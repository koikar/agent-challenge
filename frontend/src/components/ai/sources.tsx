"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { ExternalLink, Globe } from "lucide-react"

interface SourcesProps extends React.HTMLAttributes<HTMLDivElement> {
  sources: Array<{
    url: string
    title?: string
    description?: string
    favicon?: string
  }>
  className?: string
}

interface SourceProps extends React.HTMLAttributes<HTMLAnchorElement> {
  url: string
  title?: string
  description?: string
  favicon?: string
  className?: string
}

export function Sources({ sources, className, ...props }: SourcesProps) {
  if (!sources || sources.length === 0) return null

  return (
    <div 
      className={cn(
        "mt-4 space-y-2",
        className
      )}
      {...props}
    >
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Sources
      </div>
      <div className="space-y-2">
        {sources.map((source, index) => (
          <Source
            key={index}
            url={source.url}
            title={source.title}
            description={source.description}
            favicon={source.favicon}
          />
        ))}
      </div>
    </div>
  )
}

export function Source({ 
  url, 
  title, 
  description, 
  favicon, 
  className, 
  ...props 
}: SourceProps) {
  const displayTitle = title || new URL(url).hostname
  const displayUrl = new URL(url).hostname
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-start space-x-3 p-3 rounded-lg",
        "bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/40",
        "transition-colors duration-200 group",
        className
      )}
      {...props}
    >
      <div className="flex-shrink-0 mt-0.5">
        {favicon ? (
          <img 
            src={favicon} 
            alt={displayUrl}
            className="w-4 h-4 rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : null}
        <Globe className={cn(
          "w-4 h-4 text-gray-400",
          favicon ? "hidden" : "block"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <div className="font-medium text-sm text-gray-900 truncate">
            {displayTitle}
          </div>
          <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
        
        <div className="text-xs text-gray-500 truncate">
          {displayUrl}
        </div>
        
        {description && (
          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
            {description}
          </div>
        )}
      </div>
    </a>
  )
}