import React, { useEffect, useRef, useState } from "react";
import CodeEditor from "./CodeEditor";
import OutputPanel from "./OutputPanel";
import CompletionPrompt from "./CompletionPrompt";
import { useCodeExecutionContext } from "../lib/CodeExecutionContext";

const COLORS = {
  bg: "#1A1B26",
  bgDark: "#16161E",
  surface: "#20222F",
  raised: "#24283B",
  border: "#2E3244",
  fg: "#C0CAF5",
  fgDim: "#787C99",
  green: "#9ECE6A",
  orange: "#FF9E64",
  red: "#F7768E",
};
const FONTS = { mono: "'JetBrains Mono', monospace", body: "'Plus Jakarta Sans', sans-serif" };

function codeKey(sessionKey, problemId) {
  return `runtime_mockoa_code_${sessionKey}_${problemId}`;
}
function startedKey(sessionKey) {
  return `runtime_mockoa_started_${sessionKey}`;
}

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

const DURATION_OPTIONS = [45, 60];

/**
 * A real OA doesn't let you pause indefinitely or peek at a solution, so
 * this is a distinct flow from the regular lesson terminal: one combined
 * session timer for the whole problem set (not per-problem), no reveal
 * option, and the trigger/core-idea capture happens once at the end for
 * whichever problems were actually attempted — not per problem as you go.
 */
