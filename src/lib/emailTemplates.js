// Pixel-precise HTML for the two-tier streak-reminder emails. Built as
// inline-styled, table-based markup (not a stylesheet + divs) because most
// email clients — Outlook especially — strip <style> blocks and don't
// support CSS gradients, clip-path, or animation. The animated RGB-split
// glitch headline is progressive enhancement only: a static, colored
// text-shadow version always renders via inline style; a <style> block
// with @keyframes on top of it only activates in clients that respect
// embedded stylesheets (Gmail, Apple Mail — not Outlook desktop).
//
// Inline <svg> (the hearts, the bot chassis) is the other real gap: Gmail
// and Apple Mail render it fine, Outlook does not render inline SVG at
// all — that area will just be blank there. No workaround for that short
// of shipping raster image fallbacks, which wasn't asked for.

const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";
const FONT_DISPLAY = "'Press Start 2P', 'JetBrains Mono', 'Courier New', monospace";
const FONT_WORDMARK = "'Space Grotesk', 'Segoe UI', Arial, sans-serif";

// 8x7 pixel-grid heart, hand-plotted as filled cells (classic blocky heart).
const HEART_CELLS = [
  [1, 0], [2, 0], [5, 0], [6, 0],
  [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1],
  [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2],
  [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3],
  [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4],
  [2, 5], [3, 5], [4, 5], [5, 5],
  [3, 6], [4, 6],
];
// Perimeter-only subset, used for the "hollow/dashed" heart state.
const HEART_OUTLINE_CELLS = [
  [1, 0], [2, 0], [5, 0], [6, 0],
  [0, 1], [3, 1], [4, 1], [7, 1],
  [0, 2], [7, 2],
  [0, 3], [7, 3],
  [1, 4], [6, 4],
  [2, 5], [5, 5],
  [3, 6], [4, 6],
];

const CELL = 3.5; // px per pixel-grid unit
const HEART_W = 8 * CELL;
const HEART_H = 7 * CELL;

function heartSvg({ state, accent, dimAccent, bg }) {
  // state: "solid" | "cracked" | "hollow"
  const rects = (cells, fill, opacity = 1) =>
    cells
      .map(
        ([x, y]) =>
          `<rect x="${x * CELL}" y="${y * CELL}" width="${CELL}" height="${CELL}" fill="${fill}" opacity="${opacity}"/>`
      )
      .join("");

  let body = "";
  if (state === "solid") {
    body = rects(HEART_CELLS, accent);
  } else if (state === "cracked") {
    body = rects(HEART_CELLS, dimAccent, 0.45);
    // diagonal crack cut through the middle in bg color
    const crackCells = [[3, 0], [3, 1], [4, 2], [4, 3], [3, 4], [3, 5], [4, 6]];
    body += rects(crackCells, bg);
  } else {
    // hollow / dashed-outline: faint interior fill, checkered accent perimeter
    body = rects(HEART_CELLS, dimAccent, 0.18);
    body += rects(
      HEART_OUTLINE_CELLS.filter((_, i) => i % 2 === 0),
      accent
    );
    body += rects(
      HEART_OUTLINE_CELLS.filter((_, i) => i % 2 === 1),
      accent,
      0.5
    );
  }

  return `<svg width="${HEART_W}" height="${HEART_H}" viewBox="0 0 ${HEART_W} ${HEART_H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${body}</svg>`;
}

