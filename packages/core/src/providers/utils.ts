import {
  IProvider,
  ClassProvider,
  ValueProvider,
  FactoryProvider,
  AsyncProvider,
  TokenProvider,
  ProviderTypeEnum,
} from './types';

export function getProviderType<T>(
  provider: IProvider<T>,
): ProviderTypeEnum | undefined {
  if ((provider as ClassProvider<T>).useClass !== undefined) {
    return ProviderTypeEnum.ClassProvider;
  }
  if ((provider as ValueProvider<T>).useValue !== undefined) {
    return ProviderTypeEnum.ValueProvider;
  }
  if ((provider as AsyncProvider<T>).useAsync !== undefined) {
    return ProviderTypeEnum.AsyncProvider;
  }
  if ((provider as FactoryProvider<T>).useFactory !== undefined) {
    return ProviderTypeEnum.FactoryProvider;
  }
  if ((provider as TokenProvider<T>).useToken !== undefined) {
    return ProviderTypeEnum.TokenProvider;
  }
  return undefined;
}
