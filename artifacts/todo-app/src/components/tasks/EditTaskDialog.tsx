import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Task, Category, Priority } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useAppUpdateTask } from "@/hooks/use-tasks-api";
import { cn } from "@/lib/utils";

interface EditTaskDialogProps {
  task: Task | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
}

export function EditTaskDialog({ task, categories, isOpen, onClose }: EditTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const { mutate: updateTask, isPending } = useAppUpdateTask();

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setCategoryId(task.categoryId || null);
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    updateTask(
      {
        id: task.id,
        data: {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          categoryId,
        }
      },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10"
      >
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h2 className="text-xl font-display font-bold">Edit Task</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Task title"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
              <select
                value={categoryId || ""}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
              >
                <option value="">No Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending} className="px-8 shadow-lg shadow-primary/20">
              Save Changes
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
