import {
  IProvider,
  ClassProvider,
  ValueProvider,
  FactoryProvider,
  AsyncProvider,
  TokenProvider,
} from './types';

export const isClassProvider = <T>(
  provider: IProvider<T>,
): provider is ClassProvider<T> =>
  (provider as ClassProvider<T>).useClass !== undefined;

export const isValueProvider = <T>(
  provider: IProvider<T>,
): provider is ValueProvider<T> =>
  (provider as ValueProvider<T>).useValue !== undefined;

export const isFactoryProvider = <T>(
  provider: IProvider<T>,
): provider is FactoryProvider<T> =>
  (provider as FactoryProvider<T>).useFactory !== undefined;

export const isAsyncProvider = <T>(
  provider: IProvider<T>,
): provider is AsyncProvider<T> =>
  (provider as AsyncProvider<T>).useAsync !== undefined;

export const isTokenProvider = <T>(
  provider: IProvider<T>,
): provider is TokenProvider<T> =>
  (provider as TokenProvider<T>).useToken !== undefined;
