import React from 'react';

/**
 * 상담일지 필수 입력 항목 안내
 */
const ConsultationLogRequiredFieldsNotice = () => (
  <div
    className="mg-v2-consultation-log-modal__required-notice"
    role="note"
    aria-label="필수 입력 항목 안내"
  >
    <strong className="mg-v2-consultation-log-modal__required-notice-title">
      필수 입력 항목 안내
    </strong>
    <p className="mg-v2-consultation-log-modal__required-notice-text">
      <span className="mg-v2-consultation-log-modal__required-notice-required-mark">*</span>
      {' '}
      표시된 항목은 반드시 입력해야 합니다.
      <br />
      필수 항목: 세션 시간, 내담자 상태, 주요 이슈, 개입 방법, 내담자 반응, 위험도 평가, 진행 평가
    </p>
  </div>
);

export default ConsultationLogRequiredFieldsNotice;
