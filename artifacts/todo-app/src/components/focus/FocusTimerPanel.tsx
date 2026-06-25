import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, RotateCcw, X, Bell, CheckCircle2, ArrowRight } from "lucide-react";
import { useTimer } from "@/context/TimerContext";
import { cn } from "@/lib/utils";

// ── Design tokens (forced dark panel, sky-blue ring matching reference) ──────
const RING_BLUE = "#3B9EFF";
const RING_TRACK = "rgba(255,255,255,0.09)";
const PANEL_BG = "#1c1917";   // warm charcoal matching app dark surface
const TEXT_PRIMARY = "#f5f0eb";
const TEXT_MUTED = "rgba(245,240,235,0.42)";
const TEXT_FAINT = "rgba(245,240,235,0.22)";

// ── Ring geometry ─────────────────────────────────────────────────────────────
const SIZE = 284;
const R = 120;
const STROKE = 13;
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

// Always HH:MM:SS
function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

function formatEndTime(remainingSeconds: number) {
  const end = new Date(Date.now() + remainingSeconds * 1000);
  return end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Custom timer inline editor ─────────────────────────────────────────────────
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

  function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, isNaN(v) ? min : v));
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden w-full"
    >
      <div className="flex flex-col items-center gap-3 pt-1 pb-1">
        {/* H : M : S inputs */}
        <div className="flex items-center gap-2">
          {[
            { label: "h", value: h, max: 23, set: (v: number) => setH(clamp(v, 0, 23)) },
            { label: "m", value: m, max: 59, set: (v: number) => setM(clamp(v, 0, 59)) },
            { label: "s", value: s, max: 59, set: (v: number) => setS(clamp(v, 0, 59)) },
          ].map(({ label, value, max, set }, i) => (
            <div key={label} className="flex items-center gap-1.5">
              {i > 0 && (
                <span style={{ color: TEXT_FAINT }} className="text-lg font-light">:</span>
              )}
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => set(value + 1 > max ? 0 : value + 1)}
                  style={{ color: TEXT_MUTED }}
                  className="w-7 h-5 flex items-center justify-center text-xs hover:opacity-80 transition-opacity"
                >
                  ▲
                </button>
                <input
                  type="number"
                  min={0}
                  max={max}
                  value={pad(value)}
                  onChange={(e) => set(parseInt(e.target.value))}
                  className="w-10 h-9 text-center rounded-lg text-base font-mono font-semibold tabular-nums outline-none"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: TEXT_PRIMARY,
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontVariantNumeric: "tabular-nums",
                    MozAppearance: "textfield",
                  }}
                />
                <button
                  onClick={() => set(value - 1 < 0 ? max : value - 1)}
                  style={{ color: TEXT_MUTED }}
                  className="w-7 h-5 flex items-center justify-center text-xs hover:opacity-80 transition-opacity"
                >
                  ▼
                </button>
                <span style={{ color: TEXT_FAINT }} className="text-[10px] uppercase tracking-wider mt-0.5">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 mt-0.5">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: TEXT_MUTED }}
          >
            Cancel
          </button>
          <button
            onClick={() => total > 0 && onApply(total)}
            disabled={total === 0}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-30"
            style={{
              background: RING_BLUE,
              color: "#fff",
            }}
          >
            Set timer
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
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

  const endTimeStr = useMemo(
    () => (!isIdle && !isDone ? formatEndTime(remaining) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.floor(remaining / 60), isIdle, isDone]
  );

  function handlePreset(seconds: number) {
    setDuration(seconds);
    setShowCustom(false);
  }

  function handleCustomApply(seconds: number) {
    setDuration(seconds);
    setShowCustom(false);
  }

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <motion.aside
          key="focus-panel"
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-0 top-0 bottom-0 z-40 w-full md:w-[40%] lg:w-[30%] flex flex-col items-center justify-center select-none"
          style={{
            background: PANEL_BG,
            boxShadow: "-48px 0 96px -24px rgba(0,0,0,0.5), -1px 0 0 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Close */}
          <button
            onClick={dismiss}
            title="End session"
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 hover:opacity-70 active:scale-95"
            style={{ color: TEXT_MUTED }}
          >
            <X className="w-4 h-4" />
          </button>

          <AnimatePresence mode="wait">
            {isDone ? (
              /* ── Completion ── */
              (<motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-7 px-8 w-full"
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: `${RING_BLUE}18` }}
                >
                  <CheckCircle2 className="w-9 h-9" style={{ color: RING_BLUE }} strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>
                    Session complete
                  </p>
                  {activeTask && (
                    <p className="text-sm mt-1 leading-relaxed max-w-[200px] mx-auto line-clamp-2" style={{ color: TEXT_MUTED }}>
                      {activeTask.title}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
                  <button
                    onClick={reset}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                    style={{ background: RING_BLUE, color: "#fff" }}
                  >
                    Start again
                  </button>
                  <button
                    onClick={() => { reset(); setTimeout(start, 50); }}
                    className="w-full py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:opacity-70"
                    style={{ color: TEXT_MUTED }}
                  >
                    Repeat session
                  </button>
                  <button
                    onClick={dismiss}
                    className="w-full py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:opacity-70 flex items-center justify-center gap-1.5"
                    style={{ color: TEXT_FAINT }}
                  >
                    Return to work <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>)
            ) : (
              /* ── Active timer ── */
              (<motion.div
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-7 px-4 w-full"
              >
                {/* Task label */}
                {activeTask && (
                  <p
                    className="text-sm font-medium text-center max-w-[220px] line-clamp-1 tracking-tight"
                    style={{ color: TEXT_MUTED }}
                  >
                    {activeTask.title}
                  </p>
                )}
                {/* Ring + countdown */}
                <div className="relative flex items-center justify-center">
                  {/* Ambient glow behind ring */}
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: SIZE * 1.5,
                      height: SIZE * 1.5,
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                      background: `radial-gradient(circle, ${RING_BLUE}14 0%, transparent 60%)`,
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
                      <filter id="blur-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
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
                      stroke={RING_TRACK}
                      strokeLinecap="round"
                    />

                    {/* Progress */}
                    <circle
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={R}
                      strokeWidth={STROKE}
                      fill="none"
                      stroke={RING_BLUE}
                      strokeDasharray={CIRC}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      filter="url(#blur-glow)"
                      style={{ transition: "stroke-dashoffset 0.95s linear" }}
                    />
                  </svg>

                  {/* Center content */}
                  <div className="absolute inset-0 flex gap-3 justify-center items-center flex-col">
                    {/* Countdown */}
                    <span
                      className="tabular-nums font-bold tracking-tight text-[35px] text-center"
                      style={{
                        color: TEXT_PRIMARY,
                        fontSize: "2.75rem",
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {formatTime(remaining)}
                    </span>

                    {/* End time pill */}
                    {endTimeStr && (
                      <div
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          color: TEXT_MUTED,
                          fontSize: "0.75rem",
                          fontWeight: 500,
                        }}
                      >
                        <Bell className="w-3 h-3" />
                        <span>{endTimeStr}</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Controls */}
                <div className="flex items-center gap-5">
                  {/* Reset */}
                  <button
                    onClick={reset}
                    title="Reset"
                    disabled={isIdle}
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-20"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    <RotateCcw className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
                  </button>

                  {/* Play / Pause */}
                  <button
                    onClick={isRunning ? pause : start}
                    title={isRunning ? "Pause" : "Start"}
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 hover:opacity-90 bg-[#ffffff1a] opacity-[1] text-[#f7f5f3]"
                  >
                    <AnimatePresence mode="wait">
                      {isRunning ? (
                        <motion.span
                          key="pause"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.12 }}
                        >
                          <Pause className="w-6 h-6 text-white" fill="white" strokeWidth={0} />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="play"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.12 }}
                        >
                          <Play className="w-6 h-6 text-white ml-0.5" fill="white" strokeWidth={0} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* Spacer to visually balance */}
                  <div className="w-14 h-14" />
                </div>
                {/* Preset chips + Custom */}
                <div className="flex flex-col items-center gap-3 w-full px-4">
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {PRESETS.map((p) => (
                      <button
                        key={p.seconds}
                        onClick={() => handlePreset(p.seconds)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150"
                        style={
                          totalSeconds === p.seconds && !showCustom
                            ? { background: `${RING_BLUE}28`, color: RING_BLUE }
                            : { color: TEXT_FAINT, background: "transparent" }
                        }
                      >
                        {p.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowCustom((v) => !v)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150"
                      style={
                        showCustom
                          ? { background: `${RING_BLUE}28`, color: RING_BLUE }
                          : { color: TEXT_FAINT, background: "transparent" }
                      }
                    >
                      Custom
                    </button>
                  </div>

                  {/* Custom input */}
                  <AnimatePresence>
                    {showCustom && (
                      <CustomInput
                        onApply={handleCustomApply}
                        onCancel={() => setShowCustom(false)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>)
            )}
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
