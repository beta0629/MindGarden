/**
 * MappingTableView - 매칭 목록 테이블 뷰 (B0KlA 스타일)
 * Primary: 행 클릭 → 상세. Overflow: EntityRowActions ⋮
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { StatusBadge, ENTITY_ROW_ACTIONS_LAYOUT } from '../../../common';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import MappingEntityRowActions from '../molecules/MappingEntityRowActions';
import './MappingTableView.css';
import { useTranslation } from 'react-i18next';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return 'N/A';
  }
};

const formatAmount = (amount) => {
  if (!amount) return 'N/A';
  return `${Number(amount).toLocaleString()}원`;
};

const MappingTableView = ({
  mappings = [],
  mappingStatusInfo = {},
  getStatusKoreanName,
  getStatusColor,
  getStatusIcon,
  getStatusIconComponent,
  getStatusVariant,
  onView,
  onEdit,
  onRefund,
  onConfirmPayment,
  onConfirmDeposit,
  onApprove
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleRowClick = (mapping) => {
    if (onView) {
      onView(mapping);
    }
  };

  return (
    <div className="mg-v2-mapping-table-wrapper">
      <table className="mg-v2-mapping-table">
        <thead>
          <tr>
            <th>{t('admin.labels.status')}</th>
            <th>{t('admin.labels.consultant')}</th>
            <th>{t('admin.labels.client')}</th>
            <th>패키지</th>
            <th>금액</th>
            <th>회기</th>
            <th>날짜</th>
            <th className="mg-v2-mapping-table__actions-head">관리</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((mapping) => {
            const statusInfo = {
              ...(mappingStatusInfo[mapping.status] || {
                label: getStatusKoreanName(mapping.status),
                color: getStatusColor(mapping.status),
                icon: null
              }),
              variant: getStatusVariant ? getStatusVariant(mapping.status) : 'secondary'
            };
            const StatusIcon = getStatusIconComponent && mapping.status ? getStatusIconComponent(mapping.status) : null;

            const isErpIntegrated =
              mapping.status === 'ACTIVE' ||
              mapping.status === 'DEPOSIT_PENDING' ||
              mapping.depositConfirmed === true ||
              mapping.erpIntegrated === true ||
              mapping.erpSyncStatus === 'SYNCED' ||
              mapping.erpTransactionId ||
              mapping.paymentConfirmed === true;

            const statusLabel = statusInfo.label || mapping.status || 'N/A';
            const rawVariant = statusInfo.variant || 'secondary';
            let statusBadgeVariant = rawVariant;
            if (rawVariant === 'secondary') statusBadgeVariant = 'neutral';
            else if (rawVariant === 'error') statusBadgeVariant = 'danger';

            return (
              <tr
                key={mapping.id}
                className={onView ? 'mg-v2-mapping-table__row--clickable' : undefined}
                onClick={() => handleRowClick(mapping)}
              >
                <td>
                  <div className="mg-v2-mapping-table__status">
                    {StatusIcon ? <StatusIcon size={12} className="mg-v2-mapping-table__status-icon" aria-hidden /> : null}
                    <StatusBadge
                      status={mapping.status}
                      variant={statusBadgeVariant}
                      className="mg-v2-mapping-table__status-badge"
                    >
                      {statusLabel}
                    </StatusBadge>
                    {isErpIntegrated && (
                      <span className="mg-v2-mapping-table__erp" title="ERP 연동됨">
                        ERP
                      </span>
                    )}
                  </div>
                </td>
                <td>{mapping.consultantName || 'N/A'}</td>
                <td>{mapping.clientName || 'N/A'}</td>
                <td>{mapping.packageName || 'N/A'}</td>
                <td>{formatAmount(mapping.packagePrice || mapping.paymentAmount)}</td>
                <td>
                  <span>{mapping.usedSessions ?? 0}/{mapping.totalSessions ?? 0}회</span>
                  {mapping.totalSessions > 0 && (
                    <MGButton
                      type="button"
                      variant="outline"
                      size="small"
                      className={buildErpMgButtonClassName({
                        variant: 'outline',
                        size: 'sm',
                        loading: false,
                        className: 'mg-v2-mapping-table__schedule-link'
                      })}
                      loading={false}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      preventDoubleClick={false}
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/admin/schedules?consultantId=${mapping.consultantId}&clientId=${mapping.clientId}`);
                      }}
                      title="스케줄 보기"
                    >
                      {t('common.labels.schedule')}
                    </MGButton>
                  )}
                </td>
                <td>{formatDate(mapping.startDate || mapping.createdAt)}</td>
                <td className="mg-v2-mapping-table__actions">
                  <MappingEntityRowActions
                    mapping={mapping}
                    layout={ENTITY_ROW_ACTIONS_LAYOUT.TABLE}
                    menuId={`mapping-table-actions-${mapping.id}`}
                    onEdit={onEdit}
                    onRefund={onRefund}
                    onConfirmPayment={onConfirmPayment}
                    onConfirmDeposit={onConfirmDeposit}
                    onApprove={onApprove}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

MappingTableView.propTypes = {
  mappings: PropTypes.array,
  mappingStatusInfo: PropTypes.object,
  getStatusKoreanName: PropTypes.func,
  getStatusColor: PropTypes.func,
  getStatusIcon: PropTypes.func,
  getStatusIconComponent: PropTypes.func,
  getStatusVariant: PropTypes.func,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onRefund: PropTypes.func,
  onConfirmPayment: PropTypes.func,
  onConfirmDeposit: PropTypes.func,
  onApprove: PropTypes.func
};

export default MappingTableView;
