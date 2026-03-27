import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const authService = {
  async signup(data: any) {
    const response = await axios.post(`${API_URL}/auth/signup`, data);
    return response.data;
  },

  async login(data: any) {
    const response = await axios.post(`${API_URL}/auth/login`, data);
    return response.data;
  },
};
