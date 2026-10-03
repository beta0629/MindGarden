/**
 * PushMonitorFailureSection — 「최근 실패 사례」 섹션 organism.
 *
 * SettingsSectionPanel + PushMonitorFailureList. 핸드오프 §2 / §4.8.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { SettingsSectionPanel } from '../../settings-shell';
import PushMonitorFailureList from '../molecules/PushMonitorFailureList';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';

const PushMonitorFailureSection = ({
  entries = [],
  totalCount = 0,
  onResend,
  isResending = false
}) => (
  <SettingsSectionPanel title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_TITLE} body="plain">
    <PushMonitorFailureList
      entries={entries}
      totalCount={totalCount}
      onResend={onResend}
      isResending={isResending}
    />
  </SettingsSectionPanel>
);

PushMonitorFailureSection.propTypes = {
  entries: PropTypes.array,
  totalCount: PropTypes.number,
  onResend: PropTypes.func.isRequired,
  isResending: PropTypes.bool
};

export default PushMonitorFailureSection;
