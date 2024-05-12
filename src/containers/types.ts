import { AsyncModule } from '..';
import { InjectionTokenType } from '@/common';
import { IProvider, ProviderOptions } from '@/providers';

export interface ProviderRegistration<T> {
  provider: IProvider<T>;
  options?: ProviderOptions;
}

export interface ResolutionOptions<
  Optional extends boolean = boolean,
  Multiple extends boolean = boolean,
  Async extends boolean = boolean,
> {
  resolveParent?: boolean;
  useCache?: boolean;
  optional?: Optional;
  multiple?: Multiple;
  async?: Async;
  provide?: Map<InjectionTokenType<unknown>, ProviderRegistration<unknown>[]>;
}

type Token<T> = InjectionTokenType<T>;

type Opt<
  O extends boolean,
  M extends boolean,
  A extends boolean,
> = ResolutionOptions<O, M, A>;

export interface IContainer {
  register<T>(
    token: InjectionTokenType<T>,
    provider: IProvider<T>,
    options?: ProviderOptions,
  ): () => void;

  resolve<T>(token: Token<T>, options?: Opt<false, false, false>): T;
  resolve<T>(token: Token<T>, options?: Opt<false, true, false>): T[];
  resolve<T>(token: Token<T>, options?: Opt<true, false, false>): T | undefined;
  resolve<T>(
    token: Token<T>,
    options?: Opt<true, true, false>,
  ): T[] | undefined;
  resolve<T>(
    token: Token<T>,
    options?: Opt<false, false, true>,
  ): AsyncModule<T>;
  resolve<T>(
    token: Token<T>,
    options?: Opt<false, true, true>,
  ): AsyncModule<T>[];
  resolve<T>(
    token: Token<T>,
    options?: Opt<true, false, true>,
  ): AsyncModule<T> | undefined;
  resolve<T>(
    token: Token<T>,
    options?: Opt<true, true, true>,
  ): AsyncModule<T>[] | undefined;

  fork(identifier: string): IContainer;

  dispose(clearRegistration?: boolean): void;
}

export type ResolutionContext = ResolutionOptions & {
  container: IContainer;
  rootToken: InjectionTokenType<unknown>;
};
