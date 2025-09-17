// services/api.ts
import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Request interceptor - add token to headers
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Clear auth data
            Cookies.remove('token');
            Cookies.remove('user');
            // Redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth service functions
export const authService = {
    // Login function
    async login(username: string, password: string) {
        try {
            const response = await api.post('/login', {
                username,
                password
            });
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Login failed' };
        }
    },

    // Get current user
    async getCurrentUser() {
        try {
            const response = await api.get('/me');
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to get user data' };
        }
    },

    // Logout
    async logout() {
        try {
            await api.post('/logout');
            Cookies.remove('token');
            Cookies.remove('user');
            window.location.href = '/login';
        } catch (error) {
            // Even if API fails, clear local data
            Cookies.remove('token');
            Cookies.remove('user');
            window.location.href = '/login';
        }
    },

    // Check if user is admin
    async checkAdminAccess() {
        try {
            const response = await api.get('/check-admin');
            return response.data;
        } catch (error) {
            return { success: false, is_admin: false };
        }
    }
};

export default api;