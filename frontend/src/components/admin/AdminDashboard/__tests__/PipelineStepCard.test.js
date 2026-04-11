/**
 * PipelineStepCard 단위·접근성 테스트
 * - title, badgeValue("—" 포함), variant, icon 렌더
 * - article/h3, 아이콘 aria-hidden, 배지 aria-label 검증
 * @see docs/standards/TESTING_STANDARD.md
 * @see docs/project-management/ADMIN_DASHBOARD_METRICS_TEST_PROPOSAL.md
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import PipelineStepCard from '../molecules/PipelineStepCard';

const MockIcon = (props) => <svg data-testid="mock-icon" {...props} />;

describe('PipelineStepCard', () => {
  describe('렌더링', () => {
    it('title과 badgeValue가 표시된다', () => {
      render(
        <PipelineStepCard
          title="테스트 단계"
          badgeValue="5건"
          badgeLabel="완료"
          variant="success"
          icon={MockIcon}
        />
      );

      expect(screen.getByText('테스트 단계')).toBeInTheDocument();
      expect(screen.getByText('5건 완료')).toBeInTheDocument();
    });

    it('badgeValue가 "—"일 때 그대로 표시된다', () => {
      render(
        <PipelineStepCard
          title="대기 단계"
          badgeValue="—"
          badgeLabel="대기중"
          variant="warning"
        />
      );

      expect(screen.getByText(/—\s*대기중/)).toBeInTheDocument();
      expect(screen.getByText('대기 단계')).toBeInTheDocument();
    });

    it('icon이 전달되면 아이콘 영역이 렌더된다', () => {
      render(
        <PipelineStepCard
          title="아이콘 단계"
          badgeValue="0건"
          badgeLabel="라벨"
          icon={MockIcon}
        />
      );

      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('variant에 따라 카드에 해당 클래스가 적용된다', () => {
      const { container } = render(
        <PipelineStepCard
          title="성공 단계"
          badgeValue="1건"
          badgeLabel="완료"
          variant="success"
        />
      );

      const card = container.querySelector('.pipeline-step-card--success');
      expect(card).toBeInTheDocument();
    });
  });

  describe('접근성 (A11y)', () => {
    it('카드는 article 요소로 렌더된다', () => {
      const { container } = render(
        <PipelineStepCard title="제목" badgeValue="0건" badgeLabel="라벨" />
      );

      const article = container.querySelector('article.pipeline-step-card');
      expect(article).toBeInTheDocument();
    });

    it('제목은 h3로 렌더된다', () => {
      render(
        <PipelineStepCard title="단계 제목" badgeValue="3건" badgeLabel="라벨" />
      );

      const heading = screen.getByRole('heading', { level: 3, name: '단계 제목' });
      expect(heading).toBeInTheDocument();
    });

    it('아이콘이 있을 때 아이콘 컨테이너에 aria-hidden이 있다', () => {
      const { container } = render(
        <PipelineStepCard
          title="아이콘 단계"
          badgeValue="0건"
          badgeLabel="라벨"
          icon={MockIcon}
        />
      );

      const iconWrapper = container.querySelector('.pipeline-step-card__icon [aria-hidden]');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('배지가 aria-label로 값과 라벨 의미를 전달한다', () => {
      const { container } = render(
        <PipelineStepCard
          title="배지 단계"
          badgeValue="10건"
          badgeLabel="매칭됨"
          variant="success"
        />
      );

      const badge = container.querySelector('.pipeline-step-badge[aria-label]');
      expect(badge).toBeInTheDocument();
      expect(badge?.getAttribute('aria-label')).toMatch(/10건\s*매칭됨/);
    });
  });
});
