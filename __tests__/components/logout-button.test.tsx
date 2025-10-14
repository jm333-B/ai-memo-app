// __tests__/components/logout-button.test.tsx
// 로그아웃 버튼 컴포넌트 테스트
// 로그아웃 버튼이 올바르게 렌더링되고 작동하는지 확인
// Related: components/logout-button.tsx, app/actions/auth.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogoutButton } from '@/components/logout-button'

// Next.js 라우터 모킹
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Server Action 모킹
vi.mock('@/app/actions/auth', () => ({
  signOut: vi.fn(),
}))

import { signOut } from '@/app/actions/auth'

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('로그아웃 버튼이 렌더링되어야 함', () => {
    render(<LogoutButton />)

    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument()
  })

  it('버튼 클릭 시 signOut 액션이 호출되어야 함', async () => {
    const user = userEvent.setup()
    const mockSignOut = vi.mocked(signOut)
    mockSignOut.mockResolvedValueOnce({ success: true })

    render(<LogoutButton />)

    const logoutButton = screen.getByRole('button', { name: '로그아웃' })
    await user.click(logoutButton)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })

  it('로그아웃 중 로딩 상태가 표시되어야 함', async () => {
    const user = userEvent.setup()
    const mockSignOut = vi.mocked(signOut)
    mockSignOut.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))

    render(<LogoutButton />)

    const logoutButton = screen.getByRole('button', { name: '로그아웃' })
    await user.click(logoutButton)

    // 로딩 중 버튼 텍스트 변경 확인
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '로그아웃 중...' })).toBeInTheDocument()
    })
  })

  it('로그아웃 실패 시 에러 메시지를 표시해야 함', async () => {
    const user = userEvent.setup()
    const mockSignOut = vi.mocked(signOut)
    mockSignOut.mockResolvedValueOnce({ error: '로그아웃에 실패했습니다. 다시 시도해주세요.' })

    render(<LogoutButton />)

    const logoutButton = screen.getByRole('button', { name: '로그아웃' })
    await user.click(logoutButton)

    await waitFor(() => {
      expect(screen.getByText('로그아웃에 실패했습니다. 다시 시도해주세요.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
    })
  })

  it('재시도 버튼 클릭 시 signOut 액션을 다시 호출해야 함', async () => {
    const user = userEvent.setup()
    const mockSignOut = vi.mocked(signOut)
    mockSignOut.mockResolvedValueOnce({ error: '로그아웃에 실패했습니다. 다시 시도해주세요.' })

    render(<LogoutButton />)

    const logoutButton = screen.getByRole('button', { name: '로그아웃' })
    await user.click(logoutButton)

    // 에러 메시지가 표시될 때까지 대기
    await waitFor(() => {
      expect(screen.getByText('로그아웃에 실패했습니다. 다시 시도해주세요.')).toBeInTheDocument()
    })

    // 재시도 버튼 클릭
    mockSignOut.mockResolvedValueOnce({ success: true })
    const retryButton = screen.getByRole('button', { name: '다시 시도' })
    await user.click(retryButton)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(2)
    })
  })

  it('로딩 중에는 버튼이 비활성화되어야 함', async () => {
    const user = userEvent.setup()
    const mockSignOut = vi.mocked(signOut)
    mockSignOut.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))

    render(<LogoutButton />)

    const logoutButton = screen.getByRole('button', { name: '로그아웃' })
    await user.click(logoutButton)

    await waitFor(() => {
      const button = screen.getByRole('button', { name: '로그아웃 중...' })
      expect(button).toBeDisabled()
    })
  })
})

