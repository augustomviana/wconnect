"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, onChange, checked, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
      onCheckedChange?.(e.target.checked)
    }

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only" ref={ref} checked={checked} onChange={handleChange} {...props} />
        <div
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out",
            checked ? "bg-blue-600 shadow-lg" : "bg-gray-300 shadow-inner",
            "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
            className,
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out",
              checked ? "translate-x-5" : "translate-x-0",
            )}
          />
        </div>
        {/* Estado visual adicional */}
        <span className={cn("ml-3 text-sm font-medium transition-colors", checked ? "text-blue-600" : "text-gray-500")}>
          {checked ? "Ativado" : "Desativado"}
        </span>
      </label>
    )
  },
)
Switch.displayName = "Switch"

export { Switch }
