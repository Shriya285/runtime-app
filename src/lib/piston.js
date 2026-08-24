// Thin client for a Piston API instance (https://github.com/engineer-man/piston).
//
// IMPORTANT: as of 2/15/2026 the public emkc.org instance is whitelist-only
// (see the repo's README "Important Note") — it 401s on /execute for
// unauthorized callers, and per Engineer Man's stated criteria, individual/
// portfolio/AI-generated projects don't qualify for whitelisting. This
// client talks to whatever Piston-compatible base URL you configure via
// VITE_PISTON_API_URL (self-hosted via `docker-compose up -d api`, or an
// approved instance) — the request/response contract is unchanged either
// way, so no code here needs to change once you have a working URL.
const PISTON_BASE = import.meta.env.VITE_PISTON_API_URL || "https://emkc.org/api/v2/piston";

const runtimeVersionCache = {};

async function getRuntimeVersion(language) {
  if (runtimeVersionCache[language]) return runtimeVersionCache[language];

  const res = await fetch(`${PISTON_BASE}/runtimes`);
  if (!res.ok) throw new Error(`Failed to fetch Piston runtimes (${res.status})`);
  const runtimes = await res.json();

  const match = runtimes.find(
    (r) => r.language === language || (r.aliases || []).includes(language)
  );
  if (!match) throw new Error(`No Piston runtime available for language "${language}"`);

  runtimeVersionCache[language] = match.version;
  return match.version;
}

/**
 * Executes `source` on Piston and returns the run result.
 * Throws if the request fails outright or the code failed to compile.
 */
export async function executeCode({ language, source, stdin = "" }) {
  const version = await getRuntimeVersion(language);

  const res = await fetch(`${PISTON_BASE}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language,
      version,
      files: [{ content: source }],
      stdin,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Piston execute request failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  if (data.compile && data.compile.code !== 0) {
    throw new Error(data.compile.stderr || "Compile error");
  }

  const run = data.run || {};
  return {
    stdout: run.stdout || "",
    stderr: run.stderr || "",
    exitCode: run.code,
    // Piston reports these on the public instance, but defensively allow
    // for an older/self-hosted instance that doesn't.
    wallTimeMs: typeof run.wall_time === "number" ? run.wall_time : null,
    cpuTimeMs: typeof run.cpu_time === "number" ? run.cpu_time : null,
    memoryBytes: typeof run.memory === "number" ? run.memory : null,
  };
}
