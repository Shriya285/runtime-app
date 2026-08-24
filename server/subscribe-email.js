// STUB — not deployed. Accepts an email address to enable the digest
// channel in send-digest.js. Needs the same users collection as
// send-reminder.js / send-digest.js — this just upserts { email } onto the
// current user's doc.
//
// There's no auth/session system in this app yet, so "the current user"
// has nowhere to resolve from — that's what's actually missing here, not
// the Resend integration itself. Until there's a session, the frontend
// (src/components/EmailDigestOptIn.jsx) stores the email in localStorage
// as a placeholder instead of calling this endpoint.
//
// export default async function handler(req, res) {
//   if (req.method !== "POST") return res.status(405).end();
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ error: "email required" });
//   await db.collection("users").updateOne(
//     { _id: currentUserId(req) },
//     { $set: { email } },
//     { upsert: true }
//   );
//   res.status(200).json({ ok: true });
// }

export default async function handler(req, res) {
  res.status(501).json({ error: "Not implemented — see comments in this file." });
}
