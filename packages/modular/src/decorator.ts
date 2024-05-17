import { createModule } from './createModule';
import { Constructor, ModuleProps } from './types';

export function module(props: Omit<ModuleProps, 'name'>) {
  return function (ctor: Constructor<unknown>) {
    createModule(ctor, props);
  };
}
