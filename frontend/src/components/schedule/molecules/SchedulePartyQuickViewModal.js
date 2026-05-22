import React from 'react';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { useTranslation } from 'react-i18next';

/**
 * 일정 상세 내 내담자·상담사 읽기 전용 요약(중첩 UnifiedModal 1겹).
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {string} props.title
 * @param {number} props.zIndex 부모 일정 상세보다 큰 값
 * @param {Array<{ label: string, value: string }>} props.rows 표시용 문자열 행(부모에서 toDisplayString 등으로 정규화)
 * @param {'client'|'consultant'} props.userManagementType 사용자 관리 쿼리 type=
 * @param {function(string): void} props.onOpenInUserManagement type 인자로 navigate 등 처리
 * @author Core Solution
 * @since 2026-04-30
 */
const SchedulePartyQuickViewModal = ({
  isOpen,
  onClose,
  title,
  zIndex,
  rows,
  userManagementType,
  onOpenInUserManagement
}) => {
  const { t } = useTranslation();
  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="medium"
      className="mg-v2-ad-b0kla"
      backdropClick
      showCloseButton
      zIndex={zIndex}
      actions={(
        <div className="schedule-party-quick-view__actions">
          <MGButton
            type="button"
            variant="outline"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: false,
              className: 'mg-v2-btn--outline'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick={false}
            onClick={onClose}
          >
            {t('common.actions.close', '닫기')}
          </MGButton>
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading: false,
              className: 'mg-v2-btn--primary'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick={false}
            onClick={() => onOpenInUserManagement(userManagementType)}
          >
            사용자 관리에서 열기
          </MGButton>
        </div>
      )}
    >
      <div className="schedule-party-quick-view__body">
        {rows.map((row) => (
          <p key={row.label} className="schedule-party-quick-view__row">
            <span className="schedule-party-quick-view__label">{row.label}:</span>{' '}
            <SafeText tag="span">{row.value}</SafeText>
          </p>
        ))}
      </div>
    </UnifiedModal>
  );
};

export default SchedulePartyQuickViewModal;
