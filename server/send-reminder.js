// STUB — not deployed. This is the piece that makes "nags you even after
// you closed the app" actually true, same pattern as the RepSet email cron:
// Vercel Cron Job -> serverless function -> checks last-active per user ->
// sends a real push via the `web-push` library.
//
// Push only covers the 6-24h nudge tier now — a push notification only
// reaches you if the OS delivers it and you happen to be looking, which
// gets less reliable the longer you've been gone. 24h+ and 48h+ absence
// are handled by the email digest instead (see send-digest.js), which
// survives days of not having the app open.
//
// To make this real, you'd need:
//   1. `npm install web-push` in a deployed Vercel project
//   2. VAPID keys: `npx web-push generate-vapid-keys` — store the public
//      key in the frontend (to subscribe) and both in Vercel env vars
//   3. A place to store push subscriptions per user (MongoDB Atlas, same
//      as the rest of your stack) — created when the user grants
//      notification permission and calls pushManager.subscribe()
//   4. vercel.json cron config to run this on a schedule (see vercel.json
//      in this repo)
//
// Below is the shape of what that function looks like once wired up.

import webpush from "web-push";
import { PUSH_NOTIFICATIONS } from "../src/lib/sassyLines.js";

webpush.setVapidDetails(
  "mailto:shriyakonduru2805@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function tierForGapHours(hours) {
  if (hours >= 6 && hours < 24) return "nudge";
  return null; // 24h+ is the email digest's job now — see send-digest.js
}

export default async function handler(req, res) {
  // Pseudocode — replace with your actual MongoDB query once the users
  // collection + push subscriptions exist.
  //
  // const usersToNudge = await db.collection("users").find({
  //   lastActiveAt: { $lt: sixHoursAgo },
  //   pushSubscription: { $exists: true },
  // }).toArray();

  const usersToNudge = []; // placeholder

  const results = await Promise.allSettled(
    usersToNudge.map((user) => {
      const gapHours = (Date.now() - new Date(user.lastActiveAt)) / 36e5;
      const tier = tierForGapHours(gapHours);
      if (!tier) return Promise.resolve();

      const payload = JSON.stringify(PUSH_NOTIFICATIONS[tier]);
      return webpush.sendNotification(user.pushSubscription, payload);
    })
  );

  res.status(200).json({ sent: results.length });
}
