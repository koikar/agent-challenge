"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ResponseProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
  streaming?: boolean
  streamingSpeed?: number
}

// Function to auto-complete incomplete markdown formatting
function autoCompleteMarkdown(text: string): string {
  let result = text

  // Count and auto-complete bold formatting
  const boldCount = (result.match(/\*\*/g) || []).length
  if (boldCount % 2 === 1) {
    result += "**"
  }

  // Count and auto-complete italic formatting
  const italicCount = (result.match(/(?<!\*)\*(?!\*)/g) || []).length
  if (italicCount % 2 === 1) {
    result += "*"
  }

  // Count and auto-complete inline code
  const codeCount = (result.match(/`/g) || []).length
  if (codeCount % 2 === 1) {
    result += "`"
  }

  // Hide incomplete links and images
  result = result.replace(/!\[[^\]]*$/, "") // Hide incomplete images
  result = result.replace(/\[[^\]]*$/, "") // Hide incomplete links

  return result
}

export function Response({ 
  className, 
  children, 
  streaming = false,
  streamingSpeed = 50,
  ...props 
}: ResponseProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  const text = typeof children === 'string' ? children : String(children || '')

  useEffect(() => {
    if (!streaming) {
      setDisplayedText(text)
      return
    }

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        setDisplayedText(text.slice(0, currentIndex + 1))
      }, streamingSpeed)

      return () => clearTimeout(timer)
    }
  }, [text, currentIndex, streaming, streamingSpeed])

  useEffect(() => {
    if (streaming) {
      setCurrentIndex(0)
      setDisplayedText("")
    }
  }, [text, streaming])

  const processedText = streaming ? autoCompleteMarkdown(displayedText) : text

  return (
    <div 
      className={cn(
        "prose prose-sm max-w-none",
        "text-gray-900 leading-relaxed",
        "[&>*]:mb-2 [&>*:last-child]:mb-0",
        "[&>p]:text-sm [&>p]:leading-relaxed [&>p]:break-words",
        "[&>ul]:text-sm [&>ol]:text-sm",
        "[&>h1]:text-base [&>h1]:font-semibold [&>h1]:mb-2",
        "[&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mb-1",
        "[&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mb-1",
        "[&>code]:bg-gray-100 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs",
        "[&>pre]:bg-gray-100 [&>pre]:p-2 [&>pre]:rounded-lg [&>pre]:text-xs [&>pre]:overflow-x-auto",
        className
      )}
      {...props}
    >
      <div className="break-words overflow-hidden">
        {processedText}
        {streaming && currentIndex < text.length && (
          <span className="animate-pulse">|</span>
        )}
      </div>
    </div>
  )
}