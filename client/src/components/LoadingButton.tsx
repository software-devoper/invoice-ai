import clsx from "clsx";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "danger";
}

const LoadingButton = ({
  children,
  className,
  isLoading = false,
  variant = "primary",
  disabled,
  ...rest
}: PropsWithChildren<LoadingButtonProps>) => {
  const variantClasses = {
    primary:
      "border-brand-600 bg-brand-600 text-white hover:bg-brand-700 dark:border-brand-500 dark:bg-brand-600 dark:hover:bg-brand-500",
    secondary:
      "border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
    danger:
      "border-red-600 bg-red-600 text-white hover:bg-red-700 dark:border-red-500 dark:bg-red-600 dark:hover:bg-red-500",
  } as const;

  const spinnerClass = variant === "secondary" ? "border-slate-300 border-t-slate-700" : "border-white/30 border-t-white";

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <>
          <span className={clsx("h-4 w-4 animate-spin rounded-full border-2", spinnerClass)} />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
