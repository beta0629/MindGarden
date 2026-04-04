import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * 상담일지 필수 입력 항목 안내
 */
const ConsultationLogRequiredFieldsNotice = () => (
  <div className="mg-v2-bg-yellow-50 mg-v2-p-md mg-v2-radius-md mg-v2-border mg-v2-border-yellow-200 mg-flex mg-v2-items-start mg-v2-gap-sm mg-v2-mb-lg mg-v2-consultation-log-modal__required-notice">
    <AlertTriangle size={20} className="mg-v2-text-warning mg-v2-mt-xs" aria-hidden="true" />
    <div>
      <strong className="mg-v2-text-warning mg-v2-font-bold">필수 입력 항목 안내</strong>
      <p className="mg-v2-text-sm mg-v2-text-secondary mg-v2-mt-xs">
        <span className="mg-v2-text-danger">*</span> 표시된 항목은 반드시 입력해야 합니다.
        <br />
        필수 항목: 세션 시간, 내담자 상태, 주요 이슈, 개입 방법, 내담자 반응, 위험도 평가, 진행 평가
      </p>
    </div>
  </div>
);

export default ConsultationLogRequiredFieldsNotice;
