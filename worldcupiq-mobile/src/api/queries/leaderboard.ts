import { apiClient } from '../client';
import { LeaderboardEntry } from '../../types';

export type LeaderboardScope = 'global' | 'country' | 'friends';

export const leaderboardApi = {
  get: (scope: LeaderboardScope, page = 1, countryCode?: string) => {
    const params = { page, limit: 20 };
    if (scope === 'global') {
      return apiClient
        .get<{ entries: LeaderboardEntry[]; myRank?: number }>('/leaderboard/global', { params })
        .then((r) => r.data);
    }
    if (scope === 'country') {
      const code = countryCode ?? 'US';
      return apiClient
        .get<{ entries: LeaderboardEntry[]; myRank?: number }>(`/leaderboard/country/${code}`, { params })
        .then((r) => r.data);
    }
    return apiClient
      .get<{ entries: LeaderboardEntry[]; myRank?: number }>('/leaderboard/friends', { params })
      .then((r) => r.data);
  },

  addFriend: (userId: string) =>
    apiClient.post('/users/friends', { userId }).then((r) => r.data),
};
