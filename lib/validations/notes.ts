// lib/validations/notes.ts
// 노트 생성 및 수정을 위한 Zod 유효성 검증 스키마
// 제목과 본문의 필수 여부 및 길이 제한을 정의
// 관련 파일: app/notes/new/page.tsx, app/actions/notes.ts

import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(255, '제목은 최대 255자까지 입력 가능합니다'),
  content: z.string().min(1, '본문을 입력해주세요'),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

