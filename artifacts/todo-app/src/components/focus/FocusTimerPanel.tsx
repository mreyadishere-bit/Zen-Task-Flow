import { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, RotateCcw, X, ArrowRight } from "lucide-react";
import { useTimer } from "@/context/TimerContext";
import { cn } from "@/lib/utils";

// ── Ring geometry ─────────────────────────────────────────────────────────────
const SIZE = 252;
const R = 108;
const STROKE = 3.5;
const CIRC = 2 * Math.PI * R;

// ── Presets ───────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: "15m", seconds: 900 },
  { label: "25m", seconds: 1500 },
  { label: "45m", seconds: 2700 },
  { label: "60m", seconds: 3600 },
  { label: "90m", seconds: 5400 },
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

function formatEndClock(remainingSeconds: number) {
  const end = new Date(Date.now() + remainingSeconds * 1000);
  return end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// ── Custom timer ──────────────────────────────────────────────────────────────
function CustomInput({
  onApply,
  onCancel,
}: {
  onApply: (seconds: number) => void;
  onCancel: () => void;
}) {
  const [h, setH] = useState(0);
  const [m, setM] = useState(25);
  const [s, setS] = useState(0);
  const total = h * 3600 + m * 60 + s;

  function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, isNaN(v) ? lo : v));
  }

  const fields = [
    { label: "hr", value: h, max: 23, set: (v: number) => setH(clamp(v, 0, 23)) },
    { label: "min", value: m, max: 59, set: (v: number) => setM(clamp(v, 0, 59)) },
    { label: "sec", value: s, max: 59, set: (v: number) => setS(clamp(v, 0, 59)) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-4 w-full"
    >
      {/* Spinners */}
      <div className="flex items-end gap-2">
        {fields.map(({ label, value, max, set }, i) => (
          <div key={label} className="flex items-end gap-2">
            {i > 0 && (
              <span className="text-muted-foreground/30 text-xl font-light pb-4">:</span>
            )}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => set(value + 1 > max ? 0 : value + 1)}
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors text-xs leading-none py-1"
              >
                ▲
              </button>
              <input
                type="number"
                min={0}
                max={max}
                value={pad(value)}
                onChange={(e) => set(parseInt(e.target.value))}
                className={cn(
                  "w-11 h-10 text-center rounded-lg text-sm font-semibold tabular-nums outline-none",
                  "bg-muted/60 text-foreground border border-border/60",
                  "focus:border-foreground/30 transition-colors",
                  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                )}
                style={{ fontVariantNumeric: "tabular-nums" }}
              />
              <button
                onClick={() => set(value - 1 < 0 ? max : value - 1)}
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors text-xs leading-none py-1"
              >
                ▼
              </button>
              <span className="text-[10px] text-muted-foreground/40 tracking-wider">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => total > 0 && onApply(total)}
          disabled={total === 0}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95",
            "bg-primary text-primary-foreground disabled:opacity-30"
          )}
        >
          Set timer
        </button>
      </div>
    </motion.div>
  );
}

// ── Ticker for live end-time ───────────────────────────────────────────────────
function useEndTime(remaining: number, active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [active]);
  return active ? new Date(now + remaining * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export function FocusTimerPanel() {
  const {
    activeTask,
    totalSeconds,
    remaining,
    timerState,
    isPanelOpen,
    start,
    pause,
    reset,
    dismiss,
    setDuration,
  } = useTimer();

  const [showCustom, setShowCustom] = useState(false);

  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0;
  const offset = CIRC * (1 - progress);
  const isRunning = timerState === "running";
  const isDone = timerState === "done";
  const isIdle = timerState === "idle";
  const isPaused = timerState === "paused";

  const endTime = useEndTime(remaining, isRunning || isPaused);
  const timeStr = formatTime(remaining);
  const isLong = timeStr.length > 5; // HH:MM:SS

  function handlePreset(seconds: number) {
    setDuration(seconds);
    setShowCustom(false);
  }

  const stateLabel = isRunning ? "Focusing" : isPaused ? "Paused" : "Ready";

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <motion.aside
          key="focus-panel"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-0 top-0 bottom-0 z-40 w-full md:w-[40%] lg:w-[30%] flex flex-col select-none bg-background"
          style={{
            borderLeft: "1px solid hsl(var(--border))",
            boxShadow: "-32px 0 80px -20px rgba(28,25,23,0.08)",
          }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground/50">
              Focus
            </span>
            <button
              onClick={dismiss}
              className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/60 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <AnimatePresence mode="wait">
              {isDone ? (
                /* ── Done ── */
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center gap-8 w-full"
                >
                  {/* Ring — full */}
                  <div className="relative flex items-center justify-center">
                    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden>
                      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} strokeWidth={STROKE} fill="none" className="stroke-border" />
                      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} strokeWidth={STROKE} fill="none" className="stroke-primary" strokeDasharray={CIRC} strokeDashoffset={0} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-primary text-base font-medium tracking-tight">Done</span>
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-foreground font-semibold text-base tracking-tight">Session complete</p>
                    {activeTask && (
                      <p className="text-muted-foreground text-sm leading-snug max-w-[190px] mx-auto line-clamp-2">
                        {activeTask.title}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-1.5 w-full max-w-[200px]">
                    <button
                      onClick={reset}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground transition-all active:scale-[0.98] hover:opacity-90"
                    >
                      Start again
                    </button>
                    <button
                      onClick={() => { reset(); setTimeout(start, 60); }}
                      className="w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all active:scale-[0.98]"
                    >
                      Repeat session
                    </button>
                    <button
                      onClick={dismiss}
                      className="w-full py-2.5 rounded-xl text-sm text-muted-foreground/50 hover:text-muted-foreground transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                      Return to work <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* ── Timer ── */
                <motion.div
                  key="timer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center gap-8 w-full"
                >
                  {/* Task name */}
                  {activeTask && (
                    <p className="text-sm text-muted-foreground text-center max-w-[210px] leading-snug line-clamp-2 tracking-tight">
                      {activeTask.title}
                    </p>
                  )}

                  {/* Ring */}
                  <div className="relative flex items-center justify-center">
                    <svg
                      width={SIZE}
                      height={SIZE}
                      viewBox={`0 0 ${SIZE} ${SIZE}`}
                      className="-rotate-90"
                      aria-hidden
                    >
                      {/* Track */}
                      <circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={R}
                        strokeWidth={STROKE}
                        fill="none"
                        className="stroke-border"
                        strokeLinecap="round"
                      />
                      {/* Progress */}
                      <circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={R}
                        strokeWidth={STROKE}
                        fill="none"
                        className="stroke-primary"
                        strokeDasharray={CIRC}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.9s linear" }}
                      />
                    </svg>

                    {/* Countdown */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                      <span
                        className={cn(
                          "tabular-nums font-light text-foreground tracking-tight leading-none",
                          isLong ? "text-[2.4rem]" : "text-[3.25rem]"
                        )}
                        style={{
                          fontFamily: "var(--font-display)",
                          fontVariantNumeric: "tabular-nums",
                          letterSpacing: "-0.035em",
                        }}
                      >
                        {timeStr}
                      </span>
                      <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground/45">
                        {stateLabel}
                      </span>
                    </div>
                  </div>

                  {/* End time */}
                  {endTime && (
                    <p className="text-xs text-muted-foreground/50 -mt-4 tracking-tight">
                      Ends at {endTime}
                    </p>
                  )}

                  {/* Controls */}
                  <div className="flex items-center gap-6">
                    {/* Reset */}
                    <button
                      onClick={reset}
                      title="Reset"
                      disabled={isIdle}
                      className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted/70 transition-all active:scale-90 disabled:opacity-25"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Play / Pause */}
                    <button
                      onClick={isRunning ? pause : start}
                      title={isRunning ? "Pause" : "Start"}
                      className="w-14 h-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-85 transition-all active:scale-[0.93]"
                    >
                      <AnimatePresence mode="wait">
                        {isRunning ? (
                          <motion.span key="pause" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.1 }}>
                            <Pause className="w-5 h-5" fill="currentColor" strokeWidth={0} />
                          </motion.span>
                        ) : (
                          <motion.span key="play" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.1 }}>
                            <Play className="w-5 h-5 ml-0.5" fill="currentColor" strokeWidth={0} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>

                    {/* Invisible balancer */}
                    <div className="w-10 h-10" />
                  </div>

                  {/* Presets */}
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="flex items-center gap-0.5 flex-wrap justify-center">
                      {PRESETS.map((p) => (
                        <button
                          key={p.seconds}
                          onClick={() => handlePreset(p.seconds)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150",
                            totalSeconds === p.seconds && !showCustom
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowCustom((v) => !v)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150",
                          showCustom
                            ? "text-foreground bg-muted"
                            : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        Custom
                      </button>
                    </div>

                    <AnimatePresence>
                      {showCustom && (
                        <CustomInput
                          onApply={(sec) => { setDuration(sec); setShowCustom(false); }}
                          onCancel={() => setShowCustom(false)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
