import { apiClient } from '../client';
import { GameSession, GameResults, AnswerResult } from '../../types';

export const triviaApi = {
  startDaily: () =>
    apiClient.post<GameSession>('/trivia/daily/start').then((r) => r.data),

  startQuick: (opts?: { difficulty?: string; category?: string }) =>
    apiClient.post<GameSession>('/trivia/quick/start', opts ?? {}).then((r) => r.data),

  submitAnswer: (sessionId: string, questionId: string, answer: string) =>
    apiClient
      .post<AnswerResult>('/trivia/answer', { sessionId, questionId, answer })
      .then((r) => r.data),

  finishSession: (sessionId: string) =>
    apiClient.post<GameResults>('/trivia/finish', { sessionId }).then((r) => r.data),

  getDailyStatus: () =>
    apiClient.get<{ completed: boolean; score?: number }>('/trivia/daily/status').then((r) => r.data),
};
