"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}

interface ConversationContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}

export function Conversation({ className, children, ...props }: ConversationProps) {
  return (
    <div 
      className={cn(
        "flex flex-col h-full w-full",
        "bg-white dark:bg-gray-900",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const ConversationContent = React.forwardRef<HTMLDivElement, ConversationContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          "flex-1 overflow-y-auto",
          "divide-y divide-gray-100 dark:divide-gray-800",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ConversationContent.displayName = "ConversationContent"

export function ConversationScrollButton({ className, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      className={cn(
        "absolute bottom-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700",
        "hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors",
        "shadow-lg",
        className
      )}
      onClick={() => {
        const conversation = document.querySelector('[data-conversation-content]');
        if (conversation) {
          conversation.scrollTop = conversation.scrollHeight;
        }
      }}
      {...props}
    >
      ↓
    </button>
  );
}