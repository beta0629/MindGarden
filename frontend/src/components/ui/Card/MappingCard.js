import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  User,
  Calendar,
  Package,
  CreditCard,
  Clock,
  CheckCircle
} from 'lucide-react';
import { StatusBadge, CardContainer, ENTITY_ROW_ACTIONS_LAYOUT } from '../../common';
import Avatar from '../../common/Avatar';
import SafeText from '../../common/SafeText';
import MappingEntityRowActions from '../../admin/mapping-management/molecules/MappingEntityRowActions';
import { toDisplayString } from '../../../utils/safeDisplay';
import { useTranslation } from 'react-i18next';

/**
 * statusInfo.variant (legacy) → StatusBadge variant 매핑
 * @param {string} v - legacy variant 문자열
 * @returns {string|undefined} StatusBadge variant
 */
const mapStatusVariant = (v) => {
  if (!v) return undefined;
  if (v === 'secondary' || v === 'error') return v === 'secondary' ? 'neutral' : 'danger';
  return ['success', 'warning', 'neutral', 'danger', 'info'].includes(v) ? v : undefined;
};

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
  return `${amount.toLocaleString()}원`;
};

/* ─── Summary variant (기존 admin/MappingCard.js) ─── */
const MappingCardSummary = ({ mapping, onClick, actions }) => {
  const { t } = useTranslation();
  return (
    <div
      className="mg-v2-card mg-v2-mapping-card"
      onClick={onClick}
    >
      <div className="mg-v2-mapping-card-header">
        <div className="mg-v2-mapping-card-title-section">
          <Avatar
            profileImageUrl={mapping.clientProfileImageUrl || mapping.client?.profileImageUrl}
            displayName={mapping.clientName}
            className="mg-v2-client-avatar"
          />
          <div className="mg-v2-mapping-client-info">
            <h5 className="mg-v2-client-name">
              {mapping.clientName || '알 수 없음'}
            </h5>
            <span className="mg-v2-client-badge">{t('common.labels.client')}</span>
          </div>
        </div>
        <StatusBadge status={mapping.status} />
      </div>

      <div className="mg-v2-mapping-card-details">
        <div className="mg-v2-mapping-detail-item">{mapping.consultantName}</div>
        <div className="mg-v2-mapping-detail-item">{mapping.packageName}</div>
      </div>

      <div className="mg-v2-mapping-sessions-grid">
        <div className="mg-v2-session-stat mg-v2-session-stat-total">
          <div className="mg-v2-session-stat-label">총</div>
          <div className="mg-v2-session-stat-value">{mapping.totalSessions}</div>
        </div>
        <div className="mg-v2-session-stat mg-v2-session-stat-used">
          <div className="mg-v2-session-stat-label">사용</div>
          <div className="mg-v2-session-stat-value">{mapping.usedSessions}</div>
        </div>
        <div className="mg-v2-session-stat mg-v2-session-stat-remaining">
          <div className="mg-v2-session-stat-label">남은</div>
          <div className="mg-v2-session-stat-value">{mapping.remainingSessions}</div>
        </div>
      </div>

      {actions && (
        <div className="mg-v2-mapping-card-actions">{actions}</div>
      )}
    </div>
  );
};

