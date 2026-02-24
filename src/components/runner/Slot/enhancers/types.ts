import type React from "react";
import type { SlotValue } from "../../../../types/builder";

export type EnhancerProps = {
  value: SlotValue;
  children?: React.ReactNode;
};

export type DeclarationEnhancer = React.ComponentType<EnhancerProps>;
