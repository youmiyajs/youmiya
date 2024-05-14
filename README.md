# Youmiya

> ⚠️ Warning: This project is experimental now and still under construction.

`Youmiya` is a simple dependency injection (DI) library for Typescript with modern features:

- Supports both decorator style and interface-oriented style
- Supports lazy (delayed) instantiation
- Supports async module provider
- Works without reflect-metadata support (interface-oriented style)

And more features are on the way:

- Handle with circular dependencies
- Interception like tsyringe
- Injection transform

## Getting Started

### Basic Usage (decorator style)

`reflect-metadata` polyfill is needed for decorator style.

```ts
import { injectable, inject, rootContainer } from 'youmiya';

@injectable()
class Foo {
  echo() {
    console.log('foo');
  }
}

@injectable()
class Bar {
  constructor(@inject() private readonly foo: Foo) {}

  echo() {
    this.foo.echo();
    console.log('bar');
  }
}

const bar = rootContainer.resolve(Bar);
bar.echo(); // foobar
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
