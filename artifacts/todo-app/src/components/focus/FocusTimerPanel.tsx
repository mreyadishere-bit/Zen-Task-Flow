import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, RotateCcw, X, Timer } from "lucide-react";
import { useTimer } from "@/context/TimerContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "5m", seconds: 300 },
  { label: "15m", seconds: 900 },
  { label: "25m", seconds: 1500 },
  { label: "45m", seconds: 2700 },
  { label: "60m", seconds: 3600 },
];

const R = 90;
const STROKE = 5;
const SIZE = 220;
const CIRC = 2 * Math.PI * R;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${pad(h)}:${pad(m)}:${pad(sec)}`
    : `${pad(m)}:${pad(sec)}`;
}

export function FocusTimerPanel() {
  const {
    activeTask, totalSeconds, remaining, timerState,
    isPanelOpen, start, pause, reset, dismiss, setDuration,
  } = useTimer();

  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0;
  const offset = CIRC * (1 - progress);
  const isRunning = timerState === "running";
  const isDone = timerState === "done";
  const isIdle = timerState === "idle";

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "fixed right-0 top-0 bottom-0 z-40",
            "w-full md:w-[40%] lg:w-1/2",
            "bg-card border-l border-border",
            "flex flex-col items-center justify-center",
          )}
        >
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-5 right-5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Center stack */}
          <div className="flex flex-col items-center gap-10 px-8 w-full max-w-sm">

            {/* Ring */}
            <div className="relative flex items-center justify-center">
              <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="-rotate-90"
              >
                {/* Track */}
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  strokeWidth={STROKE}
                  fill="none"
                  stroke="hsl(var(--muted))"
                />
                {/* Progress */}
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  strokeWidth={STROKE}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeDasharray={CIRC}
                  strokeDashoffset={isDone ? 0 : offset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.9s linear" }}
                />
              </svg>

              {/* Countdown */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  {isDone ? (
                    <motion.span
                      key="done"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-primary text-2xl font-semibold"
                    >
                      Done
                    </motion.span>
                  ) : (
                    <motion.span
                      key="time"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "font-mono font-light tabular-nums text-foreground leading-none tracking-tight",
                        formatTime(remaining).length > 5 ? "text-4xl" : "text-5xl"
                      )}
                    >
                      {formatTime(remaining)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Task name */}
            {activeTask && (
              <p className="text-muted-foreground text-sm font-medium text-center leading-relaxed max-w-[240px] line-clamp-2">
                {activeTask.title}
              </p>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={reset}
                disabled={isIdle}
                className="rounded-xl"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <Button
                size="icon"
                onClick={isDone ? reset : isRunning ? pause : start}
                className="w-14 h-14 rounded-2xl text-base"
                title={isRunning ? "Pause" : "Start"}
              >
                <AnimatePresence mode="wait">
                  {isRunning ? (
                    <motion.span key="pause" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}>
                      <Pause className="w-5 h-5" fill="currentColor" />
                    </motion.span>
                  ) : (
                    <motion.span key="play" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}>
                      <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>

              {/* Spacer to balance */}
              <div className="w-11 h-11" />
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {PRESETS.map(p => (
                <button
                  key={p.seconds}
                  onClick={() => setDuration(p.seconds)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                    totalSeconds === p.seconds
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subtle bottom label */}
          <div className="absolute bottom-6 flex items-center gap-1.5 text-muted-foreground/40">
            <Timer className="w-3 h-3" />
            <span className="text-[11px] font-medium tracking-wide">Focus Session</span>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
