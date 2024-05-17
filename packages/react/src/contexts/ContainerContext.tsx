import { IContainer } from '@youmiya/core';
import { createContext, useMemo } from 'react';

export interface IContainerContext {
  container: IContainer;
}

export const ContainerContext = createContext<IContainerContext>(
  {} as IContainerContext,
);

export function ContainerProvider({
  container,
  children,
}: React.PropsWithChildren<IContainerContext>) {
  const memoizedProviderValue = useMemo(() => ({ container }), [container]);

  return (
    <ContainerContext.Provider value={memoizedProviderValue}>
      {children}
    </ContainerContext.Provider>
  );
}
