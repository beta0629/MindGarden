/**
 * PushMonitorOperationalSection — 「운영 상태 안내」 섹션 organism.
 *
 * SettingsSectionPanel + PushMonitorOperationalBanners. 운영 가드 5개 중 운영 OFF 배너 / PUSH 갭 /
 * 비용 placeholder 3종을 묶어 노출.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { SettingsSectionPanel } from '../../settings-shell';
import PushMonitorOperationalBanners from '../molecules/PushMonitorOperationalBanners';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';

const PushMonitorOperationalSection = ({ alimtalkRouteEnabled, channelBreakdown = null }) => (
  <SettingsSectionPanel title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_OPERATIONAL_TITLE} body="plain">
    <PushMonitorOperationalBanners
      alimtalkRouteEnabled={alimtalkRouteEnabled}
      channelBreakdown={channelBreakdown}
    />
  </SettingsSectionPanel>
);

PushMonitorOperationalSection.propTypes = {
  alimtalkRouteEnabled: PropTypes.bool.isRequired,
  channelBreakdown: PropTypes.array
};

export default PushMonitorOperationalSection;
