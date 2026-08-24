import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";
import { EditorView } from "@codemirror/view";

const editorTheme = EditorView.theme({
  "&": { fontSize: "13.5px" },
  ".cm-content": { fontFamily: "'JetBrains Mono', monospace", padding: "16px 0" },
  ".cm-gutters": { fontFamily: "'JetBrains Mono', monospace" },
});

export default function CodeEditor({ value, onChange, readOnly = false, height = "300px" }) {
  const extensions = [javascript({ jsx: false }), editorTheme];

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
