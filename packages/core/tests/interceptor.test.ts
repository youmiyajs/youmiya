import { NoProviderFoundError } from '@/common';
import { rootContainer } from '@/containers';
import { inject, injectable } from '@/decorators';
import { InterceptorEvents } from '@/interceptors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('[Interceptor] test interceptor features', () => {
  beforeEach(() => {
    rootContainer.dispose(true);
  });

  it('beforeRegister interceptor: normal usage', () => {
    const beforeRegisterHandler = vi.fn();

    const unregister = rootContainer.registerInterceptor(
      InterceptorEvents.BeforeRegister,
      beforeRegisterHandler,
    );

    @injectable({ token: 'A' })
    class A {}

    expect(beforeRegisterHandler).toHaveBeenCalledWith({
      token: 'A',
      provider: { useClass: A },
      options: {},
      container: rootContainer,
    });

    @injectable({ token: 'B' })
    class B {
      constructor(@inject('a') public a: A) {}
    }

    expect(beforeRegisterHandler).toHaveBeenCalledWith({
      token: 'B',
      provider: { useClass: B },
      options: {},
      container: rootContainer,
    });

    unregister();
    unregister();

    @injectable()
    class C {}

    expect(beforeRegisterHandler).toHaveBeenCalledTimes(2);
  });

  it('beforeRegister interceptor: modify injection token', () => {
    const beforeRegisterHandler = () => {
      return {
        token: 'B',
      };
    };

    rootContainer.registerInterceptor(
      InterceptorEvents.BeforeRegister,
      beforeRegisterHandler,
    );

    @injectable({ token: 'A' })
    class A {}

    expect(rootContainer.resolve('B')).toBeInstanceOf(A);
    expect(() => rootContainer.resolve('A')).toThrowError(NoProviderFoundError);
  });
});
