import {
  InjectionTokenInvalidError,
  UnsupportedProviderError,
  NoReflectMetadataSupportError,
  NoProviderFoundError,
  CircularDependencyDetectedError,
} from '@/common';
import { rootContainer } from '@/containers';
import { injectable, inject } from '@/decorators';
import { describe, beforeEach, it, expect } from 'vitest';

describe('[Errors] test scenes that should throw error', () => {
  beforeEach(() => rootContainer.dispose(true));

  it('should throw InjectionTokenInvalidError when resolve a invalid token', () => {
    class A {}
    expect(() => {
      rootContainer.register(null as any).to({
        useClass: A,
      });
    }).toThrowError(InjectionTokenInvalidError);
  });

  it('should throw UnsupportedProviderError when provider is not class/value/factory/async/token', () => {
    expect(() => {
      rootContainer.register('A').to({
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

      rootContainer.register(B).toClass(B);
      rootContainer.resolve(B);
    }).toThrowError(NoReflectMetadataSupportError);
  });

  it('should throw NoProviderFoundError when resolve a token with no provider associated to it', () => {
    expect(() => {
      rootContainer.resolve('404');
    }).toThrowError(NoProviderFoundError);

    expect(rootContainer.resolve('404', { optional: true })).toBeFalsy();
  });

  it('should throw CircularDependencyDetectedError when resolve path has circular dependency', () => {
    @injectable({ token: 'A' })
    class A {
      constructor(@inject('B') b: unknown) {}
    }

    @injectable({ token: 'B' })
    class B {
      constructor(@inject('A') a: unknown) {}
    }

    expect(() => rootContainer.resolve(B)).toThrowError(
      CircularDependencyDetectedError,
    );
  });

  it('should not throw CircularDependencyDetectedError when circular dependency is lazyable and not used in constructor', () => {
    @injectable({ token: 'A' })
    class A {
      constructor(@inject('B') b: unknown) {}
    }

    @injectable({ token: 'B' })
    class B {
      constructor(@inject('A', { lazy: true }) public a: A) {}
    }

    const b = rootContainer.resolve(B);
    expect(b).toBeInstanceOf(B);
    expect(b.a).toBeInstanceOf(A);
  });

  it('should throw CircularDependencyDetectedError when circular dependency is lazyable but used in constructor', () => {
    @injectable({ token: 'A' })
    class A {
      constructor(@inject('B') b: unknown) {}
      echo() {
        console.log('A');
      }
    }

    @injectable({ token: 'B' })
    class B {
      constructor(@inject('A', { lazy: true }) public a: A) {
        a.echo();
      }
    }

    expect(() => rootContainer.resolve('B')).toThrowError(
      CircularDependencyDetectedError,
    );
    // TODO: why rootContainer.resolve(B) did not throws?
  });
});
