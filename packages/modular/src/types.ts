import {
  ProviderRegistration,
  AsyncModule,
  IProvider,
  InjectionTokenType,
  ProviderOptions,
  ResolutionOptions,
} from '@youmiya/core';

export type Constructor<T> = new (...args: unknown[]) => T;

export const __MODULE_CONTEXT_SYMBOL__ = Symbol.for('MODULE_CONTEXT');

export type ModuleProvider<T> = IProvider<T> & {
  provide: InjectionTokenType<T>;
  options?: ProviderOptions;
};

export type ModuleResolutionContext<
  Optional extends boolean = boolean,
  Multiple extends boolean = boolean,
  Async extends boolean = boolean,
> = ResolutionOptions<Optional, Multiple, Async> & {
  sourceModule: IModuleContext;
};

export interface IModuleContext {
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<false, false, false>,
  ): T;
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<true, false, false>,
  ): T | undefined;
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<false, true, false>,
  ): T[];
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<false, false, true>,
  ): AsyncModule<T>;
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<true, true, false>,
  ): T[] | undefined;
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<true, false, true>,
  ): AsyncModule<T> | undefined;
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<false, true, true>,
  ): AsyncModule<T>[];
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext<true, true, true>,
  ): AsyncModule<T>[] | undefined;
  get<T>(
    token: InjectionTokenType<T>,
    options?: ModuleResolutionContext,
  ): T | T[] | AsyncModule<T> | AsyncModule<T>[] | undefined;

  getRegistration<T>(
    _token: InjectionTokenType<T>,
  ): readonly ProviderRegistration<T>[] | undefined;
}

export type ModuleType<T> = Constructor<T> & {
  [__MODULE_CONTEXT_SYMBOL__]: IModuleContext;
};

export interface ModuleProps {
  name: string;
  provides: ModuleProvider<unknown>[];
  imports?: IModuleContext[];
  exports?: InjectionTokenType<unknown>[];
}
