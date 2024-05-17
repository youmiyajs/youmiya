# 🍫 Youmiya

![build-and-test-badge](https://github.com/youmiyajs/youmiya/actions/workflows/build-and-test.yml/badge.svg) [![Coverage Status](https://coveralls.io/repos/github/youmiyajs/youmiya/badge.svg?branch=main)](https://coveralls.io/github/youmiyajs/youmiya?branch=main)

`Youmiya` is a simple dependency injection (DI) library for Typescript with modern features:

- Supports both decorator style and interface-oriented style
- Works without reflect-metadata support (interface-oriented style)
- On-demand lazy (delayed) instantiation
- Support async module injection
- Supports hierarchical containers
- Circular dependency detection & workaround
- Register / resolution interceptors
- 100% code coverage

And more features are on the way:

- Injection transform
- Modular system
- Idle-time load & instatiation

## Getting Started

Youmiya supports 3 styles for dependency injection, you can refer to the following example project to see how it works.

- [Decorator style (with reflect-metadata)](https://github.com/youmiyajs/youmiya/blob/main/examples/decorator-style-with-reflect-metadata/src/index.ts)
- [Decorator style (without reflect-metadata)](https://github.com/youmiyajs/youmiya/blob/main/examples/decorator-style-without-reflect-metadata/src/index.ts)
- [Provider identifier style (reflect-metadata is not needed)](https://github.com/youmiyajs/youmiya/blob/main/examples/provider-identifier-style/src/index.ts)

### Basic Usage (decorator metadata style)

`reflect-metadata` polyfill is needed for this style.

```ts
// First imports youmiya and `reflect-metadata`.
import 'reflect-metadata';
import { injectable, rootContainer, autoInject } from 'youmiya';

// Then we define a class `Guitar` and mark it as `injectable`.
@injectable()
class Guitar {
  play() {
    return 'playing guitar';
  }
}

// We're gonna to create a class `Anon` that plays Guitar.
// Constructing `Guitar` manually is not required because `Guitar` is injectable and `Anon` is `autoInject()` decorated.
@autoInject()
class Anon {
  constructor(private guitar?: Guitar) {}

  play() {
    console.log('Anon is', this.guitar!.play());
  }
}

// Let's play Haruhikage!
(new Anon()).play(); // Anon is playing guitar
```

### Basic Usage (interface-oriented style)

Likes VSCode, works well without `reflect-metadata`.

`foo.ts`

```ts
import { createProviderIdentifier, rootContainer } from 'youmiya';

// define and export interface
export interface IFoo {
  echo: () => void;
}

// define an identifier for provider
export const IFoo = createProviderIdentifier<IFoo>('Foo');

// implement the class
class FooImpl implements IFoo {
  echo() {
    console.log('foo');
  }
}

// bind provider identifier to implementation
rootContainer.register(Foo).toClass(FooImpl);
```

`bar.ts`

```ts
import { createProviderIdentifier, rootContainer } from 'youmiya';

import { IFoo } from './foo';

interface IBar {
  echo: () => void;
}

const IBar = createProviderIdentifier<IBar>('Bar');

class BarImpl implements IBar {
  constructor(@IFoo() private readonly foo: IFoo) {}

  echo() {
    this.foo.echo();
    console.log('bar');
  }
}

rootContainer.register(IBar).toClass(BarImpl);

const bar = rootContainer.resolve(IBar);
bar.echo(); // foobar
```

## Prerequisities

Youmiya requires a modern JavaScript engine with support for:

- Map
- Typescript `experimentalDecorators`

The following requires are depending on your usage:

- Typescript `emitDecoratorMetadata` and `reflect-metadata` polyfill
  - *only required if using decorator style
- Promise
  - *only required if using async module provider
- Proxy
  - *only required if using lazy instatiation

If your environment doesn't support one of these you will need to import a shim or polyfill.
