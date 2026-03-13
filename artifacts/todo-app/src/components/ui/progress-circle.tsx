import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
  colorClass?: string;
}

export function ProgressCircle({
  progress,
  size = 48,
  strokeWidth = 4,
  className,
  colorClass = "text-primary",
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className={cn("relative flex items-center justify-center", className)} 
      style={{ width: size, height: size }}
    >
      <svg className="rotate-[-90deg] transform w-full h-full">
        {/* Background circle */}
        <circle
          className="text-muted stroke-current"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <motion.circle
          className={cn("stroke-current transition-all duration-500 ease-out", colorClass)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
        {Math.round(progress)}%
      </div>
    </div>
  );
}
