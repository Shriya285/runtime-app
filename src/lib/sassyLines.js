// Sassy line bank for the mood bot. Escalates with how long you've been gone.
// Tone: friendly-roast, Duolingo-owl energy, never actually mean.

export const IDLE_LINES = [
  "Currently vibing. You're on track, don't ruin it.",
  "Streak's healthy. I'm shocked too.",
  "Nothing to report. Suspicious, but I'll allow it.",
];

export const NUDGE_LINES = [
  // 6-24h since last visit, same day-ish, gentle
  "It's been a bit. Sliding Window isn't going to solve itself.",
  "Just checking you're alive. And coding. Mostly coding.",
  "Two Pointers has been open in your head this whole time, right? Right?",
];

export const SASSY_LINES = [
  // 24-48h absent
  "Oh, you're back. I was about to start emotionally preparing.",
  "A whole day gone. Bold strategy. Let's see how it plays out.",
  "I've seen abandoned side projects with more commitment than this.",
  "Your streak sent me a message. It said 'we need to talk.'",
];

export const SAVAGE_LINES = [
  // 48h+ absent, streak likely broken
  "RIP streak. 47 days. It lived a good life. You killed it.",
  "I'm not mad. I'm just disappointed. Extremely, extremely disappointed.",
  "Took you long enough. The problems missed you more than I did. Barely.",
  "Congrats on the achievement: 'Ghosted your own curriculum.'",
];

export const RETURN_ON_TIME_LINES = [
  "Look who showed up. On time. Suspicious, but I'll take it.",
  "Day streak intact. You're doing better than my expectations of you.",
];

export const MILESTONE_LINES = [
  (streak) => `Day ${streak}! Look at you, actually consistent for once.`,
  (streak) => `${streak} days straight. Somewhere, your past self is proud and shocked.`,
  (streak) => `${streak}-day streak. I'd say I'm surprised but that would be rude. Mostly.`,
];

export function pickLine(mood, streak) {
  const banks = {
    idle: IDLE_LINES,
    nudge: NUDGE_LINES,
    sassy: SASSY_LINES,
    savage: SAVAGE_LINES,
    return_on_time: RETURN_ON_TIME_LINES,
  };
  if (mood === "milestone") {
    const fn = MILESTONE_LINES[Math.floor(Math.random() * MILESTONE_LINES.length)];
    return fn(streak);
  }
  const bank = banks[mood] || IDLE_LINES;
  return bank[Math.floor(Math.random() * bank.length)];
}

// Push notification copy — sent by the backend cron when you've been away too long.
// Kept separate because these need to work as a single push payload (title + body).
export const PUSH_NOTIFICATIONS = {
  nudge: {
    title: "runtime. is judging your silence",
    body: "It's been a few hours. Your streak is starting to sweat.",
  },
  sassy: {
    title: "still there?",
    body: "A whole day gone. Bold strategy, let's see how it plays out.",
  },
  savage: {
    title: "your streak has left the chat",
    body: "47 days, gone. It was a good run. Come pay respects (and start a new one).",
  },
};
