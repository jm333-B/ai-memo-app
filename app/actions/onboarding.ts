// app/actions/onboarding.ts
// 온보딩 관련 Server Actions
// 사용자 온보딩 상태를 관리하는 서버 액션
// Related: app/onboarding/page.tsx, drizzle/schema.ts, lib/db/index.ts

"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { userProfiles } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { logServerError } from "@/lib/utils/error-handler"

type OnboardingResult = {
  completed: boolean
  error?: string
}

/**
 * 현재 사용자의 온보딩 완료 여부 확인
 */
export async function getOnboardingStatus(): Promise<OnboardingResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { completed: false, error: "인증되지 않은 사용자입니다." }
    }

    // 사용자 프로필 조회
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1)

    if (!profile) {
      // 프로필이 없으면 생성
      await db.insert(userProfiles).values({
        userId: user.id,
        onboardingCompleted: false,
      })
      return { completed: false }
    }

    return { completed: profile.onboardingCompleted }
  } catch (error) {
    logServerError(error, { action: 'getOnboardingStatus' })
    return { completed: false, error: "온보딩 상태 확인 중 오류가 발생했습니다." }
  }
}

/**
 * 온보딩 완료 상태로 업데이트
 */
export async function completeOnboarding(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "인증되지 않은 사용자입니다." }
    }

    // 프로필 업데이트 또는 생성
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1)

    if (existingProfile) {
      // 기존 프로필 업데이트
      await db
        .update(userProfiles)
        .set({
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, user.id))
    } else {
      // 새 프로필 생성
      await db.insert(userProfiles).values({
        userId: user.id,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      })
    }

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    logServerError(error, { action: 'completeOnboarding' })
    return { success: false, error: "온보딩 완료 처리 중 오류가 발생했습니다." }
  }
}

/**
 * 온보딩 재설정 (다시 보기용)
 */
export async function resetOnboarding(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "인증되지 않은 사용자입니다." }
    }

    await db
      .update(userProfiles)
      .set({
        onboardingCompleted: false,
        onboardingCompletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, user.id))

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    logServerError(error, { action: 'resetOnboarding' })
    return { success: false, error: "온보딩 재설정 중 오류가 발생했습니다." }
  }
}

