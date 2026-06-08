import { apiClient } from '../client';
import { AuthResponse, User } from '../../types';
import { transformUser } from '../../utils/transformUser';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }).then((r) => ({
      ...r.data,
      user: transformUser(r.data.user),
    })),

  register: (name: string, email: string, password: string, country?: string) =>
    apiClient
      .post<AuthResponse>('/auth/register', { displayName: name, email, password, country })
      .then((r) => ({ ...r.data, user: transformUser(r.data.user) })),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }).then((r) => r.data),

  getMe: () =>
    apiClient.get<{ user: User }>('/users/me').then((r) => transformUser(r.data.user ?? r.data)),

  updateProfile: (data: Partial<Pick<User, 'name' | 'country'>>) =>
    apiClient
      .put<{ user: User }>('/users/me', { displayName: data.name, country: data.country })
      .then((r) => transformUser(r.data.user ?? r.data)),

  uploadAvatar: (formData: FormData) =>
    apiClient
      .post<{ avatarUrl: string }>('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  logout: () => apiClient.post('/auth/logout').then((r) => r.data),
};
