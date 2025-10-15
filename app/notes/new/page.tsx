// app/notes/new/page.tsx
// 노트 생성 페이지 - 제목과 본문을 입력하여 새 노트 작성
// React Hook Form, Zod 유효성 검증, 자동 임시 저장 기능 포함
// 관련 파일: app/actions/notes.ts, lib/validations/notes.ts, hooks/use-auto-save.ts

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useAutoSave } from '@/hooks/use-auto-save';
import { getDraftKey } from '@/lib/utils/draft-storage';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Save, Trash2 } from 'lucide-react';

export default function NewNotePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateNoteInput & { autoGenerateTags: boolean }>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: '',
      content: '',
      autoGenerateTags: false,
    },
  });

  const title = form.watch('title');
  const content = form.watch('content');
  const draftKey = getDraftKey('new');

  // 자동 저장 훅
  const { isSaving, lastSaved, clearDraft } = useAutoSave({
    key: draftKey,
    title,
    content,
    delay: 1500,
    enabled: !isSubmitting,
  });

  // 페이지 이탈 방지
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if ((title.trim() || content.trim()) && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [title, content, isSubmitting]);

  async function onSubmit(data: CreateNoteInput & { autoGenerateTags: boolean }) {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('autoGenerateTags', (data.autoGenerateTags ?? false).toString());

      const result = await createNote(formData);

      if (result?.error) {
        setError(result.error);
      } else {
        // 저장 성공 시 임시 저장 삭제
        clearDraft();
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
    if ((title.trim() || content.trim()) && !confirm('작성 중인 내용이 임시 저장됩니다. 페이지를 벗어나시겠습니까?')) {
      return;
    }
    router.push('/notes');
  }

  function handleClearDraft() {
    if (confirm('임시 저장된 내용을 삭제하시겠습니까?')) {
      clearDraft();
      form.reset();
    }
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

              <FormField
                control={form.control}
                name="autoGenerateTags"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        자동 태그 생성
                      </FormLabel>
                      <p className="text-xs text-gray-500">
                        노트 저장 시 AI가 자동으로 관련 태그를 생성합니다
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {/* 자동 저장 상태 표시 */}
              {(title.trim() || content.trim()) && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {isSaving ? (
                    <>
                      <Save className="h-4 w-4 animate-pulse" />
                      <span>저장 중...</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <Save className="h-4 w-4" />
                      <span>
                        임시 저장됨 - {formatDistanceToNow(lastSaved, { addSuffix: true, locale: ko })}
                      </span>
                    </>
                  ) : null}
                </div>
              )}

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
                {(title.trim() || content.trim()) && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClearDraft}
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    초안 삭제
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
