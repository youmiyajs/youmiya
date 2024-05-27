import { describe, expect, it } from 'vitest';

import { register, resolve, withContainer } from '../src';
import { NoProviderFoundError, inject, rootContainer } from '@youmiya/core';

describe('Functional: test functional features', () => {
  it('withContainer: should run on target container', () => {
    const containerA = rootContainer.fork('containerA');
    const containerB = rootContainer.fork('containerB');

    class A {}
    class B {
      constructor(
        @inject('A') a: A
      ) {}
    }
    class C {}

    withContainer(containerA, () => {
      register('A').toClass(A);
      expect(resolve('A')).toBeInstanceOf(A);
      register('B').toClass(B);
      expect(resolve('B')).toBeInstanceOf(B);
    });

    withContainer(containerB, () => {
      expect(() => resolve('A')).toThrowError(NoProviderFoundError);
      register('C').toClass(C);
      expect(resolve('C')).toBeInstanceOf(C);
    });

    withContainer(containerA, () => {
      expect(() => resolve('C')).toThrowError(NoProviderFoundError);
    });
  });
});
