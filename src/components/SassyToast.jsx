import React, { useEffect, useState } from "react";

const COLORS = {
  bg: "#1C1E2A",
  border: "#2E3244",
  fg: "#E4E7EE",
  fgDim: "#787C99",
};

const MOOD_ACCENT = {
  return_on_time: "#7DCFFF",
  nudge: "#7AA2F7",
  sassy: "#FF9E64",
  savage: "#F7768E",
  milestone: "#BB9AF7",
};

// Mimics a push notification card: bot avatar + title + body, auto-dismisses.
// This is the "duolingo-style" in-app notification for when you land back
// on the page after being gone — separate from the always-there MoodBot.
export default function SassyToast({ title, body, mood = "sassy", onDismiss, duration = 6000 }) {
  const [show, setShow] = useState(false);
  const accent = MOOD_ACCENT[mood] || MOOD_ACCENT.sassy;

  useEffect(() => {
    const inT = setTimeout(() => setShow(true), 50);
    const outT = setTimeout(() => {
      setShow(false);
      setTimeout(() => onDismiss && onDismiss(), 300);
    }, duration);
    return () => {
      clearTimeout(inT);
      clearTimeout(outT);
    };
  }, [duration, onDismiss]);

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-10px) scale(0.97); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: "22px",
          right: "22px",
          zIndex: 300,
          width: "320px",
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderLeft: `3px solid ${accent}`,
          borderRadius: "12px",
          padding: "14px 16px",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
          boxShadow: "0 20px 50px -16px rgba(0,0,0,0.7)",
          animation: `${show ? "toastIn" : "toastOut"} 0.3s cubic-bezier(0.16,1,0.3,1) both`,
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: `radial-gradient(circle at 30% 30%, ${accent}, ${accent}88)`,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: "15px",
            color: "#0D0E15",
          }}
        >
          r.
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "13px", color: COLORS.fg }}>
              {title}
            </span>
            <button
              onClick={() => {
                setShow(false);
                setTimeout(() => onDismiss && onDismiss(), 300);
              }}
              style={{
                background: "none",
                border: "none",
                color: COLORS.fgDim,
                cursor: "pointer",
                fontSize: "13px",
                padding: "0 2px",
              }}
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "12.5px", color: COLORS.fgDim, lineHeight: 1.5 }}>
            {body}
          </div>
        </div>
      </div>
    </>
  );
}
