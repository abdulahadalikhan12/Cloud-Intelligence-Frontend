import { motion } from "framer-motion";
import { aqiCategory } from "@/lib/api";

export function GlassCard({
  children,
  className = "",
  delay = 0,
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={`glass rounded-2xl p-5 transition-shadow duration-300 ${hover ? "hover:shadow-[0_8px_30px_-8px_rgba(99,102,241,0.3)]" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function AqiBadge({ aqi, size = "md" }: { aqi: number; size?: "sm" | "md" | "lg" }) {
  const cat = aqiCategory(aqi);
  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tabular-nums ${sizes[size]}`}
      style={{ background: `${cat.color}22`, color: cat.color, border: `1px solid ${cat.color}44` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />
      {Math.round(aqi)} · {cat.label}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl lg:text-2xl font-bold tracking-tight">{children}</h2>
      {sub && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
