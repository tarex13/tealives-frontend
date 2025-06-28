{/**Not being used safely delete */}
import axios from 'axios';

// Create Axios instance
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/',  // Update this to your backend base URL
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Intercept requests to add Authorization header
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken'); // Or from your AuthContext
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
         config.headers['X-Requested-With'] = 'XMLHttpRequest';
        return config;
    },
    (error) => Promise.reject(error)
);

// Optional: Intercept responses to handle 401 errors globally
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Optional: Redirect to login or show auth error globally
            console.warn('Unauthorized - Redirecting to Login');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
