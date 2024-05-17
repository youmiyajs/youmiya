import { NoProviderFoundError } from '@/common';
import { SingletonScope, inject, injectable, rootContainer } from '@/index';
import { beforeEach, describe, expect, it } from 'vitest';

describe('[Child Container] test hierarchical containers', () => {
  beforeEach(() => rootContainer.dispose(true));

  it('should resolve dependencies from parent by default', () => {
    class A {}
    class B {
      constructor(@inject('A') public a: A) {}
    }

    rootContainer.register('A').toClass(A);
    const childContainer = rootContainer.fork('CHILDREN');

    const b = childContainer.resolve(B);
    expect(b).toBeInstanceOf(B);
    expect(b.a).toBeInstanceOf(A);
  });

  it('should throw NoProviderFoundError when resolveParent is disabled', () => {
    class A {}
    class B {
      constructor(@inject('A') public a: A) {}
    }

    rootContainer.register('A').toClass(A);
    const childContainer = rootContainer.fork('CHILDREN');

    expect(() =>
      childContainer.resolve(B, { resolveParent: false }),
    ).toThrowError(NoProviderFoundError);
  });

  it('should not use scoped singleton instance from parent container even resolveParent is enabled', () => {
    @injectable({ token: 'A', singleton: SingletonScope.Scoped }) class A {}

    class B {
      constructor(@inject('A') public a: A) {}
    }

    const childContainer = rootContainer.fork('CHILDREN');

    const a = rootContainer.resolve('A');
    const b = childContainer.resolve(B);

    expect(a === b.a).toBeFalsy();
  });
});
