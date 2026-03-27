import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  addMonths,
  subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const goToPrev = () => setViewDate(subMonths(viewDate, 1));
  const goToNext = () => setViewDate(addMonths(viewDate, 1));
  const goToToday = () => setViewDate(new Date());

  const isCurrentMonth = isSameMonth(viewDate, today);

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur pb-4 pt-6 px-4 md:px-8 mb-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Calendar</h1>
            <p className="text-muted-foreground font-medium">{format(today, "EEEE, MMMM do")}</p>
          </div>
          {!isCurrentMonth && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={goToToday}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Today
            </motion.button>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPrev}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <AnimatePresence mode="wait">
            <motion.h2
              key={format(viewDate, "yyyy-MM")}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="text-xl font-display font-bold text-foreground"
            >
              {format(viewDate, "MMMM yyyy")}
            </motion.h2>
          </AnimatePresence>

          <button
            onClick={goToNext}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={format(viewDate, "yyyy-MM")}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-7 gap-1"
          >
            {allDays.map((day) => {
              const inMonth = isSameMonth(day, viewDate);
              const isThisToday = isToday(day);
              const isPast = isBefore(day, today) && !isThisToday;
              const isFuture = !isThisToday && !isPast;
              const isChecked = isThisToday || isPast;

              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: inMonth ? 1 : 0.25, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "relative flex flex-col items-center justify-center aspect-square rounded-2xl transition-colors",
                    isThisToday && "bg-primary",
                    !isThisToday && isPast && inMonth && "bg-muted/40 hover:bg-muted/60 cursor-default",
                    !isThisToday && isFuture && inMonth && "hover:bg-muted/30 cursor-default",
                    !inMonth && "pointer-events-none"
                  )}
                >
                  {/* Day number */}
                  <span
                    className={cn(
                      "text-sm font-semibold leading-none mb-1 transition-colors",
                      isThisToday && "text-primary-foreground",
                      !isThisToday && isPast && inMonth && "text-muted-foreground",
                      !isThisToday && isFuture && inMonth && "text-foreground",
                      !inMonth && "text-muted-foreground/30"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Tick indicator */}
                  {inMonth && isChecked && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: isPast ? Math.random() * 0.3 : 0,
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      className={cn(
                        "flex items-center justify-center w-4 h-4 rounded-full",
                        isThisToday
                          ? "bg-primary-foreground/20"
                          : "bg-primary/15"
                      )}
                    >
                      <Check
                        className={cn(
                          "w-2.5 h-2.5",
                          isThisToday ? "text-primary-foreground" : "text-primary"
                        )}
                        strokeWidth={3}
                      />
                    </motion.div>
                  )}

                  {/* Future placeholder dot */}
                  {inMonth && isFuture && (
                    <div className="w-1 h-1 rounded-full bg-border" />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
            </div>
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-muted/60 flex items-center justify-center">
              <Check className="w-3 h-3 text-primary" strokeWidth={3} />
            </div>
            <span className="text-xs text-muted-foreground">Past day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg border border-border flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-border" />
            </div>
            <span className="text-xs text-muted-foreground">Upcoming</span>
          </div>
        </div>

        {/* Month summary */}
        <MonthlySummary viewDate={viewDate} today={today} />
      </main>
    </div>
  );
}

function MonthlySummary({ viewDate, today }: { viewDate: Date; today: Date }) {
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const allMonthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const totalDays = allMonthDays.length;
  const passedDays = allMonthDays.filter(
    (d) => isToday(d) || isBefore(d, today)
  ).length;
  const percent = Math.round((passedDays / totalDays) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-6 p-4 rounded-2xl bg-card border border-card-border"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">
          {format(viewDate, "MMMM")} Progress
        </span>
        <span className="text-sm font-bold text-primary">{percent}%</span>
      </div>

      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className="h-full rounded-full bg-primary"
        />
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-xs text-muted-foreground">{passedDays} days passed</span>
        <span className="text-xs text-muted-foreground">{totalDays - passedDays} remaining</span>
      </div>
    </motion.div>
  );
}
