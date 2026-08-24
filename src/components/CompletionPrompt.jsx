import React, { useState } from "react";

const COLORS = {
  surface: "#20222F",
  bgDark: "#16161E",
  border: "#2E3244",
  fg: "#C0CAF5",
  fgDim: "#787C99",
  green: "#9ECE6A",
  blue: "#7AA2F7",
};
const FONTS = { mono: "'JetBrains Mono', monospace" };

const inputStyle = {
  width: "100%",
  background: COLORS.bgDark,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "6px",
  padding: "8px 10px",
  fontFamily: FONTS.mono,
  fontSize: "12px",
  color: COLORS.fg,
  outline: "none",
  boxSizing: "border-box",
};

/** Prompts for the two fields that get stored per-problem for spaced review. */
export default function CompletionPrompt({ reason, onSave, onDismiss }) {
  const [trigger, setTrigger] = useState("");
  const [coreIdea, setCoreIdea] = useState("");
  const canSave = trigger.trim() && coreIdea.trim();

  const handleSave = () => {
    if (!canSave) return;
    onSave({ trigger: trigger.trim(), coreIdea: coreIdea.trim() });
  };

  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: "8px",
        padding: "14px 16px",
        background: COLORS.surface,
        marginTop: "12px",
        fontFamily: FONTS.mono,
      }}
    >
      <div
        style={{
          color: reason === "tests-passed" ? COLORS.green : COLORS.blue,
          fontSize: "12px",
          marginBottom: "10px",
          fontWeight: 600,
        }}
      >
        {reason === "tests-passed" ? "Tests passed — lock it in" : "Solution revealed — lock it in anyway"}
      </div>
      <label style={{ display: "block", fontSize: "11px", color: COLORS.fgDim, marginBottom: "4px" }}>
        Trigger — how will you recognize this pattern next time?
      </label>
      <input
        value={trigger}
        onChange={(e) => setTrigger(e.target.value)}
        placeholder="e.g. sorted array + pair/target sum"
        style={inputStyle}
      />
      <label style={{ display: "block", fontSize: "11px", color: COLORS.fgDim, margin: "10px 0 4px" }}>
        Core idea — the one-line mechanism
      </label>
      <input
        value={coreIdea}
        onChange={(e) => setCoreIdea(e.target.value)}
        placeholder="e.g. converge two pointers from both ends"
        style={inputStyle}
      />
      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            background: COLORS.green,
            color: "#0D0E15",
            border: "none",
            borderRadius: "6px",
            padding: "6px 12px",
            fontFamily: FONTS.mono,
            fontWeight: 600,
            fontSize: "11.5px",
            cursor: canSave ? "pointer" : "not-allowed",
            opacity: canSave ? 1 : 0.5,
          }}
        >
          Save &amp; schedule review
        </button>
        <button
          onClick={onDismiss}
          style={{
            background: "transparent",
            color: COLORS.fgDim,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "6px",
            padding: "6px 12px",
            fontFamily: FONTS.mono,
            fontSize: "11.5px",
            cursor: "pointer",
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
