import { InjectionTokenType } from '@youmiya/core';
import { getRuntimeContainer } from './runtime';

export function register<T>(token: InjectionTokenType<T>) {
  return getRuntimeContainer().register(token);
}
