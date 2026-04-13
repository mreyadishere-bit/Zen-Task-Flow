import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { Category } from "@/lib/local-store";
import { cn } from "@/lib/utils";

interface CategoryListProps {
  categories: Category[];
  activeId: number | null;
  onSelect: (id: number | null) => void;
  onCreateNew: () => void;
}

export function CategoryList({ categories, activeId, onSelect, onCreateNew }: CategoryListProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-4 pt-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300",
          activeId === null 
            ? "bg-foreground text-background shadow-md" 
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        All Tasks
      </button>

      {categories.map((category) => {
        const isActive = activeId === category.id;
        return (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border border-transparent",
              isActive 
                ? "shadow-sm shadow-black/5 bg-background" 
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            style={{
              borderColor: isActive ? `${category.color}40` : 'transparent',
              color: isActive ? category.color : undefined
            }}
          >
            {category.icon && <span>{category.icon}</span>}
            {category.name}
            <span className={cn(
              "ml-1 px-1.5 py-0.5 rounded-md text-[10px] bg-foreground/5",
              isActive ? "text-foreground/70" : "text-muted-foreground"
            )}>
              {category.taskCount}
            </span>
          </button>
        );
      })}

      <button
        onClick={onCreateNew}
        className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
