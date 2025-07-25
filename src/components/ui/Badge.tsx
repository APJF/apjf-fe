import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant, ...props }: BadgeProps) {
  const variantClasses = {
    default: "border-transparent bg-red-600 text-white hover:bg-red-600/80",
    secondary: "border-transparent bg-gray-200 text-gray-800 hover:bg-gray-200/80",
    destructive: "border-transparent bg-red-500 text-white hover:bg-red-500/80",
    outline: "text-gray-900",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantClasses[variant || "default"],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
