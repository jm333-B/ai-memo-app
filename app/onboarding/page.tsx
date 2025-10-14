// app/onboarding/page.tsx
// 신규 사용자 온보딩 페이지
// 3단계 온보딩 플로우를 제공하여 서비스 사용법 안내
// Related: app/actions/onboarding.ts, components/ui/button.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { completeOnboarding } from "@/app/actions/onboarding"
import { showSuccessToast, showErrorToast } from "@/lib/utils/toast"
import { Mic, Sparkles, Search, ArrowRight, ArrowLeft } from "lucide-react"

const onboardingSteps = [
  {
    title: "AI 메모장에 오신 것을 환영합니다! 👋",
    description: "음성과 텍스트 입력으로 편리하게 메모하고, AI가 자동으로 요약하고 태깅해드립니다.",
    icon: Sparkles,
    features: [
      "실시간 음성 인식으로 빠른 메모 작성",
      "AI 기반 자동 요약 (3-6 불릿 포인트)",
      "스마트 태깅으로 쉬운 분류 및 검색",
    ],
  },
  {
    title: "핵심 기능 살펴보기 🚀",
    description: "AI 메모장의 강력한 기능들을 확인해보세요.",
    icon: Mic,
    features: [
      {
        icon: Mic,
        title: "음성 메모",
        desc: "마이크 버튼으로 음성을 텍스트로 변환",
      },
      {
        icon: Sparkles,
        title: "AI 요약",
        desc: "긴 메모를 핵심 내용으로 자동 요약",
      },
      {
        icon: Search,
        title: "스마트 검색",
        desc: "태그와 키워드로 빠르게 찾기",
      },
    ],
  },
  {
    title: "이제 시작해볼까요? ✨",
    description: "첫 메모를 작성하고 AI의 도움을 받아보세요!",
    icon: ArrowRight,
    features: [
      "메모 버튼을 클릭하여 새 메모 작성",
      "텍스트 입력 또는 음성 입력 선택",
      "AI가 자동으로 요약하고 태그 생성",
    ],
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === onboardingSteps.length - 1

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = async () => {
    await handleComplete()
  }

  const handleComplete = async () => {
    try {
      setIsLoading(true)
      const result = await completeOnboarding()

      if (result.error) {
        showErrorToast(result.error, "다시 시도해주세요.")
        return
      }

      showSuccessToast("온보딩 완료!", "AI 메모장 사용을 시작하세요.")
      router.push("/notes")
      router.refresh()
    } catch (error) {
      showErrorToast("온보딩 완료 중 오류가 발생했습니다.", "다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  const step = onboardingSteps[currentStep]
  const IconComponent = step.icon

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* 진행 표시기 */}
        <div className="mb-8 flex justify-center gap-2">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-12 rounded-full transition-all ${
                index === currentStep
                  ? "bg-indigo-600"
                  : index < currentStep
                  ? "bg-indigo-300"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* 메인 카드 */}
        <div className="rounded-2xl bg-white p-8 shadow-xl md:p-12">
          {/* 아이콘 */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-indigo-100 p-6">
              <IconComponent className="h-12 w-12 text-indigo-600" />
            </div>
          </div>

          {/* 제목 및 설명 */}
          <h1 className="mb-4 text-center text-3xl font-bold text-gray-900">
            {step.title}
          </h1>
          <p className="mb-8 text-center text-lg text-gray-600">
            {step.description}
          </p>

          {/* 기능 목록 */}
          <div className="mb-8 space-y-4">
            {Array.isArray(step.features) && typeof step.features[0] === 'string' ? (
              // Step 1, 3: 간단한 목록
              step.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-lg bg-gray-50 p-4"
                >
                  <div className="mt-0.5 h-6 w-6 flex-shrink-0 rounded-full bg-indigo-600 text-center text-white">
                    ✓
                  </div>
                  <p className="text-gray-700">{feature}</p>
                </div>
              ))
            ) : (
              // Step 2: 아이콘이 있는 목록
              step.features.map((feature: any, index: number) => {
                const FeatureIcon = feature.icon
                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 rounded-lg border border-gray-200 p-4"
                  >
                    <div className="rounded-lg bg-indigo-50 p-2">
                      <FeatureIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex items-center justify-between gap-4">
            {/* 건너뛰기 */}
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700"
            >
              건너뛰기
            </Button>

            {/* 이전/다음 버튼 */}
            <div className="flex gap-2">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  이전
                </Button>
              )}

              {!isLastStep ? (
                <Button onClick={handleNext} disabled={isLoading}>
                  다음
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={isLoading}>
                  {isLoading ? "처리 중..." : "시작하기"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 단계 표시 */}
        <p className="mt-4 text-center text-sm text-gray-500">
          {currentStep + 1} / {onboardingSteps.length}
        </p>
      </div>
    </div>
  )
}

