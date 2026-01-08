import api from '../api/axios';

export const helloService = {
  async getHello() {
    const response = await api.get<{ hello: string }>('/');
    return response.data;
  }
};