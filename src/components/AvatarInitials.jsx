import React from "react";

// Deterministic hash -> HSL color, same idea as Gmail/Google's no-photo avatars.
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AvatarInitials({ name = "Shriya Konduru", size = 30 }) {
  const hue = hashString(name) % 360;

  return (
    <div
      title={name}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: `hsl(${hue}, 55%, 42%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        fontSize: `${size * 0.4}px`,
        color: "#fff",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {getInitials(name)}
    </div>
  );
}
