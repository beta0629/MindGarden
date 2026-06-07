/**
 * PushMonitorTenantSnapshotTable — 단위 테스트.
 *
 * 검증 매트릭스:
 *  - S1: 7행 모두 렌더 (알림톡, API key, sender, template, biz code, expo token, toggles)
 *  - S2: alimtalkEnabled true 시 ON / 미등록 false 시 미등록 라벨
 *  - S3: templateMapping 분수 포맷 ko-KR locale + separator
 *  - S4: alimtalkBizTemplateCodeCount 큰 수 ko-KR locale
 *  - S5: operationalToggle alimtalk OFF, sms ON, push ON 라벨링
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import PushMonitorTenantSnapshotTable from '../molecules/PushMonitorTenantSnapshotTable';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';

const buildSnapshot = (overrides = {}) => ({
  alimtalkEnabled: true,
  kakaoApiKeyRegistered: true,
  kakaoSenderKeyRegistered: false,
  templateMapping: { filled: 5, total: 7 },
  alimtalkBizTemplateCodeCount: 1234,
  expoPushAccessTokenRegistered: true,
  operationalToggle: { alimtalk: false, sms: true, push: true },
  ...overrides
});

describe('PushMonitorTenantSnapshotTable', () => {
  test('S1: 7행 모두 렌더', () => {
    render(<PushMonitorTenantSnapshotTable snapshot={buildSnapshot()} />);
    const table = screen.getByTestId('push-monitor-snapshot-table');

    [
      ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_ALIMTALK,
      ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_API_KEY,
      ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_SENDER,
      ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_TEMPLATE,
      ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_BIZ_CODE,
      ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_EXPO_TOKEN,
      ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_TOGGLES
    ].forEach((label) => {
      expect(within(table).getByText(label)).toBeInTheDocument();
    });
  });

  test('S2: alimtalk ON/sender 미등록 라벨', () => {
    render(<PushMonitorTenantSnapshotTable snapshot={buildSnapshot()} />);
    expect(
      screen.getByLabelText(
        new RegExp(`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_ALIMTALK}: ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_VALUE_ON}`)
      )
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        new RegExp(`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_ROW_SENDER}: ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_VALUE_UNREGISTERED}`)
      )
    ).toBeInTheDocument();
  });

  test('S3: templateMapping 분수 포맷', () => {
    render(<PushMonitorTenantSnapshotTable snapshot={buildSnapshot({
      templateMapping: { filled: 3, total: 7 }
    })} />);
    const expected = `3${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TEMPLATE_FRACTION_SEPARATOR}7`;
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  test('S4: alimtalkBizTemplateCodeCount ko-KR locale', () => {
    render(<PushMonitorTenantSnapshotTable snapshot={buildSnapshot({
      alimtalkBizTemplateCodeCount: 12345
    })} />);
    expect(screen.getByText('12,345')).toBeInTheDocument();
  });

  test('S5: operationalToggle 라벨링', () => {
    render(<PushMonitorTenantSnapshotTable snapshot={buildSnapshot()} />);
    const toggles = ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_DISTRIBUTION_SEPARATOR;
    const expected = [
      `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_ALIMTALK} ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_VALUE_OFF}`,
      `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_SMS} ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_VALUE_ON}`,
      `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_PUSH} ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_VALUE_ON}`
    ].join(toggles);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
