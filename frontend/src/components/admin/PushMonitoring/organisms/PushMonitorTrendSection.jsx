/**
 * PushMonitorTrendSection — 「일별 발송 추이」 섹션 organism.
 *
 * SettingsSectionPanel + PushMonitorTrendChart molecule. 핸드오프 §2 와이어프레임 §「일별
 * 발송 추이」 와 동일.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { SettingsSectionPanel } from '../../settings-shell';
import PushMonitorTrendChart from '../molecules/PushMonitorTrendChart';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';

const PushMonitorTrendSection = ({ points = [], channel = 'ALL' }) => (
  <SettingsSectionPanel title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TREND_TITLE} body="plain">
    <PushMonitorTrendChart points={points} channel={channel} />
  </SettingsSectionPanel>
);

PushMonitorTrendSection.propTypes = {
  points: PropTypes.array,
  channel: PropTypes.string
};

export default PushMonitorTrendSection;
