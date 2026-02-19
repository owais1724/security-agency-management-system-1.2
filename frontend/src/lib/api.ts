
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
// Request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        // 1. Try to get token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        // 2. If token exists, FORCE it into the header
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // 3. Ensure credentials (cookies) are also sent as backup
        config.withCredentials = true;

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
                console.warn(`[API] 401 Unauthorized detected at ${method} ${url}. Clearing session state.`);

                // Clear state but DO NOT FORCE REDIRECT loop
                // Let the route guards in the components handle navigation
                useAuthStore.getState().logout();

                // Clear frontend cookie
                if (typeof document !== 'undefined') {
                    document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
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
