"use client";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="bg-surface glass border-b border-border shadow-[var(--glass-shadow)]">
      <div className="px-4 max-w-lg mx-auto text-center h-14 flex flex-col items-center justify-center">
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        {action && <div className="mt-1">{action}</div>}
      </div>
    </header>
  );
}
