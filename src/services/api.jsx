import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3000/api' });

API.interceptors.request.use((req) => {
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    req.headers.Authorization = `Bearer ${adminToken}`;
  }
  return req;
});

export const fetchUsers = () => API.get('/admin/allUsers');
