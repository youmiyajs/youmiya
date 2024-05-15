import { ProviderRegistration } from './types';
import { InjectionTokenType } from '@/common';

export class RegistrationMap {
  private map: Map<
    InjectionTokenType<unknown>,
    ProviderRegistration<unknown>[]
  > = new Map();

  public get<T>(
    token: InjectionTokenType<T>,
  ): readonly ProviderRegistration<T>[] | null {
    return (this.map.get(token) as ProviderRegistration<T>[]) ?? null;
  }

  public register<T>(
    token: InjectionTokenType<T>,
    registration: ProviderRegistration<T>,
  ) {
    let currentRegistration = this.map.get(token);
    if (!currentRegistration || registration.options?.replace) {
      currentRegistration = [];
      this.map.set(token, currentRegistration);
    }
    currentRegistration.push(registration);
  }

  public unregister<T>(
    token: InjectionTokenType<T>,
    registration?: ProviderRegistration<T>,
  ) {
    const currentRegistration = this.map.get(token);
    if (!currentRegistration) {
      return;
    }
    if (!registration) {
      this.map.delete(token);
      return;
    }
    const nextRegistration = currentRegistration.filter(
      reg => reg !== registration,
    );
    if (nextRegistration.length) {
      this.map.set(token, nextRegistration);
    } else {
      this.map.delete(token);
    }
  }

  public clear() {
    this.map.clear();
  }
}
