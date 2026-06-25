import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, RotateCcw, CheckCircle2, Timer } from "lucide-react";
import { useTimer } from "@/context/TimerContext";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "5m", seconds: 5 * 60 },
  { label: "10m", seconds: 10 * 60 },
  { label: "15m", seconds: 15 * 60 },
  { label: "25m", seconds: 25 * 60 },
  { label: "30m", seconds: 30 * 60 },
  { label: "45m", seconds: 45 * 60 },
  { label: "60m", seconds: 60 * 60 },
];

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const priorityColors: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#22c55e",
};

const RING_R = 88;
const RING_SIZE = 220;
const RING_STROKE = 10;
const CIRC = 2 * Math.PI * RING_R;

export function FocusTimerPanel() {
  const {
    activeTask, totalSeconds, remaining, timerState,
    sessionsCompleted, isPanelOpen,
    start, pause, reset, dismiss, setDuration,
  } = useTimer();

  const [customMin, setCustomMin] = useState("");

  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0;
  const offset = CIRC * (1 - progress);
  const isDone = timerState === "done";
  const isRunning = timerState === "running";
  const isPaused = timerState === "paused";
  const isIdle = timerState === "idle";

  const handlePreset = (seconds: number) => {
    setDuration(seconds);
    setCustomMin("");
  };

  const handleCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMin, 10);
    if (!isNaN(mins) && mins > 0 && mins <= 999) {
      setDuration(mins * 60);
      setCustomMin("");
    }
  };

  const priorityColor = activeTask ? (priorityColors[activeTask.priority] ?? "#6366f1") : "#6366f1";

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className={cn(
              "fixed right-0 top-0 bottom-0 z-50 flex flex-col",
              "w-full max-w-[320px]",
              // Forced dark glass surface
              "bg-[#0c0c12]/96 border-l border-white/[0.07]",
              "backdrop-blur-2xl shadow-[-24px_0_60px_rgba(0,0,0,0.45)]",
            )}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.03] via-transparent to-white/[0.02] rounded-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/[0.07] flex items-center justify-center">
                  <Timer className="w-3.5 h-3.5 text-white/70" />
                </div>
                <span className="text-sm font-semibold text-white/80 tracking-wide">Focus Timer</span>
              </div>

              <div className="flex items-center gap-2">
                {sessionsCompleted > 0 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-[11px] font-semibold text-white/50">{sessionsCompleted}</span>
                  </div>
                )}
                <button
                  onClick={dismiss}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Ring + Timer */}
            <div className="relative flex flex-col items-center justify-center flex-1 px-6 gap-6">

              {/* Glow orb behind ring */}
              <div
                className="absolute w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none transition-all duration-1000"
                style={{ backgroundColor: isDone ? "#22c55e" : priorityColor }}
              />

              {/* SVG Ring */}
              <div className="relative">
                <svg
                  width={RING_SIZE}
                  height={RING_SIZE}
                  viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                  className="-rotate-90"
                >
                  <defs>
                    <filter id="ring-glow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={isDone ? "#22c55e" : priorityColor} stopOpacity="1" />
                      <stop offset="100%" stopColor={isDone ? "#4ade80" : priorityColor} stopOpacity="0.7" />
                    </linearGradient>
                  </defs>

                  {/* Track */}
                  <circle
                    cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
                    strokeWidth={RING_STROKE}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                  />

                  {/* Tick marks */}
                  {Array.from({ length: 60 }).map((_, i) => {
                    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
                    const inner = RING_R - 14;
                    const outer = RING_R - (i % 5 === 0 ? 8 : 11);
                    const cx = RING_SIZE / 2;
                    const cy = RING_SIZE / 2;
                    return (
                      <line
                        key={i}
                        x1={cx + inner * Math.cos(angle)}
                        y1={cy + inner * Math.sin(angle)}
                        x2={cx + outer * Math.cos(angle)}
                        y2={cy + outer * Math.sin(angle)}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={i % 5 === 0 ? 1.5 : 0.8}
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Progress arc */}
                  <circle
                    cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
                    strokeWidth={RING_STROKE}
                    fill="none"
                    stroke="url(#ring-gradient)"
                    strokeDasharray={CIRC}
                    strokeDashoffset={isDone ? 0 : offset}
                    strokeLinecap="round"
                    filter="url(#ring-glow)"
                    style={{ transition: "stroke-dashoffset 0.95s linear" }}
                  />

                  {/* Dot at progress head */}
                  {!isDone && progress > 0 && (
                    <circle
                      cx={RING_SIZE / 2 + RING_R * Math.cos(-Math.PI / 2 + progress * 2 * Math.PI)}
                      cy={RING_SIZE / 2 + RING_R * Math.sin(-Math.PI / 2 + progress * 2 * Math.PI)}
                      r={5}
                      fill={priorityColor}
                      filter="url(#ring-glow)"
                    />
                  )}
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                  <AnimatePresence mode="wait">
                    {isDone ? (
                      <motion.div
                        key="done"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex flex-col items-center gap-1"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        >
                          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </motion.div>
                        <span className="text-emerald-400 text-sm font-bold tracking-wide">Done!</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="countdown"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center"
                      >
                        <span
                          className={cn(
                            "font-mono font-bold text-white tabular-nums leading-none tracking-tighter",
                            formatTime(remaining).length > 5 ? "text-3xl" : "text-4xl"
                          )}
                        >
                          {formatTime(remaining)}
                        </span>
                        <span className="text-white/25 text-[10px] font-medium uppercase tracking-widest mt-2">
                          {isRunning ? "focusing" : isPaused ? "paused" : "ready"}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Task name */}
              {activeTask && (
                <div className="flex flex-col items-center gap-1 px-4 text-center">
                  <p className="text-white/80 font-semibold text-sm leading-snug line-clamp-2 max-w-[220px]">
                    {activeTask.title}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: priorityColor }}
                    />
                    <span className="text-white/30 text-[11px] font-medium capitalize">
                      {activeTask.priority} priority
                    </span>
                    {sessionsCompleted > 0 && (
                      <>
                        <span className="text-white/15">·</span>
                        <span className="text-white/30 text-[11px]">
                          {sessionsCompleted} session{sessionsCompleted !== 1 ? "s" : ""} done
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Reset */}
                <button
                  onClick={reset}
                  disabled={isIdle}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200",
                    "bg-white/[0.06] border border-white/[0.08]",
                    isIdle
                      ? "opacity-25 cursor-not-allowed"
                      : "hover:bg-white/[0.12] hover:border-white/[0.15] text-white/60 hover:text-white/90"
                  )}
                >
                  <RotateCcw className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                </button>

                {/* Play / Pause — main CTA */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isDone ? reset : isRunning ? pause : start}
                  disabled={isDone && false}
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg",
                    isDone
                      ? "bg-emerald-500 shadow-emerald-500/30"
                      : "shadow-[0_0_24px_rgba(0,0,0,0.5)]",
                  )}
                  style={!isDone ? {
                    backgroundColor: priorityColor,
                    boxShadow: `0 0 32px ${priorityColor}50, 0 4px 16px rgba(0,0,0,0.4)`,
                  } : undefined}
                >
                  <AnimatePresence mode="wait">
                    {isRunning ? (
                      <motion.div key="pause" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
                        <Pause className="w-6 h-6 text-white" fill="white" />
                      </motion.div>
                    ) : isDone ? (
                      <motion.div key="retry" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
                        <RotateCcw className="w-6 h-6 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div key="play" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
                        <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Spacer to balance layout */}
                <div className="w-11 h-11" />
              </div>
            </div>

            {/* Presets footer */}
            <div className="relative px-5 pb-6 pt-4 border-t border-white/[0.06] space-y-3">
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Duration</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map(p => (
                  <button
                    key={p.seconds}
                    onClick={() => handlePreset(p.seconds)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
                      totalSeconds === p.seconds
                        ? "bg-white/[0.15] text-white border border-white/20"
                        : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/70"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCustom} className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={customMin}
                  onChange={e => setCustomMin(e.target.value)}
                  placeholder="Custom min"
                  className={cn(
                    "flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2",
                    "text-xs text-white placeholder:text-white/25 outline-none",
                    "focus:border-white/20 focus:bg-white/[0.07] transition-all"
                  )}
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] rounded-lg text-xs font-semibold text-white/70 hover:text-white transition-all"
                >
                  Set
                </button>
              </form>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
