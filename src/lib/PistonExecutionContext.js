import { createContext, useContext } from "react";

// Provided by App.jsx (which owns the usePistonExecution() call so it can
// also feed useSassyBotSentiment), consumed by Dashboard and its children
// so the run button / output panel / struggle timer don't need it prop-drilled.
export const PistonExecutionContext = createContext(null);

export function usePistonExecutionContext() {
  const ctx = useContext(PistonExecutionContext);
  if (!ctx) {
    throw new Error("usePistonExecutionContext must be used within PistonExecutionContext.Provider");
  }
  return ctx;
}
