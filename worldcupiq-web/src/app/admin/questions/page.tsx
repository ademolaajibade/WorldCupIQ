'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Question } from '@/types';

const schema = z.object({
  text: z.string().min(5, 'Question text is required'),
  options: z.array(z.string().min(1, 'Option required')).length(4),
  correctIndex: z.number().min(0).max(3),
  category: z.string().min(1, 'Category required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  year: z.number().optional(),
});
type FormData = z.infer<typeof schema>;

const categories = ['History', 'Players', 'Teams', 'Goals', 'Records', 'Rules', 'Stadiums', 'Misc'];

function QuestionForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      difficulty: 'medium',
      options: ['', '', '', ''],
      correctIndex: 0,
      ...defaultValues,
    },
  });

  const difficulty = watch('difficulty');
  const category = watch('category');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Question</Label>
        <Textarea rows={3} placeholder="Enter question text…" {...register('text')} />
        {errors.text && <p className="text-xs text-destructive">{errors.text.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Options (mark correct answer)</Label>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correctIndex"
              value={i}
              defaultChecked={defaultValues?.correctIndex === i}
              onChange={() => setValue('correctIndex', i)}
              className="h-4 w-4 accent-primary"
            />
            <Input
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              {...register(`options.${i}`)}
            />
          </div>
        ))}
        {errors.correctIndex && (
          <p className="text-xs text-destructive">Select the correct answer</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category ?? ''} onValueChange={(v) => v && setValue('category', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Difficulty</Label>
          <Select value={difficulty} onValueChange={(v) => setValue('difficulty', v as 'easy' | 'medium' | 'hard')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Year (optional)</Label>
        <Input type="number" placeholder="e.g. 2022" {...register('year', { valueAsNumber: true })} />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save question
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AdminQuestionsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Question | null>(null);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-questions', page, search],
    queryFn: () =>
      api.get('/questions', { params: { page, limit, search: search || undefined } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (body: FormData) => api.post('/questions', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-questions'] });
      toast.success('Question created');
      setShowCreate(false);
    },
    onError: () => toast.error('Failed to create question'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: FormData & { id: string }) => api.put(`/questions/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-questions'] });
      toast.success('Question updated');
      setEditQuestion(null);
    },
    onError: () => toast.error('Failed to update question'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/questions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-questions'] });
      toast.success('Question deleted');
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete question'),
  });

  const questions: Question[] = data?.questions ?? [];
  const total: number = data?.total ?? 0;
  const pages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Questions</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString()} total</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search questions…"
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add question
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? [...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(4)].map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : questions.map((q) => (
                  <TableRow key={q._id}>
                    <TableCell className="max-w-xs">
                      <p className="text-sm truncate">{q.text}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize text-xs">{q.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'capitalize text-xs',
                          q.difficulty === 'easy' && 'bg-primary/15 text-primary',
                          q.difficulty === 'medium' && 'bg-accent/15 text-accent',
                          q.difficulty === 'hard' && 'bg-destructive/15 text-destructive'
                        )}
                      >
                        {q.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditQuestion(q)}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(q)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">Page {page} of {pages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add question</DialogTitle></DialogHeader>
          <QuestionForm onSubmit={(d) => createMutation.mutate(d)} isSubmitting={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editQuestion} onOpenChange={() => setEditQuestion(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit question</DialogTitle></DialogHeader>
          {editQuestion && (
            <QuestionForm
              defaultValues={{
                ...editQuestion,
                options: editQuestion.options as [string, string, string, string],
              }}
              onSubmit={(d) => updateMutation.mutate({ ...d, id: editQuestion._id })}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete question</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this question? This cannot be undone.
          </p>
          <p className="text-sm font-medium border border-border rounded p-2 mt-1">{deleteConfirm?.text}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm._id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
