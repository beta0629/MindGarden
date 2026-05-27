/**
 * PendingDeletionList — 어드민 강제 종료 7일 보존 윈도우 내 사용자 목록.
 *
 * USER_LIFECYCLE_TERMINATION_POLICY §0.1 Q5 — GET /api/v1/admin/users/pending-deletion.
 * SSOT 컴포넌트 사용: ContentHeader / ContentSection / StatusBadge / SafeText / UnifiedLoading / EmptyState.
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import StatusBadge from '../common/StatusBadge';
import SafeText from '../common/SafeText';
import UnifiedLoading from '../common/UnifiedLoading';
import EmptyState from '../common/EmptyState';
import MGButton from '../common/MGButton';
import RestoreUserModal from './RestoreUserModal';
import StandardizedApi from '../../utils/standardizedApi';
import { showError } from '../../utils/notification';

const ENDPOINT = '/api/v1/admin/users/pending-deletion';
const DEFAULT_PAGE_SIZE = 20;

const variantForDaysRemaining = (daysRemaining) => {
  if (daysRemaining <= 2) {
    return 'danger';
  }
  if (daysRemaining <= 5) {
    return 'warning';
  }
  return 'info';
};

const formatDeletedAt = (deletedAt) => {
  if (!deletedAt) {
    return '-';
  }
  try {
    const date = new Date(deletedAt);
    if (Number.isNaN(date.getTime())) {
      return String(deletedAt);
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } catch (e) {
    return String(deletedAt);
  }
};

const PendingDeletionList = ({ embedded }) => {
  const { t } = useTranslation('admin');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [restoreTarget, setRestoreTarget] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await StandardizedApi.get(ENDPOINT, {
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        role: 'ALL'
      });
      const payload = response?.data || response;
      const content = payload?.content || [];
      setItems(content);
    } catch (err) {
      const message = t('userManagement.pendingDeletion.loadError');
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRestoreClick = (item) => {
    setRestoreTarget(item);
  };

  const handleRestoreClose = () => {
    setRestoreTarget(null);
  };

  const handleRestored = (userId) => {
    setItems((prev) => prev.filter((u) => u.userId !== userId));
  };

  const renderRow = (item) => {
    const daysRemaining = Number.isFinite(item.daysRemaining) ? item.daysRemaining : 0;
    const variant = variantForDaysRemaining(daysRemaining);
    const remainingLabel = daysRemaining > 0
      ? t('userManagement.pendingDeletion.daysRemainingValue', { count: daysRemaining })
      : t('userManagement.pendingDeletion.daysRemainingExpired');

    return (
      <tr key={item.userId} data-testid={`pending-deletion-row-${item.userId}`}>
        <td>
          <SafeText>{item.name}</SafeText>
        </td>
        <td>
          <SafeText>{item.emailMasked}</SafeText>
        </td>
        <td>
          <SafeText>{item.role}</SafeText>
        </td>
        <td>{formatDeletedAt(item.deletedAt)}</td>
        <td>
          <StatusBadge variant={variant} status="">
            {remainingLabel}
          </StatusBadge>
        </td>
        <td>
          <SafeText>{item.reason}</SafeText>
        </td>
        <td>
          <SafeText>{item.deletedByAdminName}</SafeText>
        </td>
        <td>
          <MGButton
            variant="primary"
            size="small"
            onClick={() => handleRestoreClick(item)}
            type="button"
            data-testid={`pending-deletion-restore-btn-${item.userId}`}
          >
            {t('userManagement.pendingDeletion.action.restore')}
          </MGButton>
        </td>
      </tr>
    );
  };

  const renderBody = () => {
    if (loading) {
      return (
        <UnifiedLoading
          variant="spinner"
          tone="primary"
          size="md"
          text={t('userManagement.pendingDeletion.loading')}
        />
      );
    }
    if (error) {
      return (
        <EmptyState
          title={error}
          description={null}
          action={(
            <MGButton variant="outline" size="small" type="button" onClick={fetchItems}>
              {t('actions.refresh')}
            </MGButton>
          )}
        />
      );
    }
    if (!items || items.length === 0) {
      return (
        <EmptyState
          title={t('userManagement.pendingDeletion.empty')}
        />
      );
    }
    return (
      <table className="mg-table mg-table--admin" data-testid="pending-deletion-table">
        <thead>
          <tr>
            <th>{t('userManagement.pendingDeletion.column.name')}</th>
            <th>{t('userManagement.pendingDeletion.column.email')}</th>
            <th>{t('userManagement.pendingDeletion.column.role')}</th>
            <th>{t('userManagement.pendingDeletion.column.deletedAt')}</th>
            <th>{t('userManagement.pendingDeletion.column.daysRemaining')}</th>
            <th>{t('userManagement.pendingDeletion.column.reason')}</th>
            <th>{t('userManagement.pendingDeletion.column.deletedByAdmin')}</th>
            <th>{t('userManagement.pendingDeletion.column.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map(renderRow)}
        </tbody>
      </table>
    );
  };

  return (
    <div
      className="mg-v2-pending-deletion"
      data-embedded={embedded ? 'true' : 'false'}
    >
      {!embedded && (
        <ContentHeader
          title={t('userManagement.pendingDeletion.pageTitle')}
          subtitle={t('userManagement.pendingDeletion.subtitle')}
        />
      )}
      <ContentSection>
        <div className="mg-v2-pending-deletion__toolbar">
          <MGButton
            variant="outline"
            size="small"
            type="button"
            onClick={fetchItems}
            disabled={loading}
            data-testid="pending-deletion-refresh"
          >
            {t('actions.refresh')}
          </MGButton>
        </div>
        {renderBody()}
      </ContentSection>
      <RestoreUserModal
        isOpen={restoreTarget !== null}
        onClose={handleRestoreClose}
        user={restoreTarget}
        onRestored={handleRestored}
      />
    </div>
  );
};

PendingDeletionList.propTypes = {
  embedded: PropTypes.bool
};

PendingDeletionList.defaultProps = {
  embedded: false
};

export default PendingDeletionList;
