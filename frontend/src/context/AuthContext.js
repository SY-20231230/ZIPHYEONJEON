import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from 'api/apiClient';

// 1. 컨텍스트 생성
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const updateAuthState = useCallback((token) => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser({
                    email: decoded.sub,
                    role: decoded.auth,
                    ...decoded
                });
                setIsAuthenticated(true);
            } catch (error) {
                console.error("[Auth] Session Token Invalid:", error);
                sessionStorage.removeItem('accessToken');
                setUser(null);
                setIsAuthenticated(false);
            }
        } else {
            setUser(null);
            setIsAuthenticated(false);
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = sessionStorage.getItem('accessToken');
            if (storedToken) {
                updateAuthState(storedToken);
            }
            setIsLoading(false);
        };
        initAuth();
    }, [updateAuthState]);

    /**
     * 💡 [추가된 회원가입 로직]
     * AuthPage에서 전달한 formData를 백엔드로 전송합니다.
     */
    const signup = useCallback(async (formData) => {
        try {
            // 백엔드의 /api/auth/signup 엔티티와 통신
            const response = await apiClient.post('/api/auth/signup', formData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("[Auth] Signup Error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "회원가입 신청에 실패했습니다."
            };
        }
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            const response = await apiClient.post('/api/auth/login', { email, password });
            const { accessToken } = response.data;

            sessionStorage.setItem('accessToken', accessToken);
            updateAuthState(accessToken);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || "보안 인증에 실패했습니다."
            };
        }
    }, [updateAuthState]);

    const logout = useCallback(() => {
        sessionStorage.removeItem('accessToken');
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/';
    }, []);

    // 💡 6. 성능 최적화: signup 함수를 value에 반드시 추가해야 합니다!
    const value = useMemo(() => ({
        user,
        isAuthenticated,
        isLoading,
        login,
        signup, // 👈 여기가 빠져있어서 에러가 났던 겁니다!
        logout
    }), [user, isAuthenticated, isLoading, login, signup, logout]);

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};