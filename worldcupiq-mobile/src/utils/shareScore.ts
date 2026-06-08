import { Share } from 'react-native';
import { AnswerResult } from '../types';

export interface ShareScoreData {
  mode: 'daily' | 'quick';
  correct: number;
  total: number;
  points: number;
  results: AnswerResult[];
  streak?: number;
}

export async function shareScore(data: ShareScoreData): Promise<void> {
  const emoji = data.results.map((r) => (r.correct ? '🟩' : '🟥')).join('');
  const label = data.mode === 'daily' ? 'Daily Challenge' : 'Quick Play';
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const lines = [
    `⚽ WorldCupIQ – ${label}`,
    date,
    '',
    emoji,
    '',
    `${data.correct}/${data.total} correct  ·  +${data.points} pts`,
  ];

  if (data.mode === 'daily' && (data.streak ?? 0) > 0) {
    lines.push(`🔥 ${data.streak} day streak`);
  }

  lines.push('', 'Play at worldcupiq.com');

  try {
    await Share.share({ message: lines.join('\n') });
  } catch {}
}
