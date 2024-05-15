/* eslint-disable max-lines */
import { RegistrationMap } from './RegistrationMap';
import {
  IContainer,
  ProviderRegistration,
  ResolutionOptions,
  ResolutionContext,
  ResolutionSource,
  ResetResolutionOptions,
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
  CircularDependencyDetectedError,
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

  private readonly resolveInProgress: Map<
    InjectionTokenType<unknown>,
    ResolutionSource
  > = new Map();

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
    return () => {
      this.instanceMap.delete(registration);
      this.registration.unregister(registerToken, registration);
    };
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
    this.instanceMap.clear();

    this.resolveInProgress.clear();

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
      if (isConstructor(token) && context.rootToken === token) {
        return this.resolveFromRegistrations(
          token,
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

    return this.resolveFromRegistrations(token, registrations, context);
  }

  private resolveFromRegistrations<T>(
    token: InjectionTokenType<T>,
    registrations: readonly ProviderRegistration<T>[],
    context: ResolutionContext,
  ) {
    if (!context.multiple) {
      return this.resolveSingleRegistration(
        token,
        registrations[registrations.length - 1],
        context,
      );
    }

    return registrations.map(registration =>
      this.resolveSingleRegistration(token, registration, context),
    );
  }

  private resolveSingleRegistration<T>(
    token: InjectionTokenType<T>,
    registration: ProviderRegistration<T>,
    context: ResolutionContext,
  ) {
    // use cached values
    const cachedInstance = this.instanceMap.get(registration);
    const shouldUseCache =
      cachedInstance &&
      context.useCache &&
      (getProviderType(registration.provider) !==
        ProviderTypeEnum.ClassProvider ||
        isGlobalSingleton(registration) ||
        (isScopedSingleton(registration) && context.container === this));

    if (shouldUseCache && cachedInstance) {
      return cachedInstance;
    }

    return this.resolveProvider(token, registration, context);
  }

  private resolveProvider<T>(
    token: InjectionTokenType<T>,
    registration: ProviderRegistration<T>,
    context: ResolutionContext,
  ): T | T[] | AsyncModule<T> | AsyncModule<T>[] | undefined {
    const { provider, options } = registration;
    const { lazyable = true } = options ?? {};

    const nextContext: ResolutionContext = {
      ...context,
      sourceToken: token,
    };

    const currentResolving = this.markResolutionStart(token, context);
    if (currentResolving) {
      // circular dependencies is detected in current registration
      // if target is a laziable class provider, we returns an instance.
      if (
        lazyable &&
        context.lazy &&
        getProviderType(provider) === ProviderTypeEnum.ClassProvider
      ) {
        return this.createLazyModuleLoader(token, registration, nextContext);
      }
      throw new CircularDependencyDetectedError(
        token,
        currentResolving,
        this.resolveInProgress,
      );
    }

    try {
      switch (getProviderType(provider)) {
        case ProviderTypeEnum.ClassProvider:
          return lazyable && context.lazy
            ? this.createLazyModuleLoader(token, registration, nextContext)
            : this.instantiateClass(token, registration, nextContext);

        case ProviderTypeEnum.ValueProvider:
          return (provider as ValueProvider<T>).useValue;

        case ProviderTypeEnum.AsyncProvider:
          return this.createAsyncModuleLoader(registration, nextContext);

        case ProviderTypeEnum.FactoryProvider:
          return this.instantiateFactory(registration, nextContext);

        case ProviderTypeEnum.TokenProvider:
          return this.resolve(
            (provider as TokenProvider<T>).useToken,
            nextContext,
          );

        default:
          throw new UnsupportedProviderError(provider);
      }
    } finally {
      this.markResolutionComplete(token);
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
    token: InjectionTokenType<T>,
    registration: ProviderRegistration<T>,
    context: ResolutionContext,
  ) {
    const provider = registration.provider as ClassProvider<T>;
    const constructor = provider.useClass;
    const descriptorSet = getClassDescriptorsSet(constructor);

    const constructorDependencies: any[] = [];
    descriptorSet.constructors.forEach(descriptor => {
      const nextContext = {
        ...context,
        ...ResetResolutionOptions,
        ...descriptor.options,
        ...descriptorSet.options[descriptor.index],
        sourceToken: token,
      };
      constructorDependencies[descriptor.index] = this.resolve(
        descriptor.token,
        nextContext,
      );
    });

    const result = new constructor(
      ...constructorDependencies,
      ...(provider.defaultProps ?? []),
    );

    descriptorSet.properties.forEach(descriptor => {
      const nextContext = {
        ...context,
        ...ResetResolutionOptions,
        ...descriptor.options,
        ...descriptorSet.options[descriptor.key],
        sourceToken: token,
      };
      (result as any)[descriptor.key] = this.resolve(
        descriptor.token,
        nextContext,
      );
    });

    if (context.useCache || registration.options?.singleton) {
      this.instanceMap.set(registration, result);
    }

    return result;
  }

  private createLazyModuleLoader<T>(
    token: InjectionTokenType<T>,
    registration: ProviderRegistration<T>,
    context: ResolutionContext,
  ) {
    let localCached: T | undefined;

    const getModule = () => {
      if (localCached) {
        return localCached as object;
      }
      const currentResolving = this.markResolutionStart(token, context);
      if (currentResolving) {
        // if the lazy module is still initializing when it is called
        // means that there is an invalid circular dependency
        throw new CircularDependencyDetectedError(
          token,
          currentResolving,
          this.resolveInProgress,
        );
      }

      localCached = this.instantiateClass(token, registration, context);
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

  private markResolutionStart(
    token: InjectionTokenType<unknown>,
    context: ResolutionContext,
  ) {
    if (this.resolveInProgress.has(token)) {
      return this.resolveInProgress.get(token);
    }
    this.resolveInProgress.set(token, {
      container: this,
      rootToken: context.rootToken,
      sourceToken: context.sourceToken,
    });
    return undefined;
  }

  private markResolutionComplete(token: InjectionTokenType<unknown>) {
    this.resolveInProgress.delete(token);
  }
}

const ROOT_CONTAINER_IDENTIFIER = '__ROOT_CONTAINER__';

export const rootContainer = new Container(ROOT_CONTAINER_IDENTIFIER);