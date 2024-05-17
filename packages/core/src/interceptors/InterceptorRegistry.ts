import {
  AfterRegisterInterceptor,
  AfterResolveInterceptor,
  BeforeRegisterInterceptor,
  BeforeResolveInterceptor,
  InterceptorEvents,
  InterceptorHandlerType,
} from './types';

export class InterceptorRegistry {
  private registration: Map<
    InterceptorEvents,
    InterceptorHandlerType<unknown>[]
  > = new Map();

  public on<T>(
    event: InterceptorEvents.BeforeRegister,
    handler: BeforeRegisterInterceptor<T>,
  ): () => void;
  public on<T>(
    event: InterceptorEvents.AfterRegister,
    handler: AfterRegisterInterceptor<T>,
  ): () => void;
  public on<T>(
    event: InterceptorEvents.BeforeResolve,
    handler: BeforeResolveInterceptor<T>,
  ): () => void;
  public on<T>(
    event: InterceptorEvents.AfterResolve,
    handler: AfterResolveInterceptor<T>,
  ): () => void;
  public on<T>(event: InterceptorEvents, handler: InterceptorHandlerType<T>) {
    let eventSet = this.registration.get(event);
    if (!eventSet) {
      eventSet = [];
      this.registration.set(event, eventSet);
    }
    eventSet.push(handler as any);
    return () => this.off(event, handler);
  }

  public off<T>(event: InterceptorEvents, handler: InterceptorHandlerType<T>) {
    const eventSet = this.registration.get(event);
    if (!eventSet) {
      return;
    }
    this.registration.set(
      event,
      eventSet.filter(item => item !== handler),
    );
  }

  public dispatch<T>(
    event: InterceptorEvents.BeforeRegister,
    payload: Parameters<BeforeRegisterInterceptor<T>>[0],
  ): ReturnType<BeforeRegisterInterceptor<T>>;
  public dispatch<T>(
    event: InterceptorEvents.AfterRegister,
    payload: Parameters<AfterRegisterInterceptor<T>>[0],
  ): ReturnType<AfterRegisterInterceptor<T>>;
  public dispatch<T>(
    event: InterceptorEvents.BeforeResolve,
    payload: Parameters<BeforeResolveInterceptor<T>>[0],
  ): ReturnType<BeforeResolveInterceptor<T>>;
  public dispatch<T>(
    event: InterceptorEvents.AfterResolve,
    payload: Parameters<AfterResolveInterceptor<T>>[0],
  ): ReturnType<AfterResolveInterceptor<T>>;
  public dispatch<T>(
    event: InterceptorEvents,
    payload: Parameters<InterceptorHandlerType<T>>[0],
  ) {
    const eventSet = this.registration.get(event);
    if (!eventSet) {
      return undefined;
    }

    let res = payload;
    let modified = false;

    for (const handler of eventSet) {
      const currentReturn = handler(res as any);

      // only before interceptors can modify context
      if (event.startsWith('before') && currentReturn !== undefined) {
        modified = true;
        res = { ...res, ...currentReturn } as any;
      }
    }

    return modified ? res : undefined;
  }
}
