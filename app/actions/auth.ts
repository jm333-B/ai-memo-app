// app/actions/auth.ts
// 인증 관련 Server Actions
// 회원가입, 로그인, 로그아웃 등 인증 처리를 위한 서버 액션
// Related: app/signup/page.tsx, app/login/page.tsx, lib/supabase/server.ts, lib/validations/auth.ts

"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { 
  signUpSchema, 
  type SignUpFormData,
  signInSchema,
  type SignInFormData 
} from "@/lib/validations/auth"
import { handleAuthError, logServerError } from "@/lib/utils/error-handler"

type ActionResult = {
  error?: string
  action?: string
  success?: boolean
}

/**
 * 회원가입 Server Action
 * 
 * @param data - 회원가입 폼 데이터 (이메일, 비밀번호)
 * @returns 성공 또는 에러 메시지
 */
export async function signUp(data: SignUpFormData): Promise<ActionResult> {
  try {
    // 서버 사이드 유효성 검증
    const validatedData = signUpSchema.safeParse(data)
    
    if (!validatedData.success) {
      return {
        error: validatedData.error.errors[0]?.message || "입력값이 올바르지 않습니다",
        action: "입력 내용을 확인하고 다시 시도하세요.",
      }
    }

    const { email, password } = validatedData.data

    // Supabase 클라이언트 생성
    const supabase = await createClient()

    // 회원가입 시도
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 이메일 확인 없이 바로 로그인되도록 설정
        // 프로덕션 환경에서는 이메일 확인을 활성화하는 것을 권장
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    // 에러 처리
    if (signUpError) {
      logServerError(signUpError, { action: 'signUp', email })
      const errorInfo = handleAuthError(signUpError)
      return {
        error: errorInfo.message,
        action: errorInfo.action,
      }
    }

    // 회원가입 성공했지만 세션이 없는 경우 (이메일 확인 필요)
    if (!authData.session) {
      return {
        error: "이메일 확인이 필요합니다. 이메일을 확인해주세요.",
        action: "받은 이메일의 확인 링크를 클릭하세요.",
      }
    }

    // 성공: 캐시 재검증
    revalidatePath("/", "layout")
    
    return {
      success: true,
    }
  } catch (error) {
    logServerError(error, { action: 'signUp' })
    const errorInfo = handleAuthError(error)
    return {
      error: errorInfo.message,
      action: errorInfo.action,
    }
  }
}

/**
 * 로그인 Server Action
 * 
 * @param data - 로그인 폼 데이터 (이메일, 비밀번호)
 * @returns 성공 또는 에러 메시지
 */
export async function signIn(data: SignInFormData): Promise<ActionResult> {
  try {
    // 서버 사이드 유효성 검증
    const validatedData = signInSchema.safeParse(data)
    
    if (!validatedData.success) {
      return {
        error: validatedData.error.errors[0]?.message || "입력값이 올바르지 않습니다",
        action: "입력 내용을 확인하고 다시 시도하세요.",
      }
    }

    const { email, password } = validatedData.data

    // Supabase 클라이언트 생성
    const supabase = await createClient()

    // 로그인 시도
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // 에러 처리
    if (signInError) {
      logServerError(signInError, { action: 'signIn', email })
      const errorInfo = handleAuthError(signInError)
      return {
        error: errorInfo.message,
        action: errorInfo.action,
      }
    }

    // 세션이 없는 경우
    if (!authData.session) {
      return {
        error: "로그인에 실패했습니다. 다시 시도해주세요.",
        action: "문제가 계속되면 비밀번호를 재설정하세요.",
      }
    }

    // 성공: 캐시 재검증
    revalidatePath("/", "layout")
    
    return {
      success: true,
    }
  } catch (error) {
    logServerError(error, { action: 'signIn' })
    const errorInfo = handleAuthError(error)
    return {
      error: errorInfo.message,
      action: errorInfo.action,
    }
  }
}

/**
 * 로그아웃 Server Action
 * 
 * @returns 성공 시 로그인 페이지로 리다이렉션, 실패 시 에러 메시지
 */
export async function signOut(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Supabase 로그아웃 (모든 기기에서 세션 종료)
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      logServerError(error, { action: 'signOut' })
      const errorInfo = handleAuthError(error)
      return {
        error: errorInfo.message,
        action: errorInfo.action,
      }
    }

    // 캐시 재검증 및 로그인 페이지로 리다이렉션
    revalidatePath("/", "layout")
    redirect("/login")
  } catch (error) {
    logServerError(error, { action: 'signOut' })
    const errorInfo = handleAuthError(error)
    return {
      error: errorInfo.message,
      action: errorInfo.action,
    }
  }
}

/**
 * 비밀번호 재설정 요청 Server Action
 * 
 * @param email - 재설정 링크를 받을 이메일 주소
 * @returns 성공 또는 에러 메시지 (보안상 모든 경우 성공 메시지 반환)
 */
export async function resetPassword(email: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Supabase 비밀번호 재설정 링크 발송
    // redirectTo: 먼저 /auth/callback으로 가서 토큰을 세션으로 교환한 후 /update-password로 이동
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/update-password`,
    })
    
    // 보안상 이유로 존재하지 않는 이메일도 성공으로 처리
    // 하지만 에러는 로깅
    if (error) {
      logServerError(error, { action: 'resetPassword', email })
    }

    // 항상 성공 반환 (보안)
    return {
      success: true,
    }
  } catch (error) {
    logServerError(error, { action: 'resetPassword' })
    // 보안상 이유로 여전히 성공으로 처리
    return {
      success: true,
    }
  }
}

/**
 * 비밀번호 업데이트 Server Action
 * 
 * @param password - 새 비밀번호
 * @returns 성공 또는 에러 메시지
 */
export async function updatePassword(password: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // 새 비밀번호로 업데이트
    const { error } = await supabase.auth.updateUser({
      password,
    })
    
    if (error) {
      logServerError(error, { action: 'updatePassword' })
      const errorInfo = handleAuthError(error)
      return {
        error: errorInfo.message,
        action: errorInfo.action,
      }
    }

    // 성공: 캐시 재검증
    revalidatePath("/", "layout")
    
    return {
      success: true,
    }
  } catch (error) {
    logServerError(error, { action: 'updatePassword' })
    const errorInfo = handleAuthError(error)
    return {
      error: errorInfo.message,
      action: errorInfo.action,
    }
  }
}

/**
 * 현재 사용자 정보 가져오기
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      logServerError(error, { action: 'getCurrentUser' })
      return null
    }
    
    return user
  } catch (error) {
    logServerError(error, { action: 'getCurrentUser' })
    return null
  }
}

