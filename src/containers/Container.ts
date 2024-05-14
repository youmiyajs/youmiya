/* eslint-disable max-lines */
import { RegistrationMap } from './RegistrationMap';
import {
  IContainer,
  ProviderRegistration,
  ResolutionOptions,
  ResolutionContext,
} from './types';
import {
  getClassDescriptorsSet,
  isConstructor,
  isDisposable,
  isGlobalSingleton,
  isScopedSingleton,
} from '@/utils';
import {
  Constructor,
  InjectionTokenInvalidError,
  InjectionTokenType,
  NoProviderFoundError,
  UnsupportedProviderError,
  DECORATOR_BIND_TOKEN,
  ProviderIdentifier,
  isProviderIdentifier,
} from '@/common';
import {
  IProvider,
  ProviderOptions,
  ClassProvider,
  AsyncProvider,
  getProviderType,
  ProviderTypeEnum,
  ValueProvider,
  FactoryProvider,
  TokenProvider,
  AsyncModuleLoaderFn,
  FactoryFn,
} from '@/providers';
import {
  AsyncModule,
  createAsyncModuleLoader,
  createLazyModuleLoader,
} from '@/modules';

export class Container implements IContainer {
  private readonly registration: RegistrationMap = new RegistrationMap();

  private readonly instanceMap: Map<ProviderRegistration<unknown>, unknown> =
    new Map();

  constructor(
    public readonly identifier: string,
    private readonly parentContainer?: IContainer,
  ) {}

  public register<T>(token: InjectionTokenType<T> | ProviderIdentifier<T>) {
    return {
      to: (provider: IProvider<T>, options?: ProviderOptions) =>
        this.registerImpl(token, provider, options),
      toValue: (value: T, options?: ProviderOptions) =>
        this.registerImpl(token, { useValue: value }, options),
      toFactory: (factoryFn: FactoryFn<T>, options?: ProviderOptions) =>
        this.registerImpl(token, { useFactory: factoryFn }, options),
      toToken: (target: InjectionTokenType<T>, options?: ProviderOptions) =>
        this.registerImpl(token, { useToken: target }, options),
      toAsync: (async: AsyncModuleLoaderFn<T>, options?: ProviderOptions) =>
        this.registerImpl(token, { useAsync: async }, options),
      toClass: (
        constructor: Constructor<T>,
        options?: ProviderOptions & {
          defaultProps?: any;
        },
      ) => {
        const { defaultProps, ...registerOptions } = options ?? {};

        return this.registerImpl(
          token,
          {
            useClass: constructor,
            defaultProps,
          },
          registerOptions,
        );
      },
    };
  }

  private registerImpl<T>(
    token: InjectionTokenType<T> | ProviderIdentifier<T>,
    provider: IProvider<T>,
    options?: ProviderOptions,
  ) {
    if (!token) {
      throw new InjectionTokenInvalidError(token);
    }
    const registerToken = this.unwrapInjectionToken(token);
    const registration: ProviderRegistration<T> = {
      provider,
      options,
    };

    this.registration.register(registerToken, registration);
    return () => this.registration.unregister(registerToken, registration);
  }

  public resolve<T>(
    token: InjectionTokenType<T>,
    options?: ResolutionOptions<false, false, false>,
  ): T;
  public resolve<T>(
    token: InjectionTokenType<T>,
    options?: ResolutionOptions<false, true, false>,
  ): T[];
  public resolve<T>(
    token: InjectionTokenType<T>,
    options?: ResolutionOptions<true, false, false>,
  ): T | undefined;
  public resolve<T>(
    token: InjectionTokenType<T>,
    options?: ResolutionOptions<true, true, false>,
  ): T[] | undefined;
  public resolve<T>(
    token: InjectionTokenType<T>,
    options?: ResolutionOptions<false, false, true>,
  ): AsyncModule<T>;
  public resolve<T>(
    token: InjectionTokenType<T>,
    options?: ResolutionOptions<false, true, true>,
  ): AsyncModule<T>[];
  public resolve<T>(
    token: InjectionTokenType<T>,
    options?: ResolutionOptions<true, false, true>,
  ): AsyncModule<T> | undefined;
  public resolve<T>(
    token: InjectionTokenType<T>,
    options?: ResolutionOptions<true, true, true>,
  ): AsyncModule<T>[] | undefined;
  public resolve<T>(
    token: InjectionTokenType<T>,
    options?: ResolutionOptions,
  ): T | T[] | AsyncModule<T> | AsyncModule<T>[] | undefined;
  public resolve<T, Optional extends boolean, Multiple extends boolean>(
    token: InjectionTokenType<T>,
    options?: ResolutionOptions<Optional, Multiple>,
  ): any {
    const unwrappedToken = this.unwrapInjectionToken(token);

    const context: ResolutionContext = {
      container: this,
      resolveParent: true,
      useCache: true,
      rootToken: unwrappedToken,
      ...options,
    };

    return this.resolveImpl(unwrappedToken, context);
  }

  public fork(identifier: string): IContainer {
    return new Container(identifier, this);
  }

  public dispose(clearRegistration = false) {
    // dispose instances
    this.instanceMap.forEach(instance => {
      if (isDisposable(instance)) {
        instance.dispose?.();
      }
    });

    // dispose registration
    if (clearRegistration) {
      this.registration.clear();
    }
  }

  private unwrapInjectionToken<T>(token: InjectionTokenType<T>) {
    if (isProviderIdentifier(token)) {
      return token[DECORATOR_BIND_TOKEN];
    }
    return token;
  }