export default function MockOASession({ problems, sessionKey, onFinish }) {
  const execution = useCodeExecutionContext();
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [startedAt, setStartedAt] = useState(() => {
    const stored = localStorage.getItem(startedKey(sessionKey));
    return stored ? Number(stored) : null;
  });
  const [now, setNow] = useState(Date.now());
  const [activeIndex, setActiveIndex] = useState(0);
  const [codeByProblem, setCodeByProblem] = useState(() =>
    Object.fromEntries(
      problems.map((p) => [p.id, localStorage.getItem(codeKey(sessionKey, p.id)) || p.starterCode])
    )
  );
  const [attemptsByProblem, setAttemptsByProblem] = useState({}); // id -> { attempted: true, passed, total }
  const [phase, setPhase] = useState("session"); // 'session' | 'wrapup' | 'done'
  const [wrapupIndex, setWrapupIndex] = useState(0);
  const tickRef = useRef(null);

  useEffect(() => {
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  const started = startedAt != null;
  const elapsedSeconds = started ? (now - startedAt) / 1000 : 0;
  const remainingSeconds = durationMinutes * 60 - elapsedSeconds;
  const timeUp = started && remainingSeconds <= 0;

  useEffect(() => {
    if (timeUp && phase === "session") setPhase("wrapup");
  }, [timeUp, phase]);

  const handleStart = () => {
    const t = Date.now();
    localStorage.setItem(startedKey(sessionKey), String(t));
    setStartedAt(t);
  };

  const activeProblem = problems[activeIndex];

  const handleCodeChange = (value) => {
    setCodeByProblem((prev) => ({ ...prev, [activeProblem.id]: value }));
    localStorage.setItem(codeKey(sessionKey, activeProblem.id), value);
  };

  const handleRun = async () => {
    const summary = await execution.runTests(codeByProblem[activeProblem.id], {
      language: "python",
      entryPoint: activeProblem.entryPoint,
      testCases: activeProblem.testCases,
      testKind: "assertions",
      pythonPrelude: activeProblem.pythonPrelude,
    });
    setAttemptsByProblem((prev) => ({
      ...prev,
      [activeProblem.id]: { attempted: true, passed: summary.passed, total: summary.total },
    }));
  };

  const handleEndSession = () => setPhase("wrapup");

  const attemptedProblems = problems.filter((p) => attemptsByProblem[p.id] && attemptsByProblem[p.id].attempted);

  const handleWrapupSave = ({ trigger, coreIdea }) => {
    const problem = attemptedProblems[wrapupIndex];
    const attempt = attemptsByProblem[problem.id];
    const nextIndex = wrapupIndex + 1;
    if (nextIndex >= attemptedProblems.length) {
      finishAll(trigger, coreIdea, problem, attempt);
    } else {
      recordOne(trigger, coreIdea, problem, attempt);
      setWrapupIndex(nextIndex);
    }
  };

  const collectedRef = useRef([]);
  function recordOne(trigger, coreIdea, problem, attempt) {
    collectedRef.current.push({
      problem,
      code: codeByProblem[problem.id],
      language: "python",
      trigger,
      coreIdea,
      passed: attempt.passed,
      total: attempt.total,
      reason: attempt.passed === attempt.total ? "tests-passed" : "solution-revealed",
    });
  }
  function finishAll(trigger, coreIdea, problem, attempt) {
    recordOne(trigger, coreIdea, problem, attempt);
    setPhase("done");
    onFinish(collectedRef.current);
  }

  const handleSkipWrapup = () => {
    const nextIndex = wrapupIndex + 1;
    if (nextIndex >= attemptedProblems.length) {
      setPhase("done");
      onFinish(collectedRef.current);
    } else {
      setWrapupIndex(nextIndex);
    }
  };

  if (!started) {
    return (
      <div
        style={{
          background: COLORS.bgDark,
          border: `1px solid ${COLORS.orange}66`,
          borderRadius: "12px",
          padding: "24px",
          fontFamily: FONTS.body,
          color: COLORS.fg,
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: "13px", color: COLORS.orange, marginBottom: "10px" }}>
          Mock OA — {problems.length} problems
        </div>
        <p style={{ fontSize: "13.5px", color: COLORS.fgDim, lineHeight: 1.6, marginBottom: "16px" }}>
          One combined timer for the whole set. No reveal-solution during the session — whatever you submit is
          what counts. Trigger/core-idea notes happen once at the end, for whichever problems you attempted.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: "12px", color: COLORS.fgDim }}>Duration:</span>
          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            style={{
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "6px",
              color: COLORS.fg,
              fontFamily: FONTS.mono,
              fontSize: "12px",
              padding: "4px 8px",
            }}
          >
            {DURATION_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleStart}
          style={{
            background: COLORS.orange,
            color: "#0D0E15",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontFamily: FONTS.mono,
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Start session
        </button>
      </div>
    );
  }

  if (phase === "wrapup") {
    if (attemptedProblems.length === 0) {
      setPhase("done");
      onFinish([]);
      return null;
    }
    const problem = attemptedProblems[wrapupIndex];
    const attempt = attemptsByProblem[problem.id];
    return (
      <div
        style={{
          background: COLORS.bgDark,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "12px",
          padding: "24px",
          fontFamily: FONTS.body,
          color: COLORS.fg,
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: "12px", color: COLORS.orange, marginBottom: "4px" }}>
          Session over — wrap-up ({wrapupIndex + 1}/{attemptedProblems.length})
        </div>
        <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>{problem.title}</div>
        <div style={{ fontFamily: FONTS.mono, fontSize: "12px", color: attempt.passed === attempt.total ? COLORS.green : COLORS.red, marginBottom: "12px" }}>
          {attempt.passed}/{attempt.total} passed
        </div>
        <CompletionPrompt
          reason={attempt.passed === attempt.total ? "tests-passed" : "solution-revealed"}
          onSave={handleWrapupSave}
          onDismiss={handleSkipWrapup}
        />
      </div>
    );
  }

  const outputState = execution.isLoading ? "loading" : execution.error ? "error" : execution.results ? "results" : "idle";

  return (
    <div
      style={{
        background: COLORS.bgDark,
        border: `1px solid ${COLORS.orange}66`,
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.surface,
        }}
      >
        <span style={{ fontFamily: FONTS.mono, fontSize: "12px", color: COLORS.orange }}>⏱ Mock OA</span>
        <span style={{ fontFamily: FONTS.mono, fontSize: "14px", fontWeight: 600, color: COLORS.fg, fontVariantNumeric: "tabular-nums" }}>
          {formatClock(remainingSeconds)}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleEndSession}
          style={{
            background: "transparent",
            border: `1px solid ${COLORS.border}`,
            borderRadius: "6px",
            padding: "5px 10px",
            color: COLORS.fgDim,
            fontFamily: FONTS.mono,
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          End session
        </button>
      </div>

      <div style={{ display: "flex", gap: "4px", padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
        {problems.map((p, i) => {
          const attempt = attemptsByProblem[p.id];
          return (
            <button
              key={p.id}
              onClick={() => setActiveIndex(i)}
              style={{
                background: i === activeIndex ? COLORS.raised : "transparent",
                border: `1px solid ${i === activeIndex ? COLORS.orange : COLORS.border}`,
                borderRadius: "6px",
                padding: "5px 10px",
                fontFamily: FONTS.mono,
                fontSize: "11px",
                color: i === activeIndex ? COLORS.fg : COLORS.fgDim,
                cursor: "pointer",
              }}
            >
              {attempt ? (attempt.passed === attempt.total ? "✓ " : "• ") : ""}
              {p.title}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "14px 16px", fontFamily: FONTS.body, fontSize: "13px", color: COLORS.fgDim, lineHeight: 1.6, borderBottom: `1px solid ${COLORS.border}` }}>
        {activeProblem.description}
      </div>

      <CodeEditor value={codeByProblem[activeProblem.id]} onChange={handleCodeChange} height="260px" language="python" />

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
          onClick={handleRun}
          disabled={execution.isLoading}
          style={{
            background: COLORS.green,
            color: COLORS.bgDark,
            border: "none",
            borderRadius: "8px",
            padding: "9px 18px",
            fontFamily: FONTS.mono,
            fontWeight: 600,
            fontSize: "13px",
            cursor: execution.isLoading ? "default" : "pointer",
            opacity: execution.isLoading ? 0.7 : 1,
          }}
        >
          &#9654; Run
        </button>
        <span style={{ fontFamily: FONTS.mono, fontSize: "12px", color: COLORS.fgDim }}>
          {activeProblem.testCases.length} test cases
        </span>
      </div>

      <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "16px 20px", fontFamily: FONTS.mono, fontSize: "12.5px", minHeight: "60px" }}>
        <OutputPanel
          state={outputState}
          error={execution.error}
          results={execution.results}
          runtimeMs={execution.runtimeMs}
          memoryBytes={execution.memoryBytes}
          testCount={activeProblem.testCases.length}
        />
      </div>
    </div>
  );
}
