// app/notes/new/page.tsx
// 노트 생성 페이지 - 제목과 본문을 입력하여 새 노트 작성
// React Hook Form과 Zod를 사용한 폼 유효성 검증
// 관련 파일: app/actions/notes.ts, lib/validations/notes.ts

'use client';

import { useState } from 'react';
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
import { createNote } from '@/app/actions/notes';

export default function NewNotePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateNoteInput>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  async function onSubmit(data: CreateNoteInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);

      const result = await createNote(formData);

      if (result?.error) {
        setError(result.error);
      }
      // 성공 시 Server Action에서 redirect 처리
    } catch (err) {
      setError('노트 저장에 실패했습니다');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    router.push('/notes');
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            새 노트 작성
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            제목과 본문을 입력하여 노트를 작성하세요
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

              {error && (
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

