import { InjectionToken } from '@/common';
import { rootContainer } from '@/containers';
import { injectable } from '@/decorators';
import { describe, expect, it } from 'vitest';

describe('[Loader] test module loader proxy features', () => {
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

    rootContainer.register(FooLoaderIdentifier, { useAsync: fooLoader });

    const asyncFoo = rootContainer.resolve(FooLoaderIdentifier, { async: true });
    expect(asyncFoo.foo).toBeInstanceOf(Promise);
    expect(await asyncFoo.foo).toBe(1);
    expect((await asyncFoo.bar)()).toBe(2);

    const promiseFoo = asyncFoo();
    expect(promiseFoo).toBeInstanceOf(Promise);
    expect(await promiseFoo).toBeInstanceOf(Foo);
  });
});
