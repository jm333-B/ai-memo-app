// drizzle/schema.ts
// 데이터베이스 스키마 정의 파일
// Notes 테이블, UserProfiles 테이블과 관련 인덱스를 Drizzle ORM으로 정의
// 관련 파일: drizzle.config.ts, lib/db/index.ts, app/actions/notes.ts

import { pgTable, uuid, text, timestamp, boolean, index, unique } from 'drizzle-orm/pg-core';
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
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('notes_user_id_idx').on(table.userId),
    createdAtIdx: index('notes_created_at_idx').on(table.createdAt),
  })
);

// 사용자 프로필 테이블 (온보딩 상태 포함)
export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull().unique(), // Supabase Auth 사용자 ID
    onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
    onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    userIdIdx: index('user_profiles_user_id_idx').on(table.userId),
  })
);

// AI 요약 테이블
export const summaries = pgTable(
  'summaries',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    noteId: uuid('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    model: text('model').notNull().default('gemini-2.0-flash'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    noteIdIdx: index('summaries_note_id_idx').on(table.noteId),
    createdAtIdx: index('summaries_created_at_idx').on(table.createdAt),
  })
);

// 노트 태그 테이블
export const noteTags = pgTable(
  'note_tags',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    noteId: uuid('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    noteIdIdx: index('note_tags_note_id_idx').on(table.noteId),
    tagIdx: index('note_tags_tag_idx').on(table.tag),
    uniqueNoteTag: unique('unique_note_tag').on(table.noteId, table.tag),
  })
);

// 타입 추출
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type Summary = typeof summaries.$inferSelect;
export type NewSummary = typeof summaries.$inferInsert;
export type NoteTag = typeof noteTags.$inferSelect;
export type NewNoteTag = typeof noteTags.$inferInsert;

