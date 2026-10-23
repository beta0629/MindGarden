import React from 'react';
import { CONSULTATION_LOG_SESSION_NUMBER_STRINGS } from '../../../constants/consultationLogAutosaveStrings';
import { toDisplayString } from '../../../utils/safeDisplay';

/**
 * 상담일지 필수 입력 항목 안내
 *
 * @param {{ sessionNumberMissing?: boolean }} props
 */
const ConsultationLogRequiredFieldsNotice = ({ sessionNumberMissing = false }) => {
  const sessionLabel = toDisplayString(
    CONSULTATION_LOG_SESSION_NUMBER_STRINGS.REQUIRED_FIELD_LABEL,
    '회기'
  );
  const baseRequired = '세션 시간, 내담자 상태, 주요 이슈, 개입 방법, 내담자 반응, 위험도 평가, 진행 평가';
  const requiredList = sessionNumberMissing
    ? `${sessionLabel}, ${baseRequired}`
    : baseRequired;

  return (
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
        필수 항목:
        {' '}
        {toDisplayString(requiredList, baseRequired)}
      </p>
      {sessionNumberMissing ? (
        <p
          className="mg-v2-consultation-log-modal__required-notice-text mg-v2-text-danger"
          role="alert"
        >
          {toDisplayString(
            CONSULTATION_LOG_SESSION_NUMBER_STRINGS.REQUIRED_FOR_COMPLETE,
            '일정 회기가 없어 완료할 수 없습니다.'
          )}
        </p>
      ) : null}
    </div>
  );
};

export default ConsultationLogRequiredFieldsNotice;
