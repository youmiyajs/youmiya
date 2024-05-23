import {
  AsyncModule,
  IContainer,
  InjectionToken,
  InjectionTokenType,
  NoProviderFoundError,
  rootContainer,
  unwrapInjectionToken,
} from '@youmiya/core';
import { IModuleContext, ModuleProps, ModuleResolutionContext } from './types';

export class Module implements IModuleContext {
  public readonly name: string;

  private container: IContainer;

  private exportsSet: Set<InjectionTokenType<unknown>> = new Set();

  private imports: IModuleContext[];

  constructor(moduleProps: ModuleProps) {
    this.container = rootContainer.fork(`MODULE_${moduleProps.name}_CONTAINER`);
    this.container.register(Module).toValue(this);

    this.name = moduleProps.name;

    moduleProps.provides.forEach(provider => {
      const { provide, options, ...rest } = provider;
      this.container.register(provider.provide).to(rest, provider.options);
    });

    this.imports = [...(moduleProps.imports ?? [])];

    moduleProps.exports?.forEach(originalToken => {
      const token = unwrapInjectionToken(originalToken);
      this.exportsSet.add(token);
    });
  }

  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<false, false, false>,
  ): T;
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<true, false, false>,
  ): T | undefined;
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<false, true, false>,
  ): T[];
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<false, false, true>,
  ): AsyncModule<T>;
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<true, true, false>,
  ): T[] | undefined;
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<true, false, true>,
  ): AsyncModule<T> | undefined;
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<false, true, true>,
  ): AsyncModule<T>[];
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<true, true, true>,
  ): AsyncModule<T>[] | undefined;
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext,
  ): T | T[] | AsyncModule<T> | AsyncModule<T>[] | undefined {
    try {
      const rootToken = options?.rootToken ?? token;
      return this.getImpl(token, {
        ...options,
        rootToken,
        sourceModule: options?.sourceModule ?? this,
        alternative: {
          get: this.getRegistrationImpl.bind(
            this,
            rootToken,
          ) as IModuleContext['getRegistration'],
        },
      });
    } catch (err) {
      if (err instanceof NoProviderFoundError && options?.optional) {
        return undefined;
      }
      throw err;
    }
  }

  getRegistration<T>(_token: InjectionTokenType<T>) {
    return this.getRegistrationImpl(undefined, _token);
  }

  private getRegistrationImpl<T>(
    rootToken: InjectionTokenType<any> | undefined,
    _token: InjectionTokenType<T>,
  ) {
    const token = unwrapInjectionToken(_token);

    if (this.exportsSet.has(token)) {
      return this.container.getRegistration(token);
    }
    if (token === rootToken) {
      return undefined;
    }
    for (const module of this.imports) {
      const maybeResult = module.getRegistration(token);
      if (maybeResult) {
        return maybeResult;
      }
    }
    return undefined;
  }

  private getImpl<T>(
    _token: InjectionTokenType<T>,
    context: ModuleResolutionContext,
  ) {
    const token = unwrapInjectionToken(_token);
    if (context.sourceModule !== this) {
      if (!this.exportsSet.has(token)) {
        throw new NoProviderFoundError(token);
      }
      const { rootToken: _rootToken, ...rest } = context;
      return this.container.resolve(token, rest);
    }

    try {
      return this.container.resolve(token, {
        ...context,
        optional: false,
      });
    } catch (err) {
      if (err instanceof NoProviderFoundError) {
        return this.getFromImportedModules(token, context);
      }
      throw err;
    }
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  unsafe_getModuleContainer() {
    return this.container;
  }

  private getFromImportedModules<T>(
    token: InjectionTokenType<T>,
    context: ModuleResolutionContext,
  ) {
    for (const module of this.imports) {
      try {
        return module.get(token, {
          ...context,
          rootToken: new InjectionToken(''),
        });
      } catch (err) {
        if (err instanceof NoProviderFoundError) {
          continue;
        }
        throw err;
      }
    }
    throw new NoProviderFoundError(token);
  }
}
