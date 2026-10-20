import { Moon, Sun, Target, Palette, Check } from "lucide-react";
import { format } from "date-fns";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { PageNav } from "@/components/layout/PageNav";

interface HeaderProps {
  progress: number;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  title?: string;
}

export function Header({ progress, focusMode, onToggleFocusMode, title }: HeaderProps) {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const palette = [
    { id: "original", label: "Original", color: "#e9a23b" },
    { id: "orange", label: "Orange", color: "#ed741c" },
    { id: "blue", label: "Blue", color: "#337fe8" },
    { id: "violet", label: "Violet", color: "#9060da" },
    { id: "green", label: "Green", color: "#239969" },
    { id: "rose", label: "Rose", color: "#dd426e" },
    { id: "teal", label: "Teal", color: "#159992" },
  ] as const;
  const today = new Date();

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur border-b border-border/50 pb-0 pt-6 px-4 md:px-8 mb-6">
      <div className="max-w-2xl mx-auto">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-0.5">
            <motion.div layout className="flex items-center gap-2">
              <h1 className="text-3xl font-display font-bold text-foreground">
                {title ?? (focusMode ? "Focus Mode" : "My To Do List")}
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" title="Choose theme color" aria-label="Choose theme color" className="w-8 h-8 bg-background/50">
                    <Palette className="w-4 h-4 text-primary" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="z-[100] w-60 p-3 border border-border bg-card text-card-foreground shadow-2xl opacity-100" style={{ backgroundColor: "hsl(var(--card))", color: "hsl(var(--card-foreground))", opacity: 1, backdropFilter: "none" }}>
                  <p className="text-sm font-semibold mb-3">Theme color</p>
                  <div className="grid grid-cols-4 gap-2">
                    {palette.map(option => (
                      <button key={option.id} type="button" onClick={() => setAccent(option.id)}
                        title={option.label} aria-label={option.label} aria-pressed={accent === option.id}
                        className="flex flex-col items-center gap-1 rounded-lg p-1 hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
                        <span className="w-9 h-9 rounded-full flex items-center justify-center ring-1 ring-border" style={{ backgroundColor: option.color }}>
                          {accent === option.id && <Check className="w-4 h-4 text-white drop-shadow-sm" strokeWidth={3} />}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{option.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Saved on this device</p>
                </PopoverContent>
              </Popover>
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
