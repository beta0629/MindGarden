import React from 'react';

/**
 * 상담일지 모달 내담자 요약 dl 행 (마크업: mg-v2-detail-item)
 * @param {Object} props
 * @param {string} props.label 라벨
 * @param {React.ReactNode} props.children 값
 * @param {string} [props.className] detail-item 추가 클래스
 */
const ClientSummaryField = ({ label, children, className = '' }) => (
  <div className={['mg-v2-detail-item', className].filter(Boolean).join(' ')}>
    <dt className="mg-v2-detail-label">{label}</dt>
    <dd className="mg-v2-detail-value">{children}</dd>
  </div>
);

export default ClientSummaryField;
