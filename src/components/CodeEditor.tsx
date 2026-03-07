import { useState, useCallback } from "react";
import { Copy, Check, RotateCcw } from "lucide-react";

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onReset: () => void;
  error: string | null;
}

export default function CodeEditor({ code, onChange, onReset, error }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Fragment Shader</span>
        <div className="flex gap-1">
          <button
            onClick={onReset}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground transition hover:text-foreground"
            title="Reset to original"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground transition hover:text-foreground"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="h-64 w-full resize-y rounded-lg border border-border bg-background p-3 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
