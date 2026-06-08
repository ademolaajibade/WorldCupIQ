'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Trophy, Clock, ChevronRight, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { shareScoreCard } from '@/lib/scorecard';
import { toast } from 'sonner';
import type { Session, Question } from '@/types';

interface Props {
  session: Session;
  mode?: 'daily' | 'quick';
  onComplete?: (score: number, total: number) => void;
}

type AnswerState = 'idle' | 'correct' | 'wrong';

const QUESTION_TIME = 20;

export default function TriviaGame({ session, mode = 'quick', onComplete }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(session.currentIndex ?? 0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [score, setScore] = useState(session.score ?? 0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const questions: Question[] = session.questions;
  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const progress = ((currentIndex + 1) / total) * 100;

  const handleTimeout = useCallback(async () => {
    if (selected !== null || submitting) return;
    setSelected(-1);
    setAnswerState('wrong');
    setResults((prev) => [...prev, false]);
    setSubmitting(true);
    try {
      const res = await api.post('/trivia/answer', {
        sessionId: session._id,
        questionId: currentQuestion._id,
        answerIndex: -1,
        timeSpent: QUESTION_TIME,
      });
      setExplanation(res.data.explanation ?? null);
    } catch {}
    setSubmitting(false);
  }, [selected, submitting, session._id, currentQuestion?._id]);

  useEffect(() => {
    if (answerState !== 'idle' || completed) return;
    setTimeLeft(QUESTION_TIME);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(interval); handleTimeout(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIndex, answerState, completed, handleTimeout]);

  async function handleSelect(optionIndex: number) {
    if (answerState !== 'idle' || submitting) return;
    setSelected(optionIndex);
    setSubmitting(true);
    const timeSpent = QUESTION_TIME - timeLeft;
    try {
      const res = await api.post('/trivia/answer', {
        sessionId: session._id,
        questionId: currentQuestion._id,
        answerIndex: optionIndex,
        timeSpent,
      });
      const correct = res.data.correct ?? optionIndex === currentQuestion.correctIndex;
      setAnswerState(correct ? 'correct' : 'wrong');
      setResults((prev) => [...prev, correct]);
      setExplanation(res.data.explanation ?? null);
      if (correct) setScore((s) => s + (res.data.pointsEarned ?? 10));
    } catch {
      const correct = optionIndex === currentQuestion.correctIndex;
      setAnswerState(correct ? 'correct' : 'wrong');
      setResults((prev) => [...prev, correct]);
    }
    setSubmitting(false);
  }

  async function handleNext() {
    if (currentIndex + 1 >= total) {
      try {
        const res = await api.post(`/trivia/session/${session._id}/complete`);
        setFinalScore(res.data.score ?? score);
      } catch {
        setFinalScore(score);
      }
      setCompleted(true);
      onComplete?.(score, total);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setAnswerState('idle');
    setExplanation(null);
  }

  async function handleShare() {
    setSharing(true);
    const correct = results.filter(Boolean).length;
    try {
      await shareScoreCard(
        { mode, correct, total, points: finalScore || score, results, streak: user?.stats?.currentStreak },
        () => toast.success('Score copied to clipboard!'),
      );
    } catch {}
    setSharing(false);
  }

  if (completed) {
    const correct = results.filter(Boolean).length;
    const pct = Math.round((correct / total) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
          <Trophy className="h-12 w-12 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold">{finalScore || score}</h2>
          <p className="mt-1 text-muted-foreground">points earned</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-xl font-bold text-primary">{pct}%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary">{correct}/{total}</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </div>
        </div>

        {/* Emoji grid preview */}
        <div className="flex gap-1.5">
          {results.map((r, i) => (
            <div
              key={i}
              className={cn(
                'h-7 w-7 rounded',
                r ? 'bg-primary' : 'bg-destructive'
              )}
            />
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={handleShare} disabled={sharing} variant="outline" className="gap-2">
            {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            Share score
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Dashboard
          </Button>
          <Button onClick={() => router.push('/leaderboard')}>
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboard
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {total}
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            {score}
          </Badge>
          <Badge
            className={cn(
              'flex items-center gap-1',
              timeLeft <= 5 ? 'bg-destructive/20 text-destructive' : 'bg-card'
            )}
            variant="outline"
          >
            <Clock className="h-3 w-3" />
            {timeLeft}s
          </Badge>
        </div>
      </div>

      <Progress value={progress} className="h-1.5" />

      <div className="flex gap-2">
        <Badge variant="secondary" className="capitalize">{currentQuestion.category}</Badge>
        <Badge
          variant="secondary"
          className={cn(
            'capitalize',
            currentQuestion.difficulty === 'easy' && 'bg-primary/15 text-primary',
            currentQuestion.difficulty === 'medium' && 'bg-accent/15 text-accent',
            currentQuestion.difficulty === 'hard' && 'bg-destructive/15 text-destructive'
          )}
        >
          {currentQuestion.difficulty}
        </Badge>
      </div>

      <p className="text-xl font-semibold leading-snug">{currentQuestion.text}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {currentQuestion.options.map((option, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === currentQuestion.correctIndex;
          const showResult = answerState !== 'idle';
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answerState !== 'idle' || submitting}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition-all',
                !showResult && 'border-border bg-card hover:border-primary hover:bg-primary/5',
                showResult && isCorrect && 'border-primary bg-primary/15 text-primary',
                showResult && isSelected && !isCorrect && 'border-destructive bg-destructive/15 text-destructive',
                showResult && !isSelected && !isCorrect && 'border-border bg-card opacity-50'
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{option}</span>
              {showResult && isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
              {showResult && isSelected && !isCorrect && <XCircle className="h-4 w-4 shrink-0 text-destructive" />}
            </button>
          );
        })}
      </div>

      {answerState !== 'idle' && (
        <div
          className={cn(
            'flex flex-col gap-3 rounded-xl border p-4',
            answerState === 'correct'
              ? 'border-primary/30 bg-primary/10'
              : 'border-destructive/30 bg-destructive/10'
          )}
        >
          <div className="flex items-start gap-3">
            {answerState === 'correct' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            )}
            <div className="flex-1 min-w-0">
              <p className={cn('font-semibold text-sm', answerState === 'correct' ? 'text-primary' : 'text-destructive')}>
                {answerState === 'correct' ? 'Correct!' : 'Wrong!'}
              </p>
              {explanation && (
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{explanation}</p>
              )}
            </div>
          </div>
          <Button onClick={handleNext} size="sm" className="self-end">
            {currentIndex + 1 >= total ? 'Finish' : 'Next question'}
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
