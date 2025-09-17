import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth endpoints
export const auth = {
    login: (credentials: { username: string, password: string }) =>
        api.post('/login', credentials),

    register: (data: any) =>
        api.post('/register', data),

    logout: () =>
        api.post('/logout'),

    me: () =>
        api.get('/me')
};

// Transaction endpoints
export const transactions = {
    create: (data: any) =>
        api.post('/buyer/transactions', data),

    getMyTransactions: () =>
        api.get('/buyer/transactions'),

    getAll: (params?: any) =>
        api.get('/admin/transactions', { params }),

    updateStatus: (id: number, status: string, notes?: string) =>
        api.put(`/admin/transactions/${id}/status`, { status, notes })
};

// Product endpoints
export const products = {
    getAll: () =>
        api.get('/buyer/products'),

    validateRobloxUser: (username: string) =>
        api.get(`/buyer/validate-roblox/${username}`)
};

// Payment methods
export const paymentMethods = {
    getAvailable: () =>
        api.get('/buyer/payment-methods')
};

// Admin endpoints
export const admin = {
    getDashboard: () =>
        api.get('/admin/dashboard'),

    getStatistics: () =>
        api.get('/admin/statistics'),

    // Users management
    getUsers: (params?: any) =>
        api.get('/admin/users', { params }),

    createUser: (data: any) =>
        api.post('/admin/users', data),

    updateUser: (id: number, data: any) =>
        api.put(`/admin/users/${id}`, data),

    deleteUser: (id: number) =>
        api.delete(`/admin/users/${id}`),

    // Products management
    createProduct: (data: any) =>
        api.post('/admin/products', data),

    updateProduct: (id: number, data: any) =>
        api.put(`/admin/products/${id}`, data),

    deleteProduct: (id: number) =>
        api.delete(`/admin/products/${id}`)
};

export default api;