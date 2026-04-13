import { useState, useMemo } from "react";
import { useStore } from "@/context/StoreContext";
import type { Task, Category, Priority } from "@/lib/local-store";

export type { Task, Category, Priority };

export function useAppTasks(params?: { categoryId?: number | null }) {
  const { tasks } = useStore();
  const filtered = useMemo(() => {
    if (params?.categoryId != null) {
      return tasks.filter(t => t.categoryId === params.categoryId);
    }
    return tasks;
  }, [tasks, params?.categoryId]);

  return { data: filtered, isLoading: false };
}

export function useAppCategories() {
  const { categories } = useStore();
  return { data: categories, isLoading: false };
}

export function useAppCreateTask() {
  const { createTask } = useStore();
  const [isPending, setIsPending] = useState(false);

  const mutate = (
    args: { data: { title: string; priority?: Priority; categoryId?: number | null; description?: string | null; dueDate?: string | null } },
    callbacks?: { onSuccess?: () => void }
  ) => {
    setIsPending(true);
    createTask(args.data, {
      onSuccess: () => {
        setIsPending(false);
        callbacks?.onSuccess?.();
      },
    });
    setIsPending(false);
  };

  return { mutate, isPending };
}

export function useAppUpdateTask() {
  const { updateTask } = useStore();
  const [isPending, setIsPending] = useState(false);

  const mutate = (
    args: { id: number; data: Partial<Omit<Task, "id">> },
    callbacks?: { onSuccess?: () => void }
  ) => {
    setIsPending(true);
    updateTask(args.id, args.data, {
      onSuccess: () => {
        setIsPending(false);
        callbacks?.onSuccess?.();
      },
    });
    setIsPending(false);
  };

  return { mutate, isPending };
}

export function useAppDeleteTask() {
  const { deleteTask } = useStore();
  const [isPending, setIsPending] = useState(false);

  const mutate = (args: { id: number }, callbacks?: { onSuccess?: () => void }) => {
    setIsPending(true);
    deleteTask(args.id, {
      onSuccess: () => {
        setIsPending(false);
        callbacks?.onSuccess?.();
      },
    });
    setIsPending(false);
  };

  return { mutate, isPending };
}

export function useAppReorderTasks() {
  const { reorderTasks } = useStore();
  const [isPending, setIsPending] = useState(false);

  const mutate = (args: { data: { orderedIds: number[] } }, callbacks?: { onSuccess?: () => void }) => {
    setIsPending(true);
    reorderTasks(args.data.orderedIds, {
      onSuccess: () => {
        setIsPending(false);
        callbacks?.onSuccess?.();
      },
    });
    setIsPending(false);
  };

  return { mutate, isPending };
}

export function useAppCreateCategory() {
  const { createCategory } = useStore();
  const [isPending, setIsPending] = useState(false);

  const mutate = (
    args: { data: { name: string; color: string; icon?: string | null } },
    callbacks?: { onSuccess?: () => void }
  ) => {
    setIsPending(true);
    createCategory(args.data, {
      onSuccess: () => {
        setIsPending(false);
        callbacks?.onSuccess?.();
      },
    });
    setIsPending(false);
  };

  return { mutate, isPending };
}
