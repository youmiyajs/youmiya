import {
  Container,
  ProviderRegistration,
  ResolutionContext,
} from '@/containers';
import { IProvider, ProviderOptions } from '@/providers';
import { InjectionTokenType } from '@/common';

export const enum InterceptorEvents {
  BeforeRegister = 'before:register',
  AfterRegister = 'after:register',
  BeforeResolve = 'before:resolve',
  AfterResolve = 'after:resolve',
}

export interface InterceptorPayloadCommon {
  container: Container;
}

export interface BeforeRegisterPayload<T> {
  token: InjectionTokenType<T>;
  provider: IProvider<T>;
  options?: ProviderOptions;
}

export type BeforeRegisterInterceptor<T> = (
  payload: BeforeRegisterPayload<T> & InterceptorPayloadCommon,
) => Partial<BeforeRegisterPayload<T>> | void;

export interface AfterRegisterPayload<T> extends BeforeRegisterPayload<T> {
  readonly registration: ProviderRegistration<T>;
  unregister: () => void;
}

export type AfterRegisterInterceptor<T> = (
  payload: AfterRegisterPayload<T> & InterceptorPayloadCommon,
) => void;

export interface BeforeResolvePayload<T> {
  token: InjectionTokenType<T>;
  context: ResolutionContext;
}

export type BeforeResolveInterceptor<T> = (
  payload: BeforeResolvePayload<T> & InterceptorPayloadCommon,
) => Partial<BeforeResolvePayload<T>> | void;

export interface AfterResolvePayload<T> extends BeforeResolvePayload<T> {
  readonly resolution?: ProviderRegistration<T>[];
}

export type AfterResolveInterceptor<T> = (
  payload: AfterResolvePayload<T> & InterceptorPayloadCommon,
) => void;

export type InterceptorHandlerType<T> =
  | BeforeRegisterInterceptor<T>
  | AfterRegisterInterceptor<T>
  | BeforeResolveInterceptor<T>
  | AfterResolveInterceptor<T>;
