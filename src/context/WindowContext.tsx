import { createContext, useContext } from "react";

export interface WindowContextValue {
  /** `true` when the module is rendered inside a detached popup window. */
  isPopup: boolean;
}

const WindowContext = createContext<WindowContextValue>({ isPopup: false });

/** Provider — wrap each module mount point with this. */
export const WindowProvider = WindowContext.Provider;

/** Returns metadata about the window the calling module is rendered in. */
export function useWindowContext(): WindowContextValue {
  return useContext(WindowContext);
}