function botChassisSvg({ pose, accent }) {
  // Mirrors SassyBot.jsx's real proportions: 48x38 body (rx10), 37x26
  // visor (rx7), two pill eyes inset in the visor.
  const upright = pose === "upright";
  const bodyX = 6, bodyY = 6, bodyW = 48, bodyH = 38;
  const visorX = bodyX + 5.5, visorY = bodyY + 6, visorW = 37, visorH = 26;
  const eyeY = visorY + visorH / 2 - 3.5;

  const eyes = upright
    ? `<rect x="${visorX + 6}" y="${eyeY}" width="9" height="7" rx="3.5" fill="${accent}"/>
       <rect x="${visorX + visorW - 15}" y="${eyeY}" width="9" height="7" rx="3.5" fill="${accent}"/>`
    : `<rect x="${visorX + 6}" y="${eyeY + 2.5}" width="10" height="2" rx="1" fill="${accent}" transform="rotate(-10 ${visorX + 11} ${eyeY + 3.5})"/>
       <rect x="${visorX + visorW - 16}" y="${eyeY + 2.5}" width="10" height="2" rx="1" fill="${accent}" transform="rotate(-10 ${visorX + visorW - 11} ${eyeY + 3.5})"/>`;

  const rotation = upright ? "" : `transform="rotate(-14 ${bodyX + bodyW / 2} ${bodyY + bodyH / 2})"`;

  return `<svg width="60" height="50" viewBox="0 0 60 50" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <g ${rotation}>
      <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="10" fill="#20222F" stroke="#2E3244" stroke-width="1.5"/>
      <rect x="${visorX}" y="${visorY}" width="${visorW}" height="${visorH}" rx="7" fill="#16161E"/>
      ${eyes}
    </g>
  </svg>`;
}

