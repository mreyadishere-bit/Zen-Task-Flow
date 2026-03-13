import { useState } from "react";
import { Plus, Tag, Flag, Calendar as CalendarIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppCreateTask } from "@/hooks/use-tasks-api";
import { Button } from "@/components/ui/button";
import type { Category, Priority } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface TaskInputProps {
  categories: Category[];
  activeCategoryId: number | null;
}

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-green-500" },
  { value: "medium", label: "Medium", color: "text-amber-500" },
  { value: "high", label: "High", color: "text-orange-500" },
  { value: "urgent", label: "Urgent", color: "text-red-500" },
];

export function TaskInput({ categories, activeCategoryId }: TaskInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [categoryId, setCategoryId] = useState<number | null>(activeCategoryId);

  const { mutate: createTask, isPending } = useAppCreateTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask(
      {
        data: {
          title: title.trim(),
          priority,
          categoryId,
        },
      },
      {
        onSuccess: () => {
          setTitle("");
          setIsExpanded(false);
        },
      }
    );
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 px-4 z-50 pointer-events-none flex justify-center">
      <motion.div 
        layout
        className={cn(
          "w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl pointer-events-auto transition-all duration-300 overflow-hidden",
          isExpanded ? "p-4" : "p-2"
        )}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="What needs to be done?"
              className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-foreground placeholder:text-muted-foreground font-medium text-lg"
            />
            
            {!isExpanded && (
              <Button 
                type="button" 
                size="icon" 
                className="rounded-full shadow-md"
                onClick={() => setIsExpanded(true)}
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between px-2 pt-2 border-t border-border/50"
              >
                <div className="flex items-center gap-2">
                  {/* Simple custom dropdowns for priority/category to avoid heavy radx deps if not fully available, keeping it minimal and beautiful */}
                  <div className="relative group">
                    <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted text-xs font-medium text-muted-foreground transition-colors">
                      <Flag className={cn("w-4 h-4", priorities.find(p => p.value === priority)?.color)} />
                      {priorities.find(p => p.value === priority)?.label}
                    </button>
                    <div className="absolute bottom-full left-0 mb-2 w-32 bg-popover border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                      {priorities.map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPriority(p.value)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"
                        >
                          <div className={cn("w-2 h-2 rounded-full bg-current", p.color)} />
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {categories.length > 0 && (
                    <div className="relative group">
                      <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted text-xs font-medium text-muted-foreground transition-colors">
                        <Tag className="w-4 h-4" />
                        {categoryId ? categories.find(c => c.id === categoryId)?.name : "Tag"}
                      </button>
                      <div className="absolute bottom-full left-0 mb-2 w-40 bg-popover border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden max-h-48 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => setCategoryId(null)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left text-muted-foreground"
                        >
                          No Tag
                        </button>
                        {categories.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setCategoryId(c.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"
                          >
                            <span style={{ color: c.color }}>{c.icon || <Tag className="w-3 h-3" />}</span>
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setIsExpanded(false);
                      setTitle("");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm" 
                    isLoading={isPending}
                    disabled={!title.trim()}
                    className="rounded-lg shadow-md px-6"
                  >
                    Add Task
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}
