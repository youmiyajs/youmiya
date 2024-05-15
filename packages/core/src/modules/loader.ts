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

const REFLECT_METHODS = [
  'get',
  'apply',
  'getPrototypeOf',
  'setPrototypeOf',
  'getOwnPropertyDescriptor',
  'defineProperty',
  'has',
  'set',
  'deleteProperty',
  'construct',
  'ownKeys',
] as const;

function defineLazyModuleReflectHandlers(getTarget: () => object) {
  const handlers: ProxyHandler<any> = {};

  REFLECT_METHODS.forEach(name => {
    handlers[name] = function (...args: any[]) {
      const method = Reflect[name];
      args[0] = getTarget();
      return (method as any)(...args);
    };
  });

  return handlers;
}

export function createLazyModuleLoader<T>(getModule: () => object): T {
  const target = {
    [MODULE_LOADER_TYPE_SYMBOL]: ModuleLoaderType.LazyModule,
  };

  return new Proxy(target, defineLazyModuleReflectHandlers(getModule)) as T;
}

export function createAsyncModuleLoader<T>(
  loadModule: () => Promise<object>,
): AsyncModule<T> {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noop = (() => {}) as AsyncModule<T>;

  return new Proxy(noop, {
    apply() {
      return loadModule();
    },

    get(_, key: string | symbol, receiver) {
      return loadModule().then(module => Reflect.get(module, key, receiver));
    },
  });
}
