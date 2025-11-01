"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: "user" | "assistant"
  className?: string
  children?: React.ReactNode
}

interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}

export function Message({ from, className, children, ...props }: MessageProps) {
  const isUser = from === "user"
  
  return (
    <div 
      className={cn(
        "flex w-full gap-2 px-3 py-3 min-w-0",
        isUser ? "justify-end" : "justify-start",
        className
      )}
      {...props}
    >
      {!isUser && (
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage src="https://cdn.openai.com/chatgpt/images/chatgpt-logo.png" alt="ChatGPT" />
          <AvatarFallback className="bg-green-500 text-white text-xs font-semibold flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex-1 min-w-0 max-w-[85%] flex flex-col",
        isUser ? "items-end" : "items-start"
      )}>
        {children}
      </div>
      
      {isUser && (
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarFallback className="bg-blue-500 text-white text-xs font-semibold">
            U
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

export function MessageContent({ className, children, ...props }: MessageContentProps) {
  return (
    <div 
      className={cn(
        "rounded-2xl px-3 py-2 text-sm leading-relaxed w-full min-w-0",
        "bg-gray-100 text-gray-900 break-words overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}