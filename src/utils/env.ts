import { NoReflectMetadataSupportError } from '@/common';

export function checkReflectMetadata() {
  if (!hasReflectMetadata()) {
    throw new NoReflectMetadataSupportError();
  }
  return true;
}

export function hasReflectMetadata() {
  return typeof Reflect !== 'undefined' && Reflect.getMetadata !== undefined;
}
