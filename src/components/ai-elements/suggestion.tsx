'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

export type SuggestionsProps = ComponentProps<typeof ScrollArea> & {
  /** Layout mode: 'horizontal' for scrollable row, 'wrap' for wrapping grid */
  layout?: 'horizontal' | 'wrap'
}

export const Suggestions = ({
  className,
  children,
  layout = 'horizontal',
  ...props
}: SuggestionsProps) => {
  if (layout === 'wrap') {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center justify-center gap-2',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <ScrollArea className="w-full overflow-x-auto" {...props}>
      <div
        className={cn(
          // Mobile: 2-column grid for uniform sizing, Desktop: horizontal scroll
          'grid grid-cols-2 gap-2',
          'sm:flex sm:flex-nowrap sm:items-center sm:justify-start sm:gap-2',
          'sm:w-max',
          className,
        )}
      >
        {children}
      </div>
      <ScrollBar className="hidden" orientation="horizontal" />
    </ScrollArea>
  )
}

export type SuggestionProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
  suggestion: string
  onClick?: (suggestion: string) => void
}

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant = 'outline',
  size = 'sm',
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = () => {
    onClick?.(suggestion)
  }

  return (
    <Button
      className={cn(
        'cursor-pointer rounded-full',
        // Height and padding for uniform appearance
        'h-auto py-2 min-h-[2.75rem]',
        // Responsive padding and text
        'px-3 sm:px-4 text-xs sm:text-sm',
        // Mobile: stretch to fill grid cell, Desktop: auto width
        'w-full sm:w-auto',
        // Text behavior
        'whitespace-normal sm:whitespace-nowrap',
        'text-center leading-tight',
        // Flex to center multi-line text
        'flex items-center justify-center',
        className,
      )}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children || suggestion}
    </Button>
  )
}
