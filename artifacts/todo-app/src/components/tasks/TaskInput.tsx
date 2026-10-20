import { useState } from "react";
import { Plus, Tag, Flag, Calendar as CalendarIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppCreateTask } from "@/hooks/use-tasks-api";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Category, Priority } from "@/lib/local-store";
import { cn } from "@/lib/utils";

interface TaskInputProps {
  categories: Category[];
  activeCategoryId: number | null;
  dayOfWeek?: number | null;
  placeholder?: string;
}

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-green-500" },
  { value: "medium", label: "Medium", color: "task-priority-medium-text" },
  { value: "high", label: "High", color: "text-orange-500" },
  { value: "urgent", label: "Urgent", color: "text-red-500" },
];

export function TaskInput({ categories, activeCategoryId, dayOfWeek = null, placeholder = "What needs to be done?" }: TaskInputProps) {
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
          dayOfWeek,
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
    <div className="fixed bottom-8 left-0 right-0 px-4 z-50 pointer-events-none flex justify-center">
      <motion.div 
        layout
        className={cn(
          "w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl pointer-events-auto transition-all duration-300 overflow-visible",
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
              placeholder={placeholder}
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
                  {/* Portalled click menus prevent overlapping the task input and clipping. */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted text-xs font-medium text-muted-foreground transition-colors" aria-label="Choose priority">
                        <Flag className={cn("w-4 h-4", priorities.find(p => p.value === priority)?.color)} />
                        {priorities.find(p => p.value === priority)?.label}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" sideOffset={12} className="w-36 rounded-xl p-1.5 shadow-xl bg-popover text-popover-foreground border border-border">
                      {priorities.map(p => (
                        <DropdownMenuItem key={p.value} onSelect={() => setPriority(p.value)} className="flex items-center gap-2 rounded-lg py-2.5 cursor-pointer">
                          <span className={cn("w-2 h-2 shrink-0 rounded-full bg-current", p.color)} />
                          <span>{p.label}</span>
                          {priority === p.value && <span className="ml-auto text-primary text-xs">✓</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {categories.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted text-xs font-medium text-muted-foreground transition-colors" aria-label="Choose category">
                          <Tag className="w-4 h-4" />
                          {categoryId ? categories.find(c => c.id === categoryId)?.name : "Tag"}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="top" align="start" sideOffset={12} className="w-44 rounded-xl p-1.5 shadow-xl bg-popover text-popover-foreground border border-border">
                        <DropdownMenuItem onSelect={() => setCategoryId(null)} className="rounded-lg py-2.5 cursor-pointer">No Tag</DropdownMenuItem>
                        {categories.map(c => (
                          <DropdownMenuItem key={c.id} onSelect={() => setCategoryId(c.id)} className="flex items-center gap-2 rounded-lg py-2.5 cursor-pointer">
                            <span style={{ color: c.color }}>{c.icon || <Tag className="w-3 h-3" />}</span>
                            {c.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
