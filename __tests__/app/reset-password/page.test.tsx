// __tests__/app/reset-password/page.test.tsx
// 비밀번호 재설정 요청 페이지 테스트
// 비밀번호 재설정 요청 폼이 올바르게 렌더링되고 작동하는지 확인
// Related: app/reset-password/page.tsx, app/actions/auth.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResetPasswordPage from '@/app/reset-password/page'

// Next.js 라우터 모킹
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Server Action 모킹
vi.mock('@/app/actions/auth', () => ({
  resetPassword: vi.fn(),
}))

import { resetPassword } from '@/app/actions/auth'

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비밀번호 재설정 요청 폼이 렌더링되어야 함', () => {
    render(<ResetPasswordPage />)

    expect(screen.getByRole('heading', { name: '비밀번호 재설정' })).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '재설정 링크 발송' })).toBeInTheDocument()
    expect(screen.getByText(/비밀번호가 기억나셨나요?/)).toBeInTheDocument()
  })

  it('이메일 입력이 가능해야 함', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordPage />)

    const emailInput = screen.getByLabelText('이메일')
    await user.type(emailInput, 'test@example.com')

    expect(emailInput).toHaveValue('test@example.com')
  })

  it('잘못된 이메일 형식일 때 에러 메시지를 표시해야 함', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordPage />)

    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '재설정 링크 발송' })

    await user.type(emailInput, 'notanemail')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/올바른 이메일 형식이 아닙니다/)).toBeInTheDocument()
    })
  })

  it('유효한 이메일 제출 시 성공 메시지를 표시해야 함', async () => {
    const user = userEvent.setup()
    const mockResetPassword = vi.mocked(resetPassword)
    mockResetPassword.mockResolvedValueOnce({ success: true })

    render(<ResetPasswordPage />)

    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '재설정 링크 발송' })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com')
      expect(screen.getByRole('heading', { name: '이메일을 확인하세요' })).toBeInTheDocument()
      expect(screen.getByText(/비밀번호 재설정 링크를 이메일로 발송했습니다/)).toBeInTheDocument()
    })
  })

  it('로딩 중에는 버튼이 비활성화되어야 함', async () => {
    const user = userEvent.setup()
    const mockResetPassword = vi.mocked(resetPassword)
    mockResetPassword.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))

    render(<ResetPasswordPage />)

    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '재설정 링크 발송' })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      const button = screen.getByRole('button', { name: '발송 중...' })
      expect(button).toBeDisabled()
    })
  })
})

