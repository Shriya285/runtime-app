import React, { useState, useEffect, useRef, useCallback } from "react";

const THEME = {
  idle: { glow: "#B6FF3C" },
  sassy: { glow: "#FFD84C" },
  cheer: { glow: "#39FF9A" },
  thinking: { glow: "#4CE0FF" },
  annoyed: { glow: "#FF9E4C" },
  angry: { glow: "#FF2E2E" },
};

const BOREDOM_MS = 2800;

function eyeStyle(sentiment, side) {
  const base = {
    width: "26px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  if (sentiment === "sassy") {
    return { ...base, height: "19px", borderRadius: "50px", transform: "translateX(8px)" };
  }
  if (sentiment === "cheer") {
    return {
      ...base,
      width: "30px",
      height: "20px",
      borderRadius: "50px 50px 0 0",
      transform: "scale(1.15)",
    };
  }
  if (sentiment === "thinking") {
    const squinted = side === "left";
    return { ...base, height: squinted ? "6px" : "40px", borderRadius: "50px", transform: "translateX(0)" };
  }
  if (sentiment === "annoyed") {
    const isLeft = side === "left";
    return { ...base, height: isLeft ? "12px" : "18px", borderRadius: "50px", transform: "translateX(0)" };
  }
  if (sentiment === "angry") {
    const angle = side === "left" ? -22 : 22;
    return { ...base, height: "7px", borderRadius: "50px", transform: `rotate(${angle}deg)` };
  }
  return { ...base, height: "42px", borderRadius: "50px", transform: "scale(1)" };
}

function PixelLoader({ color }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "-16px",
        left: "50%",
        marginLeft: "-6px",
        width: "12px",
        height: "12px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1.5px",
        animation: "loaderSpin 1.6s linear infinite",
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: "4.5px",
            height: "4.5px",
            background: color,
            opacity: i === 0 ? 1 : 0.35,
            boxShadow: i === 0 ? `0 0 4px ${color}` : "none",
          }}
        />
      ))}
    </div>
  );
}

function CheerSparks({ color }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: `${28 + i * 22}%`,
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 6px ${color}`,
            animation: "sparkBurst 0.9s ease-out infinite",
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </>
  );
}

export function SassyBot({ sentiment = "idle", onAutoSassy }) {
  const [blink, setBlink] = useState(false);
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState(-3);
  const chassisRef = useRef(null);
  const boredomTimer = useRef(null);

  useEffect(() => {
    if (sentiment !== "idle") {
      setBlink(false);
      return;
    }
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 220);
    }, 4000);
    return () => clearInterval(interval);
  }, [sentiment]);

  const resetBoredomTimer = useCallback(() => {
    if (boredomTimer.current) clearTimeout(boredomTimer.current);
    boredomTimer.current = setTimeout(() => {
      onAutoSassy && onAutoSassy();
    }, BOREDOM_MS);
  }, [onAutoSassy]);

  const handleMouseMove = useCallback(
    (e) => {
      if (!chassisRef.current) return;
      const rect = chassisRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = ((e.clientX - cx) / (rect.width / 2)) * 3.5;
      const dy = ((e.clientY - cy) / (rect.height / 2)) * 3.5;
      setCursorOffset({ x: Math.max(-4, Math.min(4, dx)), y: Math.max(-4, Math.min(4, dy)) });
      setTilt(dx > 0 ? -3 : 3);
      resetBoredomTimer();
    },
    [resetBoredomTimer]
  );

  const handleMouseLeave = useCallback(() => {
    setCursorOffset({ x: 0, y: 0 });
    if (boredomTimer.current) clearTimeout(boredomTimer.current);
  }, []);

  useEffect(() => () => boredomTimer.current && clearTimeout(boredomTimer.current), []);

  const theme = THEME[sentiment] || THEME.idle;

  const chassisAnim =
    sentiment === "cheer"
      ? "cheerHop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) infinite"
      : sentiment === "annoyed"
      ? "annoyedShake 1.3s ease-in-out infinite"
      : sentiment === "angry"
      ? "angryShake 0.13s linear infinite"
      : "breathe 4.2s ease-in-out infinite alternate";

  const chassisRotate = sentiment === "sassy" ? `rotate(${tilt}deg)` : "rotate(0deg)";

  const leftEye = eyeStyle(sentiment, "left");
  const rightEye = eyeStyle(sentiment, "right");
  const blinkTransform = blink ? " scaleY(0.06)" : "";

  const visorBg =
    sentiment === "angry"
      ? "radial-gradient(circle at 50% 40%, #3A1418, #150a0c)"
      : sentiment === "annoyed"
      ? "radial-gradient(circle at 50% 40%, #2A2114, #14100a)"
      : "radial-gradient(circle at 50% 40%, #14161E, #08090D)";

  return (
    <div
      ref={chassisRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: "156px",
        height: "124px",
        borderRadius: "34px",
        background: "linear-gradient(155deg, #1C1F28, #101218)",
        border: "1px solid #2A2E3A",
        boxShadow: `0 0 24px ${theme.glow}22, 0 16px 34px -16px rgba(0,0,0,0.75)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: chassisRotate,
        animation: chassisAnim,
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease",
        cursor: "pointer",
        position: "relative",
      }}
    >
      {sentiment === "cheer" && <CheerSparks color={theme.glow} />}

      <div
        style={{
          width: "120px",
          height: "84px",
          borderRadius: "22px",
          background: visorBg,
          border: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          position: "relative",
          overflow: "visible",
          transition: "background 0.35s ease",
        }}
      >
        {sentiment === "angry" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "22px",
              background: "#FF2E2E",
              animation: "angryPulse 0.55s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
        )}

        <div style={{ position: "relative" }}>
          <div
            style={{
              ...leftEye,
              background: theme.glow,
              boxShadow: `0 0 12px ${theme.glow}`,
              transform: `translate(${cursorOffset.x}px, ${cursorOffset.y}px) ${leftEye.transform}${blinkTransform}`,
            }}
          />
          {sentiment === "thinking" && <PixelLoader color={theme.glow} />}
        </div>

        <div
          style={{
            ...rightEye,
            background: theme.glow,
            boxShadow: `0 0 12px ${theme.glow}`,
            transform: `translate(${cursorOffset.x}px, ${cursorOffset.y}px) ${rightEye.transform}${blinkTransform}`,
          }}
        />
      </div>

      <style>{`
        @keyframes breathe {
          from { transform: translateY(0) scaleY(1); }
          to { transform: translateY(-3px) scaleY(1.015); }
        }
        @keyframes cheerHop {
          0%, 100% { transform: translateY(0) scaleY(1); }
          40% { transform: translateY(-14px) scaleY(1.05); }
          55% { transform: translateY(0) scaleY(0.92); }
          70% { transform: translateY(-4px) scaleY(1.02); }
        }
        @keyframes annoyedShake {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes angryShake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
        @keyframes angryPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        @keyframes sparkBurst {
          0% { transform: translateY(0) scale(1); opacity: 0.9; }
          100% { transform: translateY(-30px) scale(0.3); opacity: 0; }
        }
        @keyframes loaderSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default SassyBot;
