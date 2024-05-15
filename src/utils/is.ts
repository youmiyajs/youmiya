import { ProviderRegistration, SingletonScope } from '..';
import { Constructor, IDisposable } from '@/common';

export function isDisposable(
  maybeDisposable: unknown,
): maybeDisposable is IDisposable {
  return typeof (maybeDisposable as any).dispose === 'function';
}

export function isGlobalSingleton(registration: ProviderRegistration<unknown>) {
  return (
    registration.options?.singleton === undefined ||
    registration.options?.singleton === true ||
    registration.options?.singleton === SingletonScope.Global
  );
}

export function isScopedSingleton(registration: ProviderRegistration<unknown>) {
  return registration.options?.singleton === SingletonScope.Scoped;
}

export function isConstructor(target: unknown): target is Constructor<unknown> {
  return typeof target === 'function';
}
