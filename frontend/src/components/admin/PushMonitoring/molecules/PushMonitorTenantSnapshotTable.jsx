/**
 * PushMonitorTenantSnapshotTable — 테넌트 설정 스냅샷 테이블.
 *
 * 디자이너 핸드오프 §4.7 PushMonitoringSnapshotTable. 7~10 행 카드 list — 알림톡 활성 등.
 * StatusPill atom 으로 ON/OFF·등록 여부를 표시.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import PushMonitorStatusPill, {
  PUSH_MONITOR_STATUS_PILL_VARIANTS
} from '../atoms/PushMonitorStatusPill';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import './PushMonitorTenantSnapshotTable.css';

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatTemplateFraction = (filled, total) => {
  const f = safeNumber(filled);
  const t = safeNumber(total);
  return `${f.toLocaleString('ko-KR')}${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TEMPLATE_FRACTION_SEPARATOR}${t.toLocaleString('ko-KR')}`;
};

const PushMonitorTenantSnapshotTable = ({ snapshot = null }) => {
  const empty = !snapshot;
  const alimtalk = !!snapshot?.alimtalkEnabled;
  const apiKey = !!snapshot?.kakaoApiKeyRegistered;
  const sender = !!snapshot?.kakaoSenderKeyRegistered;
  const filled = safeNumber(snapshot?.templateMapping?.filled);
  const total = safeNumber(snapshot?.templateMapping?.total);
  const bizCount = safeNumber(snapshot?.alimtalkBizTemplateCodeCount);
  const expoToken = !!snapshot?.expoPushAccessTokenRegistered;
  const toggle = snapshot?.operationalToggle || {};

  const togglesText = [
    `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_ALIMTALK} ${toggleLabel(toggle.alimtalk)}`,
    `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_SMS} ${toggleLabel(toggle.sms)}`,
    `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_PUSH} ${toggleLabel(toggle.push)}`
  ].join(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_DISTRIBUTION_SEPARATOR);

  return (
    <div className="mg-push-monitor__snapshot-table" role="table" aria-label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_TITLE} data-testid="push-monitor-snapshot-table">
      <SnapshotRow label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_ALIMTALK}>
        <PushMonitorStatusPill
          active={alimtalk}
          styleVariant={PUSH_MONITOR_STATUS_PILL_VARIANTS.ON_OFF}
          ariaLabel={`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_ALIMTALK}: ${toggleLabel(alimtalk)}`}
        />
      </SnapshotRow>
      <SnapshotRow label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_API_KEY}>
        <PushMonitorStatusPill
          active={apiKey}
          styleVariant={PUSH_MONITOR_STATUS_PILL_VARIANTS.CHECK}
          ariaLabel={`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_API_KEY}: ${registeredLabel(apiKey)}`}
        />
      </SnapshotRow>
      <SnapshotRow label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_SENDER}>
        <PushMonitorStatusPill
          active={sender}
          styleVariant={PUSH_MONITOR_STATUS_PILL_VARIANTS.CHECK}
          ariaLabel={`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_SENDER}: ${registeredLabel(sender)}`}
        />
      </SnapshotRow>
      <SnapshotRow label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_TEMPLATE}>
        <span className="mg-push-monitor__snapshot-row__numeric" aria-label={`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_TEMPLATE}: ${filled} / ${total}`}>
          {formatTemplateFraction(filled, total)}
        </span>
      </SnapshotRow>
      <SnapshotRow label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_BIZ_CODE}>
        <span className="mg-push-monitor__snapshot-row__numeric">
          {bizCount.toLocaleString('ko-KR')}
        </span>
      </SnapshotRow>
      <SnapshotRow label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_EXPO_TOKEN}>
        <PushMonitorStatusPill
          active={expoToken}
          styleVariant={PUSH_MONITOR_STATUS_PILL_VARIANTS.CHECK}
          ariaLabel={`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_EXPO_TOKEN}: ${registeredLabel(expoToken)}`}
        />
      </SnapshotRow>
      <SnapshotRow label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_TOGGLES}>
        <span className="mg-push-monitor__snapshot-row__toggles">{togglesText}</span>
      </SnapshotRow>
      {empty ? (
        <div className="mg-push-monitor__snapshot-table__empty">
          {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_REFRESH_PENDING}
        </div>
      ) : null}
    </div>
  );
};

const toggleLabel = (active) => (active
  ? ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_VALUE_ON
  : ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_VALUE_OFF);

const registeredLabel = (active) => (active
  ? ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_VALUE_REGISTERED
  : ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_VALUE_UNREGISTERED);

const SnapshotRow = ({ label, children = null }) => (
  <div className="mg-push-monitor__snapshot-row" role="row">
    <span className="mg-push-monitor__snapshot-row__label" role="cell">{label}</span>
    <span className="mg-push-monitor__snapshot-row__value" role="cell">{children}</span>
  </div>
);

SnapshotRow.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node
};

PushMonitorTenantSnapshotTable.propTypes = {
  snapshot: PropTypes.shape({
    alimtalkEnabled: PropTypes.bool,
    kakaoApiKeyRegistered: PropTypes.bool,
    kakaoSenderKeyRegistered: PropTypes.bool,
    templateMapping: PropTypes.shape({
      filled: PropTypes.number,
      total: PropTypes.number
    }),
    alimtalkBizTemplateCodeCount: PropTypes.number,
    expoPushAccessTokenRegistered: PropTypes.bool,
    operationalToggle: PropTypes.shape({
      alimtalk: PropTypes.bool,
      sms: PropTypes.bool,
      push: PropTypes.bool
    })
  })
};

export default PushMonitorTenantSnapshotTable;
