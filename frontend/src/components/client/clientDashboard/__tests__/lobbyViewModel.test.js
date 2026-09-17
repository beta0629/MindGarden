/**
 * lobbyViewModel — 히어로 우선순위 · 칩 · 포맷
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import { CLIENT_LOBBY_HERO_PRIORITY } from '../constants';
import {
  buildSessionChipAndBalance,
  formatLobbyAmPmTime,
  formatLobbyDateTime,
  resolveHeroPriority
} from '../lobbyViewModel';
import { MAPPING_STATUS } from '../../../../constants/mapping';

describe('lobbyViewModel', () => {
  test('히어로 우선순위: 다음 예약 > 회기0 > 미배정 > 미결제 > 여유', () => {
    expect(resolveHeroPriority({
      nextSchedule: { id: 1 },
      remainingSessions: 0,
      hasAssignedConsultant: false,
      hasPendingPayment: true
    })).toBe(CLIENT_LOBBY_HERO_PRIORITY.NEXT_APPOINTMENT);

    expect(resolveHeroPriority({
      nextSchedule: null,
      remainingSessions: 0,
      hasAssignedConsultant: true,
      hasPendingPayment: false
    })).toBe(CLIENT_LOBBY_HERO_PRIORITY.ZERO_SESSIONS);

    expect(resolveHeroPriority({
      nextSchedule: null,
      remainingSessions: 3,
      hasAssignedConsultant: false,
      hasPendingPayment: false
    })).toBe(CLIENT_LOBBY_HERO_PRIORITY.CONSULTANT_UNASSIGNED);

    expect(resolveHeroPriority({
      nextSchedule: null,
      remainingSessions: 3,
      hasAssignedConsultant: true,
      hasPendingPayment: true
    })).toBe(CLIENT_LOBBY_HERO_PRIORITY.PENDING_PAYMENT);

    expect(resolveHeroPriority({
      nextSchedule: null,
      remainingSessions: 3,
      hasAssignedConsultant: true,
      hasPendingPayment: false
    })).toBe(CLIENT_LOBBY_HERO_PRIORITY.QUIET_DAY);
  });

  test('패키지/단회기 ink 칩 파생', () => {
    const meta = buildSessionChipAndBalance([
      {
        id: 1,
        status: MAPPING_STATUS.ACTIVE,
        totalSessions: 10,
        remainingSessions: 4,
        packageName: '마음돌봄 패키지'
      },
      {
        id: 2,
        status: MAPPING_STATUS.ACTIVE,
        totalSessions: 1,
        remainingSessions: 2,
        packageName: '단회기'
      }
    ]);
    expect(meta.chips).toContain('패키지');
    expect(meta.chips).toContain('단회기');
    expect(meta.rows.some((r) => r.name === '단회기')).toBe(true);
  });

  test('일시 포맷 오후', () => {
    expect(formatLobbyAmPmTime('14:00')).toBe('오후 2:00');
    expect(formatLobbyAmPmTime('09:30')).toBe('오전 9:30');
    const label = formatLobbyDateTime({ date: '2099-09-20', startTime: '14:00' });
    expect(label).toMatch(/9월/);
    expect(label).toMatch(/오후 2:00/);
  });
});
