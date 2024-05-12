import { describe, expect, it, beforeEach } from 'vitest';

import { createProviderIdentifier, rootContainer } from '../src';

describe('[Decorator] test decorators and decorator-based features', () => {
  beforeEach(() => rootContainer.dispose());

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

  });
});
