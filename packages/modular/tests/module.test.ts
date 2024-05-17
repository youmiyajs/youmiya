import { Module } from '@/Module';
import { NoProviderFoundError, inject, rootContainer } from '@youmiya/core';
import { describe, expect, it } from 'vitest';

describe('[Module] test Module basic features', () => {
  it('should hold providers and resolve correctly', () => {
    class A {}
    class B {}
    class C {
      constructor(@inject(A) public a: A, @inject(B) public b: B) {}
    }

    const module = new Module({
      name: 'Module',
      provides: [
        { provide: A, useClass: A },
        { provide: B, useClass: B },
        { provide: C, useClass: C },
        { provide: 'A', useClass: A }
      ],
    });

    expect(module.get(A)).toBeInstanceOf(A);
    expect(module.get(B)).toBeInstanceOf(B);
    expect(module.get<A>('A')).toBeInstanceOf(A);

    const c = module.get(C);
    expect(c).toBeInstanceOf(C);
    expect(c.a).toBeInstanceOf(A);
    expect(c.b).toBeInstanceOf(B);

    expect(() => rootContainer.resolve('A')).toThrowError(NoProviderFoundError);
  });

  it('should resolve from imported module correctly', () => {
    class A {}

    class B {
      constructor(@inject('A') public a: A) {}
    }

    const moduleA = new Module({
      name: 'A',
      provides: [{ provide: 'A', useClass: A }],
      exports: ['A']
    });

    const moduleB = new Module({
      name: 'B',
      provides: [{ provide: 'B', useClass: B }],
      imports: [moduleA],
    });

    expect(moduleB.get('B')).toBeInstanceOf(B);
  });
});
