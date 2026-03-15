import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthenticatedApi } from './useAuthenticatedApi'

export interface BrandKit {
    colors: string[];
    fonts: { family: string, url: string }[];
}

export function useBrandKits() {
    const { session } = useAuth()
    const { isAuthenticated } = useAuthenticatedApi()
    const [brandKit, setBrandKit] = useState<BrandKit | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchBrandKit = useCallback(async () => {
        if (!isAuthenticated || !session?.user?.id) return

        setIsLoading(true)
        setError(null)
        try {
            // Assuming you have an authenticatedFetch or just standard fetch
            const res = await fetch(`/api/brand-kits?userId=${session.user.id}`)

            if (!res.ok) {
                throw new Error('Failed to fetch brand kit')
            }
            const data = await res.json()

            // Load fonts dynamically into the document head
            if (data.brandKit?.fonts && data.brandKit.fonts.length > 0) {
                data.brandKit.fonts.forEach((font: any) => {
                    if (!document.getElementById(`font-${font.family}`)) {
                        const style = document.createElement('style')
                        style.id = `font-${font.family}`
                        style.innerHTML = `
              @font-face {
                font-family: '${font.family}';
                src: url('${font.url}');
              }
            `
                        document.head.appendChild(style)
                    }
                })
            }

            setBrandKit(data.brandKit)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [isAuthenticated, session?.user?.id])

    const saveBrandKit = useCallback(async (colors: string[], fonts: { family: string, url: string }[]) => {
        if (!isAuthenticated || !session?.user?.id) return

        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/brand-kits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: session.user.id,
                    colors,
                    fonts
                })
            })

            if (!res.ok) {
                throw new Error('Failed to save brand kit')
            }

            const data = await res.json()
            setBrandKit(data.brandKit)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [isAuthenticated, session?.user?.id])

    return {
        brandKit,
        isLoading,
        error,
        fetchBrandKit,
        saveBrandKit
    }
}
