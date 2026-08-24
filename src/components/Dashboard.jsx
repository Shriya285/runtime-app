import React, { useEffect, useState } from "react";
import CodeEditor from "./CodeEditor";
import OutputPanel from "./OutputPanel";
import LeetCodeLinkField from "./LeetCodeLinkField";
import AvatarInitials from "./AvatarInitials";
import { CURRENT_LESSON } from "../lib/lessons";
import { usePistonExecutionContext } from "../lib/PistonExecutionContext";

const COLORS = {
  bg: "#1A1B26",
  bgDark: "#16161E",
  surface: "#20222F",
  raised: "#24283B",
  border: "#2E3244",
  fg: "#C0CAF5",
  fgDim: "#787C99",
  comment: "#565F89",
  blue: "#7AA2F7",
  cyan: "#7DCFFF",
  green: "#9ECE6A",
  violet: "#BB9AF7",
  orange: "#FF9E64",
  red: "#F7768E",
  yellow: "#E0AF68",
};

const FONTS = {
  display: "'Fraunces', serif",
  body: "'Plus Jakarta Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

function useTypedText(text, speed = 28, startDelay = 0) {
  const [out, setOut] = useState("");
  useEffect(() => {
    let i = 0;
    let interval;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, speed, startDelay]);
  return out;
}

const skillPath = [
  { name: "Arrays & Strings", state: "done" },
  { name: "Two Pointers", state: "active" },
  { name: "Sliding Window", state: "locked" },
  { name: "Binary Search", state: "locked" },
  { name: "Trees & Recursion", state: "locked" },
];

function codeStorageKey(lessonId) {
  return `runtime_code_${lessonId}`;
}

export default function Dashboard() {
  const lesson = CURRENT_LESSON;
  const piston = usePistonExecutionContext();
  const typedTitle = useTypedText(lesson.title, 55, 300);

  const [code, setCode] = useState(
    () => localStorage.getItem(codeStorageKey(lesson.id)) || lesson.starterCode
  );

  useEffect(() => {
    localStorage.setItem(codeStorageKey(lesson.id), code);
  }, [code, lesson.id]);

  const handleRun = () => {
    piston.runTests(code);
  };

  const outputState = piston.isLoading
    ? "loading"
    : piston.error
    ? "error"
    : piston.results
    ? "results"
    : "idle";
  const allPassed = piston.results && piston.results.every((r) => r.passed);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.fg,
        fontFamily: FONTS.body,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(122,162,247,0.45); }
          50% { box-shadow: 0 0 0 8px rgba(122,162,247,0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes successFlash {
          0% { background: rgba(158,206,106,0); }
          30% { background: rgba(158,206,106,0.12); }
          100% { background: rgba(158,206,106,0.03); }
        }
        .reveal { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .cursor-blink { animation: blink 1s step-start infinite; }
        .run-btn:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .run-btn:active { transform: translateY(0px); }
        .node-row:hover .node-label { color: ${COLORS.fg}; }
      `}</style>

      {/* Atmosphere: grid + radial mesh */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${COLORS.border}22 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border}22 1px, transparent 1px)`,
          backgroundSize: "42px 42px",
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 40%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-180px",
          left: "8%",
          width: "560px",
          height: "560px",
          background: `radial-gradient(circle, ${COLORS.blue}33 0%, transparent 70%)`,
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "5%",
          width: "480px",
          height: "480px",
          background: `radial-gradient(circle, ${COLORS.violet}26 0%, transparent 70%)`,
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />

      {/* Top nav */}
      <div
        className="reveal"
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 44px",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontFamily: FONTS.display,
              fontWeight: 600,
              fontSize: "21px",
              letterSpacing: "-0.01em",
            }}
          >
            runtime<span style={{ color: COLORS.orange }}>.</span>
          </span>
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: "12.5px",
            color: COLORS.fgDim,
            display: "flex",
            gap: "22px",
            alignItems: "center",
          }}
        >
          <span style={{ color: COLORS.orange }}>&#9679; 14 day streak</span>
          <span>1,240 XP</span>
          <AvatarInitials />
        </div>
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          maxWidth: "1240px",
          margin: "0 auto",
          gap: "28px",
          padding: "40px 44px",
        }}
      >
        {/* Left: skill path */}
        <div className="reveal" style={{ width: "260px", flexShrink: 0, animationDelay: "0.08s" }}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: "11px",
              color: COLORS.fgDim,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "18px",
            }}
          >
            Path &mdash; Foundations
          </div>
          <div style={{ position: "relative", paddingLeft: "6px" }}>
            <div
              style={{
                position: "absolute",
                left: "15px",
                top: "10px",
                bottom: "10px",
                width: "2px",
                background: `linear-gradient(${COLORS.green}, ${COLORS.border})`,
              }}
            />
            {skillPath.map((node) => {
              const isDone = node.state === "done";
              const isActive = node.state === "active";
              const dotColor = isDone ? COLORS.green : isActive ? COLORS.blue : COLORS.comment;
              return (
                <div
                  key={node.name}
                  className="node-row"
                  style={{ position: "relative", display: "flex", alignItems: "center", gap: "16px", padding: "13px 0" }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: isActive ? COLORS.bg : dotColor,
                      border: `2px solid ${dotColor}`,
                      flexShrink: 0,
                      zIndex: 1,
                      animation: isActive ? "pulseGlow 2s infinite" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontFamily: FONTS.mono,
                      color: isDone ? COLORS.bgDark : dotColor,
                    }}
                  >
                    {isDone ? "✓" : isActive ? "" : "·"}
                  </div>
                  <span
                    className="node-label"
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: "13px",
                      color: isActive ? COLORS.fg : isDone ? COLORS.fgDim : COLORS.comment,
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {node.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: lesson terminal */}
        <div className="reveal" style={{ flex: 1, minWidth: 0, animationDelay: "0.16s" }}>
          <div style={{ marginBottom: "18px" }}>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: "11px",
                color: COLORS.blue,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "6px",
              }}
            >
              Lesson {String(lesson.lessonNumber).padStart(2, "0")}
            </div>
            <h1
              style={{
                fontFamily: FONTS.display,
                fontWeight: 600,
                fontSize: "34px",
                margin: 0,
                minHeight: "42px",
              }}
            >
              {typedTitle}
              <span className="cursor-blink" style={{ color: COLORS.orange }}>
                &#9612;
              </span>
            </h1>
          </div>

          {/* Terminal chrome */}
          <div
            style={{
              background: COLORS.bgDark,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 20px 60px -20px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 16px",
                borderBottom: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
              }}
            >
              <div style={{ display: "flex", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS.red }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS.yellow }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS.green }} />
              </div>
              <span style={{ fontFamily: FONTS.mono, fontSize: "12px", color: COLORS.fgDim, marginLeft: "6px" }}>
                {lesson.filename}
              </span>
            </div>

            <CodeEditor value={code} onChange={setCode} height="280px" />

            {/* Run bar */}
            <div
              style={{
                borderTop: `1px solid ${COLORS.border}`,
                padding: "14px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: COLORS.surface,
              }}
            >
              <button
                className="run-btn"
                onClick={handleRun}
                disabled={piston.isLoading}
                style={{
                  background: COLORS.green,
                  color: COLORS.bgDark,
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 18px",
                  fontFamily: FONTS.mono,
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: piston.isLoading ? "default" : "pointer",
                  opacity: piston.isLoading ? 0.7 : 1,
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                &#9654; Run tests
              </button>
              <span style={{ fontFamily: FONTS.mono, fontSize: "12px", color: COLORS.fgDim }}>
                {lesson.testCases.length} test cases
              </span>
            </div>

            {/* Solved elsewhere */}
            <div
              style={{
                borderTop: `1px solid ${COLORS.border}`,
                padding: "12px 20px",
                background: COLORS.surface,
              }}
            >
              <LeetCodeLinkField lessonId={lesson.id} />
            </div>

            {/* Output panel */}
            <div
              style={{
                borderTop: `1px solid ${COLORS.border}`,
                padding: "16px 20px",
                fontFamily: FONTS.mono,
                fontSize: "12.5px",
                minHeight: "76px",
                animation: allPassed ? "successFlash 1.2s ease forwards" : "none",
              }}
            >
              <OutputPanel
                state={outputState}
                error={piston.error}
                results={piston.results}
                runtimeMs={piston.runtimeMs}
                memoryBytes={piston.memoryBytes}
                testCount={lesson.testCases.length}
              />
            </div>
          </div>
        </div>

        {/* Right: stats */}
        <div className="reveal" style={{ width: "220px", flexShrink: 0, animationDelay: "0.24s" }}>
          <div
            style={{
              background: COLORS.raised,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "18px",
              marginBottom: "14px",
            }}
          >
            <div style={{ fontFamily: FONTS.mono, fontSize: "11px", color: COLORS.fgDim, marginBottom: "10px", textTransform: "uppercase" }}>
              This week
            </div>
            <div style={{ fontFamily: FONTS.display, fontSize: "30px", fontWeight: 600, color: COLORS.orange }}>
              5<span style={{ fontSize: "16px", color: COLORS.fgDim, fontFamily: FONTS.body }}>/7 days</span>
            </div>
          </div>
          <div
            style={{
              background: COLORS.raised,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "18px",
            }}
          >
            <div style={{ fontFamily: FONTS.mono, fontSize: "11px", color: COLORS.fgDim, marginBottom: "10px", textTransform: "uppercase" }}>
              Next milestone
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: "13.5px", color: COLORS.fg, lineHeight: 1.5 }}>
              Finish <span style={{ color: COLORS.violet }}>Two Pointers</span> to unlock{" "}
              <span style={{ color: COLORS.cyan }}>Sliding Window</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
