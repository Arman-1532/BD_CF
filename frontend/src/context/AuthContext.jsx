import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser && accessToken) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse stored user', e);
                logout();
            }
        }
        setLoading(false);
    }, [accessToken]);

    const updateLocalUser = (updatedFields) => {
        setUser(prev => {
            const newUserData = { ...prev, ...updatedFields };
            localStorage.setItem('user', JSON.stringify(newUserData));
            return newUserData;
        });
    };

    const login = (userData, tokens) => {
        setUser(userData);
        setAccessToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    const refreshAuthToken = async () => {
        const storedRefresh = localStorage.getItem('refreshToken');
        if (!storedRefresh) {
            logout();
            return null;
        }

        try {
            const res = await fetch('/api/auth/refresh-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: storedRefresh })
            });
            const data = await res.json();
            if (!res.ok) {
                logout();
                return null;
            }

            setAccessToken(data.accessToken);
            setRefreshToken(data.refreshToken);
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            return data.accessToken;
        } catch (err) {
            logout();
            return null;
        }
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, refreshToken, login, logout, refreshAuthToken, updateLocalUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
