/**
 * Consultant Dashboard — ListTableView 섹션 (G1-02 · B0KlA flat)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ListTableView } from '../../common';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Icon from '../../ui/Icon/Icon';
import { ContentSection } from '../content';
import {
  CONSULTANT_DASHBOARD_LIST_MAX_ROWS,
  CONSULTANT_DASHBOARD_LIST_LOADING_LABEL,
  CONSULTANT_DASHBOARD_LIST_ERROR_LABEL,
  CONSULTANT_DASHBOARD_SECTION_RETRY_LABEL
} from '../../../constants/consultantDashboardConstants';
import './ConsultantDashboardListSection.css';

const ConsultantDashboardListSection = ({
  title,
  titleIconName = '',
  columns,
  data = [],
  renderCell = null,
  onRowClick = null,
  emptyText,
  viewAllHref = '',
  viewAllLabel = '전체 보기',
  viewAllAriaLabel = '',
  rowKeyField = 'id',
  dataTestId = '',
  loading = false,
  error = '',
  onRetry = null,
  className = '',
  sectionActions = null,
  getRowClassName = null
}) => {
  const displayData = useMemo(
    () => (Array.isArray(data) ? data.slice(0, CONSULTANT_DASHBOARD_LIST_MAX_ROWS) : []),
    [data]
  );

  const titleNode = titleIconName ? (
    <span className="consultant-dashboard-list-section__title">
      <Icon name={titleIconName} size="LG" color="TRANSPARENT" aria-hidden />
      <SafeText tag="span">{title}</SafeText>
    </span>
  ) : (
    title
  );

  const renderBody = () => {
    if (loading) {
      return (
        <p className="consultant-dashboard-list-section__loading" aria-live="polite" aria-busy="true">
          <SafeText tag="span">{CONSULTANT_DASHBOARD_LIST_LOADING_LABEL}</SafeText>
        </p>
      );
    }

    if (error) {
      return (
        <div className="consultant-dashboard-list-section__error-wrap" role="alert">
          <p className="consultant-dashboard-list-section__error">
            <SafeText tag="span">{error || CONSULTANT_DASHBOARD_LIST_ERROR_LABEL}</SafeText>
          </p>
          {typeof onRetry === 'function' ? (
            <MGButton
              type="button"
              variant="outline"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'sm',
                loading: false,
                className: 'mg-v2-btn mg-v2-btn-outline mg-v2-btn-sm consultant-dashboard-list-section__retry'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onRetry}
              preventDoubleClick={false}
              aria-label={`${error || CONSULTANT_DASHBOARD_LIST_ERROR_LABEL} ${CONSULTANT_DASHBOARD_SECTION_RETRY_LABEL}`}
            >
              <SafeText tag="span">{CONSULTANT_DASHBOARD_SECTION_RETRY_LABEL}</SafeText>
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
          className="consultant-dashboard-list-section__table mg-v2-ad-b0kla__data-table--comfortable"
          rowKeyField={rowKeyField}
          getRowClassName={getRowClassName}
        />
      );
    }

    return (
      <p className="consultant-dashboard-list-section__empty">
        <SafeText tag="span">{emptyText}</SafeText>
      </p>
    );
  };

  return (
    <ContentSection
      title={titleNode}
      actions={sectionActions}
      className={className}
      dataTestId={dataTestId}
    >
      {renderBody()}

      {viewAllHref && !loading && !error ? (
        <footer className="consultant-dashboard-list-section__footer">
          <Link
            to={viewAllHref}
            className="consultant-dashboard-list-section__view-all"
            aria-label={viewAllAriaLabel || viewAllLabel}
          >
            {viewAllLabel}
          </Link>
        </footer>
      ) : null}
    </ContentSection>
  );
};

ConsultantDashboardListSection.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  titleIconName: PropTypes.string,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  data: PropTypes.arrayOf(PropTypes.object),
  renderCell: PropTypes.func,
  onRowClick: PropTypes.func,
  emptyText: PropTypes.string.isRequired,
  viewAllHref: PropTypes.string,
  viewAllLabel: PropTypes.string,
  viewAllAriaLabel: PropTypes.string,
  rowKeyField: PropTypes.string,
  dataTestId: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  className: PropTypes.string,
  sectionActions: PropTypes.node,
  getRowClassName: PropTypes.func
};

export default ConsultantDashboardListSection;
