import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, FileText } from 'lucide-react';

/**
 * 미작성 상담일지 알림 컴포넌트
 * 
 * @description 미작성 상담일지 개수를 표시하고 바로 작성하기 버튼 제공
 * @param {number} count - 미작성 일지 개수
 * @param {Array} schedules - 미작성 일지 목록 (선택)
 * @param {Function} onAction - "바로 작성하기" 클릭 시 동작
 * @param {string} className - 추가 CSS 클래스
 */
const IncompleteRecordsAlert = ({ 
  count, 
  schedules = [], 
  onAction, 
  className = '' 
}) => {
  if (count === 0) return null;

  return (
    <div className={`mg-v2-alert mg-v2-alert--warning ${className}`}>
      <div className="mg-v2-alert__content">
        <AlertTriangle size={24} className="mg-v2-alert__icon" />
        <div className="mg-v2-alert__text">
          <div className="mg-v2-alert__text-title">
            미작성 상담일지 {count}건
          </div>
          <div className="mg-v2-alert__text-subtitle">
            완료된 상담의 일지를 작성해 주세요.
          </div>
        </div>
      </div>
      <div className="mg-v2-alert__action">
        <button
          className="mg-v2-btn mg-v2-btn-primary mg-v2-btn-md"
          onClick={onAction}
          type="button"
          aria-label={`미작성 상담일지 ${count}건 작성하기`}
        >
          <FileText size={16} />
          바로 작성하기
        </button>
      </div>
    </div>
  );
};

IncompleteRecordsAlert.propTypes = {
  count: PropTypes.number.isRequired,
  schedules: PropTypes.arrayOf(
    PropTypes.shape({
      scheduleId: PropTypes.number.isRequired,
      clientName: PropTypes.string.isRequired,
      consultationDate: PropTypes.string.isRequired
    })
  ),
  onAction: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default IncompleteRecordsAlert;
