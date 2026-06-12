import React from 'react';
import { ICONS } from '../../constants/icons';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import ActionBar from '../common/ActionBar';
import ActionBarButton from '../common/ActionBarButton';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import { USER_ROLES, mapLegacyRole } from '../../constants/roles';
import { useTranslation } from 'react-i18next';

const XCircleIcon = ICONS.X_CIRCLE;

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
  const { t } = useTranslation();
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

  // 4종 SSOT: ADMIN(레거시 BRANCH_SUPER_ADMIN 포함)
  const canManageSchedule = mapLegacyRole(userRole) === USER_ROLES.ADMIN;

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
        <ActionBar align="end" gap="md">
          <ActionBarButton variant="outline" onClick={onClose}>
            {t('common.actions.cancel')}
          </ActionBarButton>
        </ActionBar>
      }
    >
      <p className="mg-v2-text-secondary mg-v2-mb-lg">원하는 작업을 선택하세요</p>

      {canManageSchedule && (
        <div className="mg-v2-form-section">
          <MGButton
            type="button"
            variant="primary"
            size="medium"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading: false,
              className: 'mg-v2-w-full'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onScheduleClick}
            preventDoubleClick={false}
          >
            <div className="mg-v2-text-left mg-v2-flex-1">
              <div className="mg-v2-text-lg mg-v2-font-semibold">상담 일정 등록</div>
              <div className="mg-v2-text-sm mg-v2-text-secondary">상담사와 내담자의 상담 일정을 등록합니다</div>
            </div>
          </MGButton>

          <MGButton
            type="button"
            variant="secondary"
            size="medium"
            className={buildErpMgButtonClassName({
              variant: 'secondary',
              size: 'md',
              loading: false,
              className: 'mg-v2-w-full mg-v2-mt-md'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onVacationClick}
            preventDoubleClick={false}
          >
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
