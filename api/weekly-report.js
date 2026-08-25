// Real, wired-up endpoint (not a stub) — lives under /api/ so Vercel's
// zero-config functions convention actually picks it up (server/*.js
// silently doesn't; see git history on vercel.json for why that mattered).
//
// Needs ANTHROPIC_API_KEY set as a Vercel env var (and in a local .env for
// `vercel dev`) to actually respond — get one at console.anthropic.com.
// Without it, this returns a clear 500 rather than a fake response.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

function buildPrompt(completions) {
  return completions
    .map((c, i) => {
      const how = c.reason === "tests-passed" ? "passed the tests unaided" : "revealed the solution";
      return `Problem ${i + 1}: ${c.lessonTitle} (${c.language})
Completed by: ${how}
Trigger (how they said they'll recognize this pattern next time): ${c.trigger}
Core idea (their stated one-line mechanism): ${c.coreIdea}
Their solution:
\`\`\`${c.language}
${c.code}
\`\`\``;
    })
    .join("\n\n---\n\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY is not set in this environment — get one at console.anthropic.com and add it as a Vercel env var.",
    });
  }

  const { completions } = req.body || {};
  if (!Array.isArray(completions) || completions.length === 0) {
    return res.status(400).json({ error: "completions array required" });
  }

  try {
    const message = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      system:
        "You are a sharp, encouraging coding mentor reviewing a student's week of practice on an " +
        "algorithm-drilling app. For each problem below, give specific, concrete feedback on their " +
        "solution and their notes — call out anything actually wrong or imprecise in their stated " +
        "trigger or core idea, credit what's genuinely good, and note if they leaned on revealing the " +
        "solution instead of solving it themselves. End with one or two sentences on what to focus on " +
        "next. Keep the whole response under 200 words, plain text, no markdown headers.",
      messages: [{ role: "user", content: buildPrompt(completions) }],
    });

    const text = message.content.find((b) => b.type === "text")?.text || "";
    res.status(200).json({ feedback: text });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY is set but invalid." });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "Rate limited by the Anthropic API — try again shortly." });
    }
    res.status(500).json({ error: err.message || "AI feedback request failed." });
  }
}
