// lib/ai/gemini-client.ts
// Gemini API 클라이언트 초기화
// Google Gen AI SDK를 사용하여 Gemini API와 통신하기 위한 클라이언트 설정
// 관련 파일: lib/ai/gemini-api.ts, lib/errors/ai-errors.ts

import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

// GoogleGenAI 클라이언트 초기화
// 서버 사이드 전용 - 클라이언트에서 절대 사용 금지
export const genAI = new GoogleGenAI({ apiKey });

// 최신 모델 설정
export const MODEL_NAME = 'gemini-2.0-flash';

