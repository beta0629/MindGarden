import fs from 'fs';
import path from 'path';
import {
  buildClientBookingPayload,
  dayOfWeekForDate,
  expandAvailabilityForDate,
  pickDefaultConsultationType
} from '../clientBookingRequest';
import { CLIENT_BOOKING_API } from '../../constants/api';

const AVAILABILITY_BODY = {
  success: true,
  data: [
    { id: 1, dayOfWeek: 'TUESDAY', startTime: '14:00:00', endTime: '14:50:00', isActive: true },
    { id: 2, dayOfWeek: 'TUESDAY', startTime: '10:00:00', endTime: '10:50:00', isActive: true },
    { id: 3, dayOfWeek: 'TUESDAY', startTime: '11:00:00', endTime: '11:50:00', isActive: false },
    { id: 4, dayOfWeek: 'WEDNESDAY', startTime: '09:00:00', endTime: '09:50:00', isActive: true }
  ],
  totalCount: 4
};

describe('clientBookingRequest', () => {
  test('날짜 요일을 서버 DayOfWeek 이름으로 바꾼다', () => {
    expect(dayOfWeekForDate('2026-10-06')).toBe('TUESDAY');
    expect(dayOfWeekForDate('not-a-date')).toBe('');
  });

  test('주간 가용 시간 응답에서 해당 요일 활성 행만 시작 시각순 슬롯으로 펼친다', () => {
    expect(expandAvailabilityForDate(AVAILABILITY_BODY, '2026-10-06')).toEqual([
      { startTime: '10:00', endTime: '10:50' },
      { startTime: '14:00', endTime: '14:50' }
    ]);
  });

  test('가용 행이 없으면 하드코딩 기본 슬롯 없이 빈 배열', () => {
    expect(expandAvailabilityForDate({ success: true, data: [] }, '2026-10-06')).toEqual([]);
    expect(expandAvailabilityForDate(undefined, '2026-10-06')).toEqual([]);
  });

  test('상담 유형은 공통코드 활성 행 중 sortOrder 최소값, 없으면 null', () => {
    expect(pickDefaultConsultationType([
      { codeValue: 'B', koreanName: '두번째', sortOrder: 2, isActive: true },
      { codeValue: 'Z', koreanName: '비활성', sortOrder: 0, isActive: false },
      { codeValue: 'A', koreanName: '첫번째', sortOrder: 1, isActive: true }
    ])).toEqual({ value: 'A', label: '첫번째' });
    expect(pickDefaultConsultationType([])).toBeNull();
    expect(pickDefaultConsultationType(null)).toBeNull();
  });

  test('요청 본문에 clientId·결제 수단을 넣지 않는다', () => {
    const body = buildClientBookingPayload({
      consultantId: '7',
      date: '2026-10-07',
      slot: { startTime: '10:00', endTime: '10:50' },
      consultationType: 'INDIVIDUAL'
    });
    expect(body).toEqual({
      consultantId: 7,
      date: '2026-10-07',
      startTime: '10:00',
      endTime: '10:50',
      consultationType: 'INDIVIDUAL'
    });
    expect(body).not.toHaveProperty('clientId');
    expect(body).not.toHaveProperty('paymentMethod');
  });

  test('웹 예약 화면은 내담자 전용 엔드포인트 상수로만 신청하고 /api/v1/consultations·결제 옵션을 쓰지 않는다', () => {
    expect(CLIENT_BOOKING_API.CREATE).toBe('/api/v1/clients/me/bookings');
    const src = fs.readFileSync(
      path.join(__dirname, '../../components/client/ClientBookingRenewal.js'),
      'utf8'
    );
    expect(src).toMatch(/StandardizedApi\.post\(\s*CLIENT_BOOKING_API\.CREATE/);
    expect(src).not.toMatch(/\/api\/v1\/consultations/);
    expect(src).not.toMatch(/clientId:/);
    expect(src).not.toMatch(/paymentMethod/);
    expect(src).not.toMatch(/\d{1,3},\d{3}원/);
    expect(src).not.toMatch(/'\d{2}:\d{2}'/);
  });
});
