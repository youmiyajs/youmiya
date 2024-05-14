import { Constructor, InjectionTokenType } from '@/common';
import { ResolutionContext } from '@/containers';

export type FactoryFn<T> = (context: ResolutionContext) => T;

export type AsyncModuleLoaderFn<T> = (
  context: ResolutionContext,
) => Promise<Constructor<T>>;

export interface ClassProvider<T> {
  useClass: Constructor<T>;
  defaultProps?: any[];
}

export interface ValueProvider<T> {
  useValue: T;
}

export interface TokenProvider<T> {
  useToken: InjectionTokenType<T>;
}

export interface FactoryProvider<T> {
  useFactory: FactoryFn<T>;
}

export interface AsyncProvider<T> {
  useAsync: AsyncModuleLoaderFn<T>;
}

export type IProvider<T = unknown> =
  | AsyncProvider<T>
  | ClassProvider<T>
  | FactoryProvider<T>
  | TokenProvider<T>
  | ValueProvider<T>;

export const enum ProviderTypeEnum {
  AsyncProvider,
  ClassProvider,
  FactoryProvider,
  TokenProvider,
  ValueProvider,
}

export const enum SingletonScope {
  Global = 'global',
  Scoped = 'scoped',
}

export interface ProviderOptions {
  /**
   * Specify the lifetime of the instance of a class.
   * Only works with ClassProvider.
   *
   * - `SingletonScope.Global`: The instance will be cached for current container and all child containers.
   * - `SingletonScope.Scoped`: The instance will be cached for current container. Resolution from child containers will be recreated.
   * - `false`: The instance will be recreated in every resolution.
   *
   * @default SingletonScope.Global
   */
  singleton?: SingletonScope | boolean;

  /**
   * Specify whether the provider can be lazy instantiated in use time.
   * Only works with ClassProvider.
   *
   * @default true
   */
  lazyable?: boolean;

  /**
   * Specify the provider should replace the existing registration for given token.
   */
  replace?: boolean;
}
