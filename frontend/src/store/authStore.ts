import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: string | null;
    agencyId: string | null;
    employeeId: string | null;
    permissions: string[];
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: (user, token) => {
                localStorage.setItem('token', token);
                set({ user, token, isAuthenticated: true });
            },
            logout: () => {
                localStorage.removeItem('token');
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'sams-auth',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
