# @youmiya/react

React binding for youmiya.

## Hooks

### useContainer

```tsx
import { useContainer, ContainerProvider } from '@youmiya/react';

function App() {
  const container = useContainer('AppContainer');

  // Now you have a brand new container...

  return (
    <ContainerProvider container={container}>
      // ...
    </ContainerProvider>
  );
}
```

### useResolution

```tsx
import { useResolution } from '@youmiya/react';

function App() {
  const instanceOfFoo = useResolution(Foo);
  const instanceOfBar = useResolution(Bar);
  // ...
}
```

## Contexts

### ContainerContext

### ContainerProvider
