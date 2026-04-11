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

      expect(screen.getByText('10건 매칭됨')).toBeInTheDocument();
      expect(screen.getByText('2건 대기중')).toBeInTheDocument();
      expect(screen.getByText('8건 부여됨')).toBeInTheDocument();
      expect(screen.getByText('1건 의견수렴중')).toBeInTheDocument();
      expect(screen.getByText('배치/일지작성 연동')).toBeInTheDocument();
    });

    it('steps를 직접 전달하면 해당 단계만 렌더된다', () => {
      const customSteps = [
        { title: '1단계', badgeValue: '5건', badgeLabel: '완료', variant: 'success' },
        { title: '2단계', badgeValue: '3건', badgeLabel: '대기', variant: 'warning' }
      ];
      render(<CoreFlowPipeline steps={customSteps} />);

      expect(screen.getByText('1단계')).toBeInTheDocument();
      expect(screen.getByText('2단계')).toBeInTheDocument();
      expect(screen.getByText('5건 완료')).toBeInTheDocument();
      expect(screen.getByText('3건 대기')).toBeInTheDocument();
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
    it('stats가 빈 객체일 때 KPI 배지가 값+라벨 형태로 표시된다', () => {
      render(<CoreFlowPipeline stats={{}} />);

      expect(screen.getByText('— 매칭됨')).toBeInTheDocument();
      expect(screen.getByText('— 대기중')).toBeInTheDocument();
      expect(screen.getByText('— 부여됨')).toBeInTheDocument();
      expect(screen.getByText('— 의견수렴중')).toBeInTheDocument();
      expect(screen.getByText('배치/일지작성 연동')).toBeInTheDocument();
    });

    it('stats 일부만 null이면 해당 단계에 "—"가 표시된다', () => {
      const stats = {
        totalMappings: 5,
        pendingDepositCount: null,
        activeMappings: 0,
        schedulePendingCount: null
      };
      render(<CoreFlowPipeline stats={stats} />);

      expect(screen.getByText('5건 매칭됨')).toBeInTheDocument();
      expect(screen.getByText('0건 부여됨')).toBeInTheDocument();
      expect(screen.getByText('— 대기중')).toBeInTheDocument();
      expect(screen.getByText('— 의견수렴중')).toBeInTheDocument();
    });

    it('schedulePendingCount가 null이면 해당 단계는 "— 의견수렴중"으로 표시된다', () => {
      const stats = {
        totalMappings: 1,
        pendingDepositCount: 0,
        activeMappings: 1,
        schedulePendingCount: null
      };
      render(<CoreFlowPipeline stats={stats} />);

      expect(screen.getByText('— 의견수렴중')).toBeInTheDocument();
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

      const badges = document.querySelectorAll('.pipeline-step-badge[aria-label]');
      expect(badges.length).toBe(5);
      const labels = [...badges].map((el) => el.getAttribute('aria-label'));
      expect(labels).toEqual(
        expect.arrayContaining([
          '3건 매칭됨',
          '1건 대기중',
          '2건 부여됨',
          '0건 의견수렴중',
          '배치/일지작성 연동'
        ])
      );
    });
  });
});
