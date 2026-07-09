/**
 * Client Dashboard — ListTableView 섹션 (스켈레톤 · error · retry)
 *
 * @author CoreSolution
 * @since 2026-07-09
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ListTableView } from '../../common';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import ClientDashboardSectionBlock from './ClientDashboardSectionBlock';
import {
  CLIENT_DASHBOARD_LIST_ERROR_LABEL,
  CLIENT_DASHBOARD_LIST_MAX_ROWS,
  CLIENT_DASHBOARD_LIST_RETRY_LABEL,
  CLIENT_DASHBOARD_LIST_SKELETON_ROW_COUNT
} from './constants';
import './ClientDashboardListSection.css';

const outlineBtnClass = buildErpMgButtonClassName({ variant: 'outline', loading: false });

const ClientDashboardListSection = ({
  title,
  subtitle,
  accentVariant = 'primary',
  columns,
  data = [],
  renderCell = null,
  onRowClick = null,
  emptyText,
  viewAllHref = '',
  viewAllLabel = '전체 일정 보기',
  rowKeyField = 'id',
  dataTestId = '',
  className = '',
  loading = false,
  error = '',
  onRetry = null
}) => {
  const displayData = useMemo(
    () => (Array.isArray(data) ? data.slice(0, CLIENT_DASHBOARD_LIST_MAX_ROWS) : []),
    [data]
  );

  const renderSkeleton = () => (
    <div
      className="client-dashboard-list-section__skeleton"
      aria-live="polite"
      aria-busy="true"
      data-testid="client-dashboard-list-skeleton"
    >
      {Array.from({ length: CLIENT_DASHBOARD_LIST_SKELETON_ROW_COUNT }, (_, idx) => (
        <div
          key={`skeleton-row-${idx}`}
          className="client-dashboard-list-section__skeleton-row"
        />
      ))}
    </div>
  );

  const renderError = () => (
    <div className="client-dashboard-list-section__error-banner" role="alert">
      <p className="client-dashboard-list-section__error-text">
        <SafeText tag="span">{error || CLIENT_DASHBOARD_LIST_ERROR_LABEL}</SafeText>
      </p>
      {typeof onRetry === 'function' ? (
        <MGButton
          variant="outline"
          className={outlineBtnClass}
          onClick={onRetry}
          preventDoubleClick={false}
        >
          {CLIENT_DASHBOARD_LIST_RETRY_LABEL}
        </MGButton>
      ) : null}
    </div>
  );

  const renderBody = () => {
    if (loading) {
      return renderSkeleton();
    }

    if (error) {
      return renderError();
    }

    if (displayData.length > 0) {
      return (
        <ListTableView
          columns={columns}
          data={displayData}
          renderCell={renderCell}
          onRowClick={onRowClick}
          className="client-dashboard-list-section__table mg-v2-ad-b0kla__data-table--comfortable"
          rowKeyField={rowKeyField}
        />
      );
    }

    return (
      <p className="client-dashboard-list-section__empty">
        <SafeText tag="span">{emptyText}</SafeText>
      </p>
    );
  };

  return (
    <ClientDashboardSectionBlock
      title={title}
      subtitle={subtitle}
      accentVariant={accentVariant}
      dataTestId={dataTestId}
      className={className}
    >
      {renderBody()}

      {viewAllHref && !loading && !error ? (
        <footer className="client-dashboard-list-section__footer">
          <Link to={viewAllHref} className="client-dashboard-list-section__view-all">
            {viewAllLabel}
          </Link>
        </footer>
      ) : null}
    </ClientDashboardSectionBlock>
  );
};

ClientDashboardListSection.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  accentVariant: PropTypes.oneOf(['primary', 'accent', 'secondary']),
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  data: PropTypes.arrayOf(PropTypes.object),
  renderCell: PropTypes.func,
  onRowClick: PropTypes.func,
  emptyText: PropTypes.string.isRequired,
  viewAllHref: PropTypes.string,
  viewAllLabel: PropTypes.string,
  rowKeyField: PropTypes.string,
  dataTestId: PropTypes.string,
  className: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func
};

export default ClientDashboardListSection;
