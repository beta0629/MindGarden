/**
 * AdminMetricsVisualization - 관리자 대시보드 지표 시각화 Organism
 * metrics 배열 + loading + error로 재사용 가능한 지표 영역 렌더.
 * variant="pipeline" 시 CoreFlowPipeline과 동일한 5단계 표시.
 * variant="grid" 시 5단계 타일 그리드, variant="option-c" 시 상단 그리드 + 하단 파이프라인.
 *
 * @param {Object} props
 * @param {Array<{id:string,label:string,value:string|number,badgeLabel?:string,variant?:string,icon?:React.Component}>} props.metrics - 지표 배열 (pipeline 시 단계별 제목·값·배지라벨·variant·아이콘)
 * @param {boolean} [props.loading] - 로딩 시 스켈레톤/로딩 문구
 * @param {string|null} [props.error] - 에러 메시지 (있으면 표시)
 * @param {'pipeline'|'grid'|'option-c'} [props.variant='pipeline'] - pipeline: 5단계 파이프라인, grid: KPI 타일 그리드, option-c: 상단 그리드+하단 파이프라인
 * @param {Object} [props.stats] - variant=pipeline/grid/option-c이고 metrics 비었을 때 사용할 통계 객체 (totalMappings, pendingDepositCount 등)
 * @param {string} [props.className] - 래퍼 추가 클래스
 * @author Core Solution
 * @since 2025-03-15
 */

import React from 'react';
import { Link2, DollarSign, KeyRound, Calendar, Receipt } from 'lucide-react';
import { toErrorMessage } from '../../../../utils/safeDisplay';
import CoreFlowPipeline from './CoreFlowPipeline';
import './AdminMetricsVisualization.css';

const formatCount = (value) => (value != null && typeof value === 'number' ? `${value}건` : '—');

/** CoreFlowPipeline과 동일한 5단계 정의 (stats 기반). grid/option-c용 */
function buildDefaultStepsFromStats(stats = {}) {
  return [
    {
      title: '내담자/상담사 매칭 (관리자)',
      badgeValue: stats.totalMappings != null ? `${stats.totalMappings}건` : '—',
      badgeLabel: '매칭됨',
      variant: 'success',
      icon: Link2
    },
    {
      title: '입금 확인 (ERP 연동)',
      badgeValue: stats.pendingDepositCount != null ? `${stats.pendingDepositCount}건` : '—',
      badgeLabel: '대기중',
      variant: 'warning',
      icon: DollarSign
    },
    {
      title: '회기(세션) 권한 부여',
      badgeValue: stats.activeMappings != null ? `${stats.activeMappings}건` : '—',
      badgeLabel: '부여됨',
      variant: 'success',
      icon: KeyRound
    },
    {
      title: '스케줄 등록 (관리자 전담)',
      badgeValue: formatCount(stats.schedulePendingCount),
      badgeLabel: '의견수렴중',
      variant: 'info',
      icon: Calendar
    },
    {
      title: '자동 회기차감/회계처리 (ERP)',
      badgeValue: '배치/일지작성',
      badgeLabel: '연동',
      variant: 'auto',
      icon: Receipt
    }
  ];
}

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
        <p className="admin-metrics-visualization__error">{toErrorMessage(error)}</p>
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
    const gridSteps = metrics.length > 0 ? metricsToSteps(metrics) : buildDefaultStepsFromStats(stats || {});
    const gridBlock = (
      <div className="admin-metrics-visualization__grid" role="list">
        {loading ? (
          <p className="admin-metrics-visualization__loading" aria-live="polite">로딩 중…</p>
        ) : (
          gridSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={index}
                className={`admin-metrics-visualization__grid-tile admin-metrics-visualization__grid-tile--${step.variant || 'neutral'}`}
                role="listitem"
              >
                <div className="admin-metrics-visualization__grid-tile-accent" aria-hidden="true" />
                <div className="admin-metrics-visualization__grid-tile-content">
                  {Icon && (
                    <div className="admin-metrics-visualization__grid-tile-icon" aria-hidden="true">
                      <Icon size={20} aria-hidden />
                    </div>
                  )}
                  <h3 className="admin-metrics-visualization__grid-tile-title">{step.title}</h3>
                  <span className="admin-metrics-visualization__grid-tile-value">{step.badgeValue}</span>
                  {step.badgeLabel ? (
                    <span className="admin-metrics-visualization__grid-tile-label">{step.badgeLabel}</span>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    );

    if (variant === 'grid') {
      return (
        <section className={wrapperClass} aria-label="지표 시각화">
          {gridBlock}
        </section>
      );
    }

    /* option-c: 상단 그리드 + 하단 파이프라인 */
    const pipelineStepsResolved = metrics.length > 0 ? metricsToSteps(metrics) : undefined;
    const pipelineStatsResolved = metrics.length > 0 ? undefined : (stats || {});
    return (
      <section className={wrapperClass} aria-label="지표 시각화">
        {gridBlock}
        <div className="admin-metrics-visualization__pipeline-wrap">
          <CoreFlowPipeline
            steps={pipelineStepsResolved}
            stats={pipelineStatsResolved}
            loading={loading}
          />
        </div>
      </section>
    );
  }

  return null;
};

export default AdminMetricsVisualization;
