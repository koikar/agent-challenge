/**
 * Base Apps SDK Components
 * Reusable, standardized components optimized for ChatGPT Apps SDK iframe streaming
 */

import React from "react";
import { cn } from "@/lib/utils";

// Apps SDK optimized base components
export interface AppsSdkComponentProps {
  className?: string;
  children?: React.ReactNode;
  brandName?: string;
  brandColor?: string;
}

/**
 * Container component optimized for Apps SDK iframe
 */
export function AppsSdkContainer({
  children,
  className,
  brandName,
  brandColor = "#0066cc",
}: AppsSdkComponentProps) {
  return (
    <div
      className={cn(
        "w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
        "font-sans leading-relaxed",
        className,
      )}
      style={
        {
          "--brand-color": brandColor,
          "--brand-color-light": `${brandColor}20`,
        } as React.CSSProperties
      }
    >
      {brandName && (
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: brandColor }} />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {brandName}
            </span>
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

/**
 * Typography components optimized for readability
 */
export function AppsSdkHeading({
  children,
  level = 1,
  className,
}: {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}) {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;

  const styles = {
    1: "text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100",
    2: "text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2",
    3: "text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200",
    4: "text-lg font-medium mb-2 text-gray-800 dark:text-gray-200",
    5: "text-base font-medium mb-2 text-gray-700 dark:text-gray-300",
    6: "text-sm font-medium mb-1 text-gray-700 dark:text-gray-300",
  };

  return <Component className={cn(styles[level], className)}>{children}</Component>;
}

/**
 * Text content component with optimal spacing
 */
export function AppsSdkText({
  children,
  size = "base",
  className,
}: {
  children: React.ReactNode;
  size?: "sm" | "base" | "lg";
  className?: string;
}) {
  const sizeStyles = {
    sm: "text-sm leading-relaxed",
    base: "text-base leading-relaxed",
    lg: "text-lg leading-relaxed",
  };

  return (
    <p className={cn(sizeStyles[size], "mb-4 text-gray-700 dark:text-gray-300", className)}>
      {children}
    </p>
  );
}

/**
 * Code block component with syntax highlighting
 */
export function AppsSdkCodeBlock({
  children,
  language,
  title,
  className,
}: {
  children: string;
  language?: string;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700",
        className,
      )}
    >
      {title && (
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
            {language && (
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{language}</span>
            )}
          </div>
        </div>
      )}
      <pre className="bg-gray-900 dark:bg-gray-800 text-gray-100 p-4 overflow-x-auto text-sm">
        <code>{children}</code>
      </pre>
    </div>
  );
}

/**
 * List component with proper spacing
 */
export function AppsSdkList({
  items,
  ordered = false,
  className,
}: {
  items: string[];
  ordered?: boolean;
  className?: string;
}) {
  const Component = ordered ? "ol" : "ul";

  return (
    <Component
      className={cn(
        "mb-4 space-y-2",
        ordered ? "list-decimal" : "list-disc",
        "ml-6 text-gray-700 dark:text-gray-300",
        className,
      )}
    >
      {items.map((item, index) => (
        <li key={index} className="leading-relaxed">
          {item}
        </li>
      ))}
    </Component>
  );
}

/**
 * Table component optimized for documentation
 */
export function AppsSdkTable({
  headers,
  rows,
  className,
}: {
  headers: string[];
  rows: string[][];
  className?: string;
}) {
  return (
    <div className={cn("mb-6 overflow-x-auto", className)}>
      <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Alert/callout component for important information
 */
export function AppsSdkAlert({
  children,
  type = "info",
  title,
  className,
}: {
  children: React.ReactNode;
  type?: "info" | "warning" | "error" | "success";
  title?: string;
  className?: string;
}) {
  const typeStyles = {
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
    warning:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300",
    error:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
    success:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
  };

  return (
    <div className={cn("mb-4 p-4 rounded-lg border", typeStyles[type], className)}>
      {title && <div className="font-medium mb-2">{title}</div>}
      <div className="text-sm">{children}</div>
    </div>
  );
}

/**
 * Link component with external link indicators
 */
export function AppsSdkLink({
  href,
  children,
  external = false,
  className,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline",
        "hover:no-underline transition-colors",
        className,
      )}
    >
      {children}
      {external && <span className="inline-block ml-1 text-xs">↗</span>}
    </a>
  );
}

/**
 * Badge component for tags and labels
 */
export function AppsSdkBadge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "success" | "warning" | "error";
  className?: string;
}) {
  const variantStyles = {
    default: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
    secondary: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    success: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    warning: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
    error: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Divider component for content separation
 */
export function AppsSdkDivider({ className }: { className?: string }) {
  return (
    <hr
      className={cn(
        "my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent",
        className,
      )}
    />
  );
}
