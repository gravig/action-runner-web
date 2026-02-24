import type { DeclarationEnhancer } from "./types";

/**
 * Maps action type[0] → its DeclarationEnhancer component.
 * Enhancers self-register by calling `registerEnhancer` at module load time.
 */
const enhancerRegistry = new Map<string, DeclarationEnhancer>();

export function registerEnhancer(
  actionType: string,
  enhancer: DeclarationEnhancer,
) {
  enhancerRegistry.set(actionType, enhancer);
}

export function getEnhancer(
  actionType: string,
): DeclarationEnhancer | undefined {
  return enhancerRegistry.get(actionType);
}
