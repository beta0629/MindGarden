/**
 * CoreFlowPipeline 단위·접근성 테스트
 * - stats 전달 시 5단계 렌더, loading 시 로딩 문구, stats null/0일 때 "—" 표시
 * - 파이프라인 섹션 aria-label, 연결선 aria-hidden, 배지 의미 전달 검증
 * @see docs/standards/TESTING_STANDARD.md
 * @see docs/project-management/ADMIN_DASHBOARD_METRICS_TEST_PROPOSAL.md
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import CoreFlowPipeline from '../organisms/CoreFlowPipeline';

describe('CoreFlowPipeline', () => {
  describe('5단계 렌더링', () => {
    it('stats 전달 시 기본 5단계 카드가 렌더된다', () => {
      const stats = {
        totalMappings: 10,
        pendingDepositCount: 2,
        activeMappings: 8,
        schedulePendingCount: 1
      };
      render(<CoreFlowPipeline stats={stats} />);

      expect(screen.getByText('내담자/상담사 매칭 (관리자)')).toBeInTheDocument();
      expect(screen.getByText('입금 확인 (ERP 연동)')).toBeInTheDocument();
      expect(screen.getByText('회기(세션) 권한 부여')).toBeInTheDocument();
      expect(screen.getByText('스케줄 등록 (관리자 전담)')).toBeInTheDocument();
      expect(screen.getByText('자동 회기차감/회계처리 (ERP)')).toBeInTheDocument();

      expect(screen.getByText('10건')).toBeInTheDocument();
      expect(screen.getByText('2건')).toBeInTheDocument();
      expect(screen.getByText('8건')).toBeInTheDocument();
      expect(screen.getByText('1건')).toBeInTheDocument();
    });

    it('steps를 직접 전달하면 해당 단계만 렌더된다', () => {
      const customSteps = [
        { title: '1단계', badgeValue: '5건', badgeLabel: '완료', variant: 'success' },
        { title: '2단계', badgeValue: '3건', badgeLabel: '대기', variant: 'warning' }
      ];
      render(<CoreFlowPipeline steps={customSteps} />);

      expect(screen.getByText('1단계')).toBeInTheDocument();
      expect(screen.getByText('2단계')).toBeInTheDocument();
      expect(screen.getByText('5건')).toBeInTheDocument();
      expect(screen.getByText('3건')).toBeInTheDocument();
      expect(screen.queryByText('내담자/상담사 매칭 (관리자)')).not.toBeInTheDocument();
    });
  });

  describe('로딩 상태', () => {
    it('loading=true일 때 "로딩 중…" 문구가 표시된다', () => {
      render(<CoreFlowPipeline stats={{}} loading />);

      expect(screen.getByText('로딩 중…')).toBeInTheDocument();
      expect(screen.queryByText('내담자/상담사 매칭 (관리자)')).not.toBeInTheDocument();
    });

    it('loading=true일 때 로딩 영역에 aria-live="polite"가 있다', () => {
      render(<CoreFlowPipeline stats={{}} loading />);

      const loadingEl = screen.getByText('로딩 중…').closest('[aria-live="polite"]');
      expect(loadingEl).toBeInTheDocument();
    });
  });

  describe('stats null/0 시 "—" 표시', () => {
    it('stats가 빈 객체일 때 단계별로 "—"가 표시된다', () => {
      render(<CoreFlowPipeline stats={{}} />);

      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it('stats 일부만 null이면 해당 단계에 "—"가 표시된다', () => {
      const stats = {
        totalMappings: 5,
        pendingDepositCount: null,
        activeMappings: 0,
        schedulePendingCount: null
      };
      render(<CoreFlowPipeline stats={stats} />);

      expect(screen.getByText('5건')).toBeInTheDocument();
      expect(screen.getByText('0건')).toBeInTheDocument();
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it('schedulePendingCount가 null이면 해당 단계는 "—"로 표시된다', () => {
      const stats = {
        totalMappings: 1,
        pendingDepositCount: 0,
        activeMappings: 1,
        schedulePendingCount: null
      };
      render(<CoreFlowPipeline stats={stats} />);

      const dashValues = screen.getAllByText('—');
      expect(dashValues.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('접근성 (A11y)', () => {
    it('파이프라인 섹션에 aria-label="5단계 핵심 파이프라인"이 있다', () => {
      render(<CoreFlowPipeline stats={{}} />);

      const section = document.querySelector('section[aria-label="5단계 핵심 파이프라인"]');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('core-flow-pipeline');
    });

    it('연결선(connector)에 aria-hidden이 적용되어 있다', () => {
      render(<CoreFlowPipeline stats={{ totalMappings: 1 }} />);

      const connectors = document.querySelectorAll('.core-flow-pipeline__connector[aria-hidden]');
      expect(connectors.length).toBeGreaterThanOrEqual(1);
    });

    it('단계 카드는 article로 렌더되고 제목은 h3이다', () => {
      render(<CoreFlowPipeline stats={{ totalMappings: 1 }} />);

      const articles = document.querySelectorAll('.pipeline-step-card');
      expect(articles.length).toBe(5);
      const firstCard = document.querySelector('.pipeline-step-card');
      expect(firstCard?.tagName).toBe('ARTICLE');
      const heading = firstCard?.querySelector('h3.pipeline-step-card__title');
      expect(heading).toBeInTheDocument();
    });

    it('배지가 의미를 전달하는 aria-label을 가진다', () => {
      render(
        <CoreFlowPipeline
          stats={{
            totalMappings: 3,
            pendingDepositCount: 1,
            activeMappings: 2,
            schedulePendingCount: 0
          }}
        />
      );

      const badgeWithAriaLabel = document.querySelector(
        '.pipeline-step-badge[aria-label]'
      );
      expect(badgeWithAriaLabel).toBeInTheDocument();
      expect(badgeWithAriaLabel?.getAttribute('aria-label')).toMatch(/\d+건|—/);
    });
  });
});
