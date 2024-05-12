import { defineOptionInDescriptor } from '@/utils';

export function multiple() {
  return function (
    target: any,
    propertyKey?: string | symbol,
    parameterIndex?: number,
  ) {
    // constructor params decorator
    if (parameterIndex !== undefined) {
      defineOptionInDescriptor(target, parameterIndex, {
        multiple: true,
      });
      return;
    }

    // property decorator
    if (propertyKey !== undefined) {
      defineOptionInDescriptor(target.constructor, propertyKey, {
        multiple: true,
      });
    }
  };
}
