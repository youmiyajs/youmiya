import { beforeEach, describe, expect, it } from 'vitest';

import 'reflect-metadata';
import { autoInject, inject, injectable, optional } from '@/decorators';
import { rootContainer } from '@/containers';
import { InjectionToken, InjectionTokenInvalidError } from '@/common';

describe('[Metadata] test scenes that requires reflect-metadata polyfill', () => {
  beforeEach(() => {
    rootContainer.dispose(true);
  });

  it('@injectable(): should autoamtically trace dependencies without @inject()', () => {
    @injectable()
    class A {}
    @injectable()
    class B {}

    @injectable()
    class C {
      constructor(public a: A, public b: B, @optional public c?: Number) {}
    }

    const c = rootContainer.resolve(C);
    expect(c).toBeInstanceOf(C);
    expect(c.a).toBeInstanceOf(A);
    expect(c.b).toBeInstanceOf(B);
  });

  it('@inject(): should automatically infer dependency constructor when used in consturctor parameters', () => {
    @injectable()
    class A {
      constructor() {}
    }

    @injectable()
    class B {}

    class C {
      constructor(@inject() public a: A, @inject() public b: B) {}
    }

    const c = rootContainer.resolve(C);
    expect(c).toBeInstanceOf(C);
    expect(c.a).toBeInstanceOf(A);
    expect(c.b).toBeInstanceOf(B);
  });

  it('@inject(): should automatically infer dependency constructor when used in property', () => {
    @injectable()
    class A {}

    @injectable()
    class B {}

    class C {
      @inject() public a!: A;
      @inject() public b!: B;
    }

    const c = rootContainer.resolve(C);
    expect(c.a).toBeInstanceOf(A);
    expect(c.b).toBeInstanceOf(B);
  });

  it('@inject(): should throw error if inferred dependency is invalid', () => {
    @injectable()
    class A {}

    @injectable()
    class B {}

    expect(() => {
      class C {
        constructor(@inject() public a: undefined) {}
      }
    }).toThrowError(InjectionTokenInvalidError);

    expect(() => {
      class D {
        @inject() public a: undefined;
      }
    }).toThrowError(InjectionTokenInvalidError);
  });

  it('@autoInject(): should correctly return a auto resolve class', () => {
    class A {}
    class B {}
    class C {}

    @autoInject()
    class Foo {
      constructor(
        public foo: number,
        public a?: A,
        public b?: B,
        public c?: C,
      ) {}
    }

    const foo = new Foo(1);

    expect(foo.foo).toBe(1);
    expect(foo.a).toBeInstanceOf(A);
    expect(foo.b).toBeInstanceOf(B);
    expect(foo.c).toBeInstanceOf(C);
  });

  it('for binding dependency, inject() should have higher priority than injectable()', () => {
    @injectable()
    class A {}

    const a = new A();
    const aFactory = () => a;
    rootContainer.register('a').toFactory(aFactory);

    @injectable()
    class B {
      constructor(@inject('a') public readonly a: A) {}
    }

    expect(rootContainer.resolve(B).a).toBe(a);

    const tokenA = new InjectionToken('A');
    rootContainer.register(tokenA).toFactory(aFactory);

    @injectable()
    class C {
      constructor(
        @inject(tokenA) public readonly a: unknown,
        @inject('a') public readonly c: A,
      ) {}
    }

    const c = rootContainer.resolve(C);
    expect(c.a).toBe(a);
    expect(c.c).toBe(a);
  });
});
