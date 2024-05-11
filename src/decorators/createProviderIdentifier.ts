import { inject } from './inject';
import { DECORATOR_BIND_TOKEN, ProviderIdentifier } from '@/common';
import { ResolutionOptions } from '@/containers';

export function createProviderIdentifier<T>(
  identifierName: string | symbol,
): ProviderIdentifier<T> {
  const injectionToken = identifierName;
  const decorator = function (options?: ResolutionOptions) {
    return inject(injectionToken, options);
  } as unknown as ProviderIdentifier<T>;
  decorator[DECORATOR_BIND_TOKEN] = injectionToken;
  return decorator;
}
