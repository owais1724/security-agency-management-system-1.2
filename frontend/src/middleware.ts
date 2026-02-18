
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Define root paths that are public
    const publicRootPaths = [
        '/',
        '/favicon.ico',
        '/sitemap.xml',
        '/robots.txt'
    ]

    // Check if the current path is a login page
    const isLoginPage = pathname.endsWith('/login') || pathname.endsWith('/staff-login') || pathname === '/'

    // Check for access token cookie
    const token = request.cookies.get('access_token')?.value

    // If user is authenticated and tries to access login page, allow them to see the page
    // but redirect ONLY if they are navigating to the generic root or admin login unnecessarily.
    if (token && isLoginPage && pathname !== '/') {
        const url = request.nextUrl.clone()

        // Only auto-redirect if on the admin login page or a root-level login
        // but let them see the staff-login even if an admin cookie exists.
        if (pathname === '/admin/login') {
            url.pathname = '/admin/dashboard'
            return NextResponse.redirect(url)
        }

        // For other login pages (like agency specific ones), we allow viewing the page
        // so the user can 'switch' accounts/roles if they wish.
        return NextResponse.next()
    }

    // If user is NOT authenticated and tries to access PROTECTED route
    if (!token && !isLoginPage && !publicRootPaths.includes(pathname)) {
        const url = request.nextUrl.clone()

        if (pathname.startsWith('/admin')) {
            url.pathname = '/admin/login'
        } else {
            // Try to extract agency
            const parts = pathname.split('/')
            if (parts.length > 1 && parts[1] && parts[1] !== '_next') {
                if (pathname.includes('/staff')) {
                    url.pathname = `/${parts[1]}/staff-login`
                } else {
                    url.pathname = `/${parts[1]}/login`
                }
            } else {
                url.pathname = '/'
            }
        }
        return NextResponse.redirect(url)
    }

    // Add security headers to response
    const response = NextResponse.next()

    // Add comprehensive security headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
