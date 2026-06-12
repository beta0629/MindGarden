/**
 * 스케줄 헤더 컴포넌트 (Presentational)
 * B0KlA 스타일, 매핑 리스트 헤더와 동일한 레이아웃 패턴
 *
 * @author Core Solution
 * @since 2025-02-22
 */
import PropTypes from 'prop-types';
import { Calendar, RefreshCw } from 'lucide-react';
import { toDisplayString } from '../../../utils/safeDisplay';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { USER_ROLES, mapLegacyRole } from '../../../constants/roles';
import { useTranslation } from 'react-i18next';
import ClientFilterMultiSelect from '../../admin/mapping-management/integrated-schedule/molecules/ClientFilterMultiSelect';

const ScheduleHeader = ({
  userRole,
  consultants,
  selectedConsultantId,
  loadingConsultants,
  onConsultantChange,
  onRefresh,
  hideTitle = false,
  showClientFilter = false,
  clients = [],
  selectedClientIds = [],
  onClientFilterChange
}) => {
  const { t } = useTranslation();
  const headerClassName = hideTitle
    ? 'mg-v2-schedule-header mg-v2-schedule-header--no-title'
    : 'mg-v2-schedule-header';

  // 4종 SSOT: ADMIN(레거시 BRANCH_SUPER_ADMIN 포함) 또는 STAFF
  const normalizedRole = mapLegacyRole(userRole);
  const isAdminRole = normalizedRole === USER_ROLES.ADMIN;
  const isAdminLikeRole = isAdminRole || normalizedRole === USER_ROLES.STAFF;

  const clientFilterTriggerLabel = t(
    'integratedSchedule.filter.clientLabel',
    { defaultValue: '내담자 필터' }
  );
  const clientFilterSelectedLabelTemplate = t(
    'integratedSchedule.filter.clientSelected',
    { count: 0, defaultValue: '내담자 {{count}}명' }
  );
  const buildSelectedLabel = (count) => t(
    'integratedSchedule.filter.clientSelected',
    { count, defaultValue: clientFilterSelectedLabelTemplate.replace('{{count}}', String(count)) }
  );
  const clientFilterAriaLabel = t(
    'integratedSchedule.filter.ariaLabel',
    {
      count: selectedClientIds.length,
      defaultValue: `내담자 필터 — ${selectedClientIds.length}명 선택됨`
    }
  );

  return (
    <div className={headerClassName}>
      {!hideTitle && (
        <div className="mg-v2-schedule-header__title">
          <Calendar size={20} className="mg-v2-schedule-header__icon" />
          <h2 className="mg-v2-schedule-title">스케줄 관리</h2>
        </div>
      )}
      <div className="mg-v2-schedule-header__actions">
        {isAdminRole && (
          <select
            value={selectedConsultantId}
            onChange={onConsultantChange}
            className="mg-v2-schedule-header__select"
            aria-label="상담사 필터"
          >
            <option value="">전체 상담사</option>
            {loadingConsultants ? (
              <option disabled>상담사 목록을 불러오는 중...</option>
            ) : (
              consultants.map(consultant => (
                <option key={consultant.id} value={consultant.id}>
                  {toDisplayString(consultant.name, '—')}
                </option>
              ))
            )}
          </select>
        )}
        {showClientFilter && isAdminLikeRole && (
          <ClientFilterMultiSelect
            options={clients}
            value={selectedClientIds}
            onChange={onClientFilterChange}
            triggerLabel={clientFilterTriggerLabel}
            triggerSelectedLabel={buildSelectedLabel}
            searchPlaceholder={t(
              'integratedSchedule.filter.searchPlaceholder',
              { defaultValue: '이름·전화 검색' }
            )}
            emptyOptionsText={t(
              'integratedSchedule.filter.emptyOptions',
              { defaultValue: '내담자가 없습니다' }
            )}
            clearAllLabel={t(
              'integratedSchedule.filter.clearAll',
              { defaultValue: '초기화' }
            )}
            doneLabel={t(
              'integratedSchedule.filter.done',
              { defaultValue: '완료' }
            )}
            ariaLabel={clientFilterAriaLabel}
          />
        )}
        <MGButton
          type="button"
          onClick={onRefresh}
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'md',
            loading: false,
            className: 'mg-v2-schedule-header__refresh mg-button--with-icon'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          title="데이터 새로고침"
          aria-label={t('common.actions.refresh')}
          variant="outline"
          preventDoubleClick={false}
        >
          <RefreshCw size={16} />
          {t('common.actions.refresh')}
        </MGButton>
      </div>
    </div>
  );
};

ScheduleHeader.propTypes = {
  userRole: PropTypes.string,
  consultants: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object])
  })),
  selectedConsultantId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  loadingConsultants: PropTypes.bool,
  onConsultantChange: PropTypes.func,
  onRefresh: PropTypes.func,
  hideTitle: PropTypes.bool,
  /** 통합 스케줄(`calendarSkin === 'integrated'`)에서만 true. 다른 캘린더 라우트는 미전달(false). */
  showClientFilter: PropTypes.bool,
  clients: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string
  })),
  selectedClientIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  onClientFilterChange: PropTypes.func
};

export default ScheduleHeader;
