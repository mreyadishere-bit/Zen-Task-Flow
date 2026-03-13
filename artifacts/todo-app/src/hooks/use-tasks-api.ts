import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetTasks, 
  useCreateTask, 
  useUpdateTask, 
  useDeleteTask, 
  useReorderTasks,
  useGetCategories,
  useCreateCategory,
  getGetTasksQueryKey,
  getGetCategoriesQueryKey,
  type Task
} from "@workspace/api-client-react";

// Wrapped hooks to provide automatic cache invalidation and optimistic updates
export function useAppTasks(params?: { focusMode?: boolean; categoryId?: number }) {
  return useGetTasks(params);
}

export function useAppCreateTask() {
  const queryClient = useQueryClient();
  return useCreateTask({
    mutation: {
      onSuccess: () => {
        // Invalidate all tasks queries
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      }
    }
  });
}

export function useAppUpdateTask() {
  const queryClient = useQueryClient();
  return useUpdateTask({
    mutation: {
      onMutate: async ({ id, data }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: ["/api/tasks"] });

        // Snapshot the previous value
        // We might have multiple cached arrays (different params), ideally we'd update all or just invalidate
        // For simplicity and speed, we'll invalidate on success, but we can do a naive optimistic update on the main list
        // Realistically, invalidate is safer, but let's try to update any query key that matches /api/tasks
        const queries = queryClient.getQueriesData<Task[]>({ queryKey: ["/api/tasks"] });
        
        queries.forEach(([queryKey, oldTasks]) => {
          if (oldTasks) {
            queryClient.setQueryData(queryKey, oldTasks.map(t => t.id === id ? { ...t, ...data } : t));
          }
        });

        return { queries };
      },
      onError: (err, variables, context) => {
        if (context?.queries) {
          context.queries.forEach(([queryKey, oldTasks]) => {
            queryClient.setQueryData(queryKey, oldTasks);
          });
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      }
    }
  });
}

export function useAppDeleteTask() {
  const queryClient = useQueryClient();
  return useDeleteTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      }
    }
  });
}

export function useAppReorderTasks() {
  const queryClient = useQueryClient();
  return useReorderTasks({
    mutation: {
      onMutate: async ({ data }) => {
        await queryClient.cancelQueries({ queryKey: ["/api/tasks"] });
        
        const queries = queryClient.getQueriesData<Task[]>({ queryKey: ["/api/tasks"] });
        
        queries.forEach(([queryKey, oldTasks]) => {
          if (oldTasks) {
            const newTasks = [...oldTasks].sort((a, b) => {
              const indexA = data.orderedIds.indexOf(a.id);
              const indexB = data.orderedIds.indexOf(b.id);
              if (indexA === -1 || indexB === -1) return 0;
              return indexA - indexB;
            });
            // Update sortOrders to reflect visually immediately
            queryClient.setQueryData(queryKey, newTasks.map((t, i) => ({ ...t, sortOrder: i })));
          }
        });

        return { queries };
      },
      onError: (err, variables, context) => {
        if (context?.queries) {
          context.queries.forEach(([queryKey, oldTasks]) => {
            queryClient.setQueryData(queryKey, oldTasks);
          });
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      }
    }
  });
}

export function useAppCategories() {
  return useGetCategories();
}

export function useAppCreateCategory() {
  const queryClient = useQueryClient();
  return useCreateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
      }
    }
  });
}
