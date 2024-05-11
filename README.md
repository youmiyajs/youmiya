# Youmiya

`Youmiya` is a simple dependency injection (DI) library for Typescript.

# Example

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
