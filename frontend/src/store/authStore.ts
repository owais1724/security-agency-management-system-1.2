import { create } from 'zustand';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: any; // Can be string or object { id, name, permissions }
    agencyId: string | null;
    employeeId: string | null;
    permissions: string[];
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => void;
}

/**
 * Auth State Store
 * Note: Persistence (localStorage) removed for production security compliance.
 * Session state is automatically re-synchronized using the secure session cookie
 * via the SessionSync component and auth middleware.
 */
export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    login: (user) => {
        set({ user, isAuthenticated: true });
    },
    logout: () => {
        set({ user: null, isAuthenticated: false });
    },
}));
