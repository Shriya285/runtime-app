import React, { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import SassyBot from "./components/SassyBot";
import SassyToast from "./components/SassyToast";
import { useMoodState } from "./lib/useMoodState";
import { useSassyBotSentiment } from "./lib/useSassyBotSentiment";
import {
  requestNotificationPermission,
  registerServiceWorker,
  scheduleLocalReminder,
} from "./lib/notifications";
import { PUSH_NOTIFICATIONS } from "./lib/sassyLines";

export default function App() {
  const moodState = useMoodState(); // { mood, gapHours, streak, justReturned } or null on first tick
  const { sentiment, handleAutoSassy } = useSassyBotSentiment(moodState);
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
      <div
        style={{
          position: "fixed",
          top: "18px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 200,
        }}
      >
        <SassyBot sentiment={sentiment} onAutoSassy={handleAutoSassy} />
      </div>

      {toast && (
        <SassyToast
          title={toast.title}
          body={toast.body}
          mood={toast.mood}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Reminder opt-in — sits above the dashboard, dismiss-able in real use */}
      {permission !== "granted" && permission !== "unsupported" && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 250,
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

      <Dashboard />
    </div>
  );
}
