export type AsyncModule<T> = {
  [key in keyof T]: T[key] extends (...args: any[]) => Promise<any>
    ? T[key]
    : T[key] extends (...args: any[]) => infer K
    ? (...args: Parameters<T[key]>) => Promise<K>
    : Promise<T[key]>;
} & (() => Promise<T>);

export function createLazyModuleLoader<T>(getModule: () => object): T {
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

export function createAsyncModuleLoader<T>(
  loadModule: () => Promise<object>,
): AsyncModule<T> {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return new Proxy(() => {}, {
    apply() {
      return loadModule();
    },
    get(_, key: string | symbol, receiver) {
      return loadModule().then(module => Reflect.get(module, key, receiver));
    },
    set(_, key: string | symbol, value: any, receiver) {
      loadModule().then(module => Reflect.set(module, key, value, receiver));
      return true;
    },
  }) as AsyncModule<T>;
}
