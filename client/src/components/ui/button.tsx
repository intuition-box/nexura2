import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transform-gpu outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 will-change-transform [&_svg]:pointer-events-none [&_svg]:shrink-0 transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        // Premium gradient button with shimmer - darker purple/blue tones
        default: "bg-gradient-to-r from-purple-700 via-blue-600 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 shimmer",
        quest: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
        destructive: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
        outline: "border-2 border-purple-500/50 bg-transparent text-foreground shadow-md hover:bg-purple-500/10 hover:border-purple-400 hover:scale-105 hover:shadow-lg",
        secondary: "bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95",
        ghost: "bg-transparent hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10 hover:scale-105",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-12 rounded-xl px-10 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
