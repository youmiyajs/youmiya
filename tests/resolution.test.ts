import { describe, expect, it, beforeEach, beforeAll } from 'vitest';

import {
  InjectionTokenInvalidError,
  NoReflectMetadataSupportError,
  UnsupportedProviderError,
  inject,
  injectable,
  rootContainer,
} from '../src';
import { NoProviderFoundError } from '@/common';

describe('[Basic] test register & resolution features', () => {
  beforeEach(() => rootContainer.dispose());

  it('should register and resolve all providers (class, value, factory, token, async)', () => {
    class A {}
    class B {}
    class C {}

    rootContainer.register('A', { useClass: A });
    rootContainer.register('B', { useValue: B });
    rootContainer.register('C', { useFactory: () => C });
    rootContainer.register('D', { useToken: 'A' });
    rootContainer.register(A, { useClass: A });
    rootContainer.register('E', { useAsync: () => Promise.resolve(A) });

    expect(rootContainer.resolve('A')).toBeInstanceOf(A);
    expect(rootContainer.resolve('B')).toBe(B);
    expect(rootContainer.resolve('C')).toBe(C);
    expect(rootContainer.resolve('D')).toBeInstanceOf(A);
    expect(rootContainer.resolve('E')()).toBeInstanceOf(Promise);
  });

  it('should resolve and instantiate classes correctly', () => {
    class A {}
    class B {
      constructor(@inject(A) public a: A) {}
    }
    class C {
      constructor(@inject(A) public a: A, @inject(B) public b: B) {}
    }

    rootContainer.register(A, { useClass: A });
    rootContainer.register(B, { useClass: B });
    rootContainer.register(C, { useClass: C });

    const a = rootContainer.resolve(A);
    expect(a).toBeInstanceOf(A);

    const b = rootContainer.resolve(B);
    expect(b).toBeInstanceOf(B);
    expect(b.a).toBe(a);

    const c = rootContainer.resolve(C);
    expect(c).toBeInstanceOf(C);
    expect(c.a).toBe(a);
    expect(c.b).toBe(b);
  });

  it('should resolve correctly when depends on multiple type of container', () => {
    class A {}
    const B = 1;
    const C = () => 2;

    rootContainer.register('A', { useClass: A });
    rootContainer.register('B', { useValue: B });
    rootContainer.register('C', { useFactory: C });
    rootContainer.register('D', { useToken: 'A' });

    @injectable()
    class E {
      constructor(
        @inject('A') public a: A,
        @inject('B') public b: number,
        @inject('C') public c: number,
        @inject('D') public d: A,
      ) {}
    }

    const e = rootContainer.resolve(E);
    expect(e.a).toBeInstanceOf(A);
    expect(e.b).toBe(B);
    expect(e.c).toBe(2);
    expect(e.d).toBeInstanceOf(A);
    expect(e.d).toBe(e.a);
  });
});

describe('[Basic] test scenes that should throw error', () => {
  beforeEach(() => rootContainer.dispose());

  it('should throw InjectionTokenInvalidError when resolve a invalid token', () => {
    class A {}
    expect(() => {
      rootContainer.register(null as any, {
        useClass: A,
      });
    }).toThrowError(InjectionTokenInvalidError);
  });

  it('should throw UnsupportedProviderError when provider is not class/value/factory/async/token', () => {
    expect(() => {
      rootContainer.register('A', {
        useAny: 1,
      } as any);

      rootContainer.resolve('A');
    }).toThrowError(UnsupportedProviderError);
  });

  it('should throw NoReflectMetadataSupportError when using decorator metadata features in no reflect support env', () => {
    expect(() => {
      class A {}
      class B {
        constructor(@inject() a: A) {}
      }

      rootContainer.register(B, { useClass: B });
      rootContainer.resolve(B);
    }).toThrowError(NoReflectMetadataSupportError);
  });

  it('should throw NoProviderFoundError when resolve a token with no provider associated to it', () => {
    expect(() => {
      rootContainer.resolve('404');
    }).toThrowError(NoProviderFoundError);

    expect(rootContainer.resolve('404', { optional: true })).toBeFalsy();
  });
});
