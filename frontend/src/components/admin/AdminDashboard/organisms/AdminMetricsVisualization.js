/**
 * AdminMetricsVisualization - 관리자 대시보드 지표 시각화 Organism
 * metrics 배열 + loading + error로 재사용 가능한 지표 영역 렌더.
 * variant="pipeline" 시 CoreFlowPipeline과 동일한 5단계 표시.
 * 옵션 C 적용 시 상단 그리드 + 하단 파이프라인 조합은 별도 스펙 반영 후 확장.
 *
 * @param {Object} props
 * @param {Array<{id:string,label:string,value:string|number,badgeLabel?:string,variant?:string,icon?:React.Component}>} props.metrics - 지표 배열 (pipeline 시 단계별 제목·값·배지라벨·variant·아이콘)
 * @param {boolean} [props.loading] - 로딩 시 스켈레톤/로딩 문구
 * @param {string|null} [props.error] - 에러 메시지 (있으면 표시)
 * @param {'pipeline'|'grid'|'option-c'} [props.variant='pipeline'] - pipeline: 5단계 파이프라인, grid: KPI 타일 그리드, option-c: 상단 그리드+하단 파이프라인(placeholder)
 * @param {Object} [props.stats] - variant=pipeline이고 metrics 비었을 때 CoreFlowPipeline에 전달할 통계 객체 (totalMappings, pendingDepositCount 등)
 * @param {string} [props.className] - 래퍼 추가 클래스
 * @author Core Solution
 * @since 2025-03-15
 */

import React from 'react';
import CoreFlowPipeline from './CoreFlowPipeline';
import './AdminMetricsVisualization.css';

/**
 * metrics 배열을 CoreFlowPipeline steps 형태로 변환
 * @param {Array} metrics
 * @returns {Array<{title:string,badgeValue:string,badgeLabel:string,variant:string,icon?:React.Component}>}
 */
function metricsToSteps(metrics) {
  if (!Array.isArray(metrics) || metrics.length === 0) return [];
  return metrics.map((m) => ({
    title: m.label || '',
    badgeValue: m.value != null ? (typeof m.value === 'number' ? `${m.value}건` : String(m.value)) : '—',
    badgeLabel: m.badgeLabel ?? '',
    variant: m.variant || 'neutral',
    icon: m.icon
  }));
}

const AdminMetricsVisualization = ({
  metrics = [],
  loading = false,
  error = null,
  variant = 'pipeline',
  stats = null,
  className = ''
}) => {
  const wrapperClass = `admin-metrics-visualization admin-metrics-visualization--${variant} ${className}`.trim();

  if (error) {
    return (
      <section className={wrapperClass} aria-live="assertive" aria-label="지표 영역">
        <p className="admin-metrics-visualization__error">{error}</p>
      </section>
    );
  }

  if (variant === 'pipeline') {
    const steps = metricsToSteps(metrics);
    const useSteps = steps.length > 0;
    const pipelineSteps = useSteps ? steps : undefined;
    const pipelineStats = useSteps ? undefined : (stats || {});
    return (
      <section className={wrapperClass} aria-label="지표 시각화">
        <CoreFlowPipeline steps={pipelineSteps} stats={pipelineStats} loading={loading} />
      </section>
    );
  }

  if (variant === 'grid' || variant === 'option-c') {
    /* 옵션 C 적용 시: 상단 그리드 + 하단 파이프라인. 현재는 pipeline 우선 구현으로 placeholder만 명시 */
    return (
      <section className={wrapperClass} aria-label="지표 시각화">
        <p className="admin-metrics-visualization__placeholder">
          {variant === 'option-c' ? '옵션 C 적용 시 상단 그리드 + 하단 파이프라인' : 'grid 레이아웃 적용 시 KPI 타일 그리드'}
        </p>
      </section>
    );
  }

  return null;
};

export default AdminMetricsVisualization;
