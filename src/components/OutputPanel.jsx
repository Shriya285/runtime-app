import React from "react";

const COLORS = {
  comment: "#565F89",
  fgDim: "#787C99",
  fg: "#C0CAF5",
  green: "#9ECE6A",
  red: "#F7768E",
  blue: "#7AA2F7",
  border: "#2E3244",
};

const FONTS = { mono: "'JetBrains Mono', monospace" };

// Both the None-return bug and the ordering bugs (see ingest-problems.js)
// looked exactly like this before they were found: a solution that's
// almost certainly correct, failing a small minority of tests. This is
// advisory, not automatic — it can't tell "subtle real bug" apart from
// "bad test data" any better than the two known past bugs could be told
// apart just by their symptom, so it surfaces the option rather than
// silently deciding for you.
const SOFT_PASS_THRESHOLD = 0.9;

function formatMemory(bytes) {
  if (bytes == null) return null;
  return `${(bytes / 1024).toFixed(0)}KB`;
}

// TODO(hints): when a test fails, this is where a "get a hint" affordance
// should go — nudge toward the bug (e.g. "check your loop's exit condition"),
// never reveal the fix outright, so it doesn't undercut the struggle-timer
// mechanic. Not implemented yet — future phase.
function HintStub() {
  return null;
}

export default function OutputPanel({ state, error, results, runtimeMs, memoryBytes, testCount, onOverridePass }) {
  if (state === "idle") {
    return <span style={{ color: COLORS.comment }}>&gt; awaiting run&hellip;</span>;
  }

  if (state === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", color: COLORS.fgDim }}>
        <div
          style={{
            width: "13px",
            height: "13px",
            border: `2px solid ${COLORS.border}`,
            borderTopColor: COLORS.blue,
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        running your code&hellip;
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={{ color: COLORS.red, whiteSpace: "pre-wrap", fontFamily: FONTS.mono }}>
        &#10007; {error}
      </div>
    );
  }

  const passed = results.filter((r) => r.passed).length;
  const allPassed = passed === testCount;
  const passRate = testCount > 0 ? passed / testCount : 0;
  const nearMiss = !allPassed && onOverridePass && passRate >= SOFT_PASS_THRESHOLD;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
      {results.map((r, i) => (
        <div key={i} style={{ color: r.passed ? COLORS.green : COLORS.red }}>
          {r.passed ? "✓" : "✗"} test {i + 1} {r.passed ? "passed" : "failed"}
          {r.error
            ? ` — ${r.error}`
            : !r.passed
            ? ` — got ${JSON.stringify(r.actual)}, expected ${JSON.stringify(r.expected)}`
            : ""}
          {!r.passed && <HintStub />}
        </div>
      ))}
      <span style={{ color: COLORS.fg, marginTop: "4px" }}>
        {passed}/{testCount} passed
        {runtimeMs != null && ` · runtime ${runtimeMs}ms`}
        {formatMemory(memoryBytes) && ` · memory ${formatMemory(memoryBytes)}`}
        {allPassed && " · +40 XP"}
      </span>
      {nearMiss && (
        <div
          style={{
            marginTop: "8px",
            padding: "10px 12px",
            background: "#20222F",
            border: `1px solid ${COLORS.blue}55`,
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <span style={{ color: COLORS.fgDim, flex: 1, minWidth: "220px" }}>
            {passed}/{testCount} is a high pass rate — worth a look at the failures below before assuming it's
            your bug. This app's test data has had exactly this problem before.
          </span>
          <button
            onClick={onOverridePass}
            style={{
              background: "transparent",
              border: `1px solid ${COLORS.blue}`,
              borderRadius: "6px",
              padding: "5px 10px",
              color: COLORS.blue,
              fontFamily: FONTS.mono,
              fontSize: "11px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            I&rsquo;m confident — mark as solved
          </button>
        </div>
      )}
      {/* TODO(complexity): once correctness is solid, this is where a
          Big-O / complexity grading pass would run against the same
          submission and report alongside pass/fail — not implemented yet. */}
    </div>
  );
}
