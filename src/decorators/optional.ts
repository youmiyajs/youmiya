import { defineOptionInDescriptor } from '@/utils';

export function optional() {
  return function (
    target: any,
    propertyKey?: string | symbol,
    parameterIndex?: number,
  ) {
    // constructor params decorator
    if (parameterIndex !== undefined) {
      defineOptionInDescriptor(target, parameterIndex, {
        optional: true,
      });
      return;
    }

    // property decorator
    if (propertyKey !== undefined) {
      defineOptionInDescriptor(target.constructor, propertyKey, {
        optional: true,
      });
    }
  };
}
