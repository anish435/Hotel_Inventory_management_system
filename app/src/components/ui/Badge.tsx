import { cn } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'error' | 'neutral' | 'info';
    className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
    const variants = {
        success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
        error: "bg-rose-500/15 text-rose-400 border-rose-500/20",
        info: "bg-blue-500/15 text-blue-400 border-blue-500/20",
        neutral: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
    };

    return (
        <span className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            variants[variant],
            className
        )}>
            {children}
        </span>
    );
}
