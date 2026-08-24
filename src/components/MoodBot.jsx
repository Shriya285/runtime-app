import React, { useEffect, useState } from "react";
import { pickLine } from "../lib/sassyLines";

const COLORS = {
  bg: "#1A1B26",
  border: "#2E3244",
  blue: "#7AA2F7",
  cyan: "#7DCFFF",
  green: "#9ECE6A",
  violet: "#BB9AF7",
  orange: "#FF9E64",
  red: "#F7768E",
  fg: "#C0CAF5",
  fgDim: "#787C99",
};

const MOOD_CONFIG = {
  idle: { color: COLORS.green, mouth: "smile", label: "chill" },
  nudge: { color: COLORS.blue, mouth: "flat", label: "waiting" },
  sassy: { color: COLORS.orange, mouth: "smirk", label: "unimpressed" },
  savage: { color: COLORS.red, mouth: "frown", label: "grieving" },
  return_on_time: { color: COLORS.cyan, mouth: "smile", label: "pleased" },
  milestone: { color: COLORS.violet, mouth: "grin", label: "hyped" },
};

function BotFace({ color, mouth }) {
  const mouths = {
    smile: <path d="M9 15 Q13 18 17 15" stroke="#0D0E15" strokeWidth="1.6" fill="none" strokeLinecap="round" />,
    grin: <path d="M8 14 Q13 20 18 14" stroke="#0D0E15" strokeWidth="1.8" fill="none" strokeLinecap="round" />,
    flat: <line x1="9" y1="16" x2="17" y2="16" stroke="#0D0E15" strokeWidth="1.6" strokeLinecap="round" />,
    smirk: <path d="M9 16 Q13 14 18 15.5" stroke="#0D0E15" strokeWidth="1.6" fill="none" strokeLinecap="round" />,
    frown: <path d="M9 17 Q13 13 17 17" stroke="#0D0E15" strokeWidth="1.6" fill="none" strokeLinecap="round" />,
  };
  return (
    <svg width="46" height="46" viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="12" fill={color} stroke="#0D0E15" strokeWidth="1.4" />
      <circle cx="9" cy="11" r="1.6" fill="#0D0E15" />
      <circle cx="17" cy="11" r="1.6" fill="#0D0E15" />
      {mouths[mouth]}
    </svg>
  );
}

export default function MoodBot({ mood = "idle", streak = 0 }) {
  const [line, setLine] = useState("");
  const [visible, setVisible] = useState(false);
  const config = MOOD_CONFIG[mood] || MOOD_CONFIG.idle;

  useEffect(() => {
    setLine(pickLine(mood, streak));
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, [mood, streak]);

  return (
    <>
      <style>{`
        @keyframes botBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes botIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bubblePop {
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
          animation: "botIn 0.4s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <div
          style={{
            animation: "botBounce 2.4s ease-in-out infinite",
            filter: `drop-shadow(0 0 10px ${config.color}66)`,
          }}
        >
          <BotFace color={config.color} mouth={config.mouth} />
        </div>
        {line && (
          <div
            style={{
              background: COLORS.bg,
              border: `1px solid ${config.color}55`,
              borderRadius: "10px",
              padding: "8px 14px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12.5px",
              color: COLORS.fg,
              maxWidth: "360px",
              boxShadow: `0 8px 24px -8px rgba(0,0,0,0.6)`,
              animation: "bubblePop 0.3s ease-out both",
              animationDelay: "0.15s",
            }}
          >
            <span style={{ color: config.color, marginRight: "6px" }}>&#9679;</span>
            {line}
          </div>
        )}
      </div>
    </>
  );
}
