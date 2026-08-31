import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";
import { EditorView } from "@codemirror/view";
import { indentUnit } from "@codemirror/language";

const editorTheme = EditorView.theme({
  "&": { fontSize: "13.5px" },
  ".cm-content": { fontFamily: "'JetBrains Mono', monospace", padding: "16px 0" },
  ".cm-gutters": { fontFamily: "'JetBrains Mono', monospace" },
});

const LANGUAGE_EXTENSIONS = {
  javascript: () => javascript({ jsx: false }),
  python: () => python(),
};

// CodeMirror's indentUnit defaults to 2 spaces regardless of language,
// which was never overridden — fine for the hand-built JS lessons (which
// are authored at 2 spaces), but every ingested Python problem's starter/
// solution code is 4-space (real PEP8, matching the dataset as-authored).
// With no override, pressing Enter after a `:` indented 2 spaces on top of
// already-4-space code, drifting the two conventions apart line by line
// until Python's strict indentation rules threw a real IndentationError.
const INDENT_UNITS = {
  javascript: "  ",
  python: "    ",
};

export default function CodeEditor({ value, onChange, readOnly = false, height = "300px", language = "javascript" }) {
  const languageExtension = (LANGUAGE_EXTENSIONS[language] || LANGUAGE_EXTENSIONS.javascript)();
  const extensions = [languageExtension, indentUnit.of(INDENT_UNITS[language] || INDENT_UNITS.javascript), editorTheme];

  return (
    <CodeMirror
      value={value}
      height={height}
      theme={tokyoNight}
      extensions={extensions}
      editable={!readOnly}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: !readOnly,
        // Off: typing a full multi-line solution (or pasting one) reliably
        // produced duplicated closing braces when this was on — the
        // "type over the auto-inserted bracket" detection doesn't hold up
        // once auto-indent repositions the cursor across a newline.
        closeBrackets: false,
      }}
      onChange={onChange}
    />
  );
}
