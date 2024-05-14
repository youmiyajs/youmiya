import { beforeEach, describe, expect, it } from 'vitest';

import '@abraham/reflection';
import { inject, injectable } from '@/decorators';
import { rootContainer } from '@/containers';

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
      constructor(public a: A, public b: B) {}
    }

    const c = rootContainer.instantiate(C);
    expect(c).toBeInstanceOf(C);
    expect(c.a).toBeInstanceOf(A);
    expect(c.b).toBeInstanceOf(B);
  });

  it('@inject(): should automatically infer dependency constructor when used in consturctor parameters', () => {
    @injectable()
    class A {}

    @injectable()
    class B {}

    class C {
      constructor(@inject() public a: A, @inject() public b: B) {}
    }

    const c = rootContainer.instantiate(C);
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

    const c = rootContainer.instantiate(C);
    expect(c.a).toBeInstanceOf(A);
    expect(c.b).toBeInstanceOf(B);
  });
});