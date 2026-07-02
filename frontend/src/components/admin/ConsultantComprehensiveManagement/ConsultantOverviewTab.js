import React from 'react';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import { SmallCardGrid, ListTableView, EntityRowActions, ENTITY_ROW_ACTIONS_LAYOUT, USER_MANAGEMENT_DEFAULT_VIEW_MODE } from '../../common';
import ConsultantCard from '../../ui/Card/ConsultantCard';
import { getConsultantBadgeDisplay } from '../../../utils/consultantHelper';
import { getStatusLabel } from '../../../utils/colorUtils';
import { toDisplayString } from '../../../utils/safeDisplay';
import { getProfessionalProviderTypeLabel } from '../../../constants/professionalProviderRoles';
import { CONSULTANT_COMP_PASSWORD_RESET } from '../../../constants/consultantComprehensiveStrings';

/**
 * 상담사 개요 탭 — list/card 뷰 + Side Peek 행 클릭
 */
const ConsultantOverviewTab = ({
  consultants,
  onConsultantPeek,
  onConsultantSelect,
  onEditConsultant,
  onDeleteConsultant,
  onResetPassword,
  onCreateConsultant,
  viewMode = USER_MANAGEMENT_DEFAULT_VIEW_MODE
}) => {
  const { t } = useTranslation(['admin', 'common']);

  const handleRowPeek = (consultant) => {
    if (onConsultantPeek) {
      onConsultantPeek(consultant);
      return;
    }
    if (onConsultantSelect) {
      onConsultantSelect(consultant);
    }
  };

  const buildConsultantActionItems = (consultant) => {
    const items = [
      {
        id: 'detail',
        label: '상세',
        onClick: () => handleRowPeek(consultant)
      },
      {
        id: 'edit',
        label: t('common.actions.edit'),
        onClick: () => onEditConsultant(consultant)
      }
    ];
    if (onResetPassword) {
      items.push({
        id: 'reset-password',
        label: CONSULTANT_COMP_PASSWORD_RESET.BTN_LABEL,
        title: CONSULTANT_COMP_PASSWORD_RESET.BTN_TITLE,
        onClick: () => onResetPassword(consultant)
      });
    }
    items.push({
      id: 'delete',
      label: t('admin.actions.delete'),
      onClick: () => onDeleteConsultant(consultant),
      variant: 'destructive'
    });
    return items;
  };

  const renderConsultantActions = (consultant, { layout = ENTITY_ROW_ACTIONS_LAYOUT.TABLE } = {}) => (
    <EntityRowActions
      layout={layout}
      ariaLabel="상담사 작업"
      items={buildConsultantActionItems(consultant)}
    />
  );

  if (consultants.length === 0) {
    return (
      <div className="mg-v2-mapping-list-block__empty">
        <div className="mg-v2-mapping-list-block__empty-icon">
          <Users size={48} />
        </div>
        <h3 className="mg-v2-mapping-list-block__empty-title">{t('admin:consultant.empty.title')}</h3>
        <p className="mg-v2-mapping-list-block__empty-desc">
          {t('admin:ConsultantComprehensiveManagement.t_cff51bee')}
        </p>
        {onCreateConsultant && (
          <MGButton
            type="button"
            variant="primary"
            preventDoubleClick={false}
            className={buildErpMgButtonClassName({
              variant: 'primary',
              loading: false,
              className: 'mg-v2-mapping-list-block__empty-btn'
            })}
            onClick={onCreateConsultant}
          >
            {t('admin:ConsultantComprehensiveManagement.t_72bf00c9')}
          </MGButton>
        )}
      </div>
    );
  }

  if (viewMode === 'largeCard') {
    return (
      <div className="mg-v2-mapping-list-block__grid">
        {consultants.map((consultant) => (
          <ConsultantCard
            key={consultant.id}
            variant="admin-list"
            consultant={consultant}
            badgeInfo={getConsultantBadgeDisplay(consultant)}
            onCardClick={() => handleRowPeek(consultant)}
            renderActions={(c) => renderConsultantActions(c, { layout: ENTITY_ROW_ACTIONS_LAYOUT.CARD })}
          />
        ))}
      </div>
    );
  }

  if (viewMode === 'smallCard') {
    return (
      <SmallCardGrid>
        {consultants.map((consultant) => (
          <ConsultantCard
            key={consultant.id}
            variant="admin-compact"
            consultant={consultant}
            badgeInfo={getConsultantBadgeDisplay(consultant)}
            onCardClick={() => handleRowPeek(consultant)}
            renderActions={(c) => renderConsultantActions(c, { layout: ENTITY_ROW_ACTIONS_LAYOUT.CORNER })}
          />
        ))}
      </SmallCardGrid>
    );
  }

  return (
    <ListTableView
      columns={[
        { key: 'name', label: t('admin:consultant.table.name') },
        { key: 'professionalProviderTypeCode', label: t('admin:consultant.filter.specialization') },
        { key: 'email', label: t('admin:consultant.table.email') },
        { key: 'status', label: t('admin:consultant.table.status') },
        { key: 'createdAt', label: t('admin:consultant.table.joinDate'), hideOnMobile: true },
        { key: 'currentClients', label: t('admin:consultant.table.sessionCount'), hideOnMobile: true },
        { key: '_actions', label: t('common.actions.actions', '작업') }
      ]}
      data={consultants}
      renderCell={(key, item) => {
        if (key === '_actions') {
          return renderConsultantActions(item, { layout: ENTITY_ROW_ACTIONS_LAYOUT.TABLE });
        }
        if (key === 'professionalProviderTypeCode') {
          return getProfessionalProviderTypeLabel(item.professionalProviderTypeCode) || '-';
        }
        if (key === 'status') return getStatusLabel(item.status || 'ACTIVE');
        if (key === 'createdAt') {
          return item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '-';
        }
        if (key === 'currentClients') {
          return item.currentClients != null ? `${item.currentClients}명` : '-';
        }
        if (key === 'name' || key === 'email') return toDisplayString(item[key], '-');
        const v = item[key];
        return toDisplayString(v, '-');
      }}
      onRowClick={handleRowPeek}
    />
  );
};

export default ConsultantOverviewTab;
