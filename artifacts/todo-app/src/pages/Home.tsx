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
import { Loader2 } from "lucide-react";

import { useAppTasks, useAppCategories, useAppUpdateTask, useAppDeleteTask, useAppReorderTasks } from "@/hooks/use-tasks-api";
import { Header } from "@/components/layout/Header";
import { CategoryList } from "@/components/categories/CategoryList";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskInput } from "@/components/tasks/TaskInput";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { fireConfetti } from "@/components/ui/confetti";
import type { Task } from "@workspace/api-client-react";

export default function Home() {
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const prevCompletedCountRef = useRef(0);

  // Data Fetching
  const { data: tasks = [], isLoading: isLoadingTasks } = useAppTasks({ 
    focusMode: focusMode ? true : undefined,
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

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, progress };
  }, [tasks]);

  // Handle Confetti Check
  useEffect(() => {
    if (stats.total > 0 && stats.completed === stats.total && prevCompletedCountRef.current < stats.total) {
      fireConfetti();
    }
    prevCompletedCountRef.current = stats.completed;
  }, [stats.completed, stats.total]);

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

  return (
    <div className="min-h-screen pb-32">
      <Header 
        progress={stats.progress} 
        focusMode={focusMode} 
        onToggleFocusMode={() => setFocusMode(!focusMode)} 
      />

      <main className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <CategoryList 
            categories={categories}
            activeId={activeCategoryId}
            onSelect={setActiveCategoryId}
            onCreateNew={() => {/* Simple MVP: not fully implemented creation modal yet to save space, assuming seeded data */}}
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
              {focusMode 
                ? "You're all clear for today! Enjoy your free time or turn off focus mode." 
                : "Add your first task below to get started on your goals."}
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

      <TaskInput categories={categories} activeCategoryId={activeCategoryId} />
      
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
