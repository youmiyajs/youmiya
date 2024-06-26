export type Constructor<T> = new (...args: any[]) => T;

export interface IDisposable {
  dispose?: () => void;
}
