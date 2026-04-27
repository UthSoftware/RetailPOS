import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
});

// Global error normalisation
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default api;
