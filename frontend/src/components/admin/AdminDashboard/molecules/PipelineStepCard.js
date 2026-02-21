import React from 'react';
import PipelineStepBadge from '../atoms/PipelineStepBadge';
import './PipelineStepCard.css';

/**
 * 파이프라인 단계 카드 (Atomic: molecule)
 * Core Flow Pipeline의 단일 단계 표시
 *
 * @param {Object} props
 * @param {string} props.title - 단계 제목
 * @param {string|number} props.value - 배지 표시값
 * @param {'neutral'|'warning'|'success'|'info'|'auto'} props.variant - 스타일 변형
 * @param {React.ReactNode} props.icon - Lucide 아이콘 컴포넌트
 * @author MindGarden
 * @since 2025-02-21
 */
const PipelineStepCard = ({ title, badgeValue, badgeLabel, variant = 'neutral', icon: Icon }) => {
  return (
    <article className={`pipeline-step-card pipeline-step-card--${variant}`}>
      {Icon && (
        <div className="pipeline-step-card__icon">
          <Icon size={20} aria-hidden />
        </div>
      )}
      <div className="pipeline-step-card__content">
        <h3 className="pipeline-step-card__title">{title}</h3>
        <PipelineStepBadge value={badgeValue} label={badgeLabel || ''} variant={variant} />
      </div>
    </article>
  );
};

export default PipelineStepCard;
