import React, { useEffect, useState } from "react";
import CodeEditor from "./CodeEditor";
import OutputPanel from "./OutputPanel";
import StruggleTimer from "./StruggleTimer";
import CompletionPrompt from "./CompletionPrompt";
import { useCodeExecutionContext } from "../lib/CodeExecutionContext";
import { recordCompletion } from "../lib/spacedRepetition";
import { logCompletion } from "../lib/completionHistory";
import { loadProblems } from "../lib/problemsData";
import { problemToLessonShape } from "../lib/problemAdapter";
import { pickReviveProblems } from "../lib/revivePicker";
import { reviveStreak } from "../lib/useMoodState";
import { HEART_CELLS, HEART_OUTLINE_CELLS, HEART_CELL_SIZE } from "../lib/emailTemplates";

const COLORS = {
  bg: "#1A1418",
  surface: "#20181C",
  raised: "#241B20",
  border: "#3A2020",
  fg: "#F0D8DE",
  fgDim: "#8B747C",
  accent: "#F7768E",
  green: "#9ECE6A",
};
const FONTS = { mono: "'JetBrains Mono', monospace", body: "'Plus Jakarta Sans', sans-serif" };

function codeKey(problemId) {
  return `runtime_revive_code_${problemId}`;
}

function PixelHeart({ filled, size = 7 }) {
  const w = 8 * HEART_CELL_SIZE * size;
  const h = 7 * HEART_CELL_SIZE * size;
  const s = HEART_CELL_SIZE * size;
  const cells = filled ? HEART_CELLS : HEART_OUTLINE_CELLS;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {!filled &&
        HEART_CELLS.map(([x, y], i) => (
          <rect key={`bg-${i}`} x={x * s} y={y * s} width={s} height={s} fill={COLORS.accent} opacity={0.12} />
        ))}
      {cells.map(([x, y], i) => (
        <rect key={i} x={x * s} y={y * s} width={s} height={s} fill={COLORS.accent} opacity={filled ? 1 : 0.85} />
      ))}
    </svg>
  );
}

/**
 * The /revive route — the destination of the FLATLINED email's "Revive
 * Hearts →" CTA. Same struggle-timer/run/CompletionPrompt mechanics as a
 * regular lesson (Dashboard.jsx), just sequenced through 3 problems with a
 * heart-fill visual instead of the normal skill-path chrome, and a
 * fresh-streak ceremony on the 3rd solve instead of a silent reset.
 */
