import { Container, IContainer, rootContainer } from '@youmiya/core';
import { useContext, useEffect, useMemo } from 'react';
import { ContainerContext } from '..';

export function useContainer(
  identifier: string,
  options?: {
    parentContainer?: IContainer | null;
  },
) {
  const { container: contextContainer = rootContainer } =
    useContext(ContainerContext);

  const parentContainer = useMemo(() => {
    if (options?.parentContainer) {
      return options.parentContainer;
    }
    if (!options?.parentContainer && options?.parentContainer !== undefined) {
      return undefined;
    }
    return contextContainer;
  }, [options?.parentContainer, contextContainer]);

  const container = useMemo(() => {
    if (parentContainer) {
      return parentContainer.fork(identifier);
    }
    return new Container(identifier);
  }, [identifier, parentContainer]);

  useEffect(() => {
    return () => {
      container.dispose(true);
    };
  }, [container]);

  return container;
}
