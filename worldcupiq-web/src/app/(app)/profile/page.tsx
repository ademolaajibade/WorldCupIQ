'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Camera, Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

const schema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional().or(z.literal('')),
  country: z.string().max(2).optional().or(z.literal('')),
  favoriteTeam: z.string().optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data: achievementsData } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get('/users/me/achievements').then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      username: user?.username ?? '',
      country: user?.country ?? '',
      favoriteTeam: user?.favoriteTeam ?? '',
    },
  });

  async function onSubmit(data: FormData) {
    try {
      const res = await api.put('/users/me', data);
      setUser(res.data.user ?? res.data);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    setUploadingAvatar(true);
    try {
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(res.data.user ?? res.data);
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  }

  const initials = user?.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const accuracy =
    user?.stats?.questionsAnswered
      ? Math.round((user.stats.correctAnswers / user.stats.questionsAnswered) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Profile</h1>

      <div className="space-y-6">
        {/* Avatar + plan */}
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatarUrl ?? ''} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                  {initials ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-bold">{user?.displayName}</h2>
              {user?.username && (
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-2">
                <Badge
                  className={
                    user?.subscription?.plan !== 'free'
                      ? 'bg-primary/20 text-primary capitalize'
                      : 'capitalize'
                  }
                  variant="secondary"
                >
                  {user?.subscription?.plan?.replace('_', ' ')}
                </Badge>
                {user?.country && <Badge variant="outline">{user.country}</Badge>}
              </div>
            </div>
            <div className="ml-auto hidden grid-cols-3 gap-6 sm:grid">
              <div className="text-center">
                <p className="text-xl font-bold">{user?.stats?.totalScore?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{accuracy}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{user?.stats?.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Edit profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input id="displayName" {...register('displayName')} />
                  {errors.displayName && (
                    <p className="text-xs text-destructive">{errors.displayName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="e.g. goatfan10" {...register('username')} />
                  {errors.username && (
                    <p className="text-xs text-destructive">{errors.username.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">Country code</Label>
                  <Input id="country" maxLength={2} className="uppercase" placeholder="NG, US, BR…" {...register('country')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="favoriteTeam">Favourite team</Label>
                  <Input id="favoriteTeam" placeholder="Brazil, Argentina…" {...register('favoriteTeam')} />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Achievements */}
        {achievementsData?.achievements?.some((a: { unlocked: boolean }) => a.unlocked) && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">
                Achievements ({achievementsData.achievements.filter((a: { unlocked: boolean }) => a.unlocked).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4" />
              <div className="grid gap-3 sm:grid-cols-2">
                {achievementsData.achievements
                  .filter((a: { unlocked: boolean }) => a.unlocked)
                  .map(
                  (a: { _id: string; iconUrl: string | null; title: string; description: string; category: string; unlockedAt: string }) => (
                    <div
                      key={a._id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      {a.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.iconUrl} alt="" className="h-8 w-8 object-contain" />
                      ) : (
                        <span className="text-2xl">
                          {{ streak: '🔥', accuracy: '🎯', social: '🤝', collection: '📦', special: '⭐' }[a.category] ?? '🏆'}
                        </span>
                      )}
                      <div>
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.description}</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {format(new Date(a.unlockedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
