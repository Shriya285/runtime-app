import React, { useState, useEffect, useRef } from "react";

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

const codeLines = [
  { n: 1, tokens: [["comment", "// two pointers, sorted array"]] },
  { n: 2, tokens: [["kw", "function"], ["plain", " "], ["fn", "twoSum"], ["plain", "("], ["param", "nums"], ["plain", ", "], ["param", "target"], ["plain", ") {"]] },
  { n: 3, tokens: [["plain", "  "], ["kw", "let"], ["plain", " left = "], ["num", "0"], ["plain", ", right = nums."], ["fn", "length"], ["plain", " - "], ["num", "1"], ["plain", ";"]] },
  { n: 4, tokens: [["plain", "  "], ["kw", "while"], ["plain", " (left < right) {"]] },
  { n: 5, tokens: [["plain", "    "], ["kw", "const"], ["plain", " sum = nums[left] + nums[right];"]] },
  { n: 6, tokens: [["plain", "    "], ["kw", "if"], ["plain", " (sum === target) "], ["kw", "return"], ["plain", " [left, right];"]] },
  { n: 7, tokens: [["plain", "    sum < target ? left"], ["op", "++"], ["plain", " : right"], ["op", "--"], ["plain", ";"]] },
  { n: 8, tokens: [["plain", "  }"]] },
  { n: 9, tokens: [["plain", "}"]] },
];

function SyntaxLine({ tokens }) {
  const tokenColor = {
    comment: COLORS.comment,
    kw: COLORS.violet,
    fn: COLORS.blue,
    param: COLORS.orange,
    num: COLORS.yellow,
    op: COLORS.cyan,
    plain: COLORS.fg,
  };
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: tokenColor[t[0]] }}>
          {t[1]}
        </span>
      ))}
    </>
  );
}

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

export default function Dashboard() {
  const [runState, setRunState] = useState("idle"); // idle | compiling | success
  const typedTitle = useTypedText("Two Pointers", 55, 300);

  const handleRun = () => {
    if (runState === "compiling") return;
    setRunState("compiling");
    setTimeout(() => setRunState("success"), 1200);
  };

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
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: COLORS.raised,
              border: `1px solid ${COLORS.border}`,
            }}
          />
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
        <div
          className="reveal"
          style={{ width: "260px", flexShrink: 0, animationDelay: "0.08s" }}
        >
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
            {skillPath.map((node, i) => {
              const isDone = node.state === "done";
              const isActive = node.state === "active";
              const dotColor = isDone ? COLORS.green : isActive ? COLORS.blue : COLORS.comment;
              return (
                <div
                  key={node.name}
                  className="node-row"
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "13px 0",
                  }}
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
                    {isDone ? "\u2713" : isActive ? "" : "\u00b7"}
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
        <div
          className="reveal"
          style={{ flex: 1, minWidth: 0, animationDelay: "0.16s" }}
        >
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
              Lesson 07
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
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "12px",
                  color: COLORS.fgDim,
                  marginLeft: "6px",
                }}
              >
                two-pointers.js
              </span>
            </div>

            <div style={{ display: "flex", fontFamily: FONTS.mono, fontSize: "13.5px", lineHeight: "1.9" }}>
              <div
                style={{
                  padding: "18px 14px",
                  color: COLORS.comment,
                  textAlign: "right",
                  userSelect: "none",
                  borderRight: `1px solid ${COLORS.border}`,
                }}
              >
                {codeLines.map((l) => (
                  <div key={l.n}>{l.n}</div>
                ))}
              </div>
              <div style={{ padding: "18px 20px", overflowX: "auto", flex: 1 }}>
                {codeLines.map((l) => (
                  <div key={l.n} style={{ whiteSpace: "pre" }}>
                    <SyntaxLine tokens={l.tokens} />
                  </div>
                ))}
              </div>
            </div>

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
                style={{
                  background: COLORS.green,
                  color: COLORS.bgDark,
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 18px",
                  fontFamily: FONTS.mono,
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                &#9654; Run tests
              </button>
              <span style={{ fontFamily: FONTS.mono, fontSize: "12px", color: COLORS.fgDim }}>
                3 test cases
              </span>
            </div>

            {/* Output panel */}
            <div
              style={{
                borderTop: `1px solid ${COLORS.border}`,
                padding: "16px 20px",
                fontFamily: FONTS.mono,
                fontSize: "12.5px",
                minHeight: "76px",
                animation: runState === "success" ? "successFlash 1.2s ease forwards" : "none",
              }}
            >
              {runState === "idle" && (
                <span style={{ color: COLORS.comment }}>&gt; awaiting run&hellip;</span>
              )}
              {runState === "compiling" && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: COLORS.fgDim }}>
                  <div
                    style={{
                      width: "13px",
                      height: "13px",
                      border: `2px solid ${COLORS.border}`,
                      borderTopColor: COLORS.blue,
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  compiling and running test cases&hellip;
                </div>
              )}
              {runState === "success" && (
                <div style={{ color: COLORS.green, display: "flex", flexDirection: "column", gap: "3px" }}>
                  <span>&#10003; test 1 passed &mdash; [2,7,11,15], target 9</span>
                  <span>&#10003; test 2 passed &mdash; [3,2,4], target 6</span>
                  <span>&#10003; test 3 passed &mdash; [-1,0,1,2], target 1</span>
                  <span style={{ color: COLORS.fg, marginTop: "4px" }}>
                    3/3 passed &middot; runtime 0.4ms &middot; +40 XP
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: stats */}
        <div
          className="reveal"
          style={{ width: "220px", flexShrink: 0, animationDelay: "0.24s" }}
        >
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
