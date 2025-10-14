// drizzle/schema.ts
// 데이터베이스 스키마 정의 파일
// Notes 테이블과 관련 인덱스를 Drizzle ORM으로 정의
// 관련 파일: drizzle.config.ts, lib/db/index.ts, app/actions/notes.ts

import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const notes = pgTable(
  'notes',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    userIdIdx: index('notes_user_id_idx').on(table.userId),
    createdAtIdx: index('notes_created_at_idx').on(table.createdAt),
  })
);

// 타입 추출
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

