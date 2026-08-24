import React, { useEffect, useState } from "react";
import SassyBot from "./SassyBot";
import { pickLine } from "../lib/sassyLines";

const COLORS = { bg: "#1A1B26", fg: "#C0CAF5" };

// Mirrors SassyBot's own THEME map (kept local rather than importing it,
// since SassyBot.jsx isn't meant to grow a new export surface for this).
const SENTIMENT_ACCENT = {
  idle: "#B6FF3C",
  sassy: "#FFD84C",
  cheer: "#39FF9A",
  thinking: "#4CE0FF",
  annoyed: "#FF9E4C",
  angry: "#FF2E2E",
};

// Same top-center overlay spot + speech bubble the old MoodBot occupied —
// only the mascot's visual design changed.
export default function SassyBotMount({ sentiment = "idle", streak = 0, onAutoSassy }) {
  const [line, setLine] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setLine(pickLine(sentiment, streak));
  }, [sentiment, streak]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const accent = SENTIMENT_ACCENT[sentiment] || SENTIMENT_ACCENT.idle;

  return (
    <>
      <style>{`
        @keyframes sassyBotIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sassyBubblePop {
          from { opacity: 0; transform: translateY(-4px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: "18px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 200,
          display: visible ? "flex" : "none",
          alignItems: "center",
          gap: "12px",
          animation: "sassyBotIn 0.4s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <SassyBot sentiment={sentiment} onAutoSassy={onAutoSassy} />
        {line && (
          <div
            style={{
              background: COLORS.bg,
              border: `1px solid ${accent}55`,
              borderRadius: "10px",
              padding: "8px 14px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12.5px",
              color: COLORS.fg,
              maxWidth: "360px",
              boxShadow: "0 8px 24px -8px rgba(0,0,0,0.6)",
              animation: "sassyBubblePop 0.3s ease-out both",
              animationDelay: "0.15s",
            }}
          >
            <span style={{ color: accent, marginRight: "6px" }}>&#9679;</span>
            {line}
          </div>
        )}
      </div>
    </>
  );
}
