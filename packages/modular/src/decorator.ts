import { autoInject } from '@youmiya/core';
import { createModule, getModuleContextFromCtor } from './createModule';
import { Constructor, ModuleProps } from './types';

export function module(props: Omit<ModuleProps, 'name'>) {
  return function (ctor: Constructor<any>) {
    createModule(ctor, props);

    return autoInject({
      container: getModuleContextFromCtor(ctor).unsafe_getModuleContainer(),
    })(ctor);
  };
}
