import React, { useEffect, useRef, useState } from "react";

const COLORS = {
  surface: "#20222F",
  border: "#2E3244",
  fg: "#C0CAF5",
  fgDim: "#787C99",
  green: "#9ECE6A",
  red: "#F7768E",
};
const FONTS = { mono: "'JetBrains Mono', monospace" };

function storageKey(lessonId) {
  return `runtime_struggle_started_${lessonId}`;
}

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

const DURATION_OPTIONS = [15, 20, 25, 30, 45];

/**
 * A struggle timer that must elapse before "Reveal solution" unlocks
 * normally. Early reveal is still possible (with a confirm step) — it
 * calls onReveal(true) so the caller can fire the 'annoyed' sentiment.
 */
export default function StruggleTimer({ lessonId, defaultMinutes = 25, onReveal, revealed = false }) {
  const [minutes, setMinutes] = useState(defaultMinutes);
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [confirmingEarly, setConfirmingEarly] = useState(false);
  const tickRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey(lessonId));
    if (stored) {
      setStartedAt(Number(stored));
    } else {
      const startTime = Date.now();
      localStorage.setItem(storageKey(lessonId), String(startTime));
      setStartedAt(startTime);
    }
  }, [lessonId]);

  useEffect(() => {
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  if (startedAt == null) return null;

  const elapsedSeconds = (now - startedAt) / 1000;
  const remainingSeconds = minutes * 60 - elapsedSeconds;
  const timeUp = remainingSeconds <= 0;

  const handleRevealClick = () => {
    if (revealed) return;
    if (timeUp) onReveal(false);
    else setConfirmingEarly(true);
  };

  const confirmEarlyReveal = () => {
    setConfirmingEarly(false);
    onReveal(true);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 14px",
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "8px",
        fontFamily: FONTS.mono,
        fontSize: "12px",
      }}
    >
      <span style={{ color: timeUp ? COLORS.green : COLORS.fgDim }}>
        {timeUp ? "struggle timer done" : "struggle timer"}
      </span>
      <span style={{ color: COLORS.fg, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        {timeUp ? "00:00" : formatClock(remainingSeconds)}
      </span>
      <select
        value={minutes}
        onChange={(e) => setMinutes(Number(e.target.value))}
        disabled={revealed}
        style={{
          background: "transparent",
          border: `1px solid ${COLORS.border}`,
          borderRadius: "6px",
          color: COLORS.fgDim,
          fontFamily: FONTS.mono,
          fontSize: "11px",
          padding: "3px 6px",
        }}
      >
        {DURATION_OPTIONS.map((m) => (
          <option key={m} value={m}>
            {m} min
          </option>
        ))}
      </select>
      <div style={{ flex: 1 }} />
      {!revealed && !confirmingEarly && (
        <button
          onClick={handleRevealClick}
          style={{
            background: "transparent",
            border: `1px solid ${timeUp ? COLORS.green : COLORS.border}`,
            borderRadius: "6px",
            padding: "5px 10px",
            color: timeUp ? COLORS.green : COLORS.fgDim,
            fontFamily: FONTS.mono,
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          {timeUp ? "Reveal solution" : "I'm stuck — reveal anyway"}
        </button>
      )}
      {confirmingEarly && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: COLORS.red }}>{formatClock(remainingSeconds)} left — reveal anyway?</span>
          <button
            onClick={confirmEarlyReveal}
            style={{
              background: COLORS.red,
              color: "#0D0E15",
              border: "none",
              borderRadius: "6px",
              padding: "4px 8px",
              fontFamily: FONTS.mono,
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            Yes
          </button>
          <button
            onClick={() => setConfirmingEarly(false)}
            style={{
              background: "transparent",
              color: COLORS.fgDim,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "6px",
              padding: "4px 8px",
              fontFamily: FONTS.mono,
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            Keep going
          </button>
        </div>
      )}
      {revealed && <span style={{ color: COLORS.fgDim }}>solution revealed</span>}
    </div>
  );
}
