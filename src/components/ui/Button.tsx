"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-gradient-to-b from-primary to-primary-dark text-white shadow-[0_2px_12px_rgba(124,91,240,0.35)] hover:shadow-[0_4px_20px_rgba(124,91,240,0.45)] hover:brightness-110 active:scale-[0.98]": variant === "primary",
            "bg-surface glass border border-border shadow-[var(--glass-shadow)] hover:bg-surface-hover": variant === "secondary",
            "hover:bg-surface-hover active:scale-[0.97]": variant === "ghost",
            "bg-danger text-white shadow-[0_2px_12px_rgba(248,113,113,0.3)] hover:brightness-110 active:scale-[0.98]": variant === "danger",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button;
