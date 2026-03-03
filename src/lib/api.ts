import axios from 'axios';

// Use the same IP/hostname as the frontend, but on port 8000
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : `http://${window.location.hostname}:8000`;

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000, // 10 second timeout
});

// Add a request interceptor to include the JWT token in all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.error('API request timed out');
        } else if (!error.response) {
            console.error('Network Error: The server might be down or unreachable', error.message);
        } else {
            console.error('API Error:', error.response.status, error.response.data);
        }
        return Promise.reject(error);
    }
);

export type UserProfile = {
    id: string;
    email: string;
    role: 'user' | 'admin';
    created_at: string;
};

export type LoginAttempt = {
    id?: string;
    attempted_username: string;
    actual_username?: string | null;
    actual_user_id: string | null;
    attempt_success: boolean;
    bypass_detected: boolean;
    bypass_details: any;
    ip_address: string | null;
    user_agent: string | null;
    website_domain: string | null;
    created_at?: string;
};

export type Restriction = {
    id: string;
    identifier: string;
    reason: string;
    expires_at: string;
    created_at: string;
};

export default api;
