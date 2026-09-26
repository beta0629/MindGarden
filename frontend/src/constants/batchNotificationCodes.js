/**
 * 배치/예약 리마인더 SMS 템플릿 코드 SSOT.
 * 백엔드 {@code BatchNotificationTemplateCodes} 와 1:1.
 *
 * @author MindGarden
 * @since 2026-09-26
 */

export const BATCH_NOTIFICATION_TEMPLATE_CODES = Object.freeze({
  RESERVATION_REMINDER_D2: 'RESERVATION_REMINDER_D2',
  RESERVATION_IMMEDIATE_SINGLE: 'RESERVATION_IMMEDIATE_SINGLE',
  RESERVATION_IMMEDIATE_LATE: 'RESERVATION_IMMEDIATE_LATE',
  SESSION_ENDING_SOON: 'SESSION_ENDING_SOON',
  SESSION_RENEW_PROMPT: 'SESSION_RENEW_PROMPT',
  CLIENT_WELCOME_FIRST: 'CLIENT_WELCOME_FIRST',
  INITIAL_GUIDE_OFFLINE: 'INITIAL_GUIDE_OFFLINE',
  INITIAL_GUIDE_ONLINE: 'INITIAL_GUIDE_ONLINE'
});

/**
 * D-2 / D-1(및 D-0) 배치 리마인드 코드 — BE {@code RESERVATION_REMINDER_DN_CODES}.
 * D-1·D-0 은 동일 템플릿 {@link BATCH_NOTIFICATION_TEMPLATE_CODES.RESERVATION_IMMEDIATE_LATE}.
 */
export const RESERVATION_REMINDER_DN_CODES = Object.freeze([
  BATCH_NOTIFICATION_TEMPLATE_CODES.RESERVATION_REMINDER_D2,
  BATCH_NOTIFICATION_TEMPLATE_CODES.RESERVATION_IMMEDIATE_LATE
]);

/** SystemConfig · SMS 템플릿 UI 에서 D-n 역할 식별 */
export const RESERVATION_REMINDER_DN_ROLE = Object.freeze({
  D2: 'D2',
  D1: 'D1'
});

/**
 * 템플릿 키 → D-n 역할. 대상이 아니면 null.
 *
 * @param {string|null|undefined} templateKey
 * @returns {'D1'|'D2'|null}
 */
export const resolveReservationReminderDnRole = (templateKey) => {
  if (!templateKey || typeof templateKey !== 'string') {
    return null;
  }
  if (templateKey === BATCH_NOTIFICATION_TEMPLATE_CODES.RESERVATION_REMINDER_D2) {
    return RESERVATION_REMINDER_DN_ROLE.D2;
  }
  if (templateKey === BATCH_NOTIFICATION_TEMPLATE_CODES.RESERVATION_IMMEDIATE_LATE) {
    return RESERVATION_REMINDER_DN_ROLE.D1;
  }
  return null;
};

/**
 * SMS 템플릿 목록 표시용 Dn 라벨 (i18n). 해당 없으면 null → 기존 label/key 사용.
 *
 * @param {string|null|undefined} templateKey
 * @param {(key: string, fallback?: string) => string} t
 * @returns {string|null}
 */
export const getReservationReminderDnListLabel = (templateKey, t) => {
  const role = resolveReservationReminderDnRole(templateKey);
  if (role === RESERVATION_REMINDER_DN_ROLE.D1) {
    return t(
      'smsTemplate.reminderDn.d1ListLabel',
      'D-1·D-0 리마인더 (LATE)'
    );
  }
  if (role === RESERVATION_REMINDER_DN_ROLE.D2) {
    return t('smsTemplate.reminderDn.d2ListLabel', 'D-2 리마인더');
  }
  return null;
};
