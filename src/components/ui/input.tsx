import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input — gunmetal field with silver border. The translucent `bg-card/40`
 * keeps it readable against either the elevated card surface or the deep
 * page background. Focus ring uses the khaki accent token.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2.5 text-sm text-white shadow-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-[rgba(255,255,255,0.35)]",
          "hover:border-[rgba(255,255,255,0.18)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6a4f] focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:ring-offset-2 focus-visible:bg-[rgba(255,255,255,0.08)]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }