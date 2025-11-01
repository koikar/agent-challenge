"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SuggestionsProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

interface SuggestionProps extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  suggestion: string
  onClick?: (suggestion: string) => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
}

export function Suggestions({ className, children, ...props }: SuggestionsProps) {
  return (
    <div 
      className={cn(
        "w-full overflow-x-auto scrollbar-hide", 
        "whitespace-nowrap",
        className
      )} 
      {...props}
    >
      <div className="flex w-max space-x-2 p-1">
        {children}
      </div>
    </div>
  )
}

export function Suggestion({ 
  suggestion, 
  onClick, 
  variant = "outline", 
  size = "sm", 
  className, 
  children,
  ...props 
}: SuggestionProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(suggestion)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        "flex-shrink-0 rounded-full whitespace-nowrap",
        "hover:scale-105 transition-all duration-200",
        "text-sm font-medium",
        className
      )}
      {...props}
    >
      {children || suggestion}
    </Button>
  )
}