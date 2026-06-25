import { useState, useMemo, useEffect, useRef } from "react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Target, X, ChevronRight } from "lucide-react";

import { useAppTasks, useAppCategories, useAppUpdateTask, useAppDeleteTask, useAppReorderTasks } from "@/hooks/use-tasks-api";
import { Header } from "@/components/layout/Header";
import { CategoryList } from "@/components/categories/CategoryList";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskInput } from "@/components/tasks/TaskInput";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { fireConfetti } from "@/components/ui/confetti";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/local-store";
import { useTimer } from "@/context/TimerContext";

export default function Home() {
  const { isPanelOpen } = useTimer();
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const prevCompletedCountRef = useRef(0);

  // Data Fetching — no server-side focus filter anymore, all filtering is client-side
  const { data: tasks = [], isLoading: isLoadingTasks } = useAppTasks({ 
    categoryId: activeCategoryId || undefined
  });
  const { data: categories = [], isLoading: isLoadingCats } = useAppCategories();
  
  // Mutations
  const { mutate: updateTask } = useAppUpdateTask();
  const { mutate: deleteTask } = useAppDeleteTask();
  const { mutate: reorderTasks } = useAppReorderTasks();

  // Sensors for Drag and Drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Derived State
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [tasks]);

  // In focus mode, display only the focused task (if chosen) or all tasks with "pick" buttons
  const visibleTasks = useMemo(() => {
    if (!focusMode || focusedTaskId === null) return sortedTasks;
    return sortedTasks.filter(t => t.id === focusedTaskId);
  }, [focusMode, focusedTaskId, sortedTasks]);

  const focusedTask = useMemo(() => {
    if (focusedTaskId === null) return null;
    return sortedTasks.find(t => t.id === focusedTaskId) ?? null;
  }, [focusedTaskId, sortedTasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, progress };
  }, [tasks]);

  // When focused task gets completed, exit focus (allow picking next or exiting)
  useEffect(() => {
    if (focusedTask && focusedTask.completed) {
      fireConfetti();
      // After 1.5s, return to "pick mode" within focus mode so user can select next task
      const t = setTimeout(() => setFocusedTaskId(null), 1500);
      return () => clearTimeout(t);
    }
  }, [focusedTask?.completed]);

  // Handle Confetti Check (all done)
  useEffect(() => {
    if (stats.total > 0 && stats.completed === stats.total && prevCompletedCountRef.current < stats.total) {
      fireConfetti();
    }
    prevCompletedCountRef.current = stats.completed;
  }, [stats.completed, stats.total]);

  const handleToggleFocusMode = () => {
    if (focusMode) {
      // exiting focus mode — clear focused task too
      setFocusedTaskId(null);
    }
    setFocusMode(!focusMode);
  };

  // Handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedTasks.findIndex((t) => t.id === active.id);
    const newIndex = sortedTasks.findIndex((t) => t.id === over.id);
    
    const newOrder = arrayMove(sortedTasks, oldIndex, newIndex);
    const orderedIds = newOrder.map(t => t.id);
    
    reorderTasks({ data: { orderedIds } });
  };

  const handleToggleTask = (id: number, completed: boolean) => {
    updateTask({ id, data: { completed } });
  };

  const handleDeleteTask = (id: number) => {
    deleteTask({ id });
  };

  if (isLoadingTasks || isLoadingCats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Focus Mode: Pick-a-task screen ───────────────────────────────────────
  if (focusMode && focusedTaskId === null) {
    const incompleteTasks = sortedTasks.filter(t => !t.completed);
    return (
      <div className="min-h-screen pb-8">
        <Header 
          progress={stats.progress} 
          focusMode={focusMode} 
          onToggleFocusMode={handleToggleFocusMode}
        />

        <main className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3"
          >
            <Target className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Choose your focus task</p>
              <p className="text-xs text-muted-foreground">Pick one task to work on. Everything else will be hidden until you're done.</p>
            </div>
          </motion.div>

          {incompleteTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">All done!</h3>
              <p className="text-muted-foreground">No incomplete tasks left. Amazing work!</p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {incompleteTasks.map((task, i) => {
                  const cat = categories.find(c => c.id === task.categoryId);
                  return (
                    <motion.button
                      key={task.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFocusedTaskId(task.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 group">
                        {/* Priority stripe */}
                        <div className={cn(
                          "w-1 h-10 rounded-full shrink-0",
                          task.priority === "urgent" && "bg-red-500",
                          task.priority === "high" && "bg-orange-500",
                          task.priority === "medium" && "bg-amber-400",
                          task.priority === "low" && "bg-green-500",
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{task.title}</p>
                          {cat && (
                            <span className="text-xs text-muted-foreground">{cat.icon} {cat.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold shrink-0">
                          Focus <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ─── Focus Mode: Active focus on selected task ─────────────────────────────
  if (focusMode && focusedTaskId !== null) {
    return (
      <div className="min-h-screen pb-8">
        <Header 
          progress={stats.progress} 
          focusMode={focusMode} 
          onToggleFocusMode={handleToggleFocusMode}
        />

        <main className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Sub-header controls */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground font-medium">
              Focusing on 1 task
            </p>
            <button
              onClick={() => setFocusedTaskId(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
            >
              <X className="w-3.5 h-3.5" />
              Change task
            </button>
          </div>

          {/* The single focused task */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {visibleTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      category={categories.find(c => c.id === task.categoryId)}
                      onToggle={handleToggleTask}
                      onDelete={handleDeleteTask}
                      onEdit={setEditingTask}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>

          {/* Motivational footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-col items-center gap-2 text-center"
          >
            <Target className="w-8 h-8 text-primary/40" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Stay locked in. All other tasks are hidden until this one is done.
            </p>
          </motion.div>
        </main>

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

  // ─── Normal view ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-32">
      <Header 
        progress={stats.progress} 
        focusMode={focusMode} 
        onToggleFocusMode={handleToggleFocusMode} 
      />

      <main className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <CategoryList 
            categories={categories}
            activeId={activeCategoryId}
            onSelect={setActiveCategoryId}
            onCreateNew={() => {}}
          />
        </div>

        {sortedTasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <img 
              src={`${import.meta.env.BASE_URL}images/empty-state.png`}
              alt="No tasks" 
              className="w-48 h-48 object-contain mb-6 opacity-80 mix-blend-multiply dark:mix-blend-screen"
            />
            <h3 className="text-xl font-display font-bold text-foreground mb-2">No tasks yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Add your first task below to get started on your goals.
            </p>
          </motion.div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={sortedTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {sortedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      category={categories.find(c => c.id === task.categoryId)}
                      onToggle={handleToggleTask}
                      onDelete={handleDeleteTask}
                      onEdit={setEditingTask}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {!isPanelOpen && <TaskInput categories={categories} activeCategoryId={activeCategoryId} />}
      
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
