import React from 'react';
import { Link2, DollarSign, KeyRound, Calendar, Receipt } from 'lucide-react';
import PipelineStepCard from '../molecules/PipelineStepCard';
import './CoreFlowPipeline.css';

/** 기본 5단계 파이프라인 설정 */
const buildDefaultSteps = (stats = {}) => [
  {
    title: '내담자/상담사 매칭 (관리자)',
    badgeValue: `${stats.totalMappings ?? 0}건`,
    badgeLabel: '매칭됨',
    variant: 'success',
    icon: Link2
  },
  {
    title: '입금 확인 (ERP 연동)',
    badgeValue: `${stats.pendingDepositCount ?? 0}건`,
    badgeLabel: '대기중',
    variant: 'warning',
    icon: DollarSign
  },
  {
    title: '회기(세션) 권한 부여',
    badgeValue: `${stats.activeMappings ?? 0}건`,
    badgeLabel: '부여됨',
    variant: 'success',
    icon: KeyRound
  },
  {
    title: '스케줄 등록 (관리자 전담)',
    badgeValue: `${stats.schedulePendingCount ?? 0}건`,
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

/**
 * 5단계 Core Flow Pipeline (Atomic: organism)
 *
 * @param {Object} props
 * @param {Array<{title:string,badgeValue:string,badgeLabel?:string,variant?:string,icon?:React.Component}>} [props.steps] - 단계 배열 (미전달 시 stats로 기본 5단계 생성)
 * @param {Object} [props.stats] - 통계 객체 (totalMappings, pendingDepositCount, activeMappings, schedulePendingCount)
 * @author Core Solution
 * @since 2025-02-21
 */
const CoreFlowPipeline = ({ steps, stats = {} }) => {
  const pipelineSteps = steps ?? buildDefaultSteps(stats);
  return (
    <section className="core-flow-pipeline" aria-label="5단계 핵심 파이프라인">
      <div className="core-flow-pipeline__steps">
        {pipelineSteps.map((step, index) => (
          <React.Fragment key={index}>
            <PipelineStepCard
              title={step.title}
              badgeValue={step.badgeValue}
              badgeLabel={step.badgeLabel}
              variant={step.variant || 'neutral'}
              icon={step.icon}
            />
            {index < pipelineSteps.length - 1 && (
              <div className="core-flow-pipeline__connector" aria-hidden />
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default CoreFlowPipeline;
