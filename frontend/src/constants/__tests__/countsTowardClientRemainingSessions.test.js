/**
 * countsTowardClientRemainingSessions — 홈·회기 잔여 SSOT
 *
 * @author MindGarden
 * @since 2026-09-19
 */

import {
  MAPPING_STATUS,
  countsTowardClientRemainingSessions
} from '../mapping';
import { calculateClientSessionTotalsFromMappings } from '../../utils/clientSessionTotals';

describe('countsTowardClientRemainingSessions', () => {
  test('shop-paid statuses count; unpaid PENDING_PAYMENT and exhausted do not', () => {
    expect(countsTowardClientRemainingSessions(MAPPING_STATUS.ACTIVE)).toBe(true);
    expect(countsTowardClientRemainingSessions(MAPPING_STATUS.PAYMENT_CONFIRMED)).toBe(true);
    expect(countsTowardClientRemainingSessions(MAPPING_STATUS.DEPOSIT_PENDING)).toBe(true);
    expect(countsTowardClientRemainingSessions(MAPPING_STATUS.DEPOSIT_CONFIRMED)).toBe(true);
    expect(countsTowardClientRemainingSessions(MAPPING_STATUS.PENDING_PAYMENT)).toBe(false);
    expect(countsTowardClientRemainingSessions(MAPPING_STATUS.SESSIONS_EXHAUSTED)).toBe(false);
    expect(countsTowardClientRemainingSessions(MAPPING_STATUS.TERMINATED)).toBe(false);
    expect(countsTowardClientRemainingSessions(null)).toBe(false);
    expect(countsTowardClientRemainingSessions(undefined)).toBe(false);
  });

  test('DevUser-000020: PAYMENT_CONFIRMED rem=10 + SESSIONS_EXHAUSTED rem=0 → home remaining===10', () => {
    const totals = calculateClientSessionTotalsFromMappings([
      {
        id: 274,
        status: MAPPING_STATUS.PAYMENT_CONFIRMED,
        totalSessions: 10,
        usedSessions: 0,
        remainingSessions: 10
      },
      {
        id: 1,
        status: MAPPING_STATUS.SESSIONS_EXHAUSTED,
        totalSessions: 10,
        usedSessions: 10,
        remainingSessions: 0
      }
    ]);
    expect(totals.remainingSessions).toBe(10);
  });

  test('ACTIVE rem=3 + PAYMENT_CONFIRMED rem=10 → remaining===13', () => {
    const totals = calculateClientSessionTotalsFromMappings([
      {
        id: 1,
        status: MAPPING_STATUS.ACTIVE,
        totalSessions: 5,
        usedSessions: 2,
        remainingSessions: 3
      },
      {
        id: 274,
        status: MAPPING_STATUS.PAYMENT_CONFIRMED,
        totalSessions: 10,
        usedSessions: 0,
        remainingSessions: 10
      }
    ]);
    expect(totals.remainingSessions).toBe(13);
  });

  test('PENDING_PAYMENT rem=0 unpaid is not counted as paid remaining', () => {
    const totals = calculateClientSessionTotalsFromMappings([
      {
        id: 1,
        status: MAPPING_STATUS.PENDING_PAYMENT,
        totalSessions: 10,
        usedSessions: 0,
        remainingSessions: 0
      }
    ]);
    expect(totals.remainingSessions).toBe(0);
    expect(totals.totalSessions).toBe(0);
  });
});
