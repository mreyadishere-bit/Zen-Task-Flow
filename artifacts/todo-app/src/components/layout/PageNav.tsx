import { Link, useLocation } from "wouter";
import { CheckSquare, CalendarDays, CalendarRange, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Tasks", icon: CheckSquare },
  { href: "/weekly-plan", label: "Weekly Plan", icon: CalendarRange },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/discipline", label: "Discipline", icon: Zap },
];

export function PageNav() {
  const [location] = useLocation();

  return (
    <div className="flex justify-start sm:justify-center mt-3 sm:mt-4 max-w-full min-w-0 overflow-x-auto no-scrollbar overscroll-x-contain">
      <div className="flex w-max min-w-max items-center gap-1 bg-muted/60 rounded-2xl p-1 mt-0 mb-3 sm:mb-5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <motion.div
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none whitespace-nowrap",
                  active
                    ? "bg-card text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
