import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, RotateCcw, X, CheckCircle2, RefreshCw, ArrowRight } from "lucide-react";
import { useTimer } from "@/context/TimerContext";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "15m", seconds: 900 },
  { label: "25m", seconds: 1500 },
  { label: "45m", seconds: 2700 },
  { label: "60m", seconds: 3600 },
  { label: "90m", seconds: 5400 },
];

const R = 106;
const STROKE = 2.5;
const SIZE = 264;
const CIRC = 2 * Math.PI * R;
const FILTER_ID = "ring-glow";

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

function IconBtn({
  onClick,
  title,
  disabled,
  children,
  large,
}: {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
  large?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-150",
        "text-muted-foreground hover:text-foreground",
        "hover:bg-foreground/6 active:scale-95",
        "disabled:opacity-25 disabled:pointer-events-none",
        large
          ? "w-14 h-14 text-foreground bg-foreground/8 hover:bg-foreground/14"
          : "w-10 h-10"
      )}
    >
      {children}
    </button>
  );
}

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

  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0;
  const offset = CIRC * (1 - progress);
  const isRunning = timerState === "running";
  const isDone = timerState === "done";
  const isIdle = timerState === "idle";
  const timeStr = formatTime(remaining);
  const isLong = timeStr.length > 5;

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <motion.aside
          key="focus-panel"
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "fixed right-0 top-0 bottom-0 z-40",
            "w-full md:w-[40%] lg:w-[30%]",
            "bg-card",
            "flex flex-col items-center justify-center select-none",
          )}
          style={{
            boxShadow: "-40px 0 80px -20px rgba(0,0,0,0.13), -1px 0 0 0 hsl(var(--border))",
          }}
        >
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground hover:bg-foreground/6 transition-all duration-150"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence mode="wait">
            {isDone ? (
              /* ── Completion state ── */
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-8 px-8 w-full"
              >
                {/* Icon */}
                <div className="relative">
                  <div className="absolute inset-0 scale-[2.5] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.08)_0%,transparent_70%)] pointer-events-none" />
                  <div className="relative w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-foreground/70" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Message */}
                <div className="text-center space-y-1.5">
                  <p className="text-foreground font-medium text-base tracking-tight">
                    Session complete
                  </p>
                  {activeTask && (
                    <p className="text-muted-foreground/60 text-sm leading-relaxed max-w-[200px] line-clamp-2">
                      {activeTask.title}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
                  <button
                    onClick={reset}
                    className="w-full py-2.5 rounded-xl text-sm font-medium bg-foreground text-background hover:opacity-90 active:scale-[0.98] transition-all duration-150"
                  >
                    Start again
                  </button>
                  <button
                    onClick={() => { reset(); start(); }}
                    className="w-full py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/6 active:scale-[0.98] transition-all duration-150"
                  >
                    Repeat session
                  </button>
                  <button
                    onClick={dismiss}
                    className="w-full py-2.5 rounded-xl text-sm font-medium text-muted-foreground/50 hover:text-muted-foreground hover:bg-foreground/6 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-1.5"
                  >
                    Return to work <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ── Active / Idle timer ── */
              <motion.div
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-9 px-6 w-full"
              >
                {/* Ring */}
                <div className="relative flex items-center justify-center">
                  {/* Radial spotlight */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      width: SIZE * 2,
                      height: SIZE * 2,
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                      background: "radial-gradient(circle, hsl(var(--primary)/0.06) 0%, transparent 60%)",
                    }}
                  />

                  <svg
                    width={SIZE}
                    height={SIZE}
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                    className="-rotate-90"
                    aria-hidden
                  >
                    <defs>
                      <filter id={FILTER_ID} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Track */}
                    <circle
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={R}
                      strokeWidth={STROKE}
                      fill="none"
                      stroke="hsl(var(--border))"
                    />

                    {/* Progress */}
                    <circle
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={R}
                      strokeWidth={STROKE}
                      fill="none"
                      stroke="hsl(var(--foreground))"
                      strokeDasharray={CIRC}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      filter={`url(#${FILTER_ID})`}
                      style={{ transition: "stroke-dashoffset 0.95s linear" }}
                    />
                  </svg>

                  {/* Countdown */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <span
                      className={cn(
                        "tabular-nums leading-none tracking-[-0.04em] text-foreground font-light",
                        isLong ? "text-[2.6rem]" : "text-[3.25rem]"
                      )}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {timeStr}
                    </span>
                    <span className="text-[11px] text-muted-foreground/40 font-medium tracking-widest uppercase">
                      {isRunning ? "focusing" : isIdle ? "ready" : "paused"}
                    </span>
                  </div>
                </div>

                {/* Task name */}
                {activeTask && (
                  <div className="text-center space-y-1">
                    <p className="text-foreground/80 text-sm font-medium leading-snug max-w-[200px] line-clamp-2">
                      {activeTask.title}
                    </p>
                  </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-5">
                  <IconBtn
                    onClick={reset}
                    title="Reset"
                    disabled={isIdle}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </IconBtn>

                  <IconBtn
                    onClick={isRunning ? pause : start}
                    title={isRunning ? "Pause" : "Start"}
                    large
                  >
                    <AnimatePresence mode="wait">
                      {isRunning ? (
                        <motion.span
                          key="pause"
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.6, opacity: 0 }}
                          transition={{ duration: 0.12 }}
                        >
                          <Pause className="w-5 h-5" fill="currentColor" strokeWidth={0} />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="play"
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.6, opacity: 0 }}
                          transition={{ duration: 0.12 }}
                        >
                          <Play className="w-5 h-5 ml-0.5" fill="currentColor" strokeWidth={0} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </IconBtn>

                  <IconBtn
                    onClick={dismiss}
                    title="End session"
                  >
                    <X className="w-4 h-4" />
                  </IconBtn>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.seconds}
                      onClick={() => setDuration(p.seconds)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150",
                        totalSeconds === p.seconds
                          ? "text-foreground bg-foreground/10"
                          : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-foreground/5"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
