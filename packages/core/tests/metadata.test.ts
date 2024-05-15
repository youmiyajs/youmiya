import { beforeEach, describe, expect, it } from 'vitest';

import 'reflect-metadata';
import { inject, injectable, optional } from '@/decorators';
import { rootContainer } from '@/containers';
import { InjectionTokenInvalidError } from '@/common';

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
});
