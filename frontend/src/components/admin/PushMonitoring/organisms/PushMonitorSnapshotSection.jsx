/**
 * PushMonitorSnapshotSection — 「테넌트 설정 스냅샷」섹션 organism.
 *
 * SettingsSectionPanel + PushMonitorTenantSnapshotTable. 핸드오프 §2 / §4.7.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { SettingsSectionPanel } from '../../settings-shell';
import PushMonitorTenantSnapshotTable from '../molecules/PushMonitorTenantSnapshotTable';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';

const PushMonitorSnapshotSection = ({ snapshot = null }) => (
  <SettingsSectionPanel title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_TITLE} body="plain">
    <PushMonitorTenantSnapshotTable snapshot={snapshot} />
  </SettingsSectionPanel>
);

PushMonitorSnapshotSection.propTypes = {
  snapshot: PropTypes.object
};

export default PushMonitorSnapshotSection;
