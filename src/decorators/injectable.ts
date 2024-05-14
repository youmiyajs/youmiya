import { Constructor, InjectionTokenType } from '@/common';
import { IContainer, rootContainer } from '@/containers';
import { ProviderOptions } from '@/providers';
import {
  defineConstructorDependencyDescriptor,
  hasReflectMetadata,
} from '@/utils';

export function injectable(
  options?: ProviderOptions & {
    token?: InjectionTokenType<unknown>;
    container?: IContainer;
    defaultProps?: any[];
  },
) {
  const { token, container = rootContainer, ...restOptions } = options ?? {};

  return function <T>(target: Constructor<T>) {
    if (hasReflectMetadata()) {
      const constructorParams =
        Reflect.getMetadata('design:paramtypes', target) || [];

      constructorParams.forEach((paramType: unknown, index: number) => {
        if (typeof paramType !== 'function') {
          return;
        }

        defineConstructorDependencyDescriptor(target, {
          token: paramType as Constructor<unknown>,
          index,
        });
      });
    }

    container.register(token || target).toClass(target, restOptions);
  };
}
