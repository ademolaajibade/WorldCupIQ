import { apiClient } from '../client';
import { LeaderboardEntry } from '../../types';

export type LeaderboardScope = 'global' | 'country' | 'friends';

export const leaderboardApi = {
  get: (scope: LeaderboardScope, page = 1) =>
    apiClient
      .get<{ entries: LeaderboardEntry[]; myRank?: number }>('/leaderboard', {
        params: { scope, page, limit: 20 },
      })
      .then((r) => r.data),

  addFriend: (userId: string) =>
    apiClient.post('/friends', { userId }).then((r) => r.data),
};
