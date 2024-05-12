import { InjectionTokenType } from '@/common';
import { IProvider, ProviderOptions } from '@/providers';

export interface ProviderRegistration<T> {
  provider: IProvider<T>;
  options?: ProviderOptions;
}

export interface ResolutionOptions<
  Optional extends boolean = boolean,
  Multiple extends boolean = boolean,
> {
  resolveParent?: boolean;
  useCache?: boolean;
  optional?: Optional;
  multiple?: Multiple;
  provide?: Map<InjectionTokenType<unknown>, ProviderRegistration<unknown>[]>;
}

export interface IContainer {
  register: <T>(
    token: InjectionTokenType<T>,
    provider: IProvider<T>,
    options?: ProviderOptions,
  ) => () => void;

  resolve: (<T>(
    token: InjectionTokenType<T>,
    options?: ResolutionOptions<false, false>,
  ) => T) &
    (<T>(
      token: InjectionTokenType<T>,
      options?: ResolutionOptions<false, true>,
    ) => T[]) &
    (<T>(
      token: InjectionTokenType<T>,
      options?: ResolutionOptions<true, false>,
    ) => T | undefined) &
    (<T>(
      token: InjectionTokenType<T>,
      options?: ResolutionOptions<true, true>,
    ) => T[] | undefined);

  fork: (identifier: string) => IContainer;

  dispose: (clearRegistration?: boolean) => void;
}

export type ResolutionContext = ResolutionOptions & {
  container: IContainer;
  rootToken: InjectionTokenType<unknown>;
};
