import { describe, expect, it, beforeEach } from 'vitest';

import { createProviderIdentifier, inject, injectable, optional, rootContainer } from '../src';
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
    rootContainer.register(IFoo, { useClass: Foo });

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
    rootContainer.register(IBar, { useClass: Bar });

    expect(rootContainer.resolve(IBar).bar()).toBe(2);
  });

  it('test optional(): should returns undefined instead of throw error when option() is declared', () => {
    class A {
      constructor(@inject('C') public c: unknown) {}
    }

    expect(() => rootContainer.instatiate(A)).toThrowError(NoProviderFoundError);

    class B {
      constructor(
        @inject('C') @optional() public c: unknown,
        @optional() @inject('D') public d: unknown,
      ) {}

      @inject('C') @optional() public c2: unknown;
      @optional() @inject('D') public d2: unknown;
    }

    const b = rootContainer.instatiate(B);
    expect(b.c).toBe(undefined);
    expect(b.d).toBe(undefined);
    expect(b.c2).toBe(undefined);
    expect(b.d2).toBe(undefined);
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

    expect(rootContainer.instatiate(B).b()).toBe(2);
  });
});
