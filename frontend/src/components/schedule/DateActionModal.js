import React from 'react';
import { ICONS } from '../../constants/icons';

const XCircleIcon = ICONS.X_CIRCLE;
const FileTextIcon = ICONS.FILE_TEXT;
const UmbrellaIcon = ICONS.UMBRELLA;
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';

/**
 * 날짜 액션 선택 모달 컴포넌트
 * - 스케줄 등록
 * - 휴가 등록
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-01-02
 */
const DateActionModal = ({
  isOpen,
  onClose,
  selectedDate,
  userRole,
  onScheduleClick,
  onVacationClick
}) => {
  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const canManageSchedule = userRole === 'ADMIN';

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={formatDate(selectedDate)}
      size="auto"
      backdropClick={true}
      showCloseButton={true}
      className="mg-v2-ad-b0kla"
      actions={
        <MGButton type="button" variant="outline" size="medium" onClick={onClose} preventDoubleClick={false}>
          <XCircleIcon size={20} className="mg-v2-icon-inline" />
          취소
        </MGButton>
      }
    >
      <p className="mg-v2-text-secondary mg-v2-mb-lg">원하는 작업을 선택하세요</p>

      {canManageSchedule && (
        <div className="mg-v2-form-section">
          <MGButton
            type="button"
            variant="primary"
            size="medium"
            onClick={onScheduleClick}
            preventDoubleClick={false}
            className="mg-v2-w-full"
          >
            <FileTextIcon size={24} className="mg-v2-icon-inline--lg" />
            <div className="mg-v2-text-left mg-v2-flex-1">
              <div className="mg-v2-text-lg mg-v2-font-semibold">상담 일정 등록</div>
              <div className="mg-v2-text-sm mg-v2-text-secondary">상담사와 내담자의 상담 일정을 등록합니다</div>
            </div>
          </MGButton>

          <MGButton
            type="button"
            variant="secondary"
            size="medium"
            onClick={onVacationClick}
            preventDoubleClick={false}
            className="mg-v2-w-full mg-v2-mt-md"
          >
            <UmbrellaIcon size={24} className="mg-v2-icon-inline--lg" />
            <div className="mg-v2-text-left mg-v2-flex-1">
              <div className="mg-v2-text-lg mg-v2-font-semibold">휴가 등록</div>
              <div className="mg-v2-text-sm mg-v2-text-secondary">상담사의 휴가를 등록합니다</div>
            </div>
          </MGButton>
        </div>
      )}
    </UnifiedModal>
  );
};

export default DateActionModal;
