import clsx from "clsx";
import type { PropsWithChildren } from "react";

const GlassCard = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <div
    className={clsx(
      "animate-floatIn rounded-2xl border border-white/70 bg-white/70 p-5 shadow-glass backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/78 dark:shadow-[0_12px_34px_rgba(2,6,23,0.55)]",
      className
    )}
  >
    {children}
  </div>
);

export default GlassCard;
