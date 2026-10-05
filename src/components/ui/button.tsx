import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_6px_18px_-6px_var(--glow)] hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-card shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        ink: "bg-ink text-ink-foreground hover:bg-ink/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onPointerDown, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const [ripples, setRipples] = React.useState<{ id: number; x: number; y: number; s: number }[]>([]);
    const down = (e: React.PointerEvent<HTMLButtonElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const s = Math.max(r.width, r.height) / 2;
      const id = Date.now();
      setRipples((p) => [...p, { id, x: e.clientX - r.left - s / 2, y: e.clientY - r.top - s / 2, s }]);
      setTimeout(() => setRipples((p) => p.filter((x) => x.id !== id)), 650);
      onPointerDown?.(e);
    };
    if (asChild) return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>{children}</Comp>;
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} onPointerDown={down} {...props}>
        {children}
        {ripples.map((r) => (
          <span key={r.id} aria-hidden className="pointer-events-none absolute rounded-full bg-current opacity-25 animate-ripple" style={{ left: r.x, top: r.y, width: r.s, height: r.s }} />
        ))}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
