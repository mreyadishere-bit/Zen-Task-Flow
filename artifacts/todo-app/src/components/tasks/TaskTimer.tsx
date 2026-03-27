import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Play, Pause, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskTimerProps {
  taskId: number;
  onActiveChange?: (active: boolean) => void;
}

type TimerState = "idle" | "running" | "paused" | "done";

const PRESETS = [
  { label: "5 min", seconds: 5 * 60 },
  { label: "10 min", seconds: 10 * 60 },
  { label: "15 min", seconds: 15 * 60 },
  { label: "25 min", seconds: 25 * 60 },
  { label: "30 min", seconds: 30 * 60 },
  { label: "45 min", seconds: 45 * 60 },
  { label: "60 min", seconds: 60 * 60 },
];

function playDoneSound() {
  try {
    const ctx = new AudioContext();
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
      osc.connect(gainNode);
      gainNode.gain.setValueAtTime(0.35, ctx.currentTime + i * 0.18);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.5);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.5);
    });

    setTimeout(() => ctx.close(), 2500);
  } catch {
    // Silently fail if AudioContext not available
  }
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function CircleProgress({ percent, size = 36, stroke = 3 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/40" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="currentColor" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary transition-all duration-1000"
      />
    </svg>
  );
}

export function TaskTimer({ taskId, onActiveChange }: TaskTimerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [state, setState] = useState<TimerState>("idle");
  const [customMin, setCustomMin] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const percent = totalSeconds > 0 ? Math.round(((totalSeconds - remaining) / totalSeconds) * 100) : 0;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const start = useCallback(() => {
    if (remaining <= 0) return;
    setState("running");
    setShowPicker(false);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearTimer();
          setState("done");
          playDoneSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [remaining, clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setState("paused");
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setRemaining(totalSeconds);
    setState("idle");
  }, [clearTimer, totalSeconds]);

  const dismiss = useCallback(() => {
    clearTimer();
    setRemaining(totalSeconds);
    setState("idle");
    setShowPicker(false);
  }, [clearTimer, totalSeconds]);

  const selectPreset = (seconds: number) => {
    clearTimer();
    setTotalSeconds(seconds);
    setRemaining(seconds);
    setState("idle");
    setShowPicker(false);
    setCustomMin("");
  };

  const applyCustom = () => {
    const mins = parseInt(customMin, 10);
    if (!isNaN(mins) && mins > 0 && mins <= 999) {
      selectPreset(mins * 60);
    }
  };

  const isActive = state === "running" || state === "paused" || state === "done";

  useEffect(() => {
    onActiveChange?.(isActive);
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative flex items-center gap-1" id={`timer-${taskId}`}>
      {/* When idle — show timer icon to open picker */}
      {!isActive && (
        <button
          onClick={() => setShowPicker(v => !v)}
          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          title="Set timer"
        >
          <Timer className="w-4 h-4" />
        </button>
      )}

      {/* Active timer display */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, width: 0 }}
            animate={{ opacity: 1, scale: 1, width: "auto" }}
            exit={{ opacity: 0, scale: 0.85, width: 0 }}
            className="flex items-center gap-1.5 bg-primary/8 border border-primary/20 rounded-xl px-2.5 py-1.5 overflow-hidden"
          >
            {/* Circle progress */}
            <div className="relative flex-shrink-0">
              <CircleProgress percent={percent} size={28} stroke={2.5} />
              {state === "done" && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-[8px]">✓</span>
                </motion.div>
              )}
            </div>

            {/* Time display */}
            <button
              onClick={() => { if (state !== "done") setShowPicker(v => !v); }}
              className={cn(
                "text-xs font-mono font-semibold tabular-nums min-w-[34px] text-center",
                state === "done" ? "text-green-500" : "text-primary",
                state !== "done" && "hover:opacity-70 cursor-pointer"
              )}
              title={state !== "done" ? "Change timer" : undefined}
            >
              {state === "done" ? "Done!" : formatTime(remaining)}
            </button>

            {/* Controls */}
            {state === "running" && (
              <button onClick={pause} className="p-0.5 text-primary hover:opacity-70 transition-opacity" title="Pause">
                <Pause className="w-3.5 h-3.5" fill="currentColor" />
              </button>
            )}
            {state === "paused" && (
              <button onClick={start} className="p-0.5 text-primary hover:opacity-70 transition-opacity" title="Resume">
                <Play className="w-3.5 h-3.5" fill="currentColor" />
              </button>
            )}
            {(state === "paused" || state === "done") && (
              <button onClick={reset} className="p-0.5 text-muted-foreground hover:text-foreground transition-colors" title="Reset">
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
            <button onClick={dismiss} className="p-0.5 text-muted-foreground hover:text-destructive transition-colors" title="Dismiss">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Picker dropdown */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 bottom-full mb-2 z-50 bg-card border border-card-border rounded-2xl shadow-lg p-3 w-52"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-1">
              Set Timer
            </p>

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {PRESETS.map(p => (
                <button
                  key={p.seconds}
                  onClick={() => { selectPreset(p.seconds); start(); }}
                  className={cn(
                    "text-xs font-medium px-2.5 py-2 rounded-xl border transition-all",
                    totalSeconds === p.seconds && state === "idle"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 border-transparent hover:bg-muted text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5">
              <input
                type="number"
                placeholder="Custom min"
                value={customMin}
                onChange={e => setCustomMin(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { applyCustom(); start(); } }}
                className="flex-1 text-xs bg-muted/50 border border-border rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                min={1} max={999}
              />
              <button
                onClick={() => { applyCustom(); if (customMin && parseInt(customMin) > 0) setTimeout(start, 10); }}
                className="px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                Go
              </button>
            </div>

            {state === "idle" && remaining > 0 && (
              <button
                onClick={start}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 bg-primary/10 text-primary text-xs font-semibold rounded-xl hover:bg-primary/20 transition-colors"
              >
                <Play className="w-3 h-3" fill="currentColor" />
                Start {formatTime(remaining)}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
