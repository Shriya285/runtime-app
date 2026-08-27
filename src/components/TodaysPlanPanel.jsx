import React from "react";
import DueForReview from "./DueForReview";

const COLORS = {
  raised: "#24283B",
  border: "#2E3244",
  fg: "#C0CAF5",
  fgDim: "#787C99",
  green: "#9ECE6A",
  blue: "#7AA2F7",
  orange: "#FF9E64",
  violet: "#BB9AF7",
};
const FONTS = { mono: "'JetBrains Mono', monospace", body: "'Plus Jakarta Sans', sans-serif" };

const panelStyle = {
  background: COLORS.raised,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "12px",
  padding: "18px",
  marginBottom: "18px",
};
const headerStyle = {
  fontFamily: FONTS.mono,
  fontSize: "11px",
  color: COLORS.fgDim,
  marginBottom: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const primaryButtonStyle = {
  background: COLORS.blue,
  color: "#0D0E15",
  border: "none",
  borderRadius: "6px",
  padding: "8px 14px",
  fontFamily: FONTS.mono,
  fontWeight: 600,
  fontSize: "12px",
  cursor: "pointer",
};

/**
 * The plan's dashboard surface: Day X of 15, the current pattern(s), and
 * the day's assigned work — a distinct look for mock-OA days (orange
 * accent + timer icon) vs. regular lesson days vs. the review day.
 */
export default function TodaysPlanPanel({
  planDay,
  blockComplete,
  reviewLessons,
  reviewRefreshKey,
  activeProblemId,
  completedIds,
  onOpenProblem,
  onAdvanceDay,
  onStartNextBlock,
  onStartMockOA,
}) {
  if (blockComplete) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>15-day plan</div>
        <div style={{ fontFamily: FONTS.body, fontSize: "13.5px", color: COLORS.fg, marginBottom: "12px" }}>
          Block complete — nice work.
        </div>
        <button onClick={onStartNextBlock} style={primaryButtonStyle}>
          Start next block
        </button>
      </div>
    );
  }

  if (!planDay) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>15-day plan</div>
        <div style={{ fontFamily: FONTS.body, fontSize: "13px", color: COLORS.fgDim }}>Loading today&rsquo;s plan…</div>
      </div>
    );
  }

  const { dayNumber, template, assignedProblems } = planDay;
  const isMockOA = template.type === "mockOA";
  const isReview = template.type === "review";
  const allLessonProblemsDone =
    !isMockOA && !isReview && assignedProblems.length > 0 && assignedProblems.every((p) => completedIds.has(p.id));

  return (
    <div
      style={{
        ...panelStyle,
        border: isMockOA ? `1px solid ${COLORS.orange}66` : panelStyle.border,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ ...headerStyle, marginBottom: 0 }}>Day {dayNumber} of 15</div>
        {isMockOA && (
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: "10.5px",
              color: COLORS.orange,
              border: `1px solid ${COLORS.orange}66`,
              borderRadius: "5px",
              padding: "2px 7px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ⏱ {template.label}
          </span>
        )}
      </div>

      {isReview ? (
        <>
          <div style={{ fontFamily: FONTS.body, fontSize: "13px", color: COLORS.fgDim, marginBottom: "12px" }}>
            Review day — whatever&rsquo;s due, nothing new.
          </div>
          <DueForReview lessons={reviewLessons} refreshKey={reviewRefreshKey} />
          <button onClick={onAdvanceDay} style={{ ...primaryButtonStyle, marginTop: "12px", width: "100%" }}>
            Done reviewing — next day
          </button>
        </>
      ) : isMockOA ? (
        <>
          <div style={{ fontFamily: FONTS.body, fontSize: "13px", color: COLORS.fg, marginBottom: "4px" }}>
            {assignedProblems.length} problems &middot; one combined session timer &middot; no reveal-solution
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: "11px", color: COLORS.fgDim, marginBottom: "12px" }}>
            {[...new Set(assignedProblems.map((p) => p.pattern))].join(" + ")}
          </div>
          <button onClick={onStartMockOA} style={{ ...primaryButtonStyle, background: COLORS.orange, width: "100%" }}>
            Start mock OA session
          </button>
        </>
      ) : (
        <>
          <div style={{ fontFamily: FONTS.mono, fontSize: "11px", color: COLORS.violet, marginBottom: "10px" }}>
            {template.pattern}
          </div>
          {assignedProblems.map((p) => {
            const done = completedIds.has(p.id);
            const isActive = p.id === activeProblemId;
            return (
              <div
                key={p.id}
                onClick={() => onOpenProblem(p)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 8px",
                  marginLeft: "-8px",
                  borderRadius: "6px",
                  background: isActive ? "#2E3244" : "transparent",
                  cursor: "pointer",
                  fontFamily: FONTS.body,
                  fontSize: "13px",
                }}
              >
                <span style={{ color: done ? COLORS.green : COLORS.fgDim }}>{done ? "✓" : "○"}</span>
                <span style={{ color: COLORS.fg, flex: 1 }}>{p.title}</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: "10px", color: COLORS.fgDim }}>{p.difficulty}</span>
              </div>
            );
          })}
          {allLessonProblemsDone && (
            <button onClick={onAdvanceDay} style={{ ...primaryButtonStyle, marginTop: "12px", width: "100%" }}>
              Next day →
            </button>
          )}
        </>
      )}
    </div>
  );
}
