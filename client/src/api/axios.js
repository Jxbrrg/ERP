import axios from 'axios';

const api = axios.create({
  baseURL: __API_URL__,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export default api;
