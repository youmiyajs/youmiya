import 'reflect-metadata';
import { autoInject, injectable, rootContainer } from '@youmiya/core';

@injectable()
class Guitar {
  play() {
    return 'playing guitar';
  }
}

@injectable()
class Anon {
  constructor(private guitar: Guitar) {}

  play() {
    console.log('Anon is', this.guitar.play());
  }
}

rootContainer.resolve(Anon).play(); // Anon is playing guitar

// Or you can use @autoInject() decorator...
@autoInject()
class Rana {
  constructor(private guitar?: Guitar) {}

  play() {
    console.log('Rana is', this.guitar!.play());
  }
}

new Rana().play(); // Rana is playing guitar
