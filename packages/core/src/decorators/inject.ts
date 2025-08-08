import { InjectionTokenInvalidError, InjectionTokenType } from '@/common';
import { ResolutionOptions } from '@/containers';
import {
  checkReflectMetadata,
  defineConstructorDependencyDescriptor,
  definePropertyDependencyDescriptor,
} from '@/utils';

/**
 * `@inject(token?, options?)`: a constructor params decorator or property
 * decorator that explicitly specifiy a parameter or class property that should
 * be injected with given token (or inferred from type metadata).
 */
export function inject<T>(
  token?: InjectionTokenType<T>,
  options?: ResolutionOptions,
) {
  return function (
    target: any,
    propertyKey?: string | symbol,
    parameterIndex?: number,
  ) {
    // constructor params decorator
    if (parameterIndex !== undefined) {
      if (!token && checkReflectMetadata()) {
        const constructorParams = Reflect.getMetadata(
          'design:paramtypes',
          target,
        );
        token = constructorParams?.[parameterIndex];
      }

      if (!token) {
        throw new InjectionTokenInvalidError(token);
      }

      defineConstructorDependencyDescriptor(target, {
        options,
        token,
        index: parameterIndex,
      });
      return;
    }

    // property decorator
    if (propertyKey !== undefined) {
      if (!token && checkReflectMetadata()) {
        token = Reflect.getMetadata('design:type', target, propertyKey);
      }
      if (!token) {
        throw new InjectionTokenInvalidError(token);
      }

      definePropertyDependencyDescriptor(target.constructor, {
        options,
        token,
        key: propertyKey,
      });
    }
  };
}
