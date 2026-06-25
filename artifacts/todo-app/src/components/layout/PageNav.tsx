import { Link, useLocation } from "wouter";
import { CheckSquare, CalendarDays, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/discipline", label: "Discipline", icon: Zap },
];

export function PageNav() {
  const [location] = useLocation();
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="flex justify-center mt-4">
      <div className="flex items-center gap-1 bg-muted/60 rounded-2xl p-1 mt-[0px] mb-[20px]">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={`${base}${href}`}>
              <motion.div
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer select-none",
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
