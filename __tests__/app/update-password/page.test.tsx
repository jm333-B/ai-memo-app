// __tests__/app/update-password/page.test.tsx
// 새 비밀번호 입력 페이지 테스트
// 새 비밀번호 입력 폼이 올바르게 렌더링되고 작동하는지 확인
// Related: app/update-password/page.tsx, app/actions/auth.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UpdatePasswordPage from '@/app/update-password/page'

// Next.js 라우터 모킹
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Server Action 모킹
vi.mock('@/app/actions/auth', () => ({
  updatePassword: vi.fn(),
}))

import { updatePassword } from '@/app/actions/auth'

describe('UpdatePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('새 비밀번호 입력 폼이 렌더링되어야 함', () => {
    render(<UpdatePasswordPage />)

    expect(screen.getByRole('heading', { name: '새 비밀번호 설정' })).toBeInTheDocument()
    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '비밀번호 변경' })).toBeInTheDocument()
  })

  it('비밀번호와 비밀번호 확인 입력이 가능해야 함', async () => {
    const user = userEvent.setup()
    render(<UpdatePasswordPage />)

    const passwordInput = screen.getByLabelText('새 비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')

    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Password123')

    expect(passwordInput).toHaveValue('Password123')
    expect(confirmPasswordInput).toHaveValue('Password123')
  })

  it('비밀번호 표시/숨김 토글이 작동해야 함', async () => {
    const user = userEvent.setup()
    render(<UpdatePasswordPage />)

    const passwordInput = screen.getByLabelText('새 비밀번호') as HTMLInputElement
    const toggleButtons = screen.getAllByRole('button', { hidden: true })
    const passwordToggle = toggleButtons[0]

    // 초기에는 password 타입
    expect(passwordInput.type).toBe('password')

    // 토글 버튼 클릭
    await user.click(passwordToggle)
    expect(passwordInput.type).toBe('text')

    // 다시 클릭
    await user.click(passwordToggle)
    expect(passwordInput.type).toBe('password')
  })

  it('비밀번호가 일치하지 않을 때 에러 메시지를 표시해야 함', async () => {
    const user = userEvent.setup()
    render(<UpdatePasswordPage />)

    const passwordInput = screen.getByLabelText('새 비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    const submitButton = screen.getByRole('button', { name: '비밀번호 변경' })

    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Password456')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('비밀번호가 일치하지 않습니다')).toBeInTheDocument()
    })
  })

  it('약한 비밀번호일 때 에러 메시지를 표시해야 함', async () => {
    const user = userEvent.setup()
    render(<UpdatePasswordPage />)

    const passwordInput = screen.getByLabelText('새 비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    const submitButton = screen.getByRole('button', { name: '비밀번호 변경' })

    await user.type(passwordInput, 'weak')
    await user.type(confirmPasswordInput, 'weak')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/비밀번호는 최소 8자 이상이어야 합니다/)).toBeInTheDocument()
    })
  })

  it('유효한 비밀번호 제출 시 updatePassword 액션이 호출되어야 함', async () => {
    const user = userEvent.setup()
    const mockUpdatePassword = vi.mocked(updatePassword)
    mockUpdatePassword.mockResolvedValueOnce({ success: true })

    render(<UpdatePasswordPage />)

    const passwordInput = screen.getByLabelText('새 비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    const submitButton = screen.getByRole('button', { name: '비밀번호 변경' })

    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith('Password123')
    })
  })

  it('로딩 중에는 버튼이 비활성화되어야 함', async () => {
    const user = userEvent.setup()
    const mockUpdatePassword = vi.mocked(updatePassword)
    mockUpdatePassword.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))

    render(<UpdatePasswordPage />)

    const passwordInput = screen.getByLabelText('새 비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    const submitButton = screen.getByRole('button', { name: '비밀번호 변경' })

    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Password123')
    await user.click(submitButton)

    await waitFor(() => {
      const button = screen.getByRole('button', { name: '업데이트 중...' })
      expect(button).toBeDisabled()
    })
  })
})

