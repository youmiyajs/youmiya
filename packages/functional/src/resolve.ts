import {
  AsyncModule,
  InjectionTokenType,
  ResolutionOptions,
} from '@youmiya/core';
import { getRuntimeContainer } from './runtime';

export function resolve<T>(
  token: InjectionTokenType<T>,
  options?: ResolutionOptions<false, false, false>,
): T;

export function resolve<T>(
  token: InjectionTokenType<T>,
  options?: ResolutionOptions<true, false, false>,
): T | undefined;

export function resolve<T>(
  token: InjectionTokenType<T>,
  options?: ResolutionOptions<false, true, false>,
): T[];

export function resolve<T>(
  token: InjectionTokenType<T>,
  options?: ResolutionOptions<false, false, true>,
): AsyncModule<T>;

export function resolve<T>(
  token: InjectionTokenType<T>,
  options?: ResolutionOptions<true, true, false>,
): T[] | undefined;

export function resolve<T>(
  token: InjectionTokenType<T>,
  options?: ResolutionOptions<true, false, true>,
): AsyncModule<T> | undefined;

export function resolve<T>(
  token: InjectionTokenType<T>,
  options?: ResolutionOptions<false, true, true>,
): AsyncModule<T>[];

export function resolve<T>(
  token: InjectionTokenType<T>,
  options?: ResolutionOptions<true, true, true>,
): AsyncModule<T>[] | undefined;

export function resolve<T>(
  token: InjectionTokenType<T>,
  options?: ResolutionOptions,
) {
  return getRuntimeContainer().resolve(token, options);
}
