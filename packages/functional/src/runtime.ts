import { IContainer, rootContainer } from '@youmiya/core';

let runtimeContainer: IContainer = rootContainer;

export function setRuntimeContainer(container: IContainer) {
  const current = runtimeContainer;
  runtimeContainer = container;
  return current;
}

export function getRuntimeContainer() {
  return runtimeContainer;
}
