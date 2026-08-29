/**
 * AdminMetricsVisualization - 관리자 대시보드 지표 시각화 Organism
 * metrics 배열 + loading + error로 재사용 가능한 지표 영역 렌더.
 * variant="pipeline" 시 CoreFlowPipeline과 동일한 5단계 표시.
 * variant="grid" 시 5단계 타일 그리드, variant="option-c" 시 상단 그리드만(중복 pill 제거).
 *
 * @param {Object} props
 * @param {Array<{id:string,label:string,value:string|number,badgeLabel?:string,variant?:string,icon?:React.Component}>} props.metrics - 지표 배열
 * @param {boolean} [props.loading] - 로딩 시 스켈레톤/로딩 문구
 * @param {string|null} [props.error] - 에러 메시지 (있으면 표시)
 * @param {'pipeline'|'grid'|'option-c'} [props.variant='pipeline'] - pipeline / grid / option-c(그리드만)
 * @param {Object} [props.stats] - metrics 비었을 때 사용할 통계 객체
 * @param {string} [props.className] - 래퍼 추가 클래스
 * @author Core Solution
 * @since 2025-03-15
 */

import React from 'react';
import { Link2, DollarSign, KeyRound, Calendar, Receipt } from 'lucide-react';
import UnifiedLoading from '../../../common/UnifiedLoading';
import SafeErrorDisplay from '../../../common/SafeErrorDisplay';
import { toDisplayString } from '../../../../utils/safeDisplay';
import { KpiNumeral } from '../../../dashboard-v2/atoms';
import CoreFlowPipeline from './CoreFlowPipeline';
import './AdminMetricsVisualization.css';

const COUNT_UNIT = '건';

/** CoreFlowPipeline과 동일한 5단계 정의 (stats 기반). grid용 */
function buildDefaultStepsFromStats(stats = {}) {
  return [
    {
      title: '내담자/상담사 매칭 (관리자)',
      value: stats.totalMappings != null ? stats.totalMappings : '—',
      unit: stats.totalMappings != null ? COUNT_UNIT : '',
      badgeLabel: '매칭됨',
      variant: 'success',
      icon: Link2
    },
    {
      title: '입금 확인 (ERP 연동)',
      value: stats.pendingDepositCount != null ? stats.pendingDepositCount : '—',
      unit: stats.pendingDepositCount != null ? COUNT_UNIT : '',
      badgeLabel: '대기중',
      variant: 'warning',
      icon: DollarSign
    },
    {
      title: '회기(세션) 권한 부여',
      value: stats.activeMappings != null ? stats.activeMappings : '—',
      unit: stats.activeMappings != null ? COUNT_UNIT : '',
      badgeLabel: '부여됨',
      variant: 'success',
      icon: KeyRound
    },
    {
      title: '스케줄 등록 (관리자 전담)',
      value: stats.schedulePendingCount != null && typeof stats.schedulePendingCount === 'number'
        ? stats.schedulePendingCount
        : '—',
      unit: stats.schedulePendingCount != null && typeof stats.schedulePendingCount === 'number'
        ? COUNT_UNIT
        : '',
      badgeLabel: '의견수렴중',
      variant: 'info',
      icon: Calendar
    },
    {
      title: '자동 회기차감/회계처리 (ERP)',
      value: '—',
      unit: '',
      badgeLabel: '배치/일지작성',
      variant: 'auto',
      icon: Receipt
    }
  ];
}

/**
 * metrics 배열을 그리드 타일 형태로 변환
 * @param {Array} metrics
 * @returns {Array}
 */
function metricsToGridSteps(metrics) {
  if (!Array.isArray(metrics) || metrics.length === 0) return [];
  return metrics.map((m) => {
    const isNumber = typeof m.value === 'number';
    return {
      title: m.label || '',
      value: m.value != null ? m.value : '—',
      unit: isNumber ? (m.unit != null ? m.unit : COUNT_UNIT) : (m.unit || ''),
      badgeLabel: m.badgeLabel ?? '',
      variant: m.variant || 'neutral',
      icon: m.icon
    };
  });
}

/**
 * metrics 배열을 CoreFlowPipeline steps 형태로 변환
 * @param {Array} metrics
 * @returns {Array}
 */
function metricsToSteps(metrics) {
  if (!Array.isArray(metrics) || metrics.length === 0) return [];
  return metrics.map((m) => ({
    title: m.label || '',
    badgeValue: m.value != null
      ? (typeof m.value === 'number' ? `${m.value}${COUNT_UNIT}` : String(m.value))
      : '—',
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
  const resolvedVariant = variant === 'option-c' ? 'grid' : variant;
  const wrapperClass = `admin-metrics-visualization admin-metrics-visualization--${resolvedVariant} ${className}`.trim();

  if (error) {
    return (
      <section className={wrapperClass} aria-live="assertive" aria-label="지표 영역">
        <SafeErrorDisplay
          error={error}
          variant="inline"
          icon={false}
          className="admin-metrics-visualization__error"
        />
      </section>
    );
  }

  if (resolvedVariant === 'pipeline') {
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

  if (resolvedVariant === 'grid') {
    const gridSteps = metrics.length > 0
      ? metricsToGridSteps(metrics)
      : buildDefaultStepsFromStats(stats || {});
    return (
      <section className={wrapperClass} aria-label="지표 시각화">
        <div className="admin-metrics-visualization__grid" role="list">
          {loading ? (
            <div className="admin-metrics-visualization__loading">
              <UnifiedLoading type="inline" />
            </div>
          ) : (
            gridSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={index}
                  className={`admin-metrics-visualization__grid-tile admin-metrics-visualization__grid-tile--${step.variant || 'neutral'}`}
                  role="listitem"
                >
                  <div className="admin-metrics-visualization__grid-tile-content">
                    {Icon && (
                      <div className="admin-metrics-visualization__grid-tile-icon" aria-hidden="true">
                        <Icon size={20} aria-hidden />
                      </div>
                    )}
                    <h3 className="admin-metrics-visualization__grid-tile-title">
                      {toDisplayString(step.title)}
                    </h3>
                    <KpiNumeral
                      value={step.value}
                      unit={step.unit}
                      className="admin-metrics-visualization__grid-tile-value"
                    />
                    {step.badgeLabel ? (
                      <span className="admin-metrics-visualization__grid-tile-label">
                        {toDisplayString(step.badgeLabel)}
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    );
  }

  return null;
};

export default AdminMetricsVisualization;
