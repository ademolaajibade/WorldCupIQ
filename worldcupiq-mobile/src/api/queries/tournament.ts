import { apiClient } from '../client';
import { TournamentChallenge, GameSession } from '../../types';

export const tournamentApi = {
  listChallenges: () =>
    apiClient
      .get<{ success: boolean; challenges: TournamentChallenge[] }>('/tournament/challenges')
      .then((r) => r.data.challenges),

  startChallenge: (id: string) =>
    apiClient
      .post<GameSession & { challenge: { title: string; badge: string } }>(
        `/tournament/challenges/${id}/start`
      )
      .then((r) => r.data),
};
