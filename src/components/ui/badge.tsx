import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge variants — recalibrated for the muted gunmetal palette.
 *
 * Status colours are intentionally desaturated: the original `bg-red-100`
 * → `bg-red-50` etc. utilities throughout the codebase now resolve to
 * muted terracotta / olive / brass tones (see tailwind.config.js), so
 * existing badges read calmly. The new `success` / `warning` / `info`
 * variants below give an opt-in route for token-driven status badges.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-khaki-deep",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-gunmetal-hover",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/85",
        success:
          "border-transparent bg-success/20 text-success-soft",
        warning:
          "border-transparent bg-warning/20 text-warning-soft",
        info:
          "border-transparent bg-info/20 text-info-soft",
        outline:
          "border-silver-cool text-silver-strong",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
