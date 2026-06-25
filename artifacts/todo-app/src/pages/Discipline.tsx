import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  format, subDays, subMonths, startOfDay, startOfMonth,
  eachDayOfInterval, eachMonthOfInterval, isWithinInterval, parseISO,
  differenceInHours, differenceInDays,
} from "date-fns";
import { Flame, Trophy, TrendingUp, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { PageNav } from "@/components/layout/PageNav";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/local-store";

type Range = "week" | "month" | "year";

const RANGE_LABELS: Record<Range, string> = {
  week: "7 Days",
  month: "30 Days",
  year: "12 Months",
};

function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: "Elite Focus", color: "text-violet-500" };
  if (score >= 65) return { label: "Disciplined", color: "text-blue-500" };
  if (score >= 45) return { label: "Consistent", color: "text-green-500" };
  if (score >= 25) return { label: "Building Habits", color: "text-amber-500" };
  return { label: "Getting Started", color: "text-muted-foreground" };
}

function priorityColor(p: string) {
  if (p === "urgent") return "#ef4444";
  if (p === "high") return "#f97316";
  if (p === "medium") return "#f59e0b";
  return "#22c55e";
}

function computeStreak(completions: { completedAt: string }[]): number {
  if (completions.length === 0) return 0;
  const days = new Set(
    completions.map(c => startOfDay(parseISO(c.completedAt)).toDateString())
  );
  let streak = 0;
  let cursor = startOfDay(new Date());
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}
function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-1">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-1", accent ?? "bg-primary/10")}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-0.5">{label}</p>
      <p className="text-primary font-bold">{payload[0].value} completed</p>
    </div>
  );
};

