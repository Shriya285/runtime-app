import React, { useEffect, useState } from "react";

const STORAGE_KEY = "runtime_digest_email";
const COLORS = { bg: "#1C1E2A", border: "#2E3244", fg: "#C0CAF5", fgDim: "#787C99", blue: "#7AA2F7" };
const FONTS = { mono: "'JetBrains Mono', monospace" };

/**
 * Client-side capture for the email digest channel (server/send-digest.js).
 * Stores locally for now — wiring this to a real POST /api/subscribe-email
 * needs the backend described in server/subscribe-email.js.
 */
export default function EmailDigestOptIn() {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEmail(localStorage.getItem(STORAGE_KEY) || "");
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, email.trim());
    setSaved(true);
  };

  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "10px",
        padding: "12px 16px",
        fontFamily: FONTS.mono,
        fontSize: "12px",
        color: COLORS.fg,
        maxWidth: "260px",
      }}
    >
      Email digest for the 24h+ gaps push can't reliably cover — not wired to a real send yet, see
      server/send-digest.js.
      <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSaved(false);
          }}
          placeholder="you@example.com"
          style={{
            flex: 1,
            minWidth: 0,
            background: "#16161E",
            border: `1px solid ${COLORS.border}`,
            borderRadius: "6px",
            padding: "5px 8px",
            fontFamily: FONTS.mono,
            fontSize: "11px",
            color: COLORS.fg,
            outline: "none",
          }}
        />
        <button
          onClick={handleSave}
          style={{
            background: COLORS.blue,
            color: "#0D0E15",
            border: "none",
            borderRadius: "6px",
            padding: "5px 10px",
            fontFamily: FONTS.mono,
            fontWeight: 600,
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          Save
        </button>
      </div>
      {saved && email.trim() && (
        <div style={{ marginTop: "4px", color: COLORS.fgDim, fontSize: "10.5px" }}>saved locally</div>
      )}
    </div>
  );
}
