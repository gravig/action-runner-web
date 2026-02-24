// Import each enhancer to trigger self-registration via registerEnhancer().
// Add new enhancers here as the system grows.
export { UseDatasetActionEnhancer } from "./UseDatasetActionEnhancer";
export { CustomActionEnhancer } from "./CustomActionEnhancer";

export { getEnhancer, registerEnhancer } from "./registry";
export type { EnhancerProps, DeclarationEnhancer } from "./types";
