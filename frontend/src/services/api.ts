/// <reference types="vite/client" /> 
// <--- ADICIONADO: Referência para tipos do Vite client-side

import axios, { AxiosError } from 'axios';

// A URL base da sua API backend.
const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? '/react-todo/api' // <--- ALTERADO AQUI para incluir /react-todo/
  : 'http://150.162.244.21:3001/api'; // Use o IP do seu VPS aqui durante o desenvolvimento no VPS

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Erro no intercetor de requisição Axios:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { data, status, headers } = error.response;
      console.error('Erro de Resposta da API:', data);
      console.error('Status do Erro:', status);
      console.error('Cabeçalhos do Erro:', headers);

      if (status === 401) {
        console.warn('Erro 401: Não autorizado. A limpar token...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        // Considerar chamar uma função de logout do AuthContext ou emitir um evento
        // para que a UI reaja e redirecione para /login.
        // window.location.href = '/login'; // Evitar, causa full page reload
      } else if (status === 403) {
        console.warn('Erro 403: Acesso proibido.');
      } else if (status >= 500) {
        console.error('Erro interno do servidor (5xx).');
      }
    } else if (error.request) {
      console.error('Erro de Requisição (sem resposta do servidor):', error.request);
    } else {
      console.error('Erro ao Configurar Requisição Axios:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

