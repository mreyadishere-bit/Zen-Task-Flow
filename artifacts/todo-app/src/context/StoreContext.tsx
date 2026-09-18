import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { store, type Task, type Category, type Priority, type CompletionEvent } from "@/lib/local-store";

interface StoreContextValue {
  tasks: Task[];
  categories: Category[];
  completions: CompletionEvent[];
  refreshTasks: () => void;
  refreshCategories: () => void;
  createTask: (data: { title: string; priority?: Priority; categoryId?: number | null; description?: string | null; dueDate?: string | null; dayOfWeek?: number | null }, callbacks?: { onSuccess?: () => void }) => void;
  updateTask: (id: number, data: Partial<Omit<Task, "id">>, callbacks?: { onSuccess?: () => void }) => void;
  deleteTask: (id: number, callbacks?: { onSuccess?: () => void }) => void;
  reorderTasks: (orderedIds: number[], callbacks?: { onSuccess?: () => void }) => void;
  clearOneTimeTasks: (callbacks?: { onSuccess?: () => void }) => void;
  createCategory: (data: { name: string; color: string; icon?: string | null }, callbacks?: { onSuccess?: () => void }) => void;
  deleteCategory: (id: number, callbacks?: { onSuccess?: () => void }) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => store.getTasks());
  const [categories, setCategories] = useState<Category[]>(() => store.getCategories());
  const [completions, setCompletions] = useState<CompletionEvent[]>(() => store.getCompletions());

  const refreshTasks = useCallback(() => {
    setTasks(store.getTasks());
  }, []);

  const refreshCategories = useCallback(() => {
    setCategories(store.getCategories());
  }, []);

  const createTask = useCallback((
    data: { title: string; priority?: Priority; categoryId?: number | null; description?: string | null; dueDate?: string | null; dayOfWeek?: number | null },
    callbacks?: { onSuccess?: () => void }
  ) => {
    store.createTask(data);
    setTasks(store.getTasks());
    callbacks?.onSuccess?.();
  }, []);

  const updateTask = useCallback((
    id: number,
    data: Partial<Omit<Task, "id">>,
    callbacks?: { onSuccess?: () => void }
  ) => {
    store.updateTask(id, data);
    setTasks(store.getTasks());
    setCompletions(store.getCompletions());
    callbacks?.onSuccess?.();
  }, []);

  const deleteTask = useCallback((id: number, callbacks?: { onSuccess?: () => void }) => {
    store.deleteTask(id);
    setTasks(store.getTasks());
    callbacks?.onSuccess?.();
  }, []);

  const reorderTasks = useCallback((orderedIds: number[], callbacks?: { onSuccess?: () => void }) => {
    store.reorderTasks(orderedIds);
    setTasks(store.getTasks());
    callbacks?.onSuccess?.();
  }, []);

  const clearOneTimeTasks = useCallback((callbacks?: { onSuccess?: () => void }) => {
    store.clearOneTimeTasks();
    setTasks(store.getTasks());
    callbacks?.onSuccess?.();
  }, []);

  const createCategory = useCallback((
    data: { name: string; color: string; icon?: string | null },
    callbacks?: { onSuccess?: () => void }
  ) => {
    store.createCategory(data);
    setCategories(store.getCategories());
    callbacks?.onSuccess?.();
  }, []);

  const deleteCategory = useCallback((id: number, callbacks?: { onSuccess?: () => void }) => {
    store.deleteCategory(id);
    setCategories(store.getCategories());
    setTasks(store.getTasks());
    callbacks?.onSuccess?.();
  }, []);

  return (
    <StoreContext.Provider value={{
      tasks,
      categories,
      completions,
      refreshTasks,
      refreshCategories,
      createTask,
      updateTask,
      deleteTask,
      reorderTasks,
      clearOneTimeTasks,
      createCategory,
      deleteCategory,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
