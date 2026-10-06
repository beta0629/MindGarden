import * as fs from 'fs';
import * as path from 'path';
import {
  buildCreateBookingRequest,
  expandWeeklyAvailability,
  pickDefaultConsultationType,
} from '../clientBookingPayload';
import { SCHEDULE_API } from '../../endpoints';

const AVAILABILITY_BODY = {
  success: true,
  data: [
    { id: 1, dayOfWeek: 'MONDAY', startTime: '10:00:00', endTime: '10:50:00', isActive: true },
    { id: 2, dayOfWeek: 'TUESDAY', startTime: '14:00:00', endTime: '14:50:00', isActive: true },
    { id: 3, dayOfWeek: 'TUESDAY', startTime: '09:00:00', endTime: '09:50:00', isActive: true },
    { id: 4, dayOfWeek: 'WEDNESDAY', startTime: '11:00:00', endTime: '11:50:00', isActive: false },
  ],
  totalCount: 4,
};

describe('clientBookingPayload', () => {
  test('가예약 신청은 내담자 전용 엔드포인트를 쓴다 (POST /api/v1/schedules 405 회귀 방지)', () => {
    expect(SCHEDULE_API.SCHEDULE_CREATE).toBe('/api/v1/clients/me/bookings');
  });

  test('주간 반복 가용 행을 weekStart 부터 날짜별 슬롯으로 펼친다 (응답에 slots 없음)', () => {
    const now = new Date('2026-10-01T00:00:00');
    const slots = expandWeeklyAvailability(AVAILABILITY_BODY, '2026-10-05', now);
    expect(slots).toEqual([
      { date: '2026-10-05', startTime: '10:00', endTime: '10:50', isAvailable: true },
      { date: '2026-10-06', startTime: '09:00', endTime: '09:50', isAvailable: true },
      { date: '2026-10-06', startTime: '14:00', endTime: '14:50', isAvailable: true },
    ]);
  });

  test('이미 지난 시작 시각은 선택 불가로 표시한다', () => {
    const now = new Date('2026-10-06T12:00:00');
    const slots = expandWeeklyAvailability(AVAILABILITY_BODY, '2026-10-05', now);
    expect(slots.map((s) => s.isAvailable)).toEqual([false, false, true]);
  });

  test('가용 행이 없거나 형식이 다르면 빈 배열', () => {
    expect(expandWeeklyAvailability({ success: true, data: [] }, '2026-10-05')).toEqual([]);
    expect(expandWeeklyAvailability(undefined, '2026-10-05')).toEqual([]);
    expect(expandWeeklyAvailability(AVAILABILITY_BODY, 'bad')).toEqual([]);
  });

  test('상담 유형은 공통코드 활성 행 중 sortOrder 최소, 없으면 null', () => {
    expect(
      pickDefaultConsultationType({
        success: true,
        data: [
          { codeValue: 'B', koreanName: '둘', sortOrder: 2, isActive: true },
          { codeValue: 'X', koreanName: '비활성', sortOrder: 0, isActive: false },
          { codeValue: 'A', codeLabel: '하나', sortOrder: 1, isActive: true },
        ],
      }),
    ).toEqual({ value: 'A', label: '하나' });
    expect(pickDefaultConsultationType({ success: true, data: [] })).toBeNull();
  });

  test('요청 본문에 clientId·paymentMethod·sessionType 이 없다', () => {
    const body = buildCreateBookingRequest({
      consultantId: '12',
      date: '2026-10-07',
      startTime: '10:00:00',
      endTime: '10:50',
      consultationType: 'INDIVIDUAL',
    });
    expect(body).toEqual({
      consultantId: 12,
      date: '2026-10-07',
      startTime: '10:00',
      endTime: '10:50',
      consultationType: 'INDIVIDUAL',
    });
    expect(body).not.toHaveProperty('clientId');
    expect(body).not.toHaveProperty('paymentMethod');
    expect(body).not.toHaveProperty('sessionType');
  });

  test('상담사·상담 유형이 없으면 요청을 만들지 않는다', () => {
    const base = { date: '2026-10-07', startTime: '10:00', endTime: '10:50' };
    expect(() =>
      buildCreateBookingRequest({ ...base, consultantId: 'x', consultationType: 'INDIVIDUAL' }),
    ).toThrow();
    expect(() => buildCreateBookingRequest({ ...base, consultantId: 1, consultationType: '' })).toThrow();
  });

  test('예약 화면은 SESSION_DEDUCT 즉시 차감 전제를 쓰지 않는다', () => {
    const root = path.join(__dirname, '../../../..');
    const payment = fs.readFileSync(path.join(root, 'app/(client)/(booking)/payment.tsx'), 'utf8');
    const hook = fs.readFileSync(path.join(root, 'src/api/hooks/useBooking.ts'), 'utf8');
    expect(payment).not.toMatch(/SESSION_DEDUCT/);
    expect(payment).not.toMatch(/sessionType/);
    expect(payment).not.toMatch(/remainingSessions/);
    expect(hook).not.toMatch(/SESSION_DEDUCT/);
  });
});
