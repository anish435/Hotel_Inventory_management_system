import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    children,
    disabled,
    ...props
}, ref) => {

    const variants = {
        primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/50",
        secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700",
        danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 hover:border-red-500",
        ghost: "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-100",
        outline: "border-2 border-zinc-700 hover:border-zinc-500 text-zinc-300 bg-transparent"
    };

    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-lg",
        icon: "h-10 w-10 p-0 flex items-center justify-center"
    };

    return (
        <button
            ref={ref}
            disabled={disabled || isLoading}
            className={cn(
                "relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = "Button";

export { Button };
