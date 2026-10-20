import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarRange, CheckCircle2, Sparkles } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskInput } from "@/components/tasks/TaskInput";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { useStore } from "@/context/StoreContext";
import type { Task } from "@/lib/local-store";

const DAYS = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

export default function WeeklyPlan() {
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(today);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { tasks, categories, updateTask, deleteTask } = useStore();

  const plannedTasks = useMemo(
    () => tasks
      .filter(task => task.dayOfWeek === selectedDay)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    [selectedDay, tasks],
  );

  const completedCount = plannedTasks.filter(task => task.completed).length;
  const selectedDayLabel = DAYS.find(day => day.value === selectedDay)?.label ?? "day";

  return (
    <div className="min-h-screen pb-32">
      <Header
        title="Weekly Plan"
        progress={plannedTasks.length ? Math.round((completedCount / plannedTasks.length) * 100) : 0}
        focusMode={false}
        onToggleFocusMode={() => {}}
      />

      <main className="max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7"
        >
          <div className="flex items-start gap-3 mb-5">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-primary/10 text-primary shrink-0">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">Plan your week</h2>

            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {DAYS.map(day => {
              const count = tasks.filter(task => task.dayOfWeek === day.value).length;
              const isSelected = selectedDay === day.value;
              const isToday = today === day.value;

              return (
                <button
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className={[
                    "relative rounded-2xl px-2 py-3 text-center transition-all duration-200",
                    isSelected
                      ? "bg-foreground text-background shadow-md"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")}
                >
                  <span className="block text-xs font-semibold">{day.short}</span>
                  <span className={[
                    "block text-[10px] mt-1",
                    isSelected ? "text-background/70" : "text-muted-foreground/70",
                  ].join(" ")}>
                    {count} {count === 1 ? "task" : "tasks"}
                  </span>
                  {isToday && (
                    <span className={[
                      "absolute top-1 right-1 w-1.5 h-1.5 rounded-full",
                      isSelected ? "bg-background" : "bg-primary",
                    ].join(" ")} />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {selectedDayLabel}
            </p>
            <h3 className="text-2xl font-display font-bold text-foreground">
              {plannedTasks.length ? `${plannedTasks.length} planned ${plannedTasks.length === 1 ? "task" : "tasks"}` : "Nothing planned yet"}
            </h3>
          </div>
          {plannedTasks.length > 0 && completedCount === plannedTasks.length && (
            <CheckCircle2 className="w-6 h-6 text-primary" />
          )}
        </div>

        {plannedTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-sm"
          >
            <Sparkles className="w-7 h-7 mx-auto text-primary/60 mb-4" />
            <p className="font-semibold text-foreground">A clear day starts here</p>

          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {plannedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  category={categories.find(category => category.id === task.categoryId)}
                  onToggle={(id, completed) => updateTask(id, { completed })}
                  onDelete={id => deleteTask(id)}
                  onEdit={setEditingTask}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <TaskInput
        categories={categories}
        activeCategoryId={null}
        dayOfWeek={selectedDay}
        placeholder={`Add a ${selectedDayLabel} task...`}
      />

      <AnimatePresence>
        {editingTask && (
          <EditTaskDialog
            isOpen={!!editingTask}
            task={editingTask}
            categories={categories}
            onClose={() => setEditingTask(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}