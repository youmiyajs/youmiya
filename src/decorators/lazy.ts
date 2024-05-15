import { defineOptionInDescriptor } from '@/utils';

export function lazy() {
  return function (
    target: any,
    propertyKey?: string | symbol,
    parameterIndex?: number,
  ) {
    // constructor params decorator
    if (parameterIndex !== undefined) {
      defineOptionInDescriptor(target, parameterIndex, {
        lazy: true,
      });
      return;
    }

    // property decorator
    if (propertyKey !== undefined) {
      defineOptionInDescriptor(target.constructor, propertyKey, {
        lazy: true,
      });
    }
  };
}
