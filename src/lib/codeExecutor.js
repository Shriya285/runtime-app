// Thin client for the public Judge0 CE demo instance (ce.judge0.com).
//
// Replaces the earlier Piston-based client: the public Piston instance
// (emkc.org) went whitelist-only on 2/15/2026 and explicitly excludes
// individual/portfolio/AI-generated projects (see git history on this
// file's predecessor, src/lib/piston.js, for that investigation). This
// instance is CORS-enabled and needs no API key — verified directly
// (curl + a CORS preflight check) before switching to it. It's a shared
// public demo instance with no documented SLA, so treat it the same way
// the Piston one was treated: best-effort, not something to depend on
// for anything beyond a personal practice app.

const JUDGE0_BASE = import.meta.env.VITE_JUDGE0_API_URL || "https://ce.judge0.com";

// Matched against the /languages list rather than hardcoded IDs, since
// this instance offers several versions per language and IDs aren't
// guaranteed stable — picks the highest version matching the pattern.
const LANGUAGE_PATTERNS = {
  javascript: /^JavaScript \(Node\.js/i,
  python: /^Python \(3\./i,
};

let languageListCache = null;

function extractVersion(name) {
  const m = name.match(/\(([\d.]+)/);
  return m ? m[1].split(".").map(Number) : [0];
}

function compareVersionsDesc(a, b) {
  const va = extractVersion(a.name);
  const vb = extractVersion(b.name);
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const diff = (vb[i] || 0) - (va[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function getLanguageId(language) {
  const pattern = LANGUAGE_PATTERNS[language];
  if (!pattern) throw new Error(`No Judge0 language mapping for "${language}"`);

  if (!languageListCache) {
    const res = await fetch(`${JUDGE0_BASE}/languages`);
    if (!res.ok) throw new Error(`Failed to fetch Judge0 languages (${res.status})`);
    languageListCache = await res.json();
  }

  const matches = languageListCache.filter((l) => pattern.test(l.name));
  if (matches.length === 0) throw new Error(`No Judge0 runtime found matching "${language}"`);
  matches.sort(compareVersionsDesc);
  return matches[0].id;
}

/**
 * Executes `source` on Judge0 and returns the run result. Uses `wait=true`
 * so the submission resolves synchronously instead of needing to poll a
 * token — simpler, at the cost of the request taking as long as the run.
 */
export async function executeCode({ language, source, stdin = "" }) {
  const languageId = await getLanguageId(language);

  const res = await fetch(`${JUDGE0_BASE}/submissions?base64_encoded=false&wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_code: source, language_id: languageId, stdin }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Judge0 execute request failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  if (data.status && data.status.id <= 2) {
    // 1 = In Queue, 2 = Processing — shouldn't happen with wait=true, but
    // don't silently treat it as a completed run if it does.
    throw new Error(`Judge0 submission did not complete (status: ${data.status.description})`);
  }

  return {
    stdout: data.stdout || "",
    stderr: data.stderr || data.compile_output || "",
    exitCode: data.status ? data.status.id : null,
    wallTimeMs: data.time ? Math.round(parseFloat(data.time) * 1000) : null,
    // Judge0 reports memory in KB; normalize to bytes so callers get a
    // consistent unit regardless of which execution backend is behind this.
    memoryBytes: typeof data.memory === "number" ? data.memory * 1024 : null,
  };
}
