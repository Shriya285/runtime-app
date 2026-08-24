import React, { useEffect, useState } from "react";

const COLORS = {
  surface: "#20222F",
  border: "#2E3244",
  fg: "#C0CAF5",
  fgDim: "#787C99",
  blue: "#7AA2F7",
};

const FONTS = { mono: "'JetBrains Mono', monospace" };

function storageKey(lessonId) {
  return `runtime_leetcode_link_${lessonId}`;
}

export default function LeetCodeLinkField({ lessonId }) {
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUrl(localStorage.getItem(storageKey(lessonId)) || "");
  }, [lessonId]);

  const handleChange = (e) => {
    setUrl(e.target.value);
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(storageKey(lessonId), url.trim());
    setSaved(true);
  };

  const handleOpen = () => {
    if (url.trim()) window.open(url.trim(), "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <input
        type="url"
        value={url}
        onChange={handleChange}
        onBlur={handleSave}
        placeholder="Solved on LeetCode instead? Paste the problem URL"
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "6px",
          padding: "6px 10px",
          fontFamily: FONTS.mono,
          fontSize: "11.5px",
          color: COLORS.fg,
          width: "260px",
          outline: "none",
        }}
      />
      <button
        onClick={handleOpen}
        disabled={!url.trim()}
        style={{
          background: "transparent",
          border: `1px solid ${COLORS.border}`,
          borderRadius: "6px",
          padding: "6px 12px",
          fontFamily: FONTS.mono,
          fontSize: "11.5px",
          color: url.trim() ? COLORS.blue : COLORS.fgDim,
          cursor: url.trim() ? "pointer" : "not-allowed",
        }}
      >
        Open
      </button>
      {saved && url.trim() && (
        <span style={{ fontFamily: FONTS.mono, fontSize: "10.5px", color: COLORS.fgDim }}>saved</span>
      )}
    </div>
  );
}
