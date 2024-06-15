import { InjectionTokenType, Constructor } from '@/common';
import { ResolutionOptions } from '@/containers';

const SYMBOL = Symbol.for('DEPENDENCIES_DESCRIPTOR');

export interface ConstructorDependencyDescriptor<T> {
  token: InjectionTokenType<T>;
  index: number;
  options?: ResolutionOptions;
}

export interface PropertyDependencyDescriptor<T> {
  token: InjectionTokenType<T>;
  key: string | symbol;
  options?: ResolutionOptions;
}

export interface ClassDescriptorSet {
  constructors: ConstructorDependencyDescriptor<unknown>[];
  properties: PropertyDependencyDescriptor<unknown>[];
  options: Record<number | string | symbol, ResolutionOptions>;
}

export function getClassDescriptorsSet(
  clazz: Constructor<unknown>,
): ClassDescriptorSet {
  if (!Reflect.has(clazz, SYMBOL)) {
    Reflect.set(clazz, SYMBOL, {
      constructors: [],
      properties: [],
      options: {},
    });
  }
  return Reflect.get(clazz, SYMBOL) as ClassDescriptorSet;
}

export function defineConstructorDependencyDescriptor(
  clazz: Constructor<unknown>,
  descriptor: ConstructorDependencyDescriptor<unknown>,
) {
  const descriptorSet = getClassDescriptorsSet(clazz);
  if (descriptorSet.constructors[descriptor.index]) {
    return;
  }
  descriptorSet.constructors[descriptor.index] = descriptor;
}

export function definePropertyDependencyDescriptor(
  clazz: Constructor<unknown>,
  descriptor: PropertyDependencyDescriptor<unknown>,
) {
  const descriptorSet = getClassDescriptorsSet(clazz);
  descriptorSet.properties.push(descriptor);
}

export function defineOptionInDescriptor(
  clazz: Constructor<unknown>,
  key: string | symbol | number,
  payload: ResolutionOptions,
) {
  const descriptorSet = getClassDescriptorsSet(clazz);
  descriptorSet.options[key] = {
    ...descriptorSet.options[key],
    ...payload,
  };
}
