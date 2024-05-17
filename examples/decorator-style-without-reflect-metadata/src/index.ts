// decorator style, but without reflect-metadata support
import { injectable, inject, rootContainer } from '@youmiya/core';

@injectable()
class Bass {
  play() {
    return 'playing bass';
  }
}

@injectable()
class Soyo {
  // omitting @inject and @inject() (<- empty) is not supported without reflect-metadata
  // explicitly mark dependency with @inject(token) is required
  constructor(@inject(Bass) private bass: Bass) {}

  play() {
    console.log('Soyo is', this.bass.play());
  }
}

rootContainer.resolve(Soyo).play(); // Soyo is playing bass
