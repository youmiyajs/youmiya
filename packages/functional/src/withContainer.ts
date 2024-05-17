import { IContainer } from '@youmiya/core';
import { setRuntimeContainer } from './runtime';

export function withContainer<T>(container: IContainer, evaluate: () => T): T {
  const beforeContainer = setRuntimeContainer(container);
  const result = evaluate();
  setRuntimeContainer(beforeContainer);
  return result;
}
