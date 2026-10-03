/**
 * 메시지 발송 화면 문구 — 개발용 메모(BW-1, 후속 PR, 서버 설정 키) 비노출 회귀.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../adminWebScaffold';
import PushMonitorOperationalBanners from '../../components/admin/PushMonitoring/molecules/PushMonitorOperationalBanners';

const DEVELOPER_COPY_PATTERNS = [/BW-\d/, /후속\s*PR/, /notification\.batch\./];

const pushMonitorCopyEntries = () => Object.entries(ADMIN_WEB_SCAFFOLD_COPY)
  .filter(([key, value]) => key.startsWith('PUSH_') && typeof value === 'string');

describe('메시지 발송 화면 문구', () => {
  it('PUSH_MONITOR_*·PUSH_PLACEHOLDER_* 문구에 개발용 메모가 없다', () => {
    const entries = pushMonitorCopyEntries();
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach(([key, value]) => {
      DEVELOPER_COPY_PATTERNS.forEach((pattern) => {
        if (pattern.test(value)) {
          throw new Error(`${key} 에 개발용 문구가 남아 있음: ${value}`);
        }
      });
    });
  });

  it('부제목은 비어 있지 않다', () => {
    expect(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SUBTITLE.trim().length).toBeGreaterThan(0);
  });

  it('알림톡 OFF 배너는 서버 설정 키를 화면에 노출하지 않는다', () => {
    const { container } = render(
      <PushMonitorOperationalBanners alimtalkRouteEnabled={false} channelBreakdown={[]} />
    );
    expect(screen.getByText(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_BANNER_ALIMTALK_OFF_TITLE))
      .toBeInTheDocument();
    expect(container.querySelector('code')).toBeNull();
    DEVELOPER_COPY_PATTERNS.forEach((pattern) => {
      expect(container.textContent).not.toMatch(pattern);
    });
  });
});
