import { apiClient } from '../client';
import { AdminStats, AdminUser, AdminQuestion, PaginatedResponse } from '../../types';

export const adminApi = {
  getStats: () =>
    apiClient.get<AdminStats>('/admin/stats').then((r) => r.data),

  getUsers: (page = 1, search = '') =>
    apiClient
      .get<PaginatedResponse<AdminUser>>('/admin/users', { params: { page, limit: 20, search } })
      .then((r) => r.data),

  banUser: (userId: string) =>
    apiClient.post(`/admin/users/${userId}/ban`).then((r) => r.data),

  unbanUser: (userId: string) =>
    apiClient.post(`/admin/users/${userId}/unban`).then((r) => r.data),

  changeRole: (userId: string, role: 'user' | 'admin') =>
    apiClient.patch(`/admin/users/${userId}/role`, { role }).then((r) => r.data),

  getQuestions: (page = 1, search = '') =>
    apiClient
      .get<PaginatedResponse<AdminQuestion>>('/admin/questions', { params: { page, limit: 20, search } })
      .then((r) => r.data),

  createQuestion: (data: Omit<AdminQuestion, '_id' | 'isActive'>) =>
    apiClient.post<AdminQuestion>('/admin/questions', data).then((r) => r.data),

  updateQuestion: (id: string, data: Partial<AdminQuestion>) =>
    apiClient.patch<AdminQuestion>(`/admin/questions/${id}`, data).then((r) => r.data),

  deleteQuestion: (id: string) =>
    apiClient.delete(`/admin/questions/${id}`).then((r) => r.data),
};
