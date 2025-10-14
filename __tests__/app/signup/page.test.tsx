// __tests__/app/signup/page.test.tsx
// 회원가입 페이지 컴포넌트 테스트
// 회원가입 폼이 올바르게 렌더링되고 사용자 상호작용이 정상 작동하는지 확인
// Related: app/signup/page.tsx, lib/validations/auth.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignUpPage from '@/app/signup/page'

// Next.js 라우터 모킹
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

// Server Action 모킹
vi.mock('@/app/actions/auth', () => ({
  signUp: vi.fn(),
}))

describe('SignUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('회원가입 폼이 렌더링되어야 함', () => {
    render(<SignUpPage />)

    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByText('로그인')).toBeInTheDocument()
  })

  it('이메일과 비밀번호 입력이 가능해야 함', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)

    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByPlaceholderText('••••••••')

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('Password123')
  })

  it('비밀번호 표시/숨김 토글이 작동해야 함', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)

    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement
    const toggleButtons = screen.getAllByRole('button', { hidden: true })
    const toggleButton = toggleButtons[0] // 첫 번째 버튼 (토글 버튼)

    // 초기에는 password 타입
    expect(passwordInput.type).toBe('password')

    // 토글 버튼 클릭
    await user.click(toggleButton)
    expect(passwordInput.type).toBe('text')

    // 다시 클릭
    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('잘못된 이메일 형식일 때 에러 메시지를 표시해야 함', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)

    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '회원가입' })

    await user.type(emailInput, 'notanemail')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/올바른 이메일 형식이 아닙니다/)).toBeInTheDocument()
    })
  })

  it('약한 비밀번호일 때 에러 메시지를 표시해야 함', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)

    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitButton = screen.getByRole('button', { name: '회원가입' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/최소 8자/)).toBeInTheDocument()
    })
  })
})

