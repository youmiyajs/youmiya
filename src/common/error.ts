import { InjectionTokenType } from './InjectionToken';

export class UnsupportedProviderError extends Error {
  constructor(public readonly provider: unknown) {
    super(`Unsupported provider type detected.`);
  }
}

export class NoReflectMetadataSupportError extends Error {
  constructor() {
    super(
      'Some features of youmiya requires `reflect-metadata` polyfill but it is not present.\n' +
        'Please import one of reflect-metadata polyfill to the top of entry point of your project.',
    );
  }
}

export class InjectionTokenInvalidError extends Error {
  constructor(public readonly token: unknown) {
    super(`Injection token "${token}" is invalid.`);
  }
}

export class NoProviderFoundError extends Error {
  constructor(public readonly token: InjectionTokenType<unknown>) {
    super(`No provider founded for token ${token.toString()}`);
  }
}
