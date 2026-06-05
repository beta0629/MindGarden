/**
 * ActionBar SSOT 단위 테스트
 *
 * MGBUTTON_SSOT_DESIGN_HANDOFF.md v1.1 (2026-06-05) 기반
 * 검증 대상:
 *  - 렌더링 (children 노드)
 *  - data-align / data-gap 속성
 *  - role="group"
 *  - 자식 MGButton 마이그 무결성 (variant primary/outline/danger 모두 렌더 가능)
 *  - className 병합
 *
 * @author MindGarden
 * @since 2026-06-05
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import ActionBar from '../ActionBar';

describe('ActionBar SSOT 컴포넌트', () => {
  describe('렌더링', () => {
    test('children 노드가 그려진다', () => {
      render(
        <ActionBar>
          <button>확인</button>
          <button>취소</button>
        </ActionBar>
      );
      expect(screen.getByText('확인')).toBeInTheDocument();
      expect(screen.getByText('취소')).toBeInTheDocument();
    });

    test('role="group" 이 부여된다', () => {
      render(
        <ActionBar>
          <button>확인</button>
        </ActionBar>
      );
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    test('기본 align="end", gap="md"', () => {
      const { container } = render(
        <ActionBar>
          <button>확인</button>
        </ActionBar>
      );
      const bar = container.querySelector('.mg-actionbar');
      expect(bar).toHaveAttribute('data-align', 'end');
      expect(bar).toHaveAttribute('data-gap', 'md');
    });

    test('align="start" / gap="sm" 도 정상 적용', () => {
      const { container } = render(
        <ActionBar align="start" gap="sm">
          <button>확인</button>
        </ActionBar>
      );
      const bar = container.querySelector('.mg-actionbar');
      expect(bar).toHaveAttribute('data-align', 'start');
      expect(bar).toHaveAttribute('data-gap', 'sm');
    });

    test('className 이 mg-actionbar 와 병합된다', () => {
      const { container } = render(
        <ActionBar className="custom-class">
          <button>확인</button>
        </ActionBar>
      );
      const bar = container.querySelector('.mg-actionbar.custom-class');
      expect(bar).toBeInTheDocument();
    });
  });

  describe('마이그레이션 호환성', () => {
    test('자식 MGButton mock 의 variant 클래스가 보존된다', () => {
      render(
        <ActionBar>
          <button className="mg-button mg-button--primary">확인</button>
          <button className="mg-button mg-button--outline">변경</button>
          <button className="mg-button mg-button--danger">취소</button>
        </ActionBar>
      );
      expect(screen.getByText('확인')).toHaveClass('mg-button--primary');
      expect(screen.getByText('변경')).toHaveClass('mg-button--outline');
      expect(screen.getByText('취소')).toHaveClass('mg-button--danger');
    });
  });
});
