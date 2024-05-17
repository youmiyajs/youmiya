/* eslint-disable @typescript-eslint/no-redeclare */
// Provider identifier style is like VSCode's implementation.
import {
  createProviderIdentifier,
  multiple,
  rootContainer,
} from '@youmiya/core';

// First, we define interfaces and corresponding provider identifiers.
// define interfaces
interface IVocal {
  sing(): void;
}

interface IDrummer {
  playTheDrum(): void;
}

interface IGuitar {
  playTheGuitar(): void;
}

interface IBass {
  playTheBass(): void;
}

// define identifiers, which can has the same name as interface
const IVocal = createProviderIdentifier('Vocal');
const IDrummer = createProviderIdentifier('IDrummer');
const IGuitar = createProviderIdentifier('Guitar');
const IBass = createProviderIdentifier('IBass');

// Then we implements the classes for interfaces
class Soyo implements IBass {
  playTheBass() {
    console.log('Soyo is playing the bass.');
  }
}
class Tomori implements IVocal {
  sing() {
    console.log('Tomori is singing.');
  }
}
class Anon implements IGuitar {
  playTheGuitar() {
    console.log('Anon is playing the guitar.');
  }
}
class Rana implements IGuitar {
  playTheGuitar() {
    console.log('Rana is playing the guitar.');
  }
}
class Taki implements IDrummer {
  playTheDrum() {
    console.log('Taki is playing the drum');
  }
}

// The next step we need to bind provider identifier to the corresponding class implementation.
// Provider identifier can be used as InjectionToken.
rootContainer.register(IBass).toClass(Soyo);
rootContainer.register(IVocal).toClass(Tomori);
rootContainer.register(IGuitar).toClass(Anon);
rootContainer.register(IGuitar).toClass(Rana);
rootContainer.register(IDrummer).toClass(Taki);

// Then we can use them in out class...
class MyGO {
  constructor(
    @IBass() private bass: IBass,
    @IGuitar() @multiple private guitars: IGuitar[],
    @IDrummer() private drummer: IDrummer,
    @IVocal() private vocal: IVocal,
  ) {}

  live() {
    this.bass.playTheBass();
    this.guitars.forEach(guitar => guitar.playTheGuitar());
    this.drummer.playTheDrum();
    this.vocal.sing();
  }
}

// You can still make class itself as InjectionToken
rootContainer.register(MyGO).toClass(MyGO);

const mygo = rootContainer.resolve(MyGO);

mygo.live();
// Soyo is playing the bass.
// Anon is playing the guitar.
// Rana is playing the guitar.
// Taki is playing the drum
// Tomori is singing.