  private resolveImpl<T>(
    token: InjectionTokenType<T>,
    context: ResolutionContext,
  ) {
    // get registrations in this container
    const registrations =
      context.provide?.get(token) || this.registration.get(token);

    if (!registrations?.length) {
      // if this container has no resolution, recursively get in parent container
      if (context.resolveParent && this.parentContainer) {
        return this.parentContainer.resolve(token, context as any); // TODO: remove any here
      }

      // if this token itself is a constructor, use itself as class provider
      if (isConstructor(token)) {
        return this.resolveFromRegistrations(
          [
            {
              provider: { useClass: token },
              options: { singleton: false },
            },
          ],
          context,
        );
      }

      // if accepts optional, return null
      if (context.optional) {
        return undefined;
      }
      throw new NoProviderFoundError(token);
    }

    return this.resolveFromRegistrations(registrations, context);
  }

  private resolveFromRegistrations<T>(
    registrations: readonly ProviderRegistration<T>[],
    context: ResolutionContext,
  ) {
    if (!context.multiple) {
      return this.resolveSingleRegistration(
        registrations[registrations.length - 1],
        context,
      );
    }

    return registrations.map(registration =>
      this.resolveSingleRegistration(registration, context),
    );
  }

  private resolveSingleRegistration<T>(
    registration: ProviderRegistration<T>,
    context: ResolutionContext,
  ) {
    // use cached values
    const cachedInstance = this.instanceMap.get(registration);
    const shouldUseCache =
      cachedInstance &&
      (context.useCache ||
        isGlobalSingleton(registration) ||
        (isScopedSingleton(registration) && context.container === this));

    if (shouldUseCache && cachedInstance) {
      return cachedInstance;
    }

    return this.resolveProvider(registration, context);
  }

  private resolveProvider<T>(
    registration: ProviderRegistration<T>,
    context: ResolutionContext,
  ): T | T[] | AsyncModule<T> | AsyncModule<T>[] | undefined {
    const { provider, options } = registration;
    const { lazyable = false } = options ?? {};

    switch (getProviderType(provider)) {
      case ProviderTypeEnum.ClassProvider:
        return lazyable
          ? this.createLazyModuleLoader(registration, context)
          : this.instantiateClass(registration, context);

      case ProviderTypeEnum.ValueProvider:
        return (provider as ValueProvider<T>).useValue;

      case ProviderTypeEnum.AsyncProvider:
        return this.createAsyncModuleLoader(registration, context);

      case ProviderTypeEnum.FactoryProvider:
        return this.instantiateFactory(registration, context);

      case ProviderTypeEnum.TokenProvider:
        return this.resolve((provider as TokenProvider<T>).useToken, context);

      default:
        throw new UnsupportedProviderError(provider);
    }
  }

  private instantiateFactory<T>(
    registration: ProviderRegistration<T>,
    context: ResolutionContext,
  ) {
    const { provider } = registration;
    const result = (provider as FactoryProvider<T>).useFactory(context);
    if (context.useCache) {
      this.instanceMap.set(registration, result);
    }
    return result;
  }

  private instantiateClass<T>(
    registration: ProviderRegistration<T>,
    context: ResolutionContext,
  ) {
    const provider = registration.provider as ClassProvider<T>;
    const constructor = provider.useClass;
    const descriptorSet = getClassDescriptorsSet(constructor);

    const constructorDependencies: any[] = [];
    descriptorSet.constructors.forEach(descriptor => {
      constructorDependencies[descriptor.index] = this.resolve(
        descriptor.token,
        {
          ...descriptor.options,
          ...descriptorSet.options[descriptor.index],
          ...context,
        },
      );
    });

    const result = new constructor(
      ...constructorDependencies,
      ...(provider.defaultProps ?? []),
    );

    descriptorSet.properties.forEach(descriptor => {
      (result as any)[descriptor.key] = this.resolve(descriptor.token, {
        ...descriptor.options,
        ...descriptorSet.options[descriptor.key],
        ...context,
      });
    });

    if (context.useCache || registration.options?.singleton) {
      this.instanceMap.set(registration, result);
    }

    return result;
  }

  private createLazyModuleLoader<T>(
    registration: ProviderRegistration<T>,
    context: ResolutionContext,
  ) {
    let localCached: T | undefined;

    const getModule = () => {
      if (localCached) {
        return localCached as object;
      }
      localCached = this.instantiateClass(registration, context);
      return localCached as object;
    };

    return createLazyModuleLoader<T>(getModule);
  }

  private createAsyncModuleLoader<T>(
    registration: ProviderRegistration<T>,
    context: ResolutionContext,
  ): AsyncModule<T> {
    let loadPromise: Promise<T | undefined> | undefined;

    const loadModule = () => {
      if (loadPromise) {
        return loadPromise;
      }

      const provider = registration.provider as AsyncProvider<T>;

      loadPromise = provider
        .useAsync(context)
        .then(
          constructor => this.resolve(constructor, context) as T | undefined,
        )
        .catch(err => {
          loadPromise = undefined;
          throw err;
        });

      return loadPromise;
    };

    const asyncModuleLoader = createAsyncModuleLoader<T>(
      loadModule as () => Promise<object>,
    );

    if (context.useCache) {
      this.instanceMap.set(registration, asyncModuleLoader);
    }

    return asyncModuleLoader;
  }
}

const ROOT_CONTAINER_IDENTIFIER = '__ROOT_CONTAINER__';

export const rootContainer = new Container(ROOT_CONTAINER_IDENTIFIER);
