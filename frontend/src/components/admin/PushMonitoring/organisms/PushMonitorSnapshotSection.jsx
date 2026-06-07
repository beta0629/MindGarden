/**
 * PushMonitorSnapshotSection — 「테넌트 설정 스냅샷」섹션 organism.
 *
 * ContentSection + PushMonitorTenantSnapshotTable. 핸드오프 §2 / §4.7.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
import PushMonitorTenantSnapshotTable from '../molecules/PushMonitorTenantSnapshotTable';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';

const PushMonitorSnapshotSection = ({ snapshot = null }) => (
  <ContentSection title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_TITLE}>
    <PushMonitorTenantSnapshotTable snapshot={snapshot} />
  </ContentSection>
);

PushMonitorSnapshotSection.propTypes = {
  snapshot: PropTypes.object
};

export default PushMonitorSnapshotSection;
