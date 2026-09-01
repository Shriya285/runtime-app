// Email digest channel (Resend) — the "reliable for multi-day gaps"
// complement to the push notifications in server/send-reminder.js. Push
// only covers the 6-24h nudge tier; this covers everything past 24h,
// culminating in the two pixel-precise tier emails (48h-168h "GAME OVER",
// 168h+ "FLATLINED") built in src/lib/emailTemplates.js.
//
// Moved here (out of server/) because Vercel's zero-config Serverless
// Functions only pick up files under /api/ — confirmed the hard way
// earlier in this project: pointing vercel.json's functions/crons at
// server/*.js broke every deployment. server/send-reminder.js hasn't been
// moved because it's push-only and out of scope for this change.
//
// This is still NOT wired to real user data — there's no auth/session
// system in this app (see server/subscribe-email.js), so there's no way
// to resolve "the current user" server-side yet, only per-browser
// localStorage. The `usersToEmail` query below is deliberately left as
// pseudocode for that reason; everything past that point (tier logic,
// template rendering, the actual Resend call) is real, working code that
// will run correctly the moment a real users collection exists.
//
// To make sending itself real:
//   1. Sign up at resend.com, add RESEND_API_KEY to Vercel env vars.
//   2. Verify a sending domain in Resend. Until you do, Resend's sandbox
//      sender (onboarding@resend.dev) will ONLY deliver to the email
//      address your Resend account itself is registered under — it
//      silently won't reach anyone else. That's the real gate on "how
//      mail needs to be received" here: no verified domain means no real
//      recipients, only yourself, regardless of what this code does.
//   3. `vercel.json` needs functions/crons entries once this is live —
//      Hobby-plan accounts cap cron runs at once daily.

import { Resend } from "resend";
import { pickLine } from "../src/lib/sassyLines.js";
import { buildTier1Email, buildTier2Email } from "../src/lib/emailTemplates.js";

const DOMAIN = "https://runtime-app-beta.vercel.app";

// Resend's constructor throws synchronously on a missing/empty API key
// (not a lazy check on first send) — `new Resend(undefined)` crashes the
// whole function before it ever reaches the "nothing to send yet" early
// return below. Since RESEND_API_KEY genuinely isn't set yet, construction
// is deferred into the handler and guarded, so this cron endpoint returns
// a real, informative response instead of a 500 until it's configured.
function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function tierForGapHours(hours) {
  if (hours >= 168) return "tier2"; // FLATLINED — a week+
  if (hours >= 48) return "tier1"; // GAME OVER — 2-3 days+
  if (hours >= 24) return "sassy"; // existing generic digest copy, unchanged
  return null; // under 24h stays push-only, see server/send-reminder.js
}

function buildEmailForUser(user, gapHours) {
  const tier = tierForGapHours(gapHours);
  if (!tier) return null;

  if (tier === "tier1") {
    const streak = user.streak ?? 1;
    const heartsRemaining = 3 - Math.min(2, Math.floor((gapHours - 48) / 24));
    return {
      subject: "GAME OVER — your streak needs you",
      html: buildTier1Email({
        streak,
        heartsRemaining,
        lessonTopic: user.currentLessonTopic || "Today's lesson",
        ctaUrl: DOMAIN,
        speechLine: pickLine("annoyed"),
      }),
    };
  }

  if (tier === "tier2") {
    return {
      subject: "FLATLINED",
      html: buildTier2Email({
        daysAbsent: Math.floor(gapHours / 24),
        solvedInSession: 0,
        ctaUrl: `${DOMAIN}/revive`,
        speechLine: pickLine("savage"),
      }),
    };
  }

  // "sassy" tier (24-48h) — no dedicated design, keep the plain digest copy.
  return {
    subject: "still there?",
    html: `<p>A whole day gone. Bold strategy, let's see how it plays out. <a href="${DOMAIN}">Come back →</a></p>`,
  };
}

export default async function handler(req, res) {
  // Pseudocode — replace with your actual MongoDB query once the users
  // collection exists.
  //
  // const usersToEmail = await db.collection("users").find({
  //   lastActiveAt: { $lt: twentyFourHoursAgo },
  //   email: { $exists: true },
  // }).toArray();

  const usersToEmail = []; // placeholder — see comment above

  const resend = getResendClient();
  if (!resend) {
    res.status(200).json({ sent: 0, note: "RESEND_API_KEY is not configured — no email was sent." });
    return;
  }

  const results = await Promise.allSettled(
    usersToEmail.map((user) => {
      const gapHours = (Date.now() - new Date(user.lastActiveAt)) / 36e5;
      const email = buildEmailForUser(user, gapHours);
      if (!email) return Promise.resolve();

      return resend.emails.send({
        // Must be an address on a domain verified in your Resend account.
        from: "runtime. <reminders@yourdomain.com>",
        to: user.email,
        subject: email.subject,
        html: email.html,
      });
    })
  );

  res.status(200).json({ sent: results.length });
}

export { tierForGapHours, buildEmailForUser };
