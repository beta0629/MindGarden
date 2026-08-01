/**
 * 통합 스케줄 — 내담자 예약 문자(SMS) 배지 상수·필드명 SSOT
 *
 * @author MindGarden
 * @since 2026-08-01
 */

/** ScheduleResponse / mapping.clientReminderSms 필드명 */
export const CLIENT_REMINDER_SMS_FIELD = 'clientReminderSms';

export const CLIENT_REMINDER_SMS_STATUS = Object.freeze({
  SENT: 'SENT',
  PENDING: 'PENDING',
  FAILED: 'FAILED'
});

/** UI 노출 라벨 (스펙: 발송됨 / 대기 / 실패) */
export const CLIENT_REMINDER_SMS_LABEL = Object.freeze({
  SENT: '발송됨',
  PENDING: '대기',
  FAILED: '실패'
});

export const CLIENT_REMINDER_SMS_ARIA_PREFIX = '예약 문자 발송 상태';

export const CLIENT_REMINDER_SMS_TOOLTIP_PREFIX = Object.freeze({
  SENT: '발송',
  PENDING: '예정',
  FAILED: '실패'
});

/** common Badge statusVariant 매핑 */
export const CLIENT_REMINDER_SMS_BADGE_STATUS_VARIANT = Object.freeze({
  SENT: 'success',
  PENDING: 'warning',
  FAILED: 'danger'
});
