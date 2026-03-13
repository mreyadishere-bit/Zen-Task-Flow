import { Moon, Sun, Target } from "lucide-react";
import { format } from "date-fns";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  progress: number;
  focusMode: boolean;
  onToggleFocusMode: () => void;
}

export function Header({ progress, focusMode, onToggleFocusMode }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const today = new Date();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-x-0 border-t-0 pb-4 pt-6 px-4 md:px-8 mb-8">
      <div className="max-w-2xl mx-auto flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <motion.div layout className="flex items-center gap-2">
            <h1 className="text-3xl font-display font-bold text-foreground">
              {focusMode ? "Focus Mode" : "My Tasks"}
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
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            {format(today, "EEEE, MMMM do")}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Daily Progress</span>
          </div>
          <ProgressCircle progress={progress || 0} size={48} strokeWidth={5} />
          
          <div className="flex flex-col gap-2 ml-2">
            <Button
              variant={focusMode ? "default" : "secondary"}
              size="icon"
              className={focusMode ? "shadow-lg shadow-primary/20" : ""}
              onClick={onToggleFocusMode}
              title="Toggle Focus Mode"
            >
              <Target className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle Theme"
              className="bg-background/50"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-blue-500" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
