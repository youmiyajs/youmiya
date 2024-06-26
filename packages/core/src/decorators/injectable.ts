import { Constructor, InjectionTokenType } from '@/common';
import { IContainer, rootContainer } from '@/containers';
import { ProviderOptions } from '@/providers';
import {
  defineConstructorDependencyDescriptor,
  hasReflectMetadata,
} from '@/utils';

export type InjectableOptions = ProviderOptions & {
  token?: InjectionTokenType<unknown>;
  container?: IContainer | false;
  defaultProps?: any[];
};

export function injectable(options?: InjectableOptions) {
  const { token, container = rootContainer, ...restOptions } = options ?? {};

  return function <T>(target: Constructor<T>) {
    if (hasReflectMetadata()) {
      const constructorParams =
        Reflect.getMetadata('design:paramtypes', target) || [];

      constructorParams.forEach((paramType: unknown, index: number) => {
        defineConstructorDependencyDescriptor(target, {
          token: paramType as Constructor<unknown>,
          index,
        });
      });
    }

    if (container !== false) {
      container.register(token || target).toClass(target, restOptions);
    }
  };
}
