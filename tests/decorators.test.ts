import { describe, expect, it, beforeEach } from 'vitest';

import { createProviderIdentifier, rootContainer } from '../src';

describe('[Decorator] test decorators and decorator-based features', () => {
  beforeEach(() => rootContainer.dispose());

  it('test createProviderIdentifier()', () => {
    class A {}
    const identifier = createProviderIdentifier('A');
    rootContainer.register(identifier, { useClass: A });
  });

  it('test optional(): should returns undefined instead of throw error when option() is declared', () => {

  });
});
