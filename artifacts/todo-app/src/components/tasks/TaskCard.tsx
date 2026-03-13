import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Check, Trash2, Edit2, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { Task, Category } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TaskCardProps {
  task: Task;
  category?: Category;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
}

const priorityColors = {
  low: "bg-green-500",
  medium: "bg-amber-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export function TaskCard({ task, category, onToggle, onDelete, onEdit }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleToggle = () => {
    onToggle(task.id, !task.completed);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => onDelete(task.id), 300); // Wait for exit animation
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDeleting ? 0 : 1, y: isDeleting ? -20 : 0, scale: isDeleting ? 0.95 : 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      style={style}
      ref={setNodeRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative group flex items-center gap-4 p-4 rounded-2xl bg-card border border-card-border shadow-sm transition-all duration-300",
        isDragging && "opacity-50 shadow-xl scale-[1.02] z-50",
        task.completed && "opacity-60 bg-muted/30"
      )}
    >
      {/* Priority Indicator */}
      <div 
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-r-full transition-colors",
          priorityColors[task.priority]
        )} 
      />

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground p-1 rounded transition-colors pl-2"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={cn(
          "relative flex-shrink-0 w-7 h-7 rounded-full border-2 transition-all duration-300 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          task.completed 
            ? "bg-primary border-primary" 
            : "border-muted-foreground/30 hover:border-primary/50 bg-background"
        )}
      >
        <AnimatePresence>
          {task.completed && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 py-1 cursor-pointer" onClick={() => onEdit(task)}>
        <div className="flex items-center gap-2 mb-1">
          <span 
            className={cn(
              "font-semibold text-base transition-all duration-300 truncate",
              task.completed ? "line-through text-muted-foreground" : "text-foreground"
            )}
          >
            {task.title}
          </span>
          {category && (
            <Badge variant="soft" className="flex-shrink-0 text-[10px] h-5" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {category.name}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.description && (
             <span className="truncate max-w-[200px]">{task.description}</span>
          )}
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={cn(
        "flex items-center gap-1 transition-opacity duration-200",
        isHovered || isDragging ? "opacity-100" : "opacity-0 md:opacity-0 opacity-100"
      )}>
        <button
          onClick={() => onEdit(task)}
          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