function skillPathSvg({ variant, accent }) {
  // variant: "tier1" (progress mid-path, current dot highlighted) or
  // "tier2" (all dim/hollow, nothing lit).
  const dot = (cx, filled, hollow, borderColor) => {
    if (filled) return `<circle cx="${cx}" cy="10" r="4" fill="#9ECE6A"/>`;
    if (hollow) return `<circle cx="${cx}" cy="10" r="4" fill="none" stroke="${borderColor}" stroke-width="1.5"/>`;
    return `<circle cx="${cx}" cy="10" r="4" fill="#3B3D4C"/>`;
  };

  const lineColor = variant === "tier1" ? "#3B3D4C" : "#2A2C38";
  const litLine = variant === "tier1" ? `<line x1="20" y1="10" x2="100" y2="10" stroke="#9ECE6A" stroke-width="2"/>` : "";

  const dots =
    variant === "tier1"
      ? `${dot(20, true)}${dot(100, false, true, "#7AA2F7")}${dot(180, false, false)}`
      : `${dot(20, false, true, "#3B3D4C")}${dot(100, false, true, "#3B3D4C")}${dot(180, false, true, "#3B3D4C")}`;

  return `<svg width="200" height="20" viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <line x1="20" y1="10" x2="180" y2="10" stroke="${lineColor}" stroke-width="2"/>
    ${litLine}
    ${dots}
  </svg>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/**
 * Renders the full 480x620 email. `cfg` carries every tier-specific value
 * (colors, copy, heart states, skill-path variant, bot pose) so tier1/tier2
 * are two thin config objects on top of one shared layout — same structure,
 * different skin, per the shared-base-structure spec.
 */
function renderEmail(cfg) {
  const {
    bg, border, bloomA, bloomB, accent, dimAccent,
    glitchColorA, glitchColorB, glitchSpeed,
    headline, subtext, ctaLabel, ctaUrl,
    statusLabel, speechBubbleText,
    heartStates, skillPathVariant, botPose, footerText,
  } = cfg;

  const hearts = heartStates
    .map(
      (state) =>
        `<td style="padding:0 5px;">${heartSvg({ state, accent, dimAccent, bg })}</td>`
    )
    .join("");

  const glitchId = `g-${headline.replace(/\s+/g, "").toLowerCase()}`;

  // Layered background: solid bgcolor first (Outlook/plain-text-ish
  // clients read this), then a CSS `background` shorthand with two radial
  // blooms + a faint linear grid, masked toward the bottom via a third
  // gradient stop set to transparent — clients that honor multi-layer
  // backgrounds (Gmail, Apple Mail) get the full look, others just see bg.
  const canvasBackground = [
    `radial-gradient(circle at 15% 10%, ${bloomA}33, transparent 40%)`,
    `radial-gradient(circle at 85% 8%, ${bloomB}2e, transparent 38%)`,
    `repeating-linear-gradient(0deg, ${border}22 0px, ${border}22 1px, transparent 1px, transparent 28px)`,
    `repeating-linear-gradient(90deg, ${border}22 0px, ${border}22 1px, transparent 1px, transparent 28px)`,
    `linear-gradient(180deg, ${bg} 60%, ${bg}00 100%)`,
    bg,
  ].join(", ");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>runtime.</title>
<style>
  @font-face {
    font-family: 'Press Start 2P';
    src: local('Press Start 2P');
  }
  @keyframes glitchBandA-${glitchId} {
    0%, 100% { clip-path: inset(0 0 85% 0); transform: translate(-1px, 0); }
    20% { clip-path: inset(15% 0 65% 0); transform: translate(1px, 0); }
    40% { clip-path: inset(40% 0 40% 0); transform: translate(-1px, 0); }
    60% { clip-path: inset(65% 0 15% 0); transform: translate(1px, 0); }
    80% { clip-path: inset(85% 0 0 0); transform: translate(-1px, 0); }
  }
  @keyframes glitchBandB-${glitchId} {
    0%, 100% { clip-path: inset(85% 0 0 0); transform: translate(1px, 0); }
    25% { clip-path: inset(55% 0 25% 0); transform: translate(-1px, 0); }
    50% { clip-path: inset(30% 0 50% 0); transform: translate(1px, 0); }
    75% { clip-path: inset(5% 0 75% 0); transform: translate(-1px, 0); }
  }
  .glitch-${glitchId} { position: relative; display: inline-block; }
  .glitch-${glitchId}::before,
  .glitch-${glitchId}::after {
    content: attr(data-text);
    position: absolute;
    left: 0; top: 0;
    width: 100%;
  }
  .glitch-${glitchId}::before {
    color: ${glitchColorA};
    animation: glitchBandA-${glitchId} ${glitchSpeed}s infinite linear;
  }
  .glitch-${glitchId}::after {
    color: ${glitchColorB};
    animation: glitchBandB-${glitchId} ${glitchSpeed}s infinite linear reverse;
  }
</style>
</head>
<body style="margin:0;padding:0;background:#0D0E15;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0D0E15;padding:32px 0;">
<tr><td align="center">

<table role="presentation" width="480" cellpadding="0" cellspacing="0" bgcolor="${bg}"
  style="width:480px;background:${canvasBackground};border:1px solid ${border};border-radius:22px;overflow:hidden;font-family:${FONT_MONO};">

  <!-- header: wordmark + speech bubble -->
  <tr>
    <td style="padding:24px 24px 0 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td valign="top" style="font-family:${FONT_WORDMARK};font-weight:700;font-size:17px;color:#C0CAF5;">
            runtime.<span style="color:${accent};">&#8226;</span>
          </td>
          <td align="right" valign="top" style="width:270px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid ${border};border-radius:10px;background:#191A24;box-shadow:0 8px 20px -8px #000000a0;">
              <tr>
                <td style="width:3px;background:${accent};border-radius:10px 0 0 10px;">&nbsp;</td>
                <td style="padding:10px 14px;font-family:${FONT_MONO};font-size:11.5px;line-height:1.5;color:#C0CAF5;">
                  ${escapeHtml(speechBubbleText)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- hearts -->
  <tr>
    <td align="center" style="padding:34px 24px 0 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>${hearts}</tr></table>
    </td>
  </tr>

  <!-- status label -->
  <tr>
    <td align="center" style="padding:12px 24px 0 24px;font-family:${FONT_MONO};font-size:10.5px;letter-spacing:2px;color:${accent};text-transform:uppercase;">
      ${escapeHtml(statusLabel)}
    </td>
  </tr>

  <!-- glitch headline -->
  <tr>
    <td align="center" style="padding:22px 24px 0 24px;">
      <div class="glitch-${glitchId}" data-text="${escapeHtml(headline)}"
        style="font-family:${FONT_DISPLAY};font-size:26px;line-height:1.3;color:${accent};text-shadow:1.5px 0 ${glitchColorA}, -1.5px 0 ${glitchColorB};">
        ${escapeHtml(headline)}
      </div>
    </td>
  </tr>

  <!-- subtext -->
  <tr>
    <td align="center" style="padding:14px 40px 0 40px;font-family:${FONT_MONO};font-size:12.5px;line-height:1.6;color:#9AA0BE;">
      ${escapeHtml(subtext)}
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td align="center" style="padding:22px 24px 0 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td bgcolor="${accent}" style="border-radius:24px;">
            <a href="${ctaUrl}" style="display:inline-block;padding:11px 26px;font-family:${FONT_MONO};font-weight:700;font-size:13px;color:#16161E;text-decoration:none;">
              ${escapeHtml(ctaLabel)}
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- skill path + bot -->
  <tr>
    <td align="center" style="padding:38px 24px 0 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:14px;">${skillPathSvg({ variant: skillPathVariant, accent })}</td>
        <td>${botChassisSvg({ pose: botPose, accent })}</td>
      </tr></table>
    </td>
  </tr>

  <!-- footer -->
  <tr>
    <td align="center" style="padding:26px 24px 24px 24px;font-family:${FONT_MONO};font-size:10.5px;color:#565A75;">
      ${escapeHtml(footerText)}
    </td>
  </tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}

/**
 * Tier 1 — "GAME OVER", 2-3 days missed, orange/warning.
 * data: { streak, heartsRemaining, lessonTopic, ctaUrl, speechLine }
 */
export function buildTier1Email(data) {
  const { streak, heartsRemaining, lessonTopic, ctaUrl, speechLine } = data;
  return renderEmail({
    bg: "#1A1B26",
    border: "#2A2D3A",
    bloomA: "#7AA2F7",
    bloomB: "#BB9AF7",
    accent: "#FF9E64",
    dimAccent: "#FF9E64",
    glitchColorA: "#F7768E",
    glitchColorB: "#7AA2F7",
    glitchSpeed: 2.4,
    headline: "GAME OVER",
    subtext: `${lessonTopic} left unfinished. Save your streak.`,
    ctaLabel: "Resume →",
    ctaUrl,
    statusLabel: `${streak} DAY STREAK · ${heartsRemaining} / 3 REMAINING`,
    speechBubbleText: speechLine,
    heartStates: heartsRemaining >= 2 ? ["solid", "solid", "cracked"] : ["solid", "cracked", "cracked"],
    skillPathVariant: "tier1",
    botPose: "upright",
    footerText: "runtime. · your move.",
  });
}

/**
 * Tier 2 — "FLATLINED", a week+ missed, crimson/critical, with recovery CTA.
 * data: { daysAbsent, solvedInSession, ctaUrl, speechLine }
 */
export function buildTier2Email(data) {
  const { daysAbsent, solvedInSession, ctaUrl, speechLine } = data;
  return renderEmail({
    bg: "#1A1418",
    border: "#3A2020",
    bloomA: "#F7768E",
    bloomB: "#FF4D4D",
    accent: "#F7768E",
    dimAccent: "#F7768E",
    glitchColorA: "#FF4D4D",
    glitchColorB: "#FFB4C0",
    glitchSpeed: 1.8,
    headline: "FLATLINED",
    subtext: `${daysAbsent} days of silence. Solve 3 problems to bring your hearts back online.`,
    ctaLabel: "Revive Hearts →",
    ctaUrl,
    statusLabel: `${solvedInSession} / 3 SOLVED · HEARTS OFFLINE`,
    speechBubbleText: speechLine,
    heartStates: ["hollow", "hollow", "hollow"],
    skillPathVariant: "tier2",
    botPose: "sideways",
    footerText: "runtime. · it's not too late. probably.",
  });
}
