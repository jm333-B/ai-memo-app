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

type ActionResult = {
  error?: string
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
      // 이미 가입된 이메일인 경우
      if (signUpError.message.includes("already registered")) {
        return {
          error: "이미 가입된 이메일입니다",
        }
      }

      // 기타 에러
      return {
        error: signUpError.message || "회원가입에 실패했습니다",
      }
    }

    // 회원가입 성공했지만 세션이 없는 경우 (이메일 확인 필요)
    if (!authData.session) {
      return {
        error: "이메일 확인이 필요합니다. 이메일을 확인해주세요.",
      }
    }

    // 성공: 캐시 재검증 및 리다이렉트
    revalidatePath("/", "layout")
    
    return {
      success: true,
    }
  } catch (error) {
    console.error("SignUp action error:", error)
    return {
      error: "회원가입 중 오류가 발생했습니다. 다시 시도해주세요.",
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
      // 잘못된 인증 정보인 경우
      if (signInError.message.includes("Invalid login credentials")) {
        return {
          error: "이메일 또는 비밀번호가 올바르지 않습니다",
        }
      }

      // 이메일 확인이 필요한 경우
      if (signInError.message.includes("Email not confirmed")) {
        return {
          error: "이메일 확인이 필요합니다. 이메일을 확인해주세요.",
        }
      }

      // 기타 에러
      return {
        error: signInError.message || "로그인에 실패했습니다",
      }
    }

    // 세션이 없는 경우
    if (!authData.session) {
      return {
        error: "로그인에 실패했습니다. 다시 시도해주세요.",
      }
    }

    // 성공: 캐시 재검증
    revalidatePath("/", "layout")
    
    return {
      success: true,
    }
  } catch (error) {
    console.error("SignIn action error:", error)
    return {
      error: "로그인 중 오류가 발생했습니다. 다시 시도해주세요.",
    }
  }
}

/**
 * 로그아웃 Server Action
 */
export async function signOut(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return {
        error: error.message,
      }
    }

    revalidatePath("/", "layout")
    redirect("/login")
  } catch (error) {
    console.error("SignOut action error:", error)
    return {
      error: "로그아웃 중 오류가 발생했습니다",
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
      return null
    }
    
    return user
  } catch (error) {
    console.error("GetCurrentUser error:", error)
    return null
  }
}

