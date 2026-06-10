'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();

  const [dailyNotif, setDailyNotif] = useState(
    user?.settings?.notifications?.daily ?? true
  );
  const [achievementNotif, setAchievementNotif] = useState(
    user?.settings?.notifications?.achievements ?? true
  );
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(
    user?.settings?.theme ?? 'auto'
  );
  const [language, setLanguage] = useState(user?.settings?.language ?? 'en');
  const [resetSent, setResetSent] = useState(false);

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (settings: object) => api.put('/users/me', { settings }).then((r) => r.data),
    onSuccess: (data) => {
      setUser(data.user ?? data);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Settings saved');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  function handleSave() {
    saveMutation.mutate({
      notifications: { daily: dailyNotif, achievements: achievementNotif },
      theme,
      language,
    });
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    try {
      await api.post('/auth/forgot-password', { email: user.email });
      setResetSent(true);
      toast.success('Password reset email sent');
    } catch {
      toast.error('Failed to send reset email');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your preferences and account</p>
      </div>

      {/* Notifications */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription>Control what you get notified about</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-notif" className="flex flex-col gap-0.5">
              <span>Daily challenges</span>
              <span className="text-xs font-normal text-muted-foreground">
                Remind me to complete the daily challenge
              </span>
            </Label>
            <Switch
              id="daily-notif"
              checked={dailyNotif}
              onCheckedChange={setDailyNotif}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="achievement-notif" className="flex flex-col gap-0.5">
              <span>Achievements</span>
              <span className="text-xs font-normal text-muted-foreground">
                Notify me when I unlock an achievement
              </span>
            </Label>
            <Switch
              id="achievement-notif"
              checked={achievementNotif}
              onCheckedChange={setAchievementNotif}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
          <CardDescription>Appearance and language settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label className="flex flex-col gap-0.5">
              <span>Theme</span>
              <span className="text-xs font-normal text-muted-foreground">
                Saved to your account across devices
              </span>
            </Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as typeof theme)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <Label className="flex flex-col gap-0.5">
              <span>Language</span>
              <span className="text-xs font-normal text-muted-foreground">
                Interface language
              </span>
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full sm:w-auto">
        {saveMutation.isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
        ) : (
          'Save changes'
        )}
      </Button>

      {/* Account */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-xs text-muted-foreground">
                {resetSent
                  ? 'Check your email for the reset link'
                  : 'Send a password reset link to your email'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePasswordReset}
              disabled={resetSent}
            >
              {resetSent ? 'Email sent' : 'Reset password'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
