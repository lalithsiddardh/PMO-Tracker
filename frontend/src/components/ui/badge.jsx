import { cn } from "../../lib/utils";

const badgeVariants = {
  default: "bg-primary/10 text-primary border-transparent",
  ok: "bg-ok-bg text-ok border-transparent",
  warn: "bg-warn-bg text-warn border-transparent",
  bad: "bg-bad-bg text-bad border-transparent",
  outline: "text-gray-950 border-gray-200",
};

function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        badgeVariants[variant] || badgeVariants.default,
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
