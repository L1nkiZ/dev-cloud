import { createContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, logout as logoutApi } from './authService.js';

export interface AuthUser {
    id: string;
    email: string;
    username: string;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if user is already logged in on mount
    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const response = await getCurrentUser();
            setUser(response.user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await logoutApi();
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const refreshUser = async () => {
        await checkUser();
    };

    const value: AuthContextType = {
        user,
        loading,
        isAuthenticated: !!user,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
