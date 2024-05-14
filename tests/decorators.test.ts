import { describe, expect, it, beforeEach } from 'vitest';

import { createProviderIdentifier, inject, injectable, multiple, optional, rootContainer } from '../src';
import { NoProviderFoundError } from '@/common';

describe('[Decorator] test util decorators', () => {
  beforeEach(() => rootContainer.dispose(true));

  it('test createProviderIdentifier()', () => {
    // foo
    interface IFoo {
      foo(): number;
    }
    class Foo implements IFoo {
      foo() {
        return 1;
      }
    }
    const IFoo = createProviderIdentifier<IFoo>('Foo');
    rootContainer.register(IFoo).toClass(Foo);

    // bar
    interface IBar {
      bar(): number;
    }
    const IBar = createProviderIdentifier<IBar>('Bar');
    class Bar implements IBar {
      constructor(@IFoo() private foo: Foo) {}
      bar() {
        return 1 + this.foo.foo();
      }
    }
    rootContainer.register(IBar).toClass(Bar);

    expect(rootContainer.resolve(IBar).bar()).toBe(2);
  });

  it('test optional(): should returns undefined instead of throw error when option() is declared', () => {
    class A {
      constructor(@inject('C') public c: unknown) {}
    }

    expect(() => rootContainer.instantiate(A)).toThrowError(NoProviderFoundError);

    class B {
      constructor(
        @inject('C') @optional() public c: unknown,
        @optional() @inject('D') public d: unknown,
      ) {}

      @inject('C') @optional() public c2: unknown;
      @optional() @inject('D') public d2: unknown;
    }

    const b = rootContainer.instantiate(B);
    expect(b.c).toBe(undefined);
    expect(b.d).toBe(undefined);
    expect(b.c2).toBe(undefined);
    expect(b.d2).toBe(undefined);
  });

  it('test multiple(): should returns an array of multiple instances', () => {
    @injectable({ token: 'Foo' }) class A {}
    @injectable({ token: 'Foo' }) class B {}

    class C {
      constructor(
        @inject('Foo') @multiple() public foo1: unknown[],
        @multiple() @inject('Foo') public foo2: unknown[],
      ) {}

      @multiple() @inject('Foo') public foo3!: unknown[];
      @inject('Foo') @multiple() public foo4!: unknown[];
    }

    const c = rootContainer.instantiate(C);
    expect(c.foo1.length).toBe(2);
    expect(c.foo2.length).toBe(2);
    expect(c.foo3.length).toBe(2);
    expect(c.foo4.length).toBe(2);

    expect(c.foo1[0]).toBeInstanceOf(A);
    expect(c.foo1[1]).toBeInstanceOf(B);
  });
});

describe('[Decorator] test inject()', () => {
  beforeEach(() => rootContainer.dispose(true));

  it('should inject the correct provider', () => {
    interface IA {
      a: () => number;
    }

    @injectable()
    class A implements IA {
      a() {
        return 1;
      }
    }

    class B {
      constructor(@inject(A) public readonly a: IA) {}
      b() {
        return 1 + this.a.a();
      }
    }

    expect(rootContainer.instantiate(B).b()).toBe(2);
  });
});
