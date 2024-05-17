import { InjectionToken } from '@/common';
import { InterceptorEvents, InterceptorRegistry } from '@/interceptors';
import { describe, expect, it, vi } from 'vitest';

describe('[Components] test InjectionToken', () => {
  it('should works normally', () => {
    class A {}

    const tokenForA = new InjectionToken<A>('TokenA', {
      prototype: A,
    });

    expect(tokenForA).toBeInstanceOf(InjectionToken);
    expect(tokenForA.context?.prototype).toBe(A);
    expect(tokenForA.toString()).toBe(`InjectionToken(TokenA)`);
  });
});

describe('[Componnts] test InterceptorRegistry', () => {
  it('should work as an event emitter', () => {
    const handler = vi.fn();
    const registry = new InterceptorRegistry();
    registry.on(InterceptorEvents.BeforeResolve, handler);
    registry.dispatch(InterceptorEvents.BeforeResolve, {} as any);
    expect(handler).toHaveBeenCalledTimes(1);

    registry.off(InterceptorEvents.BeforeResolve, handler);
    registry.dispatch(InterceptorEvents.BeforeResolve, {} as any);
    expect(handler).toHaveBeenCalledTimes(1);

    registry.off(InterceptorEvents.AfterResolve, handler);
  });
});
