import { hasReflectMetadata } from '@/utils';
import {
  Constructor,
  InjectionToken,
  NoReflectMetadataSupportError,
} from '@/common';
import { IContainer, rootContainer } from '@/containers';

export interface AutoInjectableOptions {
  container?: IContainer;
}

export function autoInject(options?: AutoInjectableOptions) {
  const { container = rootContainer } = options ?? {};
  return function <T extends Constructor<any>>(target: T) {
    if (!hasReflectMetadata()) {
      throw new NoReflectMetadataSupportError();
    }

    const constructorParams = Reflect.getMetadata('design:paramtypes', target);

    return class extends target {
      constructor(...args: any[]) {
        super(
          ...args.concat(
            constructorParams
              .slice(args.length)
              .map((paramType: unknown) =>
                container.resolve(paramType as InjectionToken<unknown>),
              ),
          ),
        );
      }
    } as T;
  };
}
