import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const inputGroupVariants = cva(
  "relative flex items-center border border-input bg-background rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
  {
    variants: {},
    defaultVariants: {}
  }
)

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof inputGroupVariants>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(inputGroupVariants({ className }))}
      {...props}
    />
  )
})
InputGroup.displayName = "InputGroup"

const inputGroupAddonVariants = cva(
  "flex items-center justify-center px-3 text-muted-foreground",
  {
    variants: {
      align: {
        "inline-start": "border-r",
        "inline-end": "border-l",
        "block-start": "border-b",
        "block-end": "border-t"
      }
    },
    defaultVariants: {
      align: "inline-start"
    }
  }
)

const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof inputGroupAddonVariants>
>(({ className, align, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(inputGroupAddonVariants({ align, className }))}
      {...props}
    />
  )
})
InputGroupAddon.displayName = "InputGroupAddon"

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex-1 bg-transparent px-3 py-2 text-base transition-colors placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      data-slot="input-group-control"
      {...props}
    />
  )
})
InputGroupInput.displayName = "InputGroupInput"

const inputGroupButtonVariants = cva(
  "relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        xs: "h-8 rounded-md px-2",
        "icon-xs": "h-8 w-8",
        "icon-sm": "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "ghost",
      size: "xs"
    }
  }
)

const InputGroupButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof inputGroupButtonVariants>
>(({ className, variant, size, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn("border-0 rounded-none", className)}
      {...props}
    />
  )
})
InputGroupButton.displayName = "InputGroupButton"

export {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
}