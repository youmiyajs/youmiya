import { Module } from './Module';
import { Constructor, ModuleProps, __MODULE_CONTEXT_SYMBOL__ } from './types';

export function createModule<T>(
  ctor: Constructor<T>,
  moduleProps: Omit<ModuleProps, 'name'>,
) {
  Object.defineProperty(ctor, __MODULE_CONTEXT_SYMBOL__, {
    value: new Module({
      ...moduleProps,
      name: ctor.name,
    }),
    writable: false,
    enumerable: false,
    configurable: false,
  });
}

export function getModuleContextFromCtor(ctor: Constructor<any>) {
  return (ctor as any)[__MODULE_CONTEXT_SYMBOL__] as Module;
}
