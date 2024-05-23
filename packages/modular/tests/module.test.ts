import { Module, module } from '@/index';
import { CircularDependencyDetectedError, NoProviderFoundError, inject, rootContainer } from '@youmiya/core';
import { describe, expect, it } from 'vitest';
import 'reflect-metadata';
import { beforeEach } from 'node:test';

describe('[Module] test Module basic features', () => {
  beforeEach(() => rootContainer.dispose(true));

  it('should hold providers and resolve correctly', () => {
    class A {}
    class B {}
    class C {
      constructor(@inject(A) public a: A, @inject(B) public b: B) {}
    }

    const module = new Module({
      name: 'Module',
      provides: [
        { provide: A, useClass: A },
        { provide: B, useClass: B },
        { provide: C, useClass: C },
        { provide: 'A', useClass: A }
      ],
    });

    expect(module.get(A)).toBeInstanceOf(A);
    expect(module.get(B)).toBeInstanceOf(B);
    expect(module.get<A>('A')).toBeInstanceOf(A);

    const c = module.get(C);
    expect(c).toBeInstanceOf(C);
    expect(c.a).toBeInstanceOf(A);
    expect(c.b).toBeInstanceOf(B);

    expect(() => rootContainer.resolve('A')).toThrowError(NoProviderFoundError);
  });

  it('should resolve from imported module correctly', () => {
    class A {}

    class B {
      constructor(@inject('A') public a: A) {}
    }

    const moduleA = new Module({
      name: 'A',
      provides: [{ provide: 'A', useClass: A }],
      exports: ['A']
    });

    const moduleB = new Module({
      name: 'B',
      provides: [{ provide: 'B', useClass: B }],
      imports: [moduleA],
    });

    expect(moduleB.get('B')).toBeInstanceOf(B);
  });

  it('should be able to access module context in @module() decorated modules', () => {
    class A {}
    class B {}

    @module({
      provides: [
        { provide: 'A', useClass: A },
        { provide: 'B', useClass: B }
      ]
    })
    class SomeModule {
      constructor(public readonly moduleCtx?: Module) {
        expect(moduleCtx).toBeInstanceOf(Module);
      }
    }

    const someModule = new SomeModule();
    expect(someModule.moduleCtx!.get('A')).toBeInstanceOf(A);
    expect(someModule.moduleCtx!.get('B')).toBeInstanceOf(B);
  });

  it('should return registration if resolving target token is registered and exported, or return undefined if not registered or exported', () => {
    class A {}
    class B {}
    class C {
      constructor(@inject(A) public a: A, @inject(B) public b: B) {}
    }

    const module = new Module({
      name: 'Module',
      provides: [
        { provide: A, useClass: A },
        { provide: B, useClass: B },
        { provide: C, useClass: C },
        { provide: 'A', useClass: A }
      ],
      exports: [A, B],
    });

    expect(module.getRegistration(A)).toBeTruthy();
    expect(module.getRegistration(B)).toBeTruthy();
    expect(module.getRegistration(C)).toBeFalsy();
    expect(module.getRegistration('A')).toBeFalsy();
    expect(module.getRegistration('D')).toBeFalsy();
  });

  it('should resolve nothing if resolving a token of imported modules, but the imoprted module did not export this token', () => {
    class A {}
    class B {}

    const moduleA = new Module({
      name: 'ModuleA',
      provides: [{  provide: 'A', useClass: A }, { provide: 'B', useClass: B }],
      exports: ['B']
    });

    const moduleB = new Module({
      name: 'ModuleB',
      provides: [],
      imports: [moduleA],
    });

    expect(moduleB.get('A', { optional: true })).toBeFalsy();
    expect(() => moduleB.get('A')).toThrowError(NoProviderFoundError);
    expect(moduleB.get('B')).toBeInstanceOf(B);
  });

  it('should throw error other than NoProviderFoundError in resolution', () => {
    class A {
      constructor(@inject('B') b: unknown) {}
    }

    class B {
      constructor(@inject('A') a: unknown) {}
    }

    class C {
      constructor(@inject('A') a: unknown) {}
    }

    const importedModule = new Module({
      name: 'importedModule',
      provides: [
        {provide: 'A', useClass: A},
        {provide: 'B', useClass: B},
        {provide: 'C', useClass: C}
      ],
      exports: ['C']
    })

    const someModule = new Module({
      name: 'someModule',
      provides: [
        {provide: 'A', useClass: A},
        {provide: 'B', useClass: B}
      ],
      imports: [importedModule]
    });

    expect(() => someModule.get('A')).toThrowError(CircularDependencyDetectedError);
    expect(() => someModule.get('C')).toThrowError(CircularDependencyDetectedError);
  });
});
