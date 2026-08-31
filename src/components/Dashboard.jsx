import React, { useEffect, useMemo, useState } from "react";
import CodeEditor from "./CodeEditor";
import OutputPanel from "./OutputPanel";
import LeetCodeLinkField from "./LeetCodeLinkField";
import AvatarInitials from "./AvatarInitials";
import StruggleTimer from "./StruggleTimer";
import CompletionPrompt from "./CompletionPrompt";
import DueForReview from "./DueForReview";
import WeeklyReportModal from "./WeeklyReportModal";
import TodaysPlanPanel from "./TodaysPlanPanel";
import MockOASession from "./MockOASession";
import { CURRENT_LESSON, LESSON_SLIDING_WINDOW, LESSONS } from "../lib/lessons";
import { useCodeExecutionContext } from "../lib/CodeExecutionContext";
import { recordCompletion, getReviewRecord } from "../lib/spacedRepetition";
import { logCompletion, getThisWeekCompletions } from "../lib/completionHistory";
import { recordActivityToday, getWeekProgress } from "../lib/weeklyActivity";
import { loadProblems } from "../lib/problemsData";
import { problemToLessonShape } from "../lib/problemAdapter";
import { getCurrentDayPlan, isBlockComplete, advanceDay, startNextBlock } from "../lib/studyPlan";
import { resetAllProgress } from "../lib/resetProgress";

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

function codeStorageKey(lessonId, language) {
  return `runtime_code_${lessonId}_${language}`;
}

function languageStorageKey(lessonId) {
  return `runtime_language_${lessonId}`;
}

const ACTIVE_LESSON_KEY = "runtime_active_lesson";

