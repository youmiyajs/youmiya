const MODULE_LOADER_TYPE_SYMBOL = Symbol.for('MODULE_LOADER_TYPE');

export const enum ModuleLoaderType {
  LazyModule,
  AsyncModule,
}

export type AsyncModule<T> = {
  [key in keyof T]: T[key] extends Promise<unknown> ? T[key] : Promise<T[key]>;
} & (() => Promise<T>) & {
    [MODULE_LOADER_TYPE_SYMBOL]: ModuleLoaderType.AsyncModule;
  };

export type LazyModule<T> = T & {
  [MODULE_LOADER_TYPE_SYMBOL]: ModuleLoaderType.LazyModule;
};

export function createLazyModuleLoader<T>(getModule: () => object): T {
  const loader = new Proxy(
    {
      [MODULE_LOADER_TYPE_SYMBOL]: ModuleLoaderType.LazyModule,
    },
    {
      get(target, key: string | symbol, receiver) {
        if (key === MODULE_LOADER_TYPE_SYMBOL) {
          return (target as LazyModule<T>)[MODULE_LOADER_TYPE_SYMBOL];
        }
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

  return loader;
}

export function createAsyncModuleLoader<T>(
  loadModule: () => Promise<object>,
): AsyncModule<T> {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noop = (() => {}) as AsyncModule<T>;

  noop[MODULE_LOADER_TYPE_SYMBOL] = ModuleLoaderType.AsyncModule;

  return new Proxy(noop, {
    apply() {
      return loadModule();
    },

    get(target: AsyncModule<T>, key: string | symbol, receiver) {
      if (key === MODULE_LOADER_TYPE_SYMBOL) {
        return target[MODULE_LOADER_TYPE_SYMBOL];
      }

      return loadModule().then(module => Reflect.get(module, key, receiver));
    },

    set(_, key: string | symbol, value: any, receiver) {
      loadModule().then(module => Reflect.set(module, key, value, receiver));
      return true;
    },
  });
}
