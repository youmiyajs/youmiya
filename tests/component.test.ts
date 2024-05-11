import { InjectionToken } from '@/common';
import { describe, expect, it } from 'vitest';

describe('[Components] test InjectionToken', () => {
  it('should works normally', () => {
    class A {}
    class B {}

    const tokenForA = new InjectionToken<A>('TokenA', {
      prototype: A,
    });

    expect(tokenForA).toBeInstanceOf(InjectionToken);
    expect(tokenForA.context?.prototype).toBe(A);
    expect(tokenForA.toString()).toBe(`InjectionToken(TokenA)`);
  });
});
