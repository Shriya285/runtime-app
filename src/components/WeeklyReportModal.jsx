import React, { useEffect, useState } from "react";

const COLORS = {
  bg: "#1A1B26",
  surface: "#20222F",
  border: "#2E3244",
  fg: "#C0CAF5",
  fgDim: "#787C99",
  green: "#9ECE6A",
  blue: "#7AA2F7",
  red: "#F7768E",
};
const FONTS = { mono: "'JetBrains Mono', monospace", body: "'Plus Jakarta Sans', sans-serif" };

function buildReportText(completions, feedback) {
  const lines = ["runtime. — weekly report", ""];
  completions.forEach((c, i) => {
    const how = c.reason === "tests-passed" ? "solved" : "solution revealed";
    lines.push(`${i + 1}. ${c.lessonTitle} (${c.language}) — ${how}`);
    lines.push(`   Trigger: ${c.trigger}`);
    lines.push(`   Core idea: ${c.coreIdea}`);
    lines.push("   Solution:");
    lines.push(
      c.code
        .split("\n")
        .map((l) => `     ${l}`)
        .join("\n")
    );
    lines.push("");
  });
  if (feedback) {
    lines.push("What the AI has to say:");
    lines.push(feedback);
  }
  return lines.join("\n");
}

export default function WeeklyReportModal({ completions, onClose }) {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (completions.length === 0) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/weekly-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completions }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        if (!cancelled) setFeedback(data.feedback);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completions.length]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText(completions, feedback));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8,9,13,0.7)",
        zIndex: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "14px",
          padding: "24px",
          width: "560px",
          maxWidth: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          fontFamily: FONTS.body,
          color: COLORS.fg,
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontFamily: FONTS.mono }}>This week&rsquo;s report</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: COLORS.fgDim, fontSize: "18px", cursor: "pointer", lineHeight: 1 }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {completions.length === 0 ? (
          <div style={{ color: COLORS.fgDim, fontSize: "13px" }}>
            Nothing completed yet this week — solve a problem (or reveal a solution and save your notes) to
            start building this report.
          </div>
        ) : (
          <>
            {completions.map((c, i) => (
              <div key={i} style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: "12px", color: COLORS.blue, marginBottom: "6px" }}>
                  {c.lessonTitle} &middot; {c.language} &middot;{" "}
                  {c.reason === "tests-passed" ? "solved" : "solution revealed"}
                </div>
                <div style={{ fontSize: "12.5px", color: COLORS.fgDim, marginBottom: "4px" }}>
                  <strong style={{ color: COLORS.fg }}>Trigger:</strong> {c.trigger}
                </div>
                <div style={{ fontSize: "12.5px", color: COLORS.fgDim, marginBottom: "8px" }}>
                  <strong style={{ color: COLORS.fg }}>Core idea:</strong> {c.coreIdea}
                </div>
                <pre
                  style={{
                    background: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontFamily: FONTS.mono,
                    fontSize: "11.5px",
                    overflowX: "auto",
                    margin: 0,
                  }}
                >
                  {c.code}
                </pre>
              </div>
            ))}

            <div style={{ marginTop: "8px" }}>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "11px",
                  color: COLORS.fgDim,
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                What the AI has to say
              </div>
              {loading && <div style={{ color: COLORS.fgDim, fontSize: "13px" }}>Generating feedback&hellip;</div>}
              {error && <div style={{ color: COLORS.red, fontSize: "13px" }}>{error}</div>}
              {feedback && <div style={{ fontSize: "13px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{feedback}</div>}
            </div>

            <button
              onClick={handleCopy}
              style={{
                marginTop: "18px",
                background: copied ? COLORS.green : "transparent",
                color: copied ? "#0D0E15" : COLORS.fg,
                border: `1px solid ${copied ? COLORS.green : COLORS.border}`,
                borderRadius: "6px",
                padding: "7px 14px",
                fontFamily: FONTS.mono,
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {copied ? "Copied!" : "Copy report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
