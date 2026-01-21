import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const endpoints = {
  albums: {
    list: '/albums',
    create: '/albums',
    get: (id: string) => `/albums/${id}`,
  },
  images: {
    upload: '/images/upload',
    list: (albumId: string) => `/images/album/${albumId}`,
  },
  shares: {
    create: '/shares',
    validate: (token: string) => `/shares/validate/${token}`,
  },
};
