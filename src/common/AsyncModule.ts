export type AsyncModule<T> = {
  [key in keyof T]: T[key] extends (...args: any[]) => Promise<any>
    ? T[key]
    : T[key] extends (...args: any[]) => infer K
    ? (...args: Parameters<T[key]>) => Promise<K>
    : Promise<T[key]>;
} & (() => Promise<T>);
