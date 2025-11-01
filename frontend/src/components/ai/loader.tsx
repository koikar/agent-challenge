"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "dots" | "pulse" | "thinking"
  size?: "sm" | "default" | "lg"
  className?: string
}

export function Loader({ 
  variant = "dots", 
  size = "default", 
  className, 
  ...props 
}: LoaderProps) {
  const sizeClasses = {
    sm: "w-1 h-1",
    default: "w-1.5 h-1.5", 
    lg: "w-2 h-2"
  }

  const containerSizeClasses = {
    sm: "gap-1 px-3 py-2",
    default: "gap-1 px-4 py-3",
    lg: "gap-1.5 px-5 py-4"
  }

  if (variant === "thinking") {
    return (
      <div 
        className={cn(
          "flex items-center space-x-2 text-gray-500 text-sm",
          className
        )}
        {...props}
      >
        <div className="flex space-x-1">
          <div className={cn("bg-gray-400 rounded-full animate-bounce", sizeClasses[size])}></div>
          <div className={cn("bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]", sizeClasses[size])}></div>
          <div className={cn("bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]", sizeClasses[size])}></div>
        </div>
        <span className="font-medium">Thinking...</span>
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div 
        className={cn(
          "bg-gray-100 rounded-2xl border border-gray-200/20",
          containerSizeClasses[size],
          className
        )}
        {...props}
      >
        <div className={cn("bg-gray-400 rounded-full animate-pulse", sizeClasses[size])}></div>
      </div>
    )
  }

  // Default dots variant
  return (
    <div 
      className={cn(
        "bg-gray-100 rounded-2xl border border-gray-200/20 flex",
        containerSizeClasses[size],
        className
      )}
      {...props}
    >
      <div className={cn("bg-gray-400 rounded-full animate-bounce", sizeClasses[size])}></div>
      <div className={cn("bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]", sizeClasses[size])}></div>
      <div className={cn("bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]", sizeClasses[size])}></div>
    </div>
  )
}