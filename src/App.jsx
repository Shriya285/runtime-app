import React, { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import SassyBotMount from "./components/SassyBotMount";
import SassyToast from "./components/SassyToast";
import EmailDigestOptIn from "./components/EmailDigestOptIn";
import { useMoodState } from "./lib/useMoodState";
import { useSassyBotSentiment } from "./lib/useSassyBotSentiment";
import { useCodeExecution } from "./lib/useCodeExecution";
import { CodeExecutionContext } from "./lib/CodeExecutionContext";
import { CURRENT_LESSON } from "./lib/lessons";
import {
  requestNotificationPermission,
  registerServiceWorker,
  scheduleLocalReminder,
} from "./lib/notifications";
import { PUSH_NOTIFICATIONS } from "./lib/sassyLines";

export default function App() {
  const moodState = useMoodState(); // { mood, gapHours, streak, justReturned } or null on first tick
  const execution = useCodeExecution(CURRENT_LESSON);
  const { sentiment, reportRunResult, reportSolutionRevealedEarly, handleAutoSassy } = useSassyBotSentiment(
    moodState,
    { isExecuting: execution.isLoading }
  );
  const [toast, setToast] = useState(null);
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  // Register the service worker once, quietly, on load.
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Show the Duolingo-style toast once we know how you're returning.
  useEffect(() => {
    if (!moodState) return;
    if (moodState.justReturned && moodState.mood !== "idle") {
      const tier =
        moodState.mood === "savage" ? "savage" : moodState.mood === "sassy" ? "sassy" : "nudge";
      const copy = PUSH_NOTIFICATIONS[tier] || PUSH_NOTIFICATIONS.nudge;
      setToast({ ...copy, mood: moodState.mood });
    }
  }, [moodState]);

  // Edge-trigger the run-result reaction the moment a run finishes, rather
  // than reacting continuously to execution.isLoading — see useSassyBotSentiment.
  useEffect(() => {
    if (!execution.lastRunSummary) return;
    const { passed, total } = execution.lastRunSummary;
    if (total === 0) return;
    if (passed === total) reportRunResult("cheer");
    else if (passed === 0) reportRunResult("angry");
    else reportRunResult("annoyed");
  }, [execution.lastRunSummary, reportRunResult]);

  const handleEnableReminders = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      // Demo: fires a real OS notification in 20s so you can see it work.
      // Swap this for real absence thresholds once the backend cron exists.
      scheduleLocalReminder(20000, "nudge");
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <SassyBotMount
        sentiment={sentiment}
        streak={moodState ? moodState.streak : 0}
        onAutoSassy={handleAutoSassy}
      />

      {toast && (
        <SassyToast
          title={toast.title}
          body={toast.body}
          mood={toast.mood}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Notification channels — sit above the dashboard, bottom-right */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 250,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          alignItems: "flex-end",
        }}
      >
        {permission !== "granted" && permission !== "unsupported" && (
          <div
            style={{
              background: "#1C1E2A",
              border: "1px solid #2E3244",
              borderRadius: "10px",
              padding: "12px 16px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              color: "#C0CAF5",
              maxWidth: "260px",
            }}
          >
            Let runtime. remind you (nicely, then not so nicely) if you go quiet?
            <button
              onClick={handleEnableReminders}
              style={{
                display: "block",
                marginTop: "8px",
                background: "#7AA2F7",
                color: "#0D0E15",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                fontSize: "11.5px",
                cursor: "pointer",
              }}
            >
              Enable reminders
            </button>
          </div>
        )}

        <EmailDigestOptIn />
      </div>

      <CodeExecutionContext.Provider value={execution}>
        <Dashboard onSolutionRevealedEarly={reportSolutionRevealedEarly} />
      </CodeExecutionContext.Provider>
    </div>
  );
}
