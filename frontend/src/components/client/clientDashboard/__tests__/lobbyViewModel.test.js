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
  resolveHeroPriority,
  resolveLobbyBrandLabels
} from '../lobbyViewModel';
import { MAPPING_STATUS } from '../../../../constants/mapping';

describe('lobbyViewModel', () => {
  test('resolveLobbyBrandLabels: session/branding 바인딩 · 플랫폼 기본값 fail-closed', () => {
    expect(resolveLobbyBrandLabels(
      { tenant: { name: '햇살상담센터' } },
      { companyName: '햇살상담센터', companyNameEn: 'Sunshine' }
    )).toEqual({ brandWord: 'Sunshine', brandCenter: '햇살상담센터' });

    expect(resolveLobbyBrandLabels(
      { tenant: { name: '' } },
      { companyName: 'CoreSolution', companyNameEn: 'Core Solution' }
    )).toEqual({ brandWord: '', brandCenter: '' });

    expect(resolveLobbyBrandLabels(
      { tenant: { name: '동일센터' } },
      { companyNameEn: '동일센터' }
    )).toEqual({ brandWord: '', brandCenter: '동일센터' });

    expect(resolveLobbyBrandLabels(null, null)).toEqual({
      brandWord: '',
      brandCenter: ''
    });
  });

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

  test('PAYMENT_CONFIRMED rem 도 칩·잔여 집계 (홈 SSOT)', () => {
    const meta = buildSessionChipAndBalance([
      {
        id: 274,
        status: MAPPING_STATUS.PAYMENT_CONFIRMED,
        totalSessions: 10,
        remainingSessions: 10,
        packageName: '패키지10'
      },
      {
        id: 9,
        status: MAPPING_STATUS.SESSIONS_EXHAUSTED,
        totalSessions: 5,
        remainingSessions: 0,
        packageName: '소진'
      },
      {
        id: 8,
        status: MAPPING_STATUS.PENDING_PAYMENT,
        totalSessions: 10,
        remainingSessions: 0,
        packageName: '미결제'
      }
    ]);
    expect(meta.packageRemaining).toBe(10);
    expect(meta.rows.some((r) => r.remaining === 10)).toBe(true);
  });

  test('ACTIVE + PAYMENT_CONFIRMED rem 합산', () => {
    const meta = buildSessionChipAndBalance([
      {
        id: 1,
        status: MAPPING_STATUS.ACTIVE,
        totalSessions: 5,
        remainingSessions: 3,
        packageName: '활성'
      },
      {
        id: 2,
        status: MAPPING_STATUS.PAYMENT_CONFIRMED,
        totalSessions: 10,
        remainingSessions: 10,
        packageName: '결제확인'
      }
    ]);
    expect(meta.packageRemaining).toBe(13);
  });

  test('일시 포맷 오후', () => {
    expect(formatLobbyAmPmTime('14:00')).toBe('오후 2:00');
    expect(formatLobbyAmPmTime('09:30')).toBe('오전 9:30');
    const label = formatLobbyDateTime({ date: '2099-09-20', startTime: '14:00' });
    expect(label).toMatch(/9월/);
    expect(label).toMatch(/오후 2:00/);
  });
});
