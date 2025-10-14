// vitest.setup.ts
// Vitest 테스트 환경 초기 설정
// Testing Library와 Jest DOM을 설정하고 전역 테스트 환경 구성
// Related: vitest.config.ts

import '@testing-library/jest-dom'
import dotenv from 'dotenv'

// 환경 변수 로드
dotenv.config({ path: '.env.local' })