/* ─── Detailed variant (기존 admin/mapping/MappingCard.js) ─── */
const MappingCardDetailed = ({
  mapping,
  statusInfo,
  onView,
  onEdit,
  onConfirmPayment,
  onConfirmDeposit,
  onApprove,
  onRefund
}) => {
  const { t } = useTranslation();

  const handleCardClick = useCallback(() => {
    if (onView) {
      onView(mapping);
    }
  }, [onView, mapping]);

  const handleCardKeyDown = useCallback(
    (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && onView) {
        event.preventDefault();
        onView(mapping);
      }
    },
    [onView, mapping]
  );

  const isErpIntegrated = () => (
    mapping.status === 'ACTIVE' ||
    mapping.status === 'DEPOSIT_PENDING' ||
    mapping.depositConfirmed === true ||
    mapping.erpIntegrated === true ||
    mapping.erpSyncStatus === 'SYNCED' ||
    mapping.erpTransactionId ||
    mapping.paymentConfirmed === true
  );

  const statusLabel = statusInfo?.label || mapping?.status || 'N/A';

  return (
    <CardContainer
      className="mg-v2-mapping-card mg-v2-mapping-card--clickable"
      role={onView ? 'button' : undefined}
      tabIndex={onView ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div className="mg-v2-card-header">
        <div className="mg-v2-mapping-card-header-left">
          <StatusBadge status={mapping?.status} variant={mapStatusVariant(statusInfo?.variant)}>
            {statusLabel}
          </StatusBadge>
          {isErpIntegrated() && (
            <StatusBadge variant="info">ERP 연동</StatusBadge>
          )}
        </div>
        <MappingEntityRowActions
          mapping={mapping}
          layout={ENTITY_ROW_ACTIONS_LAYOUT.CORNER}
          menuId={`mapping-card-actions-${mapping.id}`}
          onEdit={onEdit}
          onRefund={onRefund}
          onConfirmPayment={onConfirmPayment}
          onConfirmDeposit={onConfirmDeposit}
          onApprove={onApprove}
        />
      </div>

      <div className="mg-v2-mapping-card-body">
        <div className="mg-v2-mapping-participants">
          <div className="mg-v2-mapping-participant">
            <User size={16} className="mg-v2-mapping-icon" />
            <div className="mg-v2-mapping-participant-info">
              <div className="mg-v2-mapping-participant-label">{t('common.labels.consultant')}</div>
              <div className="mg-v2-mapping-participant-name">
                {mapping.consultantName || 'N/A'}
              </div>
            </div>
          </div>
          <div className="mg-v2-mapping-package-item">
            <Avatar
              profileImageUrl={mapping.clientProfileImageUrl || mapping.client?.profileImageUrl}
              displayName={mapping.clientName}
              className="mg-v2-mapping-participant-avatar"
            />
            <div className="mg-v2-mapping-participant-info">
              <div className="mg-v2-mapping-participant-label">{t('common.labels.client')}</div>
              <div className="mg-v2-mapping-participant-name">
                {mapping.clientName || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="mg-v2-mapping-package-section">
          <div className="mg-v2-mapping-package-row">
            <Package size={16} className="mg-v2-mapping-icon" />
            <div className="mg-v2-mapping-package-info-item">
              <div className="mg-v2-mapping-package-label">패키지</div>
              <div className="mg-v2-mapping-package-name">{mapping.packageName || 'N/A'}</div>
            </div>
          </div>
          <div className="mg-v2-mapping-package-row">
            <CreditCard size={16} className="mg-v2-mapping-icon" />
            <div className="mg-v2-mapping-package-info-item">
              <div className="mg-v2-mapping-package-label">금액</div>
              <div className="mg-v2-mapping-amount">
                {formatAmount(mapping.packagePrice || mapping.paymentAmount)}
              </div>
            </div>
          </div>
        </div>

        <div className="mg-v2-mapping-dates-section">
          {mapping.startDate && (
            <div className="mg-v2-mapping-date-item">
              <Calendar size={14} className="mg-v2-mapping-date-icon" />
              <span className="mg-v2-mapping-date-label">시작일:</span>
              <span className="mg-v2-mapping-date-value">{formatDate(mapping.startDate)}</span>
            </div>
          )}
          {mapping.createdAt && (
            <div className="mg-v2-mapping-date-item">
              <Clock size={14} className="mg-v2-mapping-date-icon" />
              <span className="mg-v2-mapping-date-label">생성일:</span>
              <span className="mg-v2-mapping-date-value">{formatDate(mapping.createdAt)}</span>
            </div>
          )}
          {mapping.adminApprovalDate && (
            <div className="mg-v2-mapping-date-item">
              <CheckCircle size={14} className="mg-v2-mapping-approval-icon" />
              <span className="mg-v2-mapping-date-label">승인일:</span>
              <span className="mg-v2-mapping-date-value">{formatDate(mapping.adminApprovalDate)}</span>
            </div>
          )}
        </div>
      </div>

    </CardContainer>
  );
};

/* ─── Compact variant (기존 ui/Card/MappingDetailCard.js) ─── */
const MappingCardCompact = ({
  id,
  consultantName,
  packageName,
  status,
  usedSessions,
  totalSessions,
  remainingSessions,
  startDate,
  endDate,
  createdAt,
  notes,
  onViewDetail,
  onEdit
}) => {
  const { t } = useTranslation();
  const startDateStr = startDate ? new Date(startDate).toLocaleDateString('ko-KR') : 'N/A';
  const endDateStr = endDate ? new Date(endDate).toLocaleDateString('ko-KR') : null;
  const createdStr = createdAt ? new Date(createdAt).toLocaleDateString('ko-KR') : '날짜 없음';

  const compactMapping = {
    id,
    consultantName,
    packageName,
    status,
    usedSessions,
    totalSessions,
    remainingSessions,
    startDate,
    endDate,
    createdAt,
    notes
  };

  const handleCardClick = useCallback(() => {
    if (onViewDetail) {
      onViewDetail();
    }
  }, [onViewDetail]);

  const handleCardKeyDown = useCallback(
    (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && onViewDetail) {
        event.preventDefault();
        onViewDetail();
      }
    },
    [onViewDetail]
  );

  return (
    <CardContainer
      className="mg-v2-mapping-card__compact mg-v2-mapping-card--clickable"
      role={onViewDetail ? 'button' : undefined}
      tabIndex={onViewDetail ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div className="mg-v2-card-header">
        <div className="mg-v2-mapping-info">
          <h4 className="mg-v2-mapping-card__title mg-v2-h4">매칭 #{id}</h4>
          <p className="mg-v2-mapping-date">{createdStr}</p>
        </div>
        <div className="mg-v2-mapping-card__compact-header-actions">
          <StatusBadge status={status} />
          <MappingEntityRowActions
            mapping={compactMapping}
            layout={ENTITY_ROW_ACTIONS_LAYOUT.CORNER}
            menuId={`mapping-compact-actions-${id}`}
            onEdit={onEdit}
          />
        </div>
      </div>
      <div className="mg-v2-card-content">
        <div className="mg-v2-mapping-details">
          <div className="mg-v2-mapping-card__row">
            <span className="mg-v2-mapping-card__label">{t('common.labels.consultant')}</span>
            <span className="mg-v2-mapping-card__value">
              <SafeText fallback="알 수 없음">{consultantName}</SafeText>
            </span>
          </div>
          {packageName && (
            <div className="mg-v2-mapping-card__row">
              <span className="mg-v2-mapping-card__label">패키지</span>
              <span className="mg-v2-mapping-card__value"><SafeText>{packageName}</SafeText></span>
            </div>
          )}
          {(totalSessions != null || remainingSessions !== undefined) && (
            <div className="mg-v2-mapping-card__row">
              <span className="mg-v2-mapping-card__label">회기</span>
              <span className="mg-v2-mapping-card__value mg-v2-mapping-card__value--emphasis">
                {usedSessions ?? 0}/{totalSessions ?? 0} (남은: {remainingSessions ?? 0})
              </span>
            </div>
          )}
          <div className="mg-v2-mapping-card__row">
            <span className="mg-v2-mapping-card__label">시작일</span>
            <span className="mg-v2-mapping-card__value mg-v2-mapping-card__value--emphasis">{startDateStr}</span>
          </div>
          {endDateStr && (
            <div className="mg-v2-mapping-card__row">
              <span className="mg-v2-mapping-card__label">종료일</span>
              <span className="mg-v2-mapping-card__value mg-v2-mapping-card__value--emphasis">{endDateStr}</span>
            </div>
          )}
          {notes && (
            <div className="mg-v2-mapping-card__row">
              <span className="mg-v2-mapping-card__label">메모</span>
              <span className="mg-v2-mapping-card__value mg-v2-mapping-card__memo" title={toDisplayString(notes)}>
                <SafeText>{notes}</SafeText>
              </span>
            </div>
          )}
        </div>
      </div>
    </CardContainer>
  );
};

/**
 * 통합 매칭 카드 컴포넌트
 * variant 기반으로 summary / detailed / compact 렌더링 분기
 *
 * @author CoreSolution
 * @since 2026-05-12
 *
 * @param {'summary'|'detailed'|'compact'} variant - 카드 표시 모드 (기본: 'detailed')
 */
const MappingCard = ({ variant = 'detailed', ...props }) => {
  switch (variant) {
    case 'summary':
      return <MappingCardSummary {...props} />;
    case 'compact':
      return <MappingCardCompact {...props} />;
    case 'detailed':
    default:
      return <MappingCardDetailed {...props} />;
  }
};

const mappingShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  clientName: PropTypes.string,
  clientProfileImageUrl: PropTypes.string,
  client: PropTypes.shape({ profileImageUrl: PropTypes.string }),
  consultantName: PropTypes.string,
  packageName: PropTypes.string,
  packagePrice: PropTypes.number,
  paymentAmount: PropTypes.number,
  status: PropTypes.string,
  totalSessions: PropTypes.number,
  usedSessions: PropTypes.number,
  remainingSessions: PropTypes.number,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  createdAt: PropTypes.string,
  adminApprovalDate: PropTypes.string,
  depositConfirmed: PropTypes.bool,
  erpIntegrated: PropTypes.bool,
  erpSyncStatus: PropTypes.string,
  erpTransactionId: PropTypes.string,
  paymentConfirmed: PropTypes.bool,
  notes: PropTypes.string
});

MappingCardSummary.propTypes = {
  mapping: mappingShape.isRequired,
  onClick: PropTypes.func,
  actions: PropTypes.node
};

MappingCardDetailed.propTypes = {
  mapping: mappingShape.isRequired,
  statusInfo: PropTypes.shape({
    label: PropTypes.string,
    variant: PropTypes.string
  }),
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onConfirmPayment: PropTypes.func,
  onConfirmDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  onRefund: PropTypes.func
};

MappingCardCompact.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  consultantName: PropTypes.string,
  packageName: PropTypes.string,
  status: PropTypes.string,
  usedSessions: PropTypes.number,
  totalSessions: PropTypes.number,
  remainingSessions: PropTypes.number,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  createdAt: PropTypes.string,
  notes: PropTypes.string,
  onViewDetail: PropTypes.func,
  onEdit: PropTypes.func
};

MappingCard.propTypes = {
  variant: PropTypes.oneOf(['summary', 'detailed', 'compact']),
  mapping: PropTypes.object,
  className: PropTypes.string,
  onClick: PropTypes.func
};

MappingCard.defaultProps = {
  variant: 'detailed'
};

export default MappingCard;
