'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface FadeScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Height of the fade gradient in pixels */
    fadeHeight?: number
    /** Whether to show the top fade when scrolled */
    showTopFade?: boolean
    /** Whether to show the bottom fade when there's more content */
    showBottomFade?: boolean
    /** Custom class for the scroll container */
    scrollClassName?: string
    /** Threshold in pixels before showing fade indicators */
    threshold?: number
    /** 
     * Background color for the gradient fade. 
     * Can be a CSS color value or a CSS variable like 'var(--sidebar)' 
     * Defaults to using the sidebar color.
     */
    fadeColor?: string
}

/**
 * A scrollable container with fade gradients at top/bottom edges
 * and a custom styled scrollbar. The fades appear when there's
 * more content above or below the visible area.
 */
export function FadeScrollArea({
    children,
    className,
    scrollClassName,
    fadeHeight = 32,
    showTopFade = true,
    showBottomFade = true,
    threshold = 10,
    fadeColor = 'hsl(var(--sidebar))',
    ...props
}: FadeScrollAreaProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const [canScrollUp, setCanScrollUp] = React.useState(false)
    const [canScrollDown, setCanScrollDown] = React.useState(false)

    const checkScroll = React.useCallback(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
            setCanScrollUp(scrollTop > threshold)
            setCanScrollDown(scrollTop + clientHeight < scrollHeight - threshold)
        }
    }, [threshold])

    // Check scroll position on mount and content changes
    React.useEffect(() => {
        checkScroll()
        // Also check after images/content load
        const timer = setTimeout(checkScroll, 100)
        return () => clearTimeout(timer)
    }, [checkScroll, children])

    // Use ResizeObserver to detect content size changes
    React.useEffect(() => {
        const scrollElement = scrollRef.current
        if (!scrollElement) return

        const resizeObserver = new ResizeObserver(() => {
            checkScroll()
        })

        resizeObserver.observe(scrollElement)

        // Also observe the scroll content if it exists
        const firstChild = scrollElement.firstElementChild
        if (firstChild) {
            resizeObserver.observe(firstChild)
        }

        return () => resizeObserver.disconnect()
    }, [checkScroll])

    // Extract color for gradient - handle both hsl() and var() formats
    const getGradientColor = (opacity: number) => {
        if (fadeColor.startsWith('hsl(var(')) {
            // It's using a CSS variable like hsl(var(--sidebar))
            const varName = fadeColor.match(/var\((--[\w-]+)\)/)?.[1]
            if (varName) {
                return opacity < 1
                    ? `hsl(var(${varName}) / ${opacity})`
                    : `hsl(var(${varName}))`
            }
        }
        // Fallback - just use the color directly
        return fadeColor
    }

    const topGradient = `linear-gradient(to bottom, ${getGradientColor(1)} 0%, ${getGradientColor(0.6)} 40%, transparent 100%)`
    const bottomGradient = `linear-gradient(to top, ${getGradientColor(1)} 0%, ${getGradientColor(0.6)} 40%, transparent 100%)`

    return (
        <div className={cn('relative overflow-hidden', className)} {...props}>
            {/* Top fade indicator */}
            {showTopFade && canScrollUp && (
                <div
                    className="absolute top-0 inset-x-0 pointer-events-none z-10"
                    style={{ height: fadeHeight, background: topGradient }}
                />
            )}

            {/* Scrollable content */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className={cn(
                    'h-full overflow-y-auto overflow-x-hidden',
                    // Webkit scrollbar styles
                    '[&::-webkit-scrollbar]:w-1.5',
                    '[&::-webkit-scrollbar-track]:bg-transparent',
                    '[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20',
                    '[&::-webkit-scrollbar-thumb]:rounded-full',
                    '[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40',
                    scrollClassName
                )}
            >
                {children}
            </div>

            {/* Bottom fade indicator */}
            {showBottomFade && canScrollDown && (
                <div
                    className="absolute bottom-0 inset-x-0 pointer-events-none z-10"
                    style={{ height: fadeHeight, background: bottomGradient }}
                />
            )}
        </div>
    )
}
