import { createContext, useContext } from "react";

// Provided by App.jsx (which owns the useCodeExecution() call so it can
// also feed useSassyBotSentiment), consumed by Dashboard and its children
// so the run button / output panel / struggle timer don't need it prop-drilled.
export const CodeExecutionContext = createContext(null);

export function useCodeExecutionContext() {
  const ctx = useContext(CodeExecutionContext);
  if (!ctx) {
    throw new Error("useCodeExecutionContext must be used within CodeExecutionContext.Provider");
  }
  return ctx;
}
