// src/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // const navigate = useNavigate(); // Can't use useNavigate here, AuthProvider is outside Router usually

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchProfile = async () => {
        setLoading(true); // Ensure loading is true when fetching
        try {
            const response = await axios.get('/api/profile/');
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            // If profile fetch fails (e.g., token expired), log out
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                logoutAndClearState(); // Use a specific function for this
            }
        } finally {
            setLoading(false);
        }
    };

    const login = (tokens, userData) => {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
        setUser(userData);
        // Navigation should happen in the component calling login
    };

    const logoutAndClearState = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        // Do not navigate here directly, as AuthProvider might not be within Router context
        // Navigation after logout should be handled by components or a redirect mechanism
    };
    
    const logout = () => {
        logoutAndClearState();
        // Components can react to user being null and redirect.
        // Forcing navigation here can be problematic if AuthProvider isn't a child of BrowserRouter.
        // A common pattern is to have a component observe `user` and redirect.
        // Or, the component calling logout can handle navigation.
        // window.location.href = '/login'; // A harder redirect if needed.
    };


    const value = {
        user,
        login,
        logout,
        loading,
        fetchProfile // Expose fetchProfile if needed elsewhere
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};