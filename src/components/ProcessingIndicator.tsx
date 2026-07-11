/**
 * ProcessingIndicator — Shows Knock AI processing state.
 * Displays an animated indicator when AI is processing, and
 * allows users to see the current step in the queue.
 */

import { useEffect, useState } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  onProcessingChange,
  getProcessingState,
  type ProcessingState,
} from "../services/aiService";

/* ─── Queue history (recent knocks) ─── */

interface RecentEntry {
  id: string;
  type: "thought" | "goal" | "polish";
  timestamp: number;
  status: "processing" | "done" | "failed";
  label: string;
}

/* ─── Component ─── */

export default function ProcessingIndicator() {
  const [state, setState] = useState<ProcessingState>(getProcessingState);
  const [history, setHistory] = useState<RecentEntry[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const unsub = onProcessingChange((newState) => {
      setState(newState);

      if (newState.isProcessing && newState.currentType) {
        setHistory((prev) => [
          {
            id: crypto.randomUUID(),
            type: newState.currentType!,
            timestamp: Date.now(),
            status: "processing",
            label:
              newState.currentType === "thought"
                ? "Knocking a thought"
                : newState.currentType === "goal"
                  ? "Processing a goal"
                  : "Polishing a publication",
          },
          ...prev.slice(0, 9), // keep last 10
        ]);
      }

      if (!newState.isProcessing && newState.progress === 100) {
        setHistory((prev) => {
          const updated = [...prev];
          const pending = updated.findIndex((e) => e.status === "processing");
          if (pending !== -1) {
            updated[pending] = { ...updated[pending], status: "done" };
          }
          return updated;
        });
      }

      if (!newState.isProcessing && newState.progress === 0 && newState.message) {
        setHistory((prev) => {
          const updated = [...prev];
          const pending = updated.findIndex((e) => e.status === "processing");
          if (pending !== -1) {
            updated[pending] = { ...updated[pending], status: "failed" };
          }
          return updated;
        });
      }
    });

    return unsub;
  }, []);

  if (!state.isProcessing && history.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Main indicator */}
      {state.isProcessing && (
        <div className="flex items-center gap-3 bg-surface border border-primary/20 rounded-lg px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="relative">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <div className="absolute inset-0 w-5 h-5 rounded-full bg-primary/10 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-foreground font-medium">
              {state.currentType === "thought" ? "Knock AI" : state.currentType === "goal" ? "Goal Builder" : "Polish ✨"}
            </span>
            <span className="text-xs text-muted">{state.message}</span>
          </div>
          <div className="flex gap-1 ml-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary/40"
                style={{
                  animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* History toggle */}
      {history.length > 0 && !state.isProcessing && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Recent knocks ({history.filter((h) => h.status === "done").length})
        </button>
      )}

      {/* History panel */}
      {expanded && history.length > 0 && (
        <div className="bg-surface border border-border rounded-lg shadow-lg p-3 w-72 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0"
            >
              {entry.status === "processing" && (
                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
              )}
              {entry.status === "done" && (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              )}
              {entry.status === "failed" && (
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{entry.label}</p>
                <p className="text-[10px] text-muted">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <span className="text-[10px] capitalize text-muted">
                {entry.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}