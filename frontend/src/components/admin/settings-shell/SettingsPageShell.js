/**
 * SettingsPageShell — 설정 화면 공통 셸 (ContentArea + ErpPageShell + SettingsQuietHeader)
 * 상담사 지급(SalaryManagement) 화면과 동일한 크롬 계약.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import PropTypes from 'prop-types';
import ContentArea from '../../dashboard-v2/content/ContentArea';
import ErpPageShell from '../../erp/shell/ErpPageShell';
import SettingsQuietHeader from './SettingsQuietHeader';
import './SettingsSuite.css';

const SettingsPageShell = ({
  title,
  titleId,
  actions = null,
  actionsAriaLabel,
  tabs = null,
  summary = null,
  ariaLabel,
  className = '',
  children
}) => {
  const regionLabel = ariaLabel || (typeof title === 'string' ? title : undefined);
  return (
    <ContentArea className="mg-v2-content-area" ariaLabel={regionLabel}>
      <ErpPageShell
        className={['mg-v2-settings-shell', className].filter(Boolean).join(' ')}
        headerSlot={(
          <SettingsQuietHeader
            title={title}
            titleId={titleId}
            actions={actions}
            actionsAriaLabel={actionsAriaLabel}
          />
        )}
        tabsSlot={tabs}
        mainAriaLabel={regionLabel}
      >
        <div className="mg-v2-settings-shell__body" data-testid="settings-page-shell">
          {summary}
          {children}
        </div>
      </ErpPageShell>
    </ContentArea>
  );
};

SettingsPageShell.propTypes = {
  title: PropTypes.node.isRequired,
  titleId: PropTypes.string,
  actions: PropTypes.node,
  actionsAriaLabel: PropTypes.string,
  tabs: PropTypes.node,
  summary: PropTypes.node,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node
};

export default SettingsPageShell;
