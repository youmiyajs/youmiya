import { describe, expect, it, beforeEach } from 'vitest';

import {
  AsyncModule,
  Container,
  SingletonScope,
  inject,
  injectable,
  rootContainer,
} from '../src';
import { NoProviderFoundError } from '@/common';

describe('[Basic] test register & resolution features', () => {
  beforeEach(() => rootContainer.dispose(true));

  it('should register and resolve all providers (class, value, factory, token, async)', () => {
    class A {}
    class B {}
    class C {}

    rootContainer.register('A').toClass(A);
    rootContainer.register('B').toValue(B);
    rootContainer.register('C').toFactory(() => C);
    rootContainer.register('D').toToken('A');
    rootContainer.register(A).to({ useClass: A });
    rootContainer.register('E').to({ useAsync: () => Promise.resolve(A) });

    expect(rootContainer.resolve('A')).toBeInstanceOf(A);
    expect(rootContainer.resolve('B')).toBe(B);
    expect(rootContainer.resolve('C')).toBe(C);
    expect(rootContainer.resolve('D')).toBeInstanceOf(A);
    expect(rootContainer.resolve<AsyncModule<A>>('E')()).toBeInstanceOf(
      Promise,
    );
  });

  it('should resolve and instantiate classes correctly', () => {
    class A {}
    class B {
      constructor(@inject(A) public a: A) {}
    }
    class C {
      constructor(@inject(A) public a: A, @inject(B) public b: B) {}
    }

    rootContainer.register(A).to({ useClass: A });
    rootContainer.register(B).to({ useClass: B });
    rootContainer.register(C).to({ useClass: C });

    const a = rootContainer.resolve(A);
    expect(a).toBeInstanceOf(A);

    const b = rootContainer.resolve(B);
    expect(b).toBeInstanceOf(B);
    expect(b.a).toBe(a);

    const c = rootContainer.resolve(C);
    expect(c).toBeInstanceOf(C);
    expect(c.a).toBe(a);
    expect(c.b).toBe(b);
  });

  it('should resolve correctly when depends on multiple type of container', () => {
    class A {}
    const B = 1;
    const C = () => 2;

    rootContainer.register('A').to({ useClass: A });
    rootContainer.register('B').to({ useValue: B });
    rootContainer.register('C').to({ useFactory: C });
    rootContainer.register('D').to({ useToken: 'A' });

    @injectable()
    class E {
      constructor(
        @inject('A') public a: A,
        @inject('B') public b: number,
        @inject('C') public c: number,
        @inject('D') public d: A,
      ) {}
    }

    const e = rootContainer.resolve(E);
    expect(e.a).toBeInstanceOf(A);
    expect(e.b).toBe(B);
    expect(e.c).toBe(2);
    expect(e.d).toBeInstanceOf(A);
    expect(e.d).toBe(e.a);
  });

  it('should resolve multiple instances when registered multiple providers for a token', () => {
    class A {}
    class B {}

    rootContainer.register('A').to({ useClass: A });
    rootContainer.register('A').to({ useClass: B });

    const res = rootContainer.resolve('A', { multiple: true });
    expect(res.length).toBe(2);
    expect(res[0]).toBeInstanceOf(A);
    expect(res[1]).toBeInstanceOf(B);
  });

  it('should returns a lazy instance when resolve is set to lazy', () => {
    let counter = 0;
    @injectable()
    class A {
      constructor() {
        counter++;
      }
    }
    @injectable()
    class B {
      constructor(@inject(A, { lazy: true }) public a: A) {}
    }

    const b = rootContainer.resolve(B);
    expect(counter).toBe(0);
    expect(b.a).toBeInstanceOf(A);
    expect(counter).toBe(1);
  });

  it('should invoke registration if called the callback of register() returned', () => {
    class A {}
    const unregister = rootContainer.register('A').toClass(A);
    expect(rootContainer.resolve('A')).toBeInstanceOf(A);
    unregister();
    unregister(); // should do nothing
    expect(() => rootContainer.resolve('A')).toThrowError(NoProviderFoundError);
  });

  it('should invoke correct registration if registered multiple providers', () => {
    const unregister1 = rootContainer.register('A').toValue(1);
    const unregister2 = rootContainer.register('A').toValue(2);
    expect(rootContainer.resolve('A', { multiple: true })).toStrictEqual([
      1, 2,
    ]);
    unregister2();
    expect(rootContainer.resolve('A')).toBe(1);
    unregister1();
    expect(() => rootContainer.resolve('A')).toThrowError(NoProviderFoundError);
  });

  it('should dispose disposable instances when container is disposed', () => {
    let isDisposed = false;
    class A {
      dispose() {
        isDisposed = true;
      }
    }

    const container = new Container('SOME_CONTAINER');
    container.register(A).toClass(A);

    const a = container.resolve(A);
    expect(a).toBeInstanceOf(A);
    expect(isDisposed).toBeFalsy();
    container.dispose();
    expect(isDisposed).toBeTruthy();
  });

  it('should cache singleton even if context.useCache is false', () => {
    @injectable()
    class A {}
    const a1 = rootContainer.resolve(A, { useCache: false });
    const a2 = rootContainer.resolve(A);
    expect(a1).toBe(a2);

    @injectable({ singleton: SingletonScope.Scoped })
    class B {}
    const b1 = rootContainer.resolve(B, { useCache: false });
    const b2 = rootContainer.resolve(B);
    expect(b1).toBe(b2);
  });

  it('should prefer to resolve from `prefers` in context', () => {
    class A {}
    class B {}
    rootContainer.register('A').toClass(A);

    const overrideMap = new Map();
    overrideMap.set('A', [{ provider: { useClass: B } }]);
    const a = rootContainer.resolve('A', { prefers: overrideMap });

    expect(a).toBeInstanceOf(B);
  });

  it('should resolve from alternative if current container has no registration', () => {
    class A {}
    class B {}

    const overrideMap = new Map();
    overrideMap.set('A', [{ provider: { useClass: B } }]);
    const a = rootContainer.resolve('A', { alternative: overrideMap });
    expect(a).toBeInstanceOf(B);

    rootContainer.dispose();

    rootContainer.register('A').toClass(A);
    expect(
      rootContainer.resolve('A', { alternative: overrideMap }),
    ).toBeInstanceOf(A);
  });

  it('should return readonly registrations when called container.getRegistration()', () => {
    class A {}
    class B {}
    rootContainer.register('foo').toClass(A);
    rootContainer.register('foo').toClass(B);
    expect(rootContainer.getRegistration('foo')).toStrictEqual([
      { options: {}, provider: { defaultProps: undefined, useClass: A } },
      { options: {}, provider: { defaultProps: undefined, useClass: B } }
    ]);
    expect(rootContainer.getRegistration('bar')).toBeFalsy();
  });
});