export default function RevivePage() {
  const execution = useCodeExecutionContext();
  const [problems, setProblems] = useState(null);
  const [reviveProblems, setReviveProblems] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [phase, setPhase] = useState("loading"); // 'loading' | 'active' | 'ceremony'

  const [code, setCode] = useState("");
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [completion, setCompletion] = useState(null);
  const [promptDismissed, setPromptDismissed] = useState(false);

  useEffect(() => {
    loadProblems().then((all) => {
      setProblems(all);
      const picked = pickReviveProblems(all);
      setReviveProblems(picked);
      setPhase(picked.length > 0 ? "active" : "loading");
    });
  }, []);

  const activeProblem = reviveProblems && reviveProblems[activeIndex];
  const lesson = activeProblem ? problemToLessonShape(activeProblem) : null;

  useEffect(() => {
    if (!lesson) return;
    setCode(localStorage.getItem(codeKey(lesson.id)) || lesson.languages.python.starterCode);
    setSolutionRevealed(false);
    setCompletion(null);
    setPromptDismissed(false);
    execution.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, reviveProblems]);

  useEffect(() => {
    if (!lesson) return;
    localStorage.setItem(codeKey(lesson.id), code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    if (!execution.lastRunSummary) return;
    const { passed, total } = execution.lastRunSummary;
    if (total > 0 && passed === total) {
      setCompletion({ reason: "tests-passed" });
      setPromptDismissed(false);
    }
  }, [execution.lastRunSummary]);

  if (phase === "loading" || !lesson) {
    return (
      <PageShell>
        <div style={{ color: COLORS.fgDim, fontFamily: FONTS.mono, fontSize: "13px" }}>Loading revive session&hellip;</div>
      </PageShell>
    );
  }

  const handleRun = () => {
    execution.runTests(code, {
      language: "python",
      entryPoint: lesson.languages.python.entryPoint,
      testCases: lesson.testCases,
      testKind: lesson.testKind,
      pythonPrelude: lesson.pythonPrelude,
    });
  };

  const handleReveal = () => {
    setCode(lesson.languages.python.solutionCode);
    setSolutionRevealed(true);
    setCompletion({ reason: "solution-revealed" });
    setPromptDismissed(false);
  };

  const handleOverridePass = () => {
    setCompletion({ reason: "tests-passed-override" });
    setPromptDismissed(false);
  };

  const handleSaveCompletion = ({ trigger, coreIdea }) => {
    recordCompletion(lesson.id, { trigger, coreIdea, reason: completion.reason, code, language: "python", mode: "revive" });
    logCompletion({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      trigger,
      coreIdea,
      code,
      language: "python",
      reason: completion.reason,
      mode: "revive",
    });

    const nextSolved = solvedCount + 1;
    setSolvedCount(nextSolved);
    setCompletion(null);

    if (nextSolved >= 3) {
      reviveStreak();
      setPhase("ceremony");
    } else {
      setActiveIndex((i) => i + 1);
    }
  };

  const outputState = execution.isLoading ? "loading" : execution.error ? "error" : execution.results ? "results" : "idle";

  if (phase === "ceremony") {
    return (
      <PageShell>
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "24px" }}>
          <PixelHeart filled size={9} />
          <PixelHeart filled size={9} />
          <PixelHeart filled size={9} />
        </div>
        <div style={{ textAlign: "center", fontFamily: FONTS.mono, fontSize: "11px", letterSpacing: "2px", color: COLORS.green, textTransform: "uppercase", marginBottom: "18px" }}>
          hearts online
        </div>
        <h1 style={{ textAlign: "center", fontFamily: FONTS.mono, fontSize: "22px", color: COLORS.fg, margin: "0 0 14px" }}>
          Revived.
        </h1>
        <p style={{ textAlign: "center", fontFamily: FONTS.body, fontSize: "14px", color: COLORS.fgDim, lineHeight: 1.7, maxWidth: "440px", margin: "0 auto 28px" }}>
          Three solves, hearts restored. Your streak resumes today, as day 1 &mdash; not a silent reset, an
          actual restart.
        </p>
        <div style={{ textAlign: "center" }}>
          <a
            href="/"
            style={{
              display: "inline-block",
              background: COLORS.accent,
              color: "#16161E",
              borderRadius: "24px",
              padding: "11px 26px",
              fontFamily: FONTS.mono,
              fontWeight: 700,
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Back to the dashboard →
          </a>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "10px" }}>
        {[0, 1, 2].map((i) => (
          <PixelHeart key={i} filled={i < solvedCount} />
        ))}
      </div>
      <div style={{ textAlign: "center", fontFamily: FONTS.mono, fontSize: "10.5px", letterSpacing: "2px", color: COLORS.accent, textTransform: "uppercase", marginBottom: "26px" }}>
        {solvedCount} / 3 SOLVED &middot; HEARTS OFFLINE
      </div>

      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          background: COLORS.raised,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: "11px", color: COLORS.fgDim, marginBottom: "4px" }}>
            Revive &middot; problem {activeIndex + 1} of 3 &middot; {activeProblem.pattern}
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: "16px", fontWeight: 600, color: COLORS.fg }}>{lesson.title}</div>
        </div>

        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, fontFamily: FONTS.body, fontSize: "13px", color: COLORS.fgDim, lineHeight: 1.6, maxHeight: "160px", overflowY: "auto" }}>
          {lesson.prompt}
        </div>

        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
          <StruggleTimer lessonId={lesson.id} onReveal={handleReveal} revealed={solutionRevealed} />
        </div>

        <CodeEditor value={code} onChange={setCode} height="260px" language="python" />

        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.surface }}>
          <button
            onClick={handleRun}
            disabled={execution.isLoading}
            style={{
              background: COLORS.accent,
              color: "#16161E",
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
          <span style={{ fontFamily: FONTS.mono, fontSize: "12px", color: COLORS.fgDim }}>{lesson.testCases.length} test cases</span>
        </div>

        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "16px 20px", fontFamily: FONTS.mono, fontSize: "12.5px" }}>
          <OutputPanel
            state={outputState}
            error={execution.error}
            results={execution.results}
            runtimeMs={execution.runtimeMs}
            memoryBytes={execution.memoryBytes}
            testCount={lesson.testCases.length}
            onOverridePass={handleOverridePass}
          />
          {completion && !promptDismissed && (
            <CompletionPrompt reason={completion.reason} onSave={handleSaveCompletion} onDismiss={() => setPromptDismissed(true)} />
          )}
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.fg, fontFamily: FONTS.body, padding: "56px 24px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div style={{ textAlign: "center", fontFamily: FONTS.mono, fontWeight: 700, fontSize: "15px", marginBottom: "34px" }}>
        runtime.<span style={{ color: COLORS.accent }}>&#8226;</span>
      </div>
      {children}
    </div>
  );
}
