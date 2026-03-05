import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface glass rounded-2xl border border-border p-4 shadow-[var(--glass-shadow)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
