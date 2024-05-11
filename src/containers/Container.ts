import { RegistrationMap } from './RegistrationMap';
import {
  IContainer,
  ProviderRegistration,
  ResolutionOptions,
  ResolutionContext,
} from './types';
import { getClassDescriptorsSet, isDisposable } from '@/utils';
import {
  AsyncModule,
  InjectionTokenInvalidError,
  InjectionTokenType,
  NoProviderFoundError,
  UnsupportedProviderError,
} from '@/common';
import {
  IProvider,
  ProviderOptions,
  isValueProvider,
  isTokenProvider,
  isClassProvider,
  isFactoryProvider,
  isAsyncProvider,
  ClassProvider,
  AsyncProvider,
} from '@/providers';
import {
  DECORATOR_BIND_TOKEN,
  ProviderIdentifier,
} from '@/common/InjectionToken';

export class Container implements IContainer {
  private readonly registration: RegistrationMap = new RegistrationMap();

  private readonly instanceMap: Map<ProviderRegistration<unknown>, unknown> =
    new Map();

  constructor(
    public readonly identifier: string,
    private readonly parentContainer?: IContainer,
  ) {}

  public register<T>(
    token: InjectionTokenType<T> | ProviderIdentifier<T>,
    provider: IProvider<T>,
    options?: ProviderOptions,
  ): () => void {
    if (!token) {
      throw new InjectionTokenInvalidError(token);
    }

    const registerToken = (token as any)[DECORATOR_BIND_TOKEN]
      ? (token as ProviderIdentifier<T>)[DECORATOR_BIND_TOKEN]
      : (token as InjectionTokenType<T>);

    const registration: ProviderRegistration<T> = {
      provider,
      options,
    };

    this.registration.register(registerToken, registration);
    return () => this.registration.unregister(registerToken, registration);
  }

  public resolve<T, Optional extends boolean, Multiple extends boolean>(
    token: InjectionTokenType<T>,
    options?: ResolutionOptions<Optional, Multiple>,
  ): any {
    const context: ResolutionContext = {
      container: this,
      resolveParent: true,
      useCache: true,
      multiple: false,
      optional: false,
      ...options,
    };

    return this.resolveImpl(token, context);
  }

  public fork(identifier: string): IContainer {
    return new Container(identifier, this);
  }

  private resolveImpl<T>(
    token: InjectionTokenType<T>,
    context: ResolutionContext,
  ): any {
    // get registrations in this container
    const registrations =
      context.provide?.get(token) || this.registration.get(token);
    if (!registrations?.length) {
      // if this container has no resolution, recursively get in parent container
      if (context.resolveParent && this.parentContainer) {
        return this.parentContainer.resolve(token, context as any); // TODO: remove any here
      }
      // if accepts optional, return null
      if (context.optional) {
        return undefined;
      }
      throw new NoProviderFoundError(token);
    }

    if (!context.multiple) {
      return this.resolveSingleRegistration(registrations[0], context);
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
        registration.options?.singleton === 'global' ||
        (registration.options?.singleton === 'scoped' &&
          context.container === this));

    if (shouldUseCache && cachedInstance) {
      return cachedInstance;
    }

    return this.resolveProvider(registration, context);
  }

  private resolveProvider<T>(
    registration: ProviderRegistration<T>,
    context: ResolutionContext,
  ): T | T[] | AsyncModule<T> | null {
    const { provider, options } = registration;
    const { lazyable = false } = options ?? {};

    // TODO: circluar depenency

    if (isValueProvider(provider)) {
      return provider.useValue;
    }

    if (isTokenProvider(provider)) {
      return this.resolve(provider.useToken, context);
    }

    if (isClassProvider(provider)) {
      return lazyable
        ? this.createLazyModuleLoader(registration, context)
        : this.instantiateClass(registration, context);
    }

    if (isFactoryProvider(provider)) {
      const result = provider.useFactory(context);
      if (context.useCache) {
        this.instanceMap.set(registration, result);
      }
      return result;
    }

    if (isAsyncProvider(provider)) {
      return this.createAsyncModuleLoader(registration, context);
    }

    throw new UnsupportedProviderError(provider);
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

    return new Proxy(
      {},
      {
        get(_, key: string | symbol, receiver) {
          return Reflect.get(getModule(), key, receiver);
        },
        set(_, key: string | symbol, value: any, receiver) {
          return Reflect.set(getModule(), key, value, receiver);
        },
        defineProperty(_, property, attributes) {
          return Reflect.defineProperty(getModule(), property, attributes);
        },
        deleteProperty(_, p) {
          return Reflect.deleteProperty(getModule(), p);
        },
        has(_, p) {
          return Reflect.has(getModule(), p);
        },
        getOwnPropertyDescriptor(_, p) {
          return Reflect.getOwnPropertyDescriptor(getModule(), p);
        },
        ownKeys(_) {
          return Reflect.ownKeys(getModule());
        },
        setPrototypeOf(_, v) {
          return Reflect.setPrototypeOf(getModule(), v);
        },
      },
    ) as T;
  }

  private createAsyncModuleLoader<T>(
    registration: ProviderRegistration<T>,
    context: ResolutionContext,
  ): AsyncModule<T> {
    let loadPromise: Promise<T> | undefined;

    const loadModule = () => {
      if (loadPromise) {
        return loadPromise;
      }

      const provider = registration.provider as AsyncProvider<T>;

      loadPromise = provider
        .useAsync(context)
        .then(constructor => this.resolve(constructor, context))
        .catch(err => {
          loadPromise = undefined;
          throw err;
        });

      return loadPromise;
    };

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return new Proxy(() => {}, {
      apply() {
        return loadModule();
      },
      get(_, key: string | symbol, receiver) {
        return loadModule().then(module =>
          Reflect.get(module as object, key, receiver),
        );
      },
      set(_, key: string | symbol, value: any, receiver) {
        loadModule().then(module =>
          Reflect.set(module as object, key, value, receiver),
        );
        return true;
      },
    }) as AsyncModule<T>;
  }

  public dispose() {
    // dispose instances
    this.instanceMap.forEach(instance => {
      if (isDisposable(instance)) {
        instance.dispose?.();
      }
    });

    this.registration.clear();
  }
}

export const ROOT_CONTAINER_IDENTIFIER = '__ROOT_CONTAINER__';

export const rootContainer = new Container(ROOT_CONTAINER_IDENTIFIER);
