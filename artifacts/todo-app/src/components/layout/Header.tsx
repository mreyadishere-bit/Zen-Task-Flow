import { Moon, Sun, Target } from "lucide-react";
import { format } from "date-fns";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { motion, AnimatePresence } from "framer-motion";
import { PageNav } from "@/components/layout/PageNav";

interface HeaderProps {
  progress: number;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  title?: string;
}

export function Header({ progress, focusMode, onToggleFocusMode, title }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const today = new Date();

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur border-b border-border/50 pb-0 pt-6 px-4 md:px-8 mb-6">
      <div className="max-w-2xl mx-auto">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-0.5">
            <motion.div layout className="flex items-center gap-2">
              <h1 className="text-3xl font-display font-bold text-foreground">
                {title ?? (focusMode ? "Focus Mode" : "My Tasks")}
              </h1>
              <AnimatePresence>
                {focusMode && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <Target className="w-6 h-6 text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <p className="text-sm text-muted-foreground font-medium">
              {format(today, "EEEE, MMMM do")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <ProgressCircle progress={progress || 0} size={40} strokeWidth={4} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Button
                variant={focusMode ? "default" : "secondary"}
                size="icon"
                className={focusMode ? "shadow-md shadow-primary/20 w-8 h-8" : "w-8 h-8"}
                onClick={onToggleFocusMode}
                title="Toggle Focus Mode"
              >
                <Target className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Toggle Theme"
                className="w-8 h-8 bg-background/50"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-500" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Nav tabs — centered below title */}
        <PageNav />
      </div>
    </header>
  );
}
