import {
  DECORATOR_BIND_TOKEN,
  InjectionTokenType,
  isProviderIdentifier,
} from '@/common';

export function unwrapInjectionToken<T>(token: InjectionTokenType<T>) {
  if (isProviderIdentifier(token)) {
    return token[DECORATOR_BIND_TOKEN];
  }
  return token;
}
