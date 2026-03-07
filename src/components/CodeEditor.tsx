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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Fragment Shader</span>
        <div className="flex gap-1.5">
          <button
            onClick={onReset}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Reset to original"
          >
            <RotateCcw size={11} />
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="h-72 w-full resize-y rounded-lg border border-border bg-background p-4 font-mono text-[11px] leading-relaxed text-foreground/80 placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[11px] text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
