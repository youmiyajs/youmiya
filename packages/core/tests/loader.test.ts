import { InjectionToken } from '@/common';
import { rootContainer } from '@/containers';
import { injectable, lazy } from '@/decorators';
import { beforeEach } from 'node:test';
import { describe, expect, it } from 'vitest';

describe('[Loader] test module loader proxy features', () => {
  beforeEach(() => rootContainer.dispose(true));

  it('LazyModuleLoader: should instatiate the class on demand', () => {
    let counter = 0;
    @injectable()
    class Foo {
      constructor() {
        counter++;
      }

      foo = 1;
      bar() {
        return 2;
      }
    }

    const lazyFoo = rootContainer.resolve(Foo, { lazy: true });
    expect(counter).toBe(0);
    expect(lazyFoo.bar()).toBe(2);
    expect(counter).toBe(1);
    expect(lazyFoo.bar()).toBe(2);
    expect(counter).toBe(1);
  });

  it('AsyncModuleLoader: should load the provider and resolve on-demand', async () => {
    @injectable()
    class Foo {
      foo = 1;
      bar() {
        return 2;
      }
    }

    const fooLoader = () => Promise.resolve(Foo);
    const FooLoaderIdentifier = new InjectionToken<Foo>('FooLoader');

    rootContainer.register(FooLoaderIdentifier).toAsync(fooLoader);

    const asyncFoo = rootContainer.resolve(FooLoaderIdentifier, {
      async: true,
    });
    expect(asyncFoo.foo).toBeInstanceOf(Promise);
    expect(await asyncFoo.foo).toBe(1);
    expect((await asyncFoo.bar)()).toBe(2);

    const promiseFoo = asyncFoo();
    expect(promiseFoo).toBeInstanceOf(Promise);
    expect(await promiseFoo).toBeInstanceOf(Foo);
  });

  it('AsyncModuleLoader: should throw error when load async provider failed', async () => {
    @injectable()
    class Foo {
      foo = 1;
      bar() {
        return 2;
      }
    }

    let counter = 0;
    const fooLoader = async () => {
      if (!counter++) {
        throw new Error('counter is zero');
      }
      return Foo;
    };
    const FooLoaderIdentifier = new InjectionToken<Foo>('FooLoader');

    rootContainer.register(FooLoaderIdentifier).toAsync(fooLoader);

    const asyncFoo = rootContainer.resolve(FooLoaderIdentifier, {
      async: true,
    });

    // first call should throw
    await expect(asyncFoo()).rejects.toThrow();

    // second call should be success
    const foo = await asyncFoo();
    expect(foo.bar()).toBe(2);
  });
});