export default function Dashboard({ onSolutionRevealedEarly, streak = 0 }) {
  const execution = useCodeExecutionContext();
  const [showReport, setShowReport] = useState(false);

  // --- Study plan state ---
  // The plan is the default/primary view — 'freeplay' only kicks in once
  // you deliberately click one of the two hand-built lessons in the skill
  // path. Without this distinction, "no plan problem open yet" (still
  // loading) was indistinguishable from "deliberately viewing a hand-built
  // lesson", so the terminal defaulted to Two Pointers instead of Day 1's
  // actual assigned work.
  const [viewMode, setViewMode] = useState("plan"); // 'plan' | 'freeplay'
  const [studyProblems, setStudyProblems] = useState(null);
  const [planRefreshKey, setPlanRefreshKey] = useState(0);
  const [activePlanProblem, setActivePlanProblem] = useState(null); // dataset problem object, or null
  const [mockOAActive, setMockOAActive] = useState(false);

  useEffect(() => {
    loadProblems().then(setStudyProblems);
  }, []);

  // getCurrentDayPlan does a localStorage read/write (assignment caching),
  // so this is memoized rather than called on every render — Dashboard
  // re-renders on every keystroke in the editor.
  const planDay = useMemo(() => (studyProblems ? getCurrentDayPlan(studyProblems) : null), [studyProblems, planRefreshKey]);
  const blockComplete = useMemo(() => isBlockComplete(), [planRefreshKey]);

  const [activeLessonId, setActiveLessonId] = useState(
    () => localStorage.getItem(ACTIVE_LESSON_KEY) || LESSONS[0].id
  );

  const lesson =
    viewMode === "plan" && activePlanProblem
      ? problemToLessonShape(activePlanProblem)
      : LESSONS.find((l) => l.id === activeLessonId) || LESSONS[0];
  const availableLanguages = Object.keys(lesson.languages);
  const typedTitle = useTypedText(lesson.title, 55, 300);

  const [language, setLanguage] = useState(
    () => localStorage.getItem(languageStorageKey(lesson.id)) || lesson.defaultLanguage
  );
  const variant = lesson.languages[language] || lesson.languages[lesson.defaultLanguage];

  const [code, setCode] = useState(
    () => localStorage.getItem(codeStorageKey(lesson.id, language)) || variant.starterCode
  );
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [completion, setCompletion] = useState(null); // { reason } | null
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);

  useEffect(() => {
    localStorage.setItem(codeStorageKey(lesson.id, language), code);
  }, [code, lesson.id, language]);

  useEffect(() => {
    localStorage.setItem(languageStorageKey(lesson.id), language);
  }, [language, lesson.id]);

  const handleLanguageChange = (nextLanguage) => {
    if (nextLanguage === language) return;
    setLanguage(nextLanguage);
    setCode(localStorage.getItem(codeStorageKey(lesson.id, nextLanguage)) || lesson.languages[nextLanguage].starterCode);
    setSolutionRevealed(false);
  };

  // Switching lessons (hand-built or plan-sourced) reloads that lesson's
  // own saved language/code and clears transient per-lesson UI state,
  // including the previous lesson's run output — otherwise a stale
  // "3/3 passed" could sit on screen for code that hasn't been run yet.
  const resetTransientState = (nextLessonId, nextDefaultLanguage, languagesMap) => {
    const nextLanguage = localStorage.getItem(languageStorageKey(nextLessonId)) || nextDefaultLanguage;
    setLanguage(nextLanguage);
    setCode(localStorage.getItem(codeStorageKey(nextLessonId, nextLanguage)) || languagesMap[nextLanguage].starterCode);
    setSolutionRevealed(false);
    setCompletion(null);
    setPromptDismissed(false);
    execution.reset();
  };

  // Auto-open today's first assigned problem once the plan loads, so the
  // terminal actually shows Day 1's real content by default instead of
  // sitting on whichever hand-built lesson happened to be last active.
  // Must go through resetTransientState like the manual handlers do —
  // without it, `lesson` (title/prompt/filename) updates but `code`/
  // `language` stay at whatever the first render initialized them to.
  useEffect(() => {
    if (
      viewMode === "plan" &&
      !activePlanProblem &&
      planDay &&
      planDay.template.type === "lesson" &&
      planDay.assignedProblems.length > 0
    ) {
      const problem = planDay.assignedProblems[0];
      setActivePlanProblem(problem);
      const shaped = problemToLessonShape(problem);
      resetTransientState(shaped.id, shaped.defaultLanguage, shaped.languages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, activePlanProblem, planDay]);

  const handleSelectLesson = (lessonId) => {
    const alreadyThere = viewMode === "freeplay" && lessonId === activeLessonId;
    setViewMode("freeplay");
    if (alreadyThere) return;
    localStorage.setItem(ACTIVE_LESSON_KEY, lessonId);
    setActiveLessonId(lessonId);
    const nextLesson = LESSONS.find((l) => l.id === lessonId);
    resetTransientState(lessonId, nextLesson.defaultLanguage, nextLesson.languages);
  };

  // "Arrays & Strings" in the skill path has no hand-built lesson behind
  // it — its real content lives in the plan (it's Day 1's actual pattern
  // right now) — so selecting it just returns to the plan view rather than
  // switching to a lesson id, which is what made it look inert before.
  // Still has to reload code/language for whichever plan problem was
  // already open — flipping viewMode alone left the freeplay lesson's code
  // sitting in the editor under the plan problem's title/description.
  const handleSelectPlanPattern = () => {
    if (viewMode === "plan") return;
    setViewMode("plan");
    if (activePlanProblem) {
      const shaped = problemToLessonShape(activePlanProblem);
      resetTransientState(shaped.id, shaped.defaultLanguage, shaped.languages);
    }
  };

  const handleOpenPlanProblem = (problem) => {
    const alreadyThere = viewMode === "plan" && activePlanProblem && activePlanProblem.id === problem.id;
    setViewMode("plan");
    if (alreadyThere) return;
    setActivePlanProblem(problem);
    const shaped = problemToLessonShape(problem);
    resetTransientState(shaped.id, shaped.defaultLanguage, shaped.languages);
  };

  // Offer the trigger/core-idea prompt whenever a run comes back all-passed.
  useEffect(() => {
    if (!execution.lastRunSummary) return;
    const { passed, total } = execution.lastRunSummary;
    if (total > 0 && passed === total) {
      setCompletion({ reason: "tests-passed" });
      setPromptDismissed(false);
    }
  }, [execution.lastRunSummary]);

  const handleRun = () => {
    recordActivityToday();
    execution.runTests(code, {
      language,
      entryPoint: variant.entryPoint,
      testCases: lesson.testCases,
      testKind: lesson.testKind,
      pythonPrelude: lesson.pythonPrelude,
    });
  };

  const handleReveal = (wasEarly) => {
    setCode(variant.solutionCode);
    setSolutionRevealed(true);
    if (wasEarly) onSolutionRevealedEarly && onSolutionRevealedEarly();
    setCompletion({ reason: "solution-revealed" });
    setPromptDismissed(false);
  };

  // Advisory soft-check (OutputPanel) rather than an automatic pass — a
  // near-miss run looks identical whether it's a subtle real bug or a
  // test-data issue, so this hands the call to the user instead of
  // silently deciding. Goes through the same completion flow as a full
  // pass, just tagged separately so the weekly report and review history
  // show it was a self-vouched call, not an automated 100%.
  const handleOverridePass = () => {
    setCompletion({ reason: "tests-passed-override" });
    setPromptDismissed(false);
  };

  const handleSaveCompletion = ({ trigger, coreIdea }) => {
    recordCompletion(lesson.id, { trigger, coreIdea, reason: completion.reason, code, language, mode: "lesson" });
    logCompletion({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      trigger,
      coreIdea,
      code,
      language,
      reason: completion.reason,
      mode: "lesson",
    });
    setCompletion(null);
    setReviewRefreshKey((k) => k + 1);
    setPlanRefreshKey((k) => k + 1);
  };

  const handleAdvanceDay = () => {
    advanceDay();
    setActivePlanProblem(null);
    setPlanRefreshKey((k) => k + 1);
  };

  const handleStartNextBlock = () => {
    startNextBlock();
    setActivePlanProblem(null);
    setPlanRefreshKey((k) => k + 1);
  };

  const handleResetProgress = () => {
    if (
      !window.confirm(
        "Reset everything — streak, the 15-day plan, skill-path progress, and all saved notes/code? This can't be undone."
      )
    )
      return;
    resetAllProgress();
    window.location.reload(); // re-run every hook's mount effect against the now-empty storage
  };

  const handleMockOAFinish = (collected) => {
    for (const item of collected) {
      const lessonId = `dataset-${item.problem.id}`;
      recordCompletion(lessonId, {
        trigger: item.trigger,
        coreIdea: item.coreIdea,
        reason: item.reason,
        code: item.code,
        language: item.language,
        mode: "mockOA",
      });
      logCompletion({
        lessonId,
        lessonTitle: item.problem.title,
        trigger: item.trigger,
        coreIdea: item.coreIdea,
        code: item.code,
        language: item.language,
        reason: item.reason,
        mode: "mockOA",
      });
    }
    setMockOAActive(false);
    advanceDay();
    setPlanRefreshKey((k) => k + 1);
    setReviewRefreshKey((k) => k + 1);
  };

  // Derived from real completion data: a node is done once its lesson has
  // a review record, active once the lesson before it is done (so it's
  // actually reachable), and locked otherwise. Only two nodes have real
  // hand-built lessons behind them — Binary Search / Trees & Recursion
  // stay locked here (the study plan, not this skill path, is what
  // actually covers those patterns now via ingested problems).
  const twoPointersDone = !!getReviewRecord(CURRENT_LESSON.id);
  const slidingWindowDone = !!getReviewRecord(LESSON_SLIDING_WINDOW.id);
  // Arrays & Strings has no hand-built lesson of its own — it's Block 0's
  // days 1-3 in the plan, so "done" here means the plan has moved past
  // day 3, not a permanently pre-marked placeholder.
  const arraysStringsDone = Boolean(planDay) && (planDay.blockIndex > 0 || planDay.dayIndex >= 3);
  const skillPath = [
    { name: "Arrays & Strings", lessonId: null, isPlanLink: true, state: arraysStringsDone ? "done" : "active" },
    { name: "Two Pointers", lessonId: CURRENT_LESSON.id, state: twoPointersDone ? "done" : "active" },
    {
      name: "Sliding Window",
      lessonId: LESSON_SLIDING_WINDOW.id,
      state: slidingWindowDone ? "done" : twoPointersDone ? "active" : "locked",
    },
    { name: "Binary Search", lessonId: null, state: "locked" },
    { name: "Trees & Recursion", lessonId: null, state: "locked" },
  ];

  const { daysThisWeek } = getWeekProgress();
  const thisWeekCompletions = getThisWeekCompletions();

  // Combined id list so the review-day panel can surface due reviews from
  // both the hand-built lessons and any ingested study-plan problem.
  const reviewLessons = useMemo(() => {
    const dataset = (studyProblems || []).map(problemToLessonShape);
    return [...LESSONS, ...dataset];
  }, [studyProblems]);

  const completedPlanProblemIds = useMemo(() => {
    if (!planDay) return new Set();
    const ids = new Set();
    for (const p of planDay.assignedProblems) {
      if (getReviewRecord(`dataset-${p.id}`)) ids.add(p.id);
    }
    return ids;
  }, [planDay, reviewRefreshKey]);

  const outputState = execution.isLoading
    ? "loading"
    : execution.error
    ? "error"
    : execution.results
    ? "results"
    : "idle";
  const allPassed = execution.results && execution.results.every((r) => r.passed);

  const showingMockOA = mockOAActive && planDay && planDay.template.type === "mockOA";

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
          <span style={{ color: COLORS.orange }}>&#9679; {streak} day streak</span>
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
              const isLocked = node.state === "locked";
              const isCurrent = node.isPlanLink ? viewMode === "plan" : node.lessonId === lesson.id;
              const clickable = (Boolean(node.lessonId) || node.isPlanLink) && !isLocked;
              const dotColor = isDone ? COLORS.green : isActive ? COLORS.blue : COLORS.comment;
              const handleClick = node.isPlanLink ? handleSelectPlanPattern : () => handleSelectLesson(node.lessonId);
              return (
                <div
                  key={node.name}
                  className="node-row"
                  onClick={clickable ? handleClick : undefined}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "13px 10px",
                    marginLeft: "-10px",
                    borderRadius: "8px",
                    background: isCurrent ? COLORS.raised : "transparent",
                    cursor: clickable ? "pointer" : "default",
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
                    {isDone ? "✓" : isActive ? "" : "·"}
                  </div>
                  <span
                    className="node-label"
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: "13px",
                      color: isActive ? COLORS.fg : isDone ? COLORS.fgDim : COLORS.comment,
                      fontWeight: isActive || isCurrent ? 600 : 400,
                    }}
                  >
                    {node.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: today's plan + lesson terminal */}
        <div className="reveal" style={{ flex: 1, minWidth: 0, animationDelay: "0.16s" }}>
          <TodaysPlanPanel
            planDay={planDay}
            blockComplete={blockComplete}
            reviewLessons={reviewLessons}
            reviewRefreshKey={reviewRefreshKey}
            activeProblemId={activePlanProblem ? activePlanProblem.id : null}
            completedIds={completedPlanProblemIds}
            onOpenProblem={handleOpenPlanProblem}
            onAdvanceDay={handleAdvanceDay}
            onStartNextBlock={handleStartNextBlock}
            onStartMockOA={() => setMockOAActive(true)}
          />

          {showingMockOA ? (
            <MockOASession
              problems={planDay.assignedProblems}
              sessionKey={`${planDay.blockIndex}-${planDay.dayIndex}`}
              onFinish={handleMockOAFinish}
            />
          ) : (
            <>
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
                  {lesson.lessonNumber ? `Lesson ${String(lesson.lessonNumber).padStart(2, "0")}` : lesson.pattern || "Practice"}
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

              {lesson.prompt && (
                <div
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: "14px",
                    color: COLORS.fgDim,
                    lineHeight: 1.6,
                    marginBottom: "18px",
                    paddingBottom: "18px",
                    borderBottom: `1px solid ${COLORS.border}`,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {lesson.prompt}
                </div>
              )}

              <div style={{ marginBottom: "14px" }}>
                <StruggleTimer lessonId={lesson.id} onReveal={handleReveal} revealed={solutionRevealed} />
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
                    {variant.filename}
                  </span>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: "flex", gap: "4px" }}>
                    {availableLanguages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        style={{
                          background: lang === language ? COLORS.raised : "transparent",
                          border: `1px solid ${lang === language ? COLORS.blue : COLORS.border}`,
                          borderRadius: "6px",
                          padding: "3px 9px",
                          fontFamily: FONTS.mono,
                          fontSize: "11px",
                          color: lang === language ? COLORS.fg : COLORS.fgDim,
                          cursor: "pointer",
                        }}
                      >
                        {lesson.languages[lang].label}
                      </button>
                    ))}
                  </div>
                </div>

                <CodeEditor value={code} onChange={setCode} height="280px" language={language} />

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
                    error={execution.error}
                    results={execution.results}
                    runtimeMs={execution.runtimeMs}
                    memoryBytes={execution.memoryBytes}
                    onOverridePass={handleOverridePass}
                    testCount={lesson.testCases.length}
                  />
                </div>

                {completion && !promptDismissed && (
                  <div style={{ padding: "0 20px 20px" }}>
                    <CompletionPrompt
                      reason={completion.reason}
                      onSave={handleSaveCompletion}
                      onDismiss={() => setPromptDismissed(true)}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: stats */}
        <div className="reveal" style={{ width: "220px", flexShrink: 0, animationDelay: "0.24s" }}>
          <DueForReview lessons={LESSONS} refreshKey={reviewRefreshKey} />
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
              {daysThisWeek}
              <span style={{ fontSize: "16px", color: COLORS.fgDim, fontFamily: FONTS.body }}>/7 days</span>
            </div>
            <button
              onClick={() => setShowReport(true)}
              style={{
                marginTop: "12px",
                background: "transparent",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                padding: "6px 10px",
                fontFamily: FONTS.mono,
                fontSize: "11px",
                color: COLORS.blue,
                cursor: "pointer",
                width: "100%",
              }}
            >
              View weekly report
            </button>
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
              {!twoPointersDone ? (
                <>
                  Finish <span style={{ color: COLORS.violet }}>Two Pointers</span> to unlock{" "}
                  <span style={{ color: COLORS.cyan }}>Sliding Window</span>
                </>
              ) : !slidingWindowDone ? (
                <>
                  Finish <span style={{ color: COLORS.violet }}>Sliding Window</span> — the 15-day plan on the
                  left covers what comes after
                </>
              ) : (
                <>Follow the 15-day plan above for what&rsquo;s next.</>
              )}
            </div>
            <button
              onClick={handleResetProgress}
              style={{
                marginTop: "12px",
                background: "transparent",
                border: "none",
                color: COLORS.fgDim,
                fontFamily: FONTS.mono,
                fontSize: "10.5px",
                textDecoration: "underline",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ↺ Reset everything &amp; start fresh
            </button>
          </div>
        </div>
      </div>

      {showReport && (
        <WeeklyReportModal completions={thisWeekCompletions} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}
