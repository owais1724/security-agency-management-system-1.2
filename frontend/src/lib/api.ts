
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://security-agency-management-system-12-production.up.railway.app',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for cookies
});


// Request interceptor to inject the token from client-side cookies if present
api.interceptors.request.use((config) => {
    // Only run on client-side
    if (typeof document !== 'undefined') {
        const token = document.cookie
            .split('; ')
            .find((row) => row.startsWith('access_token='))
            ?.split('=')[1];

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || 'Unknown URL';
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';

        // Prepare a cleaner error message
        const message =
            error.response?.data?.message ||
            error.message ||
            "An unexpected error occurred";

        // Automatically logout on 401 Unauthorized - but NOT for the login request itself
        if (status === 401) {
            const isLoginRequest = url.includes('/auth/login');

            if (!isLoginRequest) {
                console.warn(`[API] 401 Unauthorized detected at ${method} ${url}. Clearing session.`);
                useAuthStore.getState().logout();
                // Clear frontend cookie
                if (typeof document !== 'undefined') {
                    document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
                }

                // Do NOT redirect if we are already on a login page
                const isLoginPage = typeof window !== 'undefined' && (
                    window.location.pathname.includes('/login') ||
                    window.location.pathname.includes('/staff-login')
                );

                if (typeof window !== 'undefined' && !isLoginPage) {
                    const path = window.location.pathname;
                    const agencySlug = path.split('/')[1];

                    if (path.includes('/staff')) {
                        window.location.href = `/${agencySlug}/staff-login`;
                    } else if (path.includes('/admin')) {
                        window.location.href = '/admin/login';
                    } else {
                        if (agencySlug && agencySlug !== 'admin') {
                            window.location.href = `/${agencySlug}/login`;
                        } else {
                            window.location.href = '/';
                        }
                    }
                }
            }
        }

        // Log error for debugging
        if (status !== 401 && status !== 403) {
            console.error(`[API] ${method} ${url} Error:`, message);
        }

        // Create a robust error object
        const customError = new Error(Array.isArray(message) ? message.join(', ') : message) as any;
        customError.status = status;
        customError.response = error.response;
        customError.extractedMessage = customError.message;
        customError.config = error.config;

        return Promise.reject(customError);
    }
);

export default api;
