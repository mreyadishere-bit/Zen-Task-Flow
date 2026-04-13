export type Priority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  categoryId: number | null;
  dueDate: string | null;
  sortOrder: number;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string | null;
}

const TASKS_KEY = "todo_app_tasks";
const CATEGORIES_KEY = "todo_app_categories";
const NEXT_TASK_ID_KEY = "todo_app_next_task_id";
const NEXT_CAT_ID_KEY = "todo_app_next_cat_id";

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function loadCategories(): Category[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCategories(categories: Category[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

function nextTaskId(): number {
  const current = parseInt(localStorage.getItem(NEXT_TASK_ID_KEY) || "1", 10);
  localStorage.setItem(NEXT_TASK_ID_KEY, String(current + 1));
  return current;
}

function nextCatId(): number {
  const current = parseInt(localStorage.getItem(NEXT_CAT_ID_KEY) || "1", 10);
  localStorage.setItem(NEXT_CAT_ID_KEY, String(current + 1));
  return current;
}

export const store = {
  getTasks(params?: { categoryId?: number }): Task[] {
    const tasks = loadTasks();
    if (params?.categoryId != null) {
      return tasks.filter(t => t.categoryId === params.categoryId);
    }
    return tasks;
  },

  createTask(data: { title: string; priority?: Priority; categoryId?: number | null; description?: string | null; dueDate?: string | null }): Task {
    const tasks = loadTasks();
    const maxSort = tasks.length > 0 ? Math.max(...tasks.map(t => t.sortOrder)) : -1;
    const task: Task = {
      id: nextTaskId(),
      title: data.title,
      description: data.description ?? null,
      completed: false,
      priority: data.priority ?? "medium",
      categoryId: data.categoryId ?? null,
      dueDate: data.dueDate ?? null,
      sortOrder: maxSort + 1,
    };
    tasks.push(task);
    saveTasks(tasks);
    return task;
  },

  updateTask(id: number, data: Partial<Omit<Task, "id">>): Task | null {
    const tasks = loadTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    tasks[index] = { ...tasks[index], ...data };
    saveTasks(tasks);
    return tasks[index];
  },

  deleteTask(id: number): void {
    const tasks = loadTasks().filter(t => t.id !== id);
    saveTasks(tasks);
  },

  reorderTasks(orderedIds: number[]): void {
    const tasks = loadTasks();
    orderedIds.forEach((id, index) => {
      const t = tasks.find(t => t.id === id);
      if (t) t.sortOrder = index;
    });
    saveTasks(tasks);
  },

  getCategories(): Category[] {
    return loadCategories();
  },

  createCategory(data: { name: string; color: string; icon?: string | null }): Category {
    const categories = loadCategories();
    const category: Category = {
      id: nextCatId(),
      name: data.name,
      color: data.color,
      icon: data.icon ?? null,
    };
    categories.push(category);
    saveCategories(categories);
    return category;
  },

  deleteCategory(id: number): void {
    const categories = loadCategories().filter(c => c.id !== id);
    saveCategories(categories);
    const tasks = loadTasks().map(t => t.categoryId === id ? { ...t, categoryId: null } : t);
    saveTasks(tasks);
  },
};
