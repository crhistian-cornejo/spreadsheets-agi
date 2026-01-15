'use client'

import * as React from 'react'
import { useAuth } from '@/lib/supabase'
import { IconUser } from '@tabler/icons-react'

interface UserAvatarProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
    showFallback?: boolean
}

const sizeClasses = {
    sm: 'size-8 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-14 text-lg',
}

export function UserAvatar({ size = 'md', className = '', showFallback = true }: UserAvatarProps) {
    const { profile, user } = useAuth()
    const [imageError, setImageError] = React.useState(false)

    const avatarUrl = profile?.avatar_url
    const displayName = profile?.full_name || user?.email || 'Usuario'
    const initials = getInitials(displayName)

    const handleImageError = () => {
        setImageError(true)
    }

    // Reset error state when avatar URL changes
    React.useEffect(() => {
        setImageError(false)
    }, [avatarUrl])

    if (avatarUrl && !imageError) {
        return (
            <img
                src={avatarUrl}
                alt={displayName}
                onError={handleImageError}
                className={`${sizeClasses[size]} rounded-full object-cover border border-border ${className}`}
            />
        )
    }

    if (showFallback) {
        return (
            <div
                className={`${sizeClasses[size]} rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20 ${className}`}
                title={displayName}
            >
                {initials || <IconUser className="size-4" />}
            </div>
        )
    }

    return null
}

function getInitials(name: string): string {
    if (!name) return ''

    // If it's an email, use first letter
    if (name.includes('@')) {
        return name.charAt(0).toUpperCase()
    }

    // Otherwise, get first letter of first two words
    const words = name.trim().split(/\s+/)
    if (words.length === 1) {
        return words[0].charAt(0).toUpperCase()
    }

    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
}
