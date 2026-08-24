// STUB — not deployed. Email digest channel (Resend), the "reliable for
// multi-day gaps" complement to the push notifications in send-reminder.js.
// Push only covers the 6-24h nudge tier — this covers 24h+ (sassy) and
// 48h+ (savage), since email survives days of the app not being open in a
// way an OS push notification doesn't reliably.
//
// To make this real, you'd need:
//   1. `npm install resend` in a deployed Vercel project
//   2. A Resend API key (resend.com) — store as RESEND_API_KEY in Vercel
//      env vars, plus a verified sending domain (their onboarding sandbox
//      domain works for testing before you have one)
//   3. A place to store each user's email + lastActiveAt — same store as
//      send-reminder.js's push subscriptions (MongoDB Atlas). See
//      subscribe-email.js for how an email gets in there.
//   4. Move this file (and send-reminder.js) into /api/ — Vercel's
//      zero-config functions directory. `functions`/`crons` in
//      vercel.json only match files under /api/, confirmed the hard way:
//      pointing them at server/*.js broke every deployment ("doesn't
//      match any Serverless Functions inside the api directory"), which
//      is why vercel.json is empty right now. Once moved, add back:
//        "functions": { "api/send-reminder.js": { "maxDuration": 10 },
//                       "api/send-digest.js": { "maxDuration": 10 } },
//        "crons": [ { "path": "/api/send-reminder", "schedule": "..." },
//                    { "path": "/api/send-digest", "schedule": "..." } ]
//      Hobby-plan accounts are also capped at once-daily cron runs (an
//      hourly schedule fails deployment outright) — Pro removes that cap
//      if you want finer-grained absence checks than once a day.
//
// Below is the shape of what that function looks like once wired up.

import { Resend } from "resend";
import { PUSH_NOTIFICATIONS } from "../src/lib/sassyLines.js";

const resend = new Resend(process.env.RESEND_API_KEY);

function tierForGapHours(hours) {
  if (hours >= 48) return "savage";
  if (hours >= 24) return "sassy";
  return null; // 6-24h stays push-only, see send-reminder.js
}

export default async function handler(req, res) {
  // Pseudocode — replace with your actual MongoDB query once the users
  // collection exists.
  //
  // const usersToEmail = await db.collection("users").find({
  //   lastActiveAt: { $lt: twentyFourHoursAgo },
  //   email: { $exists: true },
  // }).toArray();

  const usersToEmail = []; // placeholder

  const results = await Promise.allSettled(
    usersToEmail.map((user) => {
      const gapHours = (Date.now() - new Date(user.lastActiveAt)) / 36e5;
      const tier = tierForGapHours(gapHours);
      if (!tier) return Promise.resolve();

      const copy = PUSH_NOTIFICATIONS[tier];
      return resend.emails.send({
        // Must be an address on a domain verified in your Resend account.
        from: "runtime. <reminders@yourdomain.com>",
        to: user.email,
        subject: copy.title,
        text: copy.body,
      });
    })
  );

  res.status(200).json({ sent: results.length });
}
