import { AsyncModule } from '..';
import { Constructor, InjectionTokenType, ProviderIdentifier } from '@/common';
import {
  AsyncModuleLoaderFn,
  FactoryFn,
  IProvider,
  ProviderOptions,
} from '@/providers';

export interface ProviderRegistration<T> {
  provider: IProvider<T>;
  options?: ProviderOptions;
}

export interface GettableProviderSource {
  get<T>(
    token: InjectionTokenType<T>,
  ): readonly ProviderRegistration<T>[] | undefined;
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
  lazy?: boolean;
  prefers?: GettableProviderSource;
  alternative?: GettableProviderSource;
}

export const ResetResolutionOptions: Partial<ResolutionOptions> = {
  optional: false,
  multiple: false,
  async: false,
  lazy: false,
};

type Token<T> = InjectionTokenType<T>;

type Opt<
  O extends boolean,
  M extends boolean,
  A extends boolean,
> = ResolutionOptions<O, M, A>;

export interface IContainer {
  register<T>(token: InjectionTokenType<T> | ProviderIdentifier<T>): {
    to: (provider: IProvider<T>, options?: ProviderOptions) => () => void;
    toClass: (
      constructor: Constructor<T>,
      options?: ProviderOptions & {
        defaultProps?: any;
      },
    ) => () => void;
    toValue: (value: T, options?: ProviderOptions) => () => void;
    toFactory: (
      factoryFn: FactoryFn<T>,
      options?: ProviderOptions,
    ) => () => void;
    toToken: (
      token: InjectionTokenType<T>,
      options?: ProviderOptions,
    ) => () => void;
    toAsync: (
      async: AsyncModuleLoaderFn<T>,
      options?: ProviderOptions,
    ) => () => void;
  };

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
  resolve<T>(
    token: Token<T>,
    options?: ResolutionOptions,
  ): T | T[] | AsyncModule<T> | AsyncModule<T>[] | undefined;

  getRegistration<T>(
    token: Token<T>,
  ): readonly ProviderRegistration<T>[] | undefined;

  fork(identifier: string): IContainer;

  dispose(clearRegistration?: boolean): void;
}

export type ResolutionContext = ResolutionOptions & {
  container: IContainer;
  rootToken: InjectionTokenType<unknown>;
  sourceToken?: InjectionTokenType<unknown>;
};

export interface ResolutionSource {
  container: IContainer;
  rootToken: InjectionTokenType<unknown>;
  sourceToken?: InjectionTokenType<unknown>;
}
