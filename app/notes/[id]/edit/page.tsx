// app/notes/[id]/edit/page.tsx
// 노트 수정 페이지 - 기존 노트의 제목과 본문 수정
// React Hook Form과 Zod를 사용한 폼 유효성 검증
// 관련 파일: app/actions/notes.ts, lib/validations/notes.ts

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { createNoteSchema, type CreateNoteInput } from '@/lib/validations/notes';
import { getNoteById, updateNote } from '@/app/actions/notes';

interface NoteEditPageProps {
  params: Promise<{ id: string }>;
}

export default function NoteEditPage({ params }: NoteEditPageProps) {
  const router = useRouter();
  const [noteId, setNoteId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<CreateNoteInput>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  // 노트 데이터 로드
  useEffect(() => {
    async function loadNote() {
      try {
        const resolvedParams = await params;
        setNoteId(resolvedParams.id);

        const { note, error: fetchError } = await getNoteById(resolvedParams.id);

        if (fetchError || !note) {
          setError(fetchError || '노트를 불러올 수 없습니다');
          setIsLoading(false);
          return;
        }

        // 폼에 기존 데이터 채우기
        form.reset({
          title: note.title,
          content: note.content,
        });

        setIsLoading(false);
      } catch (err) {
        setError('노트를 불러오는 중 오류가 발생했습니다');
        setIsLoading(false);
        console.error(err);
      }
    }

    loadNote();
  }, [params, form]);

  async function onSubmit(data: CreateNoteInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);

      const result = await updateNote(noteId, formData);

      if (result?.error) {
        setError(result.error);
      }
      // 성공 시 Server Action에서 redirect 처리
    } catch (err) {
      setError('노트 수정에 실패했습니다');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    router.push(`/notes/${noteId}`);
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">노트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 발생
  if (error && !form.formState.isDirty) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => router.push('/notes')} className="mt-4">
            노트 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            노트 수정
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            노트의 제목과 본문을 수정하세요
          </p>
        </div>

        <div className="rounded-lg bg-white px-8 py-10 shadow-sm ring-1 ring-gray-900/5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제목</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="노트 제목을 입력하세요"
                        {...field}
                        disabled={isSubmitting}
                        maxLength={255}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>본문</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="노트 내용을 입력하세요"
                        {...field}
                        disabled={isSubmitting}
                        rows={15}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && form.formState.isDirty && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? '저장 중...' : '저장'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

