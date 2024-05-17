import {
  AsyncModule,
  IContainer,
  InjectionTokenType,
  ResolutionOptions,
  rootContainer,
} from '@youmiya/core';
import { useContext, useMemo } from 'react';
import { ContainerContext } from '@/contexts/ContainerContext';

type HooksResolutionOptionsType<
  Optional extends boolean = boolean,
  Multiple extends boolean = boolean,
  Async extends boolean = boolean,
> = ResolutionOptions<Optional, Multiple, Async> & {
  container?: IContainer;
};

export function useResolution<T>(
  token: InjectionTokenType<T>,
  options?: HooksResolutionOptionsType<false, false, false>,
  deps?: unknown[],
): T;

export function useResolution<T>(
  token: InjectionTokenType<T>,
  options?: HooksResolutionOptionsType<true, false, false>,
  deps?: unknown[],
): T | undefined;

export function useResolution<T>(
  token: InjectionTokenType<T>,
  options?: HooksResolutionOptionsType<false, true, false>,
  deps?: unknown[],
): T[];

export function useResolution<T>(
  token: InjectionTokenType<T>,
  options?: HooksResolutionOptionsType<false, false, true>,
  deps?: unknown[],
): AsyncModule<T>;

export function useResolution<T>(
  token: InjectionTokenType<T>,
  options?: HooksResolutionOptionsType<true, true, false>,
  deps?: unknown[],
): T[] | undefined;

export function useResolution<T>(
  token: InjectionTokenType<T>,
  options?: HooksResolutionOptionsType<true, false, true>,
  deps?: unknown[],
): AsyncModule<T> | undefined;

export function useResolution<T>(
  token: InjectionTokenType<T>,
  options?: HooksResolutionOptionsType<false, true, true>,
  deps?: unknown[],
): AsyncModule<T>[];

export function useResolution<T>(
  token: InjectionTokenType<T>,
  options?: HooksResolutionOptionsType<true, true, true>,
  deps?: unknown[],
): AsyncModule<T>[] | undefined;

export function useResolution<T>(
  token: InjectionTokenType<T>,
  options?: HooksResolutionOptionsType,
  deps?: unknown[],
): T | T[] | AsyncModule<T> | AsyncModule<T>[] | undefined;

export function useResolution<T>(
  token: InjectionTokenType<T>,
  options?: HooksResolutionOptionsType,
  deps?: unknown[],
) {
  const { container: contextContainer = rootContainer } =
    useContext(ContainerContext);

  const { container = contextContainer, ...restOptions } = options ?? {};

  const resolutionResult = useMemo(
    () => container.resolve(token, restOptions),
    [token, options, deps],
  );

  return resolutionResult;
}
