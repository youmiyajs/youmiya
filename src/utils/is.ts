import { IDisposable } from '@/common';

export function isDisposable(
  maybeDisposable: unknown,
): maybeDisposable is IDisposable {
  return typeof (maybeDisposable as any).dispose === 'function';
}
