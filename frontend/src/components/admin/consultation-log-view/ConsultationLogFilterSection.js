/**
 * 상담일지 조회 - 필터 섹션 (상담사·내담자·기간)
 * 역할이 CONSULTANT면 상담사 필터 비노출.
 *
 * @author Core Solution
 * @since 2025-03-02
 */

import React from 'react';
import PropTypes from 'prop-types';

const LABELS = {
  CONSULTANT: '상담사',
  CONSULTANT_PLACEHOLDER: '전체',
  CLIENT: '내담자',
  CLIENT_PLACEHOLDER: '전체',
  DATE_START: '시작일',
  DATE_END: '종료일'
};

const ConsultationLogFilterSection = ({
  isAdmin,
  consultantId,
  consultants,
  onConsultantChange,
  clientId,
  clients,
  onClientChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}) => {
  return (
    <section className="mg-v2-consultation-log-filter" aria-label="상담일지 필터">
      <div className="mg-v2-consultation-log-filter__row">
        {isAdmin && (
          <div className="mg-v2-consultation-log-filter__field">
            <label className="mg-v2-consultation-log-filter__label" htmlFor="consultation-log-consultant">
              {LABELS.CONSULTANT}
            </label>
            <select
              id="consultation-log-consultant"
              className="mg-v2-consultation-log-filter__select"
              value={consultantId ?? ''}
              onChange={(e) => onConsultantChange(e.target.value ? Number(e.target.value) : null)}
              aria-label={LABELS.CONSULTANT}
            >
              <option value="">{LABELS.CONSULTANT_PLACEHOLDER}</option>
              {(consultants || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.userName || `상담사 ${c.id}`}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="mg-v2-consultation-log-filter__field">
          <label className="mg-v2-consultation-log-filter__label" htmlFor="consultation-log-client">
            {LABELS.CLIENT}
          </label>
          <select
            id="consultation-log-client"
            className="mg-v2-consultation-log-filter__select"
            value={clientId ?? ''}
            onChange={(e) => onClientChange(e.target.value ? Number(e.target.value) : null)}
            aria-label={LABELS.CLIENT}
          >
            <option value="">{LABELS.CLIENT_PLACEHOLDER}</option>
            {(clients || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.userName || `내담자 ${c.id}`}
                </option>
            ))}
          </select>
        </div>
        <div className="mg-v2-consultation-log-filter__field">
          <label className="mg-v2-consultation-log-filter__label" htmlFor="consultation-log-start">
            {LABELS.DATE_START}
          </label>
          <input
            id="consultation-log-start"
            type="date"
            className="mg-v2-consultation-log-filter__input"
            value={startDate || ''}
            onChange={(e) => onStartDateChange(e.target.value || null)}
            aria-label={LABELS.DATE_START}
          />
        </div>
        <div className="mg-v2-consultation-log-filter__field">
          <label className="mg-v2-consultation-log-filter__label" htmlFor="consultation-log-end">
            {LABELS.DATE_END}
          </label>
          <input
            id="consultation-log-end"
            type="date"
            className="mg-v2-consultation-log-filter__input"
            value={endDate || ''}
            onChange={(e) => onEndDateChange(e.target.value || null)}
            aria-label={LABELS.DATE_END}
          />
        </div>
      </div>
    </section>
  );
};

ConsultationLogFilterSection.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  consultantId: PropTypes.number,
  consultants: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), name: PropTypes.string, userName: PropTypes.string })),
  onConsultantChange: PropTypes.func.isRequired,
  clientId: PropTypes.number,
  clients: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), name: PropTypes.string, userName: PropTypes.string })),
  onClientChange: PropTypes.func.isRequired,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  onStartDateChange: PropTypes.func.isRequired,
  onEndDateChange: PropTypes.func.isRequired
};

export default ConsultationLogFilterSection;
