// lib/db/index.ts
// Drizzle 클라이언트 인스턴스 및 데이터베이스 연결 관리
// Supabase Postgres와 Drizzle ORM을 연결하는 중앙 인터페이스
// 관련 파일: drizzle/schema.ts, drizzle.config.ts, app/actions/notes.ts

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/drizzle/schema';

// 환경 변수 검증
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
}

// Postgres 클라이언트 생성
const client = postgres(process.env.DATABASE_URL);

// Drizzle 인스턴스 생성
export const db = drizzle(client, { schema });

// 스키마와 타입 재수출
export { schema };
export type { Note, NewNote, NoteTag, NewNoteTag } from '@/drizzle/schema';

