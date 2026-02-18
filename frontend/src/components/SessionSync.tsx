"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/api"
import { usePathname } from "next/navigation"

export function SessionSync() {
    const { isAuthenticated, logout, login } = useAuthStore()
    const pathname = usePathname()

    useEffect(() => {
        const verifySession = async () => {
            // Public paths that don't need verification
            const isPublicPath = pathname === '/' ||
                pathname.endsWith('/login') ||
                pathname.endsWith('/staff-login')

            if (isPublicPath) return

            try {
                // This will trigger the 401 interceptor if the cookie is gone
                const response = await api.get('/auth/me')
                // If we are authenticated but the store was cleared (e.g. manual localStorage clear)
                if (!isAuthenticated) {
                    login(response.data)
                }
            } catch (error: any) {
                // Interceptor in api.ts already handles logout() and redirect on 401
                console.warn("Session verification failed")
            }
        }

        // Verify on mount
        verifySession()

        // Handle browser back/forward cache (BF Cache)
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                // Page was restored from cache (back button)
                verifySession()
            }
        }

        window.addEventListener('pageshow', handlePageShow)
        return () => window.removeEventListener('pageshow', handlePageShow)
    }, [pathname, isAuthenticated, login, logout])

    return null
}
