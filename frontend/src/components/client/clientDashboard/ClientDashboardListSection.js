/**
 * Client Dashboard — ListTableView 섹션 (B0KlA flat · 섹션별 loading/empty/error+retry)
 * 상담사 대시보드 V2(ConsultantDashboardListSection) 패턴 정합.
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import ListTableView from '../../common/ListTableView';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { ContentSection } from '../../dashboard-v2/content';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import {
  CLIENT_MAX_LIST_ROWS,
  CLIENT_SECTION_LOADING_LABEL,
  CLIENT_SECTION_RETRY_LABEL
} from './constants';

const SKELETON_ROW_COUNT = 3;
const retryBtnClass = buildErpMgButtonClassName({ variant: 'outline', loading: false });

const ClientDashboardListSection = ({
  title,
  subtitle,
  columns,
  data = [],
  renderCell = null,
  onRowClick = null,
  emptyText,
  loading = false,
  error = '',
  onRetry = null,
  viewAllHref = '',
  viewAllLabel = '전체 보기',
  rowKeyField = 'id',
  dataTestId = '',
  noCard = false,
  sectionClassName = ''
}) => {
  const displayData = useMemo(
    () => (Array.isArray(data) ? data.slice(0, CLIENT_MAX_LIST_ROWS) : []),
    [data]
  );

  const renderBody = () => {
    if (loading) {
      return (
        <div
          className="client-dashboard-list__skeleton"
          aria-live="polite"
          aria-busy="true"
          role="status"
          aria-label={CLIENT_SECTION_LOADING_LABEL}
        >
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, idx) => (
            <span key={`sk-${idx}`} className="client-dashboard-list__skeleton-row" aria-hidden />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="client-dashboard-list__error" role="alert">
          <p className="client-dashboard-list__error-text">
            <SafeText tag="span">{error}</SafeText>
          </p>
          {onRetry ? (
            <MGButton
              variant="outline"
              className={`${retryBtnClass} client-dashboard-list__retry`}
              onClick={onRetry}
              preventDoubleClick={false}
            >
              <RefreshCw size={16} aria-hidden />
              <span>{CLIENT_SECTION_RETRY_LABEL}</span>
            </MGButton>
          ) : null}
        </div>
      );
    }

    if (displayData.length > 0) {
      return (
        <ListTableView
          columns={columns}
          data={displayData}
          renderCell={renderCell}
          onRowClick={onRowClick}
          className="client-dashboard-list__table mg-v2-ad-b0kla__data-table--comfortable"
          rowKeyField={rowKeyField}
        />
      );
    }

    return (
      <p className="client-dashboard-list__empty">
        <SafeText tag="span">{emptyText}</SafeText>
      </p>
    );
  };

  return (
    <ContentSection
      title={title}
      subtitle={subtitle}
      className={`client-dashboard__section client-dashboard__section-block ${sectionClassName}`.trim()}
      dataTestId={dataTestId}
      noCard={noCard}
    >
      {renderBody()}

      {viewAllHref && !loading && !error ? (
        <footer className="client-dashboard-list__footer">
          <Link to={viewAllHref} className="client-dashboard-list__view-all">
            {viewAllLabel}
          </Link>
        </footer>
      ) : null}
    </ContentSection>
  );
};

ClientDashboardListSection.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  data: PropTypes.arrayOf(PropTypes.object),
  renderCell: PropTypes.func,
  onRowClick: PropTypes.func,
  emptyText: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  viewAllHref: PropTypes.string,
  viewAllLabel: PropTypes.string,
  rowKeyField: PropTypes.string,
  dataTestId: PropTypes.string,
  noCard: PropTypes.bool,
  sectionClassName: PropTypes.string
};

export default ClientDashboardListSection;
