// __tests__/lib/utils/highlight.test.ts
// 하이라이팅 유틸리티 함수 테스트
// highlightText, escapeHtml 함수의 동작 검증
// 관련 파일: lib/utils/highlight.ts

import { describe, it, expect } from 'vitest';
import { highlightText, createHighlightedHTML } from '@/lib/utils/highlight';

describe('Highlight Utils', () => {
  describe('highlightText', () => {
    it('검색어가 텍스트에 있을 때 하이라이트해야 함', () => {
      const text = 'JavaScript is a programming language';
      const query = 'JavaScript';
      const result = highlightText(text, query);
      
      expect(result).toContain('<mark class="bg-yellow-200 px-1 rounded">JavaScript</mark>');
      expect(result).toContain('is a programming language');
    });

    it('대소문자 구분 없이 하이라이트해야 함', () => {
      const text = 'JavaScript Programming';
      const query = 'javascript';
      const result = highlightText(text, query);
      
      expect(result).toContain('<mark class="bg-yellow-200 px-1 rounded">JavaScript</mark>');
    });

    it('부분 일치도 하이라이트해야 함', () => {
      const text = '웹 개발 가이드';
      const query = '개발';
      const result = highlightText(text, query);
      
      expect(result).toContain('<mark class="bg-yellow-200 px-1 rounded">개발</mark>');
    });

    it('여러 번 나타나는 검색어를 모두 하이라이트해야 함', () => {
      const text = 'JavaScript is JavaScript programming';
      const query = 'JavaScript';
      const result = highlightText(text, query);
      
      const matches = result.match(/<mark class="bg-yellow-200 px-1 rounded">JavaScript<\/mark>/g);
      expect(matches).toHaveLength(2);
    });

    it('검색어가 없을 때 원본 텍스트를 반환해야 함', () => {
      const text = 'Hello World';
      const query = 'JavaScript';
      const result = highlightText(text, query);
      
      expect(result).toBe('Hello World');
    });

    it('빈 검색어일 때 원본 텍스트를 반환해야 함', () => {
      const text = 'Hello World';
      const query = '';
      const result = highlightText(text, query);
      
      expect(result).toBe('Hello World');
    });

    it('빈 텍스트일 때 빈 문자열을 반환해야 함', () => {
      const text = '';
      const query = 'test';
      const result = highlightText(text, query);
      
      expect(result).toBe('');
    });

    it('HTML 특수문자를 이스케이핑해야 함', () => {
      const text = '<script>alert("test")</script>';
      const query = 'script';
      const result = highlightText(text, query);
      
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&lt;/script&gt;');
      expect(result).not.toContain('<script>');
    });

    it('검색어의 HTML 특수문자도 이스케이핑해야 함', () => {
      const text = 'This is a <test> string';
      const query = '<test>';
      const result = highlightText(text, query);
      
      expect(result).toContain('&lt;test&gt;');
      expect(result).not.toContain('<test>');
    });
  });

  describe('createHighlightedHTML', () => {
    it('HTML 문자열을 안전한 객체로 변환해야 함', () => {
      const htmlString = '<mark>highlighted</mark> text';
      const result = createHighlightedHTML(htmlString);
      
      expect(result).toEqual({ __html: htmlString });
    });

    it('빈 문자열도 처리해야 함', () => {
      const htmlString = '';
      const result = createHighlightedHTML(htmlString);
      
      expect(result).toEqual({ __html: '' });
    });
  });
});
