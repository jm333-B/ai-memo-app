// __tests__/app/login/page.test.tsx
// 로그인 페이지 컴포넌트 테스트
// 로그인 폼이 올바르게 렌더링되고 사용자 상호작용이 정상 작동하는지 확인
// Related: app/login/page.tsx, lib/validations/auth.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'

// Next.js 라우터 모킹
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
}))

// Server Action 모킹
vi.mock('@/app/actions/auth', () => ({
  signIn: vi.fn(),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('로그인 폼이 렌더링되어야 함', () => {
    render(<LoginPage />)

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
    expect(screen.getByText('회원가입')).toBeInTheDocument()
    expect(screen.getByText(/비밀번호를 잊으셨나요?/)).toBeInTheDocument()
  })

  it('이메일과 비밀번호 입력이 가능해야 함', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByPlaceholderText('••••••••')

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('Password123')
  })

  it('비밀번호 표시/숨김 토글이 작동해야 함', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement
    const toggleButtons = screen.getAllByRole('button', { hidden: true })
    const toggleButton = toggleButtons[0]

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
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '로그인' })

    await user.type(emailInput, 'notanemail')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/올바른 이메일 형식이 아닙니다/)).toBeInTheDocument()
    })
  })

  it('비밀번호가 비어있을 때 에러 메시지를 표시해야 함', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '로그인' })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/비밀번호를 입력해주세요/)).toBeInTheDocument()
    })
  })

  it('비밀번호 찾기 링크가 disabled 상태여야 함', () => {
    render(<LoginPage />)

    const forgotPasswordButton = screen.getByText(/비밀번호를 잊으셨나요?/)
    expect(forgotPasswordButton).toBeDisabled()
  })
})

