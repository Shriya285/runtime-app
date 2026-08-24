# runtime.

A DSA/code-learning dashboard with a sassy mood bot and streak reminders.

## What works right now (no setup)

```
npm install
npm run dev
```

- The full dashboard (skill path, terminal lesson, Run/compile animation)
- **MoodBot** — the bouncing character pinned to the top of the page. Its
  color, face, and speech-bubble line change based on how long it's been
  since your last visit (tracked in `localStorage`, see
  `src/lib/useMoodState.js`).
- **SassyToast** — the Duolingo-style notification card (bot avatar, title,
  body, top-right) that appears once, right when you return, if you were
  gone long enough to deserve it.
- **Local reminders** — click "Enable reminders" and grant permission, and
  the app will fire a real OS-level notification (try it, it's set to 20s
  in the demo) using the browser Notification API. This only fires while
  the tab/app is still open or recently backgrounded — see the big comment
  in `src/lib/notifications.js` for why.

## Mood thresholds (tune these in `useMoodState.js`)

| Gap since last visit | Mood   | Tone                           |
|-----------------------|--------|---------------------------------|
| < 6h                  | idle   | normal                          |
| 6–24h                 | nudge  | gentle poke                     |
| 24–48h                | sassy  | mock-annoyed                    |
| 48h+                  | savage | streak declared dead, roasted   |

All copy lives in `src/lib/sassyLines.js` — add more lines to any bank
any time, they're picked at random.

## What needs real deployment to fully work

To get notifications that reach you **even after you've closed the app**
(the actual ask), you need Web Push, not just the Notification API:

1. A backend — `server/send-reminder.js` is the stub, needs:
   - `npm install web-push`
   - VAPID keys (`npx web-push generate-vapid-keys`)
   - A database table/collection for push subscriptions (MongoDB Atlas,
     matches your existing stack)
2. Frontend subscribes via `pushManager.subscribe()` once permission is
   granted, and sends that subscription to your backend to store
3. A Vercel Cron job (same pattern as the RepSet weekly email) that runs
   hourly, checks who's crossed a threshold, and calls `web-push`

This is the same shape as the RepSet email reminder — just push instead
of email, and hourly instead of weekly.

## Structure

```
src/
  App.jsx                 orchestrates MoodBot + toast + dashboard
  components/
    Dashboard.jsx          the main runtime. screen (skill path, terminal, stats)
    MoodBot.jsx             the bouncing bot pinned to the top
    SassyToast.jsx          duolingo-style return notification
  lib/
    sassyLines.js            all bot copy, by mood
    useMoodState.js         localStorage-based mood/streak logic
    notifications.js         permission + local scheduling + SW registration
public/
  sw.js                     service worker (push + notification click)
  bot-icon.svg              notification icon
server/
  send-reminder.js          backend push cron stub, not deployed
```