export default function DisciplinePage() {
  const { tasks, completions } = useStore();
  const [range, setRange] = useState<Range>("week");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [taskListOpen, setTaskListOpen] = useState(false);

  const today = new Date();

  const totalCreated = tasks.length;
  const totalCompleted = tasks.filter(t => t.completed).length;
  const completionRate = totalCreated === 0 ? 0 : Math.round((totalCompleted / totalCreated) * 100);

  const streak = useMemo(() => computeStreak(completions), [completions]);

  const recentCompletions = useMemo(() => {
    const cutoff = subDays(today, 7);
    return completions.filter(c => parseISO(c.completedAt) >= cutoff).length;
  }, [completions]);

  const disciplineScore = useMemo(() => {
    const rateScore = completionRate * 0.4;
    const streakScore = Math.min(streak, 14) / 14 * 30;
    const activityScore = Math.min(recentCompletions, 14) / 14 * 30;
    return Math.min(100, Math.round(rateScore + streakScore + activityScore));
  }, [completionRate, streak, recentCompletions]);

  const { label: scoreLbl, color: scoreColor } = scoreLabel(disciplineScore);

  const chartData = useMemo(() => {
    if (range === "week") {
      return eachDayOfInterval({ start: subDays(today, 6), end: today }).map(day => ({
        name: format(day, "EEE"),
        count: completions.filter(c =>
          startOfDay(parseISO(c.completedAt)).toDateString() === startOfDay(day).toDateString()
        ).length,
      }));
    }
    if (range === "month") {
      return eachDayOfInterval({ start: subDays(today, 29), end: today }).map(day => ({
        name: format(day, "MMM d"),
        count: completions.filter(c =>
          startOfDay(parseISO(c.completedAt)).toDateString() === startOfDay(day).toDateString()
        ).length,
      }));
    }
    return eachMonthOfInterval({ start: subMonths(today, 11), end: today }).map(month => ({
      name: format(month, "MMM"),
      count: completions.filter(c =>
        isWithinInterval(parseISO(c.completedAt), {
          start: startOfMonth(month),
          end: startOfMonth(subMonths(month, -1)),
        })
      ).length,
    }));
  }, [range, completions]);

  const maxBar = Math.max(...chartData.map(d => d.count), 1);

  const selectedTask: Task | null = useMemo(() => {
    if (selectedTaskId === null) return null;
    return tasks.find(t => t.id === selectedTaskId) ?? null;
  }, [selectedTaskId, tasks]);

  const taskCompletions = useMemo(() => {
    if (!selectedTaskId) return [];
    return completions.filter(c => c.taskId === selectedTaskId);
  }, [selectedTaskId, completions]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks]);

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="pt-6 pb-2">
          <h1 className="text-2xl font-display font-bold text-foreground">Discipline</h1>
          <p className="text-sm text-muted-foreground">Track your consistency and growth over time.</p>
        </div>
        <PageNav />

        {/* Score Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl p-6 mb-4 flex items-center gap-6"
        >
          <div className="relative flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" strokeWidth="8" className="stroke-muted fill-none" />
              <circle
                cx="40" cy="40" r="34"
                strokeWidth="8"
                fill="none"
                className="stroke-primary transition-all duration-700"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - disciplineScore / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{disciplineScore}</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Discipline Score</p>
            <p className={cn("text-2xl font-bold", scoreColor)}>{scoreLbl}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {completionRate}% completion · {streak} day streak
            </p>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={<Flame className="w-4 h-4 text-orange-500" />}
            accent="bg-orange-500/10"
            label="Day Streak"
            value={streak}
            sub={streak === 1 ? "Keep it up!" : streak > 3 ? "On fire!" : "Stay consistent"}
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
            accent="bg-green-500/10"
            label="Completed"
            value={totalCompleted}
            sub={`of ${totalCreated} tasks`}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
            accent="bg-blue-500/10"
            label="This Week"
            value={recentCompletions}
            sub="tasks completed"
          />
          <StatCard
            icon={<Trophy className="w-4 h-4 text-violet-500" />}
            accent="bg-violet-500/10"
            label="Rate"
            value={`${completionRate}%`}
            sub="completion rate"
          />
        </div>

        {/* Chart */}
        <div className="bg-card border border-border rounded-3xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Completions Over Time</h2>
            <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
              {(Object.keys(RANGE_LABELS) as Range[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                    range === r
                      ? "bg-card text-foreground shadow-sm border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {completions.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center">
              <p className="text-4xl mb-2">📊</p>
              <p className="text-sm text-muted-foreground">Complete tasks to start tracking your discipline.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barSize={range === "month" ? 6 : 20}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={range === "month" ? 4 : 0}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.4)", radius: 6 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.count === maxBar && entry.count > 0
                        ? "hsl(var(--primary))"
                        : entry.count > 0
                          ? "hsl(var(--primary)/0.4)"
                          : "hsl(var(--muted))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Task Breakdown */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden mb-6">
          <button
            onClick={() => setTaskListOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
          >
            <h2 className="font-semibold text-foreground">Task Breakdown</h2>
            {taskListOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          <AnimatePresence initial={false}>
            {taskListOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-border/50"
              >
                {sortedTasks.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">No tasks yet.</div>
                ) : (
                  <div className="divide-y divide-border/40 max-h-72 overflow-y-auto">
                    {sortedTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id === selectedTaskId ? null : task.id)}
                        className={cn(
                          "w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors",
                          selectedTaskId === task.id && "bg-primary/5"
                        )}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: priorityColor(task.priority) }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            task.completed ? "line-through text-muted-foreground" : "text-foreground"
                          )}>
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {task.completed && task.completedAt
                              ? `Completed in ${differenceInDays(parseISO(task.completedAt), parseISO(task.createdAt))} days`
                              : `Pending · ${differenceInDays(today, parseISO(task.createdAt))}d old`
                            }
                          </p>
                        </div>
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
                          task.completed
                            ? "bg-green-500/10 text-green-600"
                            : "bg-amber-500/10 text-amber-600"
                        )}>
                          {task.completed ? "Done" : "Open"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Task Detail */}
        <AnimatePresence>
          {selectedTask && (
            <motion.div
              key={selectedTask.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-card border border-border rounded-3xl p-5 mb-6"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Selected Task</p>
                  <h3 className="font-bold text-foreground text-lg leading-tight">{selectedTask.title}</h3>
                </div>
                <div
                  className="px-3 py-1 rounded-full text-xs font-bold capitalize shrink-0 mt-1"
                  style={{
                    backgroundColor: `${priorityColor(selectedTask.priority)}20`,
                    color: priorityColor(selectedTask.priority),
                  }}
                >
                  {selectedTask.priority}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-2xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-semibold text-foreground">
                    {format(parseISO(selectedTask.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className={cn(
                    "text-sm font-semibold",
                    selectedTask.completed ? "text-green-600" : "text-amber-600"
                  )}>
                    {selectedTask.completed ? "Completed ✓" : "Still Open"}
                  </p>
                </div>
                {selectedTask.completed && selectedTask.completedAt && (
                  <>
                    <div className="bg-muted/30 rounded-2xl p-3">
                      <p className="text-xs text-muted-foreground mb-1">Completed</p>
                      <p className="text-sm font-semibold text-foreground">
                        {format(parseISO(selectedTask.completedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-2xl p-3">
                      <p className="text-xs text-muted-foreground mb-1">Time Taken</p>
                      <p className="text-sm font-semibold text-foreground">
                        {differenceInHours(parseISO(selectedTask.completedAt), parseISO(selectedTask.createdAt)) < 24
                          ? `${differenceInHours(parseISO(selectedTask.completedAt), parseISO(selectedTask.createdAt))}h`
                          : `${differenceInDays(parseISO(selectedTask.completedAt), parseISO(selectedTask.createdAt))}d`
                        }
                      </p>
                    </div>
                  </>
                )}
                {!selectedTask.completed && (
                  <div className="bg-amber-500/10 rounded-2xl p-3 col-span-2">
                    <p className="text-xs text-amber-600 font-semibold">
                      Pending for {differenceInDays(today, parseISO(selectedTask.createdAt))} day(s) — complete it to boost your score!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
