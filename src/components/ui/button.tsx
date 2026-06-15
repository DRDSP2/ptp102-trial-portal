import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button variants — per design token spec.
 *
 * Token mapping:
 *   default (primary)    -> bg-[#2d6a4f] hover:bg-[#357a5c] text-white
 *   secondary            -> transparent bg, border-white/15, text-white/60, hover:bg-white/5 border-white/25 text-white
 *   outline              -> border-white/10, bg-transparent, hover:bg-white/5
 *   ghost                -> no chrome, text-white/60, hover:bg-white/5 text-white
 *   destructive          -> bg-red-500/80 hover:bg-red-500/90 text-white
 *   link                 -> khaki underline, hover:text-khaki-soft
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6a4f] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#2d6a4f] text-white shadow-sm hover:bg-[#357a5c]",
        destructive:
          "bg-red-500/80 text-white shadow-sm hover:bg-red-500/90",
        outline:
          "border border-white/15 bg-transparent text-foreground hover:bg-white/5",
        secondary:
          "bg-transparent text-white/60 border border-white/15 hover:bg-white/5 hover:border-white/25 hover:text-white",
        ghost:
          "text-white/60 hover:bg-white/5 hover:text-white",
        link:
          "text-khaki underline-offset-4 hover:underline hover:text-khaki-soft",
      },
      size: {
        sm: "h-8 rounded-lg px-3 text-xs",
        default: "h-10 px-5 py-2",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }