import React, { useEffect, useRef, useState } from "react";

const COLORS = {
  surface: "#20222F",
  border: "#2E3244",
  fg: "#C0CAF5",
  fgDim: "#787C99",
  green: "#9ECE6A",
  blue: "#7AA2F7",
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
 * normally. Doesn't auto-start — it used to begin counting down silently
 * on mount with no visible "this is running" moment, which read as broken.
 * Now it waits for an explicit Start click. Not-started is treated the
 * same as still-running for reveal purposes (timeUp stays false), so
 * skipping the struggle entirely still routes through the early-reveal
 * confirmation rather than becoming a free bypass.
 */
export default function StruggleTimer({ lessonId, defaultMinutes = 25, onReveal, revealed = false }) {
  const [minutes, setMinutes] = useState(defaultMinutes);
  const [startedAt, setStartedAt] = useState(null); // null = not started yet
  const [now, setNow] = useState(Date.now());
  const [confirmingEarly, setConfirmingEarly] = useState(false);
  const tickRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey(lessonId));
    setStartedAt(stored ? Number(stored) : null);
    setConfirmingEarly(false);
  }, [lessonId]);

  useEffect(() => {
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  const handleStart = () => {
    const startTime = Date.now();
    localStorage.setItem(storageKey(lessonId), String(startTime));
    setStartedAt(startTime);
  };

  const started = startedAt != null;
  const elapsedSeconds = started ? (now - startedAt) / 1000 : 0;
  const remainingSeconds = minutes * 60 - elapsedSeconds;
  const timeUp = started && remainingSeconds <= 0;

  const handleRevealClick = () => {
    if (timeUp) onReveal(false);
    else setConfirmingEarly(true);
  };

  const confirmEarlyReveal = () => {
    setConfirmingEarly(false);
    onReveal(true);
  };

  let rightSide;
  if (revealed) {
    rightSide = <span style={{ color: COLORS.fgDim }}>solution revealed</span>;
  } else if (confirmingEarly) {
    rightSide = (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: COLORS.red }}>{formatClock(remainingSeconds)} left — reveal anyway?</span>
        <button onClick={confirmEarlyReveal} style={buttonStyle(COLORS.red, "#0D0E15")}>
          Yes
        </button>
        <button onClick={() => setConfirmingEarly(false)} style={buttonStyle("transparent", COLORS.fgDim)}>
          Keep going
        </button>
      </div>
    );
  } else if (timeUp) {
    rightSide = (
      <button onClick={handleRevealClick} style={buttonStyle("transparent", COLORS.green, COLORS.green)}>
        Reveal solution
      </button>
    );
  } else if (started) {
    rightSide = (
      <button onClick={handleRevealClick} style={buttonStyle("transparent", COLORS.fgDim)}>
        I&rsquo;m stuck — reveal anyway
      </button>
    );
  } else {
    rightSide = (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button onClick={handleStart} style={buttonStyle(COLORS.blue, "#0D0E15")}>
          Start struggle timer
        </button>
        <button
          onClick={() => setConfirmingEarly(true)}
          style={{
            background: "transparent",
            border: "none",
            color: COLORS.fgDim,
            fontFamily: FONTS.mono,
            fontSize: "10.5px",
            textDecoration: "underline",
            cursor: "pointer",
            padding: 0,
          }}
        >
          or reveal now
        </button>
      </div>
    );
  }

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
        {timeUp ? "struggle timer done" : started ? "struggle timer" : "struggle timer — not started"}
      </span>
      <span style={{ color: COLORS.fg, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        {started ? formatClock(remainingSeconds) : formatClock(minutes * 60)}
      </span>
      <select
        value={minutes}
        onChange={(e) => setMinutes(Number(e.target.value))}
        disabled={revealed || started}
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
      {rightSide}
    </div>
  );
}

function buttonStyle(background, color, borderColor) {
  return {
    background,
    border: `1px solid ${borderColor || (background === "transparent" ? "#2E3244" : background)}`,
    borderRadius: "6px",
    padding: "5px 10px",
    color,
    fontFamily: FONTS.mono,
    fontWeight: background === "transparent" ? 400 : 600,
    fontSize: "11px",
    cursor: "pointer",
  };
}
