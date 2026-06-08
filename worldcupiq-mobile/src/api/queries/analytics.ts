import { apiClient } from '../client';
import { AnalyticsData } from '../../types';

export const analyticsApi = {
  get: () =>
    apiClient
      .get<{ success: boolean; analytics: AnalyticsData }>('/users/me/analytics')
      .then((r) => r.data.analytics),
};
