import { Constructor } from './types';

/**
 * `InjectionToken` is a class to be used as a injection token that can store
 * some context, where generic `T` stores the type that this token may provides.
 */
export class InjectionToken<T = unknown> {
  _phantom: T | undefined;

  constructor(
    public readonly id: string | symbol,
    public readonly context?: any,
  ) {}

  toString() {
    return `InjectionToken(${String(this.id)})`;
  }
}

/**
 * `InjectionTokenType` is a set of type that can be used as identifier to index
 * dependency in a container.
 */
export type InjectionTokenType<T = unknown> =
  | Constructor<T>
  | InjectionToken<T>
  | symbol
  | string;

export const DECORATOR_BIND_TOKEN = Symbol.for('DECORATOR_BIND_TOKEN');

export type ProviderIdentifier<T> = (() => void) & {
  [DECORATOR_BIND_TOKEN]: InjectionTokenType<T>;
};
