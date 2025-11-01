"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUp, Loader2, Plus, Mic, Volume2 } from "lucide-react"

interface PromptInputProps extends React.FormHTMLAttributes<HTMLFormElement> {
  className?: string
  children?: React.ReactNode
}

interface PromptInputTextareaProps extends React.ComponentProps<typeof Textarea> {
  className?: string
}

interface PromptInputSubmitProps extends React.ComponentProps<typeof Button> {
  status?: "idle" | "loading" | "success" | "error"
  disabled?: boolean
  className?: string
}

interface PromptInputActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}

export function PromptInput({ className, children, ...props }: PromptInputProps) {
  return (
    <form 
      className={cn(
        "border-t border-gray-200/50 p-4 bg-white/95 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </form>
  )
}

export function PromptInputTextarea({ className, ...props }: PromptInputTextareaProps) {
  return (
    <Textarea
      className={cn(
        "min-h-0 resize-none border-0 p-0 bg-transparent",
        "placeholder:text-gray-500 text-[15px] leading-relaxed",
        "focus-visible:ring-0 focus-visible:ring-offset-0",
        className
      )}
      rows={1}
      {...props}
    />
  )
}

export function PromptInputSubmit({ 
  status = "idle", 
  disabled, 
  className, 
  children,
  ...props 
}: PromptInputSubmitProps) {
  const isLoading = status === "loading"
  const isDisabled = disabled || isLoading

  return (
    <Button
      type="submit"
      size="icon"
      disabled={isDisabled}
      className={cn(
        "w-8 h-8 rounded-full flex-shrink-0",
        "bg-black hover:bg-black/90 text-white",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        children || <ArrowUp className="h-4 w-4" />
      )}
    </Button>
  )
}

export function PromptInputActions({ className, children, ...props }: PromptInputActionsProps) {
  return (
    <div 
      className={cn(
        "flex items-center space-x-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Pre-built complete prompt input for common use cases
interface CompletePromptInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  placeholder?: string
  disabled?: boolean
  status?: "idle" | "loading" | "success" | "error"
  showAttach?: boolean
  showVoice?: boolean
  className?: string
}

export function CompletePromptInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask anything",
  disabled = false,
  status = "idle",
  showAttach = true,
  showVoice = true,
  className
}: CompletePromptInputProps) {
  return (
    <PromptInput onSubmit={onSubmit} className={cn("border-t border-gray-200/50 p-4 bg-white", className)}>
      <div className="flex items-center space-x-3">
        {showAttach && (
          <Plus className="h-5 w-5 text-gray-400 flex-shrink-0" />
        )}
        
        <div className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 flex items-center justify-between min-w-0">
          <PromptInputTextarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent resize-none border-0 outline-none min-h-0 text-[15px] placeholder:text-gray-500"
            rows={1}
          />
          
          {showVoice && (
            <PromptInputActions className="flex-shrink-0">
              <Mic className="h-4 w-4 text-gray-400" />
              <Volume2 className="h-4 w-4 text-gray-400" />
            </PromptInputActions>
          )}
        </div>
        
        <PromptInputSubmit 
          disabled={disabled || !value.trim()} 
          status={status}
          className="w-8 h-8 rounded-full bg-black hover:bg-gray-800 disabled:bg-gray-400"
        />
      </div>
    </PromptInput>
  )
}