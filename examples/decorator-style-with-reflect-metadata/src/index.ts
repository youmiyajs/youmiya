import 'reflect-metadata';
import { injectable, rootContainer, autoInject } from '@youmiya/core';

@injectable()
class Guitar {
  play() {
    return 'playing guitar';
  }
}

@autoInject()
class Anon {
  constructor(private guitar: Guitar) {}

  play() {
    console.log('Anon is', this.guitar.play());
  }
}

rootContainer.resolve(Anon).play(); // Anon is playing guitar
