import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import type { Task } from "@/lib/local-store";

export type TimerState = "idle" | "running" | "paused" | "done";

interface TimerContextValue {
  activeTask: Task | null;
  totalSeconds: number;
  remaining: number;
  timerState: TimerState;
  sessionsCompleted: number;
  isPanelOpen: boolean;
  openTimer: (task: Task, seconds?: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  dismiss: () => void;
  setDuration: (seconds: number) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

const DEFAULT_DURATION = 25 * 60;

function playDoneSound() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
      osc.connect(gain);
      gain.gain.setValueAtTime(0.35, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.5);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.5);
    });
    setTimeout(() => ctx.close(), 2500);
  } catch {}
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_DURATION);
  const [remaining, setRemaining] = useState(DEFAULT_DURATION);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const openTimer = useCallback((task: Task, seconds?: number) => {
    clearTimer();
    setActiveTask(task);
    const dur = seconds ?? DEFAULT_DURATION;
    setTotalSeconds(dur);
    setRemaining(dur);
    setTimerState("idle");
    setIsPanelOpen(true);
  }, [clearTimer]);

  const start = useCallback(() => {
    setTimerState("running");
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearTimer();
          setTimerState("done");
          setSessionsCompleted(s => s + 1);
          playDoneSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setTimerState("paused");
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setRemaining(totalSeconds);
    setTimerState("idle");
  }, [clearTimer, totalSeconds]);

  const dismiss = useCallback(() => {
    clearTimer();
    setActiveTask(null);
    setRemaining(DEFAULT_DURATION);
    setTotalSeconds(DEFAULT_DURATION);
    setTimerState("idle");
    setIsPanelOpen(false);
  }, [clearTimer]);

  const setDuration = useCallback((seconds: number) => {
    clearTimer();
    setTotalSeconds(seconds);
    setRemaining(seconds);
    setTimerState("idle");
  }, [clearTimer]);

  return (
    <TimerContext.Provider value={{
      activeTask, totalSeconds, remaining, timerState,
      sessionsCompleted, isPanelOpen,
      openTimer, start, pause, reset, dismiss, setDuration,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}
