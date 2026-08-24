import React, { useEffect, useState } from "react";
import { advanceReview, getDueReviews, getUpcomingReviews } from "../lib/spacedRepetition";

const COLORS = {
  raised: "#24283B",
  border: "#2E3244",
  fgDim: "#787C99",
  fg: "#C0CAF5",
  orange: "#FF9E64",
  green: "#9ECE6A",
};
const FONTS = { mono: "'JetBrains Mono', monospace", body: "'Plus Jakarta Sans', sans-serif" };

function timeUntil(dateStr) {
  const diffMs = new Date(dateStr) - Date.now();
  const days = Math.round(Math.abs(diffMs) / 86400000);
  if (diffMs <= 0) return days === 0 ? "due today" : `${days}d overdue`;
  return `in ${days}d`;
}

const panelStyle = {
  background: COLORS.raised,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "12px",
  padding: "18px",
  marginBottom: "14px",
};
const headerStyle = {
  fontFamily: FONTS.mono,
  fontSize: "11px",
  color: COLORS.fgDim,
  marginBottom: "10px",
  textTransform: "uppercase",
};
const rowStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  padding: "8px 0",
  borderTop: `1px solid ${COLORS.border}`,
};

// "Reps on a pattern, not just lessons completed" — the spaced-repetition
// queue built from CompletionPrompt saves. `refreshKey` bumps whenever a
// new completion is recorded so this re-reads localStorage.
export default function DueForReview({ lessons, refreshKey }) {
  const [due, setDue] = useState([]);
  const [upcoming, setUpcoming] = useState([]);

  const reload = () => {
    const ids = lessons.map((l) => l.id);
    setDue(getDueReviews(ids));
    setUpcoming(getUpcomingReviews(ids));
  };

  useEffect(reload, [lessons, refreshKey]);

  const lessonTitle = (id) => lessons.find((l) => l.id === id)?.title || id;

  const handleMarkReviewed = (lessonId) => {
    advanceReview(lessonId);
    reload();
  };

  if (due.length === 0 && upcoming.length === 0) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>Due for review</div>
        <div style={{ fontFamily: FONTS.body, fontSize: "12.5px", color: COLORS.fgDim }}>
          Finish a problem to start building your review queue.
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>Due for review</div>
      {due.length === 0 && (
        <div style={{ fontFamily: FONTS.body, fontSize: "12px", color: COLORS.fgDim }}>
          Nothing due right now.
        </div>
      )}
      {due.map((r) => (
        <div key={r.lessonId} style={rowStyle}>
          <span style={{ color: COLORS.orange }}>&#9679;</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: COLORS.fg, fontSize: "12.5px" }}>{lessonTitle(r.lessonId)}</div>
            <div style={{ color: COLORS.fgDim, fontSize: "11px" }}>{timeUntil(r.nextDueAt)}</div>
          </div>
          <button
            onClick={() => handleMarkReviewed(r.lessonId)}
            style={{
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "6px",
              padding: "3px 7px",
              color: COLORS.green,
              fontFamily: FONTS.mono,
              fontSize: "10px",
              cursor: "pointer",
              alignSelf: "center",
            }}
          >
            Mark reviewed
          </button>
        </div>
      ))}
      {upcoming.slice(0, 3).map((r) => (
        <div key={r.lessonId} style={{ ...rowStyle, opacity: 0.6 }}>
          <span style={{ color: COLORS.green }}>&#9679;</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: COLORS.fg, fontSize: "12.5px" }}>{lessonTitle(r.lessonId)}</div>
            <div style={{ color: COLORS.fgDim, fontSize: "11px" }}>{timeUntil(r.nextDueAt)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
