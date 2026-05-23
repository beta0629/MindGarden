/**
 * UnifiedLoading SSOT 단위 테스트
 *
 * 검증 대상:
 *  - props 정규화 (size / tone / variant / inline / overlay / type)
 *  - 접근성 (role=status, aria-live, aria-busy, aria-label)
 *  - 클래스명 (mg-loading*, tone, size variant)
 *  - 텍스트 표시 / 숨김 (showText, label)
 *  - 레거시 호환 (small/medium/large)
 *
 * @author MindGarden
 * @since 2026-05-23
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import UnifiedLoading from '../UnifiedLoading';

describe('UnifiedLoading SSOT 컴포넌트', () => {
  describe('접근성', () => {
    test('role="status" 가 부여된다', () => {
      render(<UnifiedLoading text="로딩 중..." />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('aria-live="polite" 가 부여된다', () => {
      render(<UnifiedLoading text="로딩 중..." />);
      const region = screen.getByRole('status');
      expect(region).toHaveAttribute('aria-live', 'polite');
    });

    test('aria-busy="true" 가 부여된다', () => {
      render(<UnifiedLoading text="로딩 중..." />);
      const region = screen.getByRole('status');
      expect(region).toHaveAttribute('aria-busy', 'true');
    });

    test('label prop이 있으면 aria-label로 사용된다', () => {
      render(<UnifiedLoading label="데이터를 불러오는 중" showText={false} />);
      expect(
        screen.getByRole('status', { name: '데이터를 불러오는 중' })
      ).toBeInTheDocument();
    });

    test('label이 없으면 text가 aria-label로 사용된다', () => {
      render(<UnifiedLoading text="저장 중..." />);
      expect(screen.getByRole('status', { name: '저장 중...' })).toBeInTheDocument();
    });

    test('label/text 모두 없으면 디폴트 "로딩 중" 사용', () => {
      render(<UnifiedLoading text="" label="" />);
      expect(screen.getByRole('status', { name: '로딩 중' })).toBeInTheDocument();
    });
  });

  describe('size 정규화', () => {
    test.each([
      ['xs', 'mg-loading--xs'],
      ['sm', 'mg-loading--sm'],
      ['md', 'mg-loading--md'],
      ['lg', 'mg-loading--lg'],
      ['xl', 'mg-loading--xl']
    ])('size="%s" → 클래스 "%s"', (size, expectedClass) => {
      const { container } = render(<UnifiedLoading size={size} />);
      expect(container.querySelector(`.${expectedClass}`)).not.toBeNull();
    });

    test.each([
      ['small', 'mg-loading--sm'],
      ['medium', 'mg-loading--md'],
      ['large', 'mg-loading--lg']
    ])('레거시 size="%s" → 신규 클래스 "%s"', (size, expectedClass) => {
      const { container } = render(<UnifiedLoading size={size} />);
      expect(container.querySelector(`.${expectedClass}`)).not.toBeNull();
    });

    test('알 수 없는 size → "md" 로 폴백', () => {
      const { container } = render(<UnifiedLoading size="huge" />);
      expect(container.querySelector('.mg-loading--md')).not.toBeNull();
    });
  });

  describe('tone 정규화', () => {
    test.each([
      ['primary', 'mg-loading--tone-primary'],
      ['secondary', 'mg-loading--tone-secondary'],
      ['success', 'mg-loading--tone-success'],
      ['danger', 'mg-loading--tone-danger'],
      ['neutral', 'mg-loading--tone-neutral']
    ])('tone="%s" → 클래스 "%s"', (tone, expectedClass) => {
      const { container } = render(<UnifiedLoading tone={tone} />);
      expect(container.querySelector(`.${expectedClass}`)).not.toBeNull();
    });

    test('알 수 없는 tone → "primary" 폴백', () => {
      const { container } = render(<UnifiedLoading tone="rainbow" />);
      expect(container.querySelector('.mg-loading--tone-primary')).not.toBeNull();
    });
  });

  describe('variant 렌더링', () => {
    test('variant="spinner" → .mg-loading-spinner-icon', () => {
      const { container } = render(<UnifiedLoading variant="spinner" />);
      expect(container.querySelector('.mg-loading-spinner-icon')).not.toBeNull();
    });

    test('variant="dots" → .mg-loading-dot 3개', () => {
      const { container } = render(<UnifiedLoading variant="dots" />);
      expect(container.querySelectorAll('.mg-loading-dot')).toHaveLength(3);
    });

    test('variant="pulse" → .mg-loading-pulse-circle', () => {
      const { container } = render(<UnifiedLoading variant="pulse" />);
      expect(container.querySelector('.mg-loading-pulse-circle')).not.toBeNull();
    });

    test('variant="bars" → .mg-loading-bar 4개', () => {
      const { container } = render(<UnifiedLoading variant="bars" />);
      expect(container.querySelectorAll('.mg-loading-bar')).toHaveLength(4);
    });

    test('알 수 없는 variant → spinner 폴백', () => {
      const { container } = render(<UnifiedLoading variant="oddball" />);
      expect(container.querySelector('.mg-loading-spinner-icon')).not.toBeNull();
    });
  });

  describe('컨테이너 타입 (type / inline / overlay)', () => {
    test('기본은 inline 컨테이너', () => {
      const { container } = render(<UnifiedLoading />);
      expect(container.querySelector('.mg-loading-container--inline')).not.toBeNull();
    });

    test('overlay → fullscreen 컨테이너', () => {
      const { container } = render(<UnifiedLoading overlay />);
      expect(
        container.querySelector('.mg-loading-container--fullscreen')
      ).not.toBeNull();
    });

    test('inline=true → inline 컨테이너', () => {
      const { container } = render(<UnifiedLoading inline />);
      expect(container.querySelector('.mg-loading-container--inline')).not.toBeNull();
    });

    test('type prop이 inline/overlay 보다 우선', () => {
      const { container } = render(<UnifiedLoading inline type="page" />);
      expect(container.querySelector('.mg-loading-container--page')).not.toBeNull();
    });
  });

  describe('텍스트 표시 / 숨김', () => {
    test('showText=true (기본) → 텍스트 표시', () => {
      render(<UnifiedLoading text="잠시만요" />);
      expect(screen.getByText('잠시만요')).toBeInTheDocument();
    });

    test('showText=false → 텍스트 미표시', () => {
      render(<UnifiedLoading text="잠시만요" showText={false} />);
      expect(screen.queryByText('잠시만요')).not.toBeInTheDocument();
    });

    test('text 없으면 텍스트 영역 미렌더', () => {
      const { container } = render(<UnifiedLoading text="" />);
      expect(container.querySelector('.mg-loading-text')).toBeNull();
    });
  });

  describe('className 병합', () => {
    test('custom className 추가됨', () => {
      const { container } = render(<UnifiedLoading className="custom-wrapper" />);
      expect(
        container.querySelector('.mg-loading-container.custom-wrapper')
      ).not.toBeNull();
    });
  });

  describe('애니메이션 keyframe (DOM 검증)', () => {
    test('spinner-icon 요소 존재 (등속 회전 SSOT 클래스 보장)', () => {
      const { container } = render(<UnifiedLoading variant="spinner" size="md" />);
      const icon = container.querySelector('.mg-loading-spinner-icon');
      expect(icon).not.toBeNull();
      // CSS는 jest-dom 환경에서 직접 계산되지 않으므로 클래스 기반 검증으로 대체한다.
      // 실제 animation/transform-origin/will-change 값은 시각 회귀(core-tester) 단계에서 확인.
    });
  });
});
