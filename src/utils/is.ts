import { ProviderRegistration, SingletonScope } from '..';
import { IDisposable } from '@/common';

export function isDisposable(
  maybeDisposable: unknown,
): maybeDisposable is IDisposable {
  return typeof (maybeDisposable as any).dispose === 'function';
}

export function isGlobalSingleton(registration: ProviderRegistration<unknown>) {
  return (
    registration.options?.singleton === true ||
    registration.options?.singleton === SingletonScope.Global
  );
}

export function isScopedSingleton(registration: ProviderRegistration<unknown>) {
  return registration.options?.singleton === SingletonScope.Scoped;
}
