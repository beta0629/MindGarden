/**
 * 통합 월간 컴팩트 칩 문구.
 * 표식이 숨겨도 title·aria-label 에 전체 라벨이 남는다.
 */

export const INTEGRATED_MONTH_CHIP_I18N = Object.freeze({
  cancelledBadge: 'schedule:calendar.compact.cancelledBadge',
  sameDayPrefix: 'schedule:calendar.compact.sameDayPrefix',
  sameDayAria: 'schedule:calendar.compact.sameDayAria',
  clientNameFallback: 'schedule:calendar.compact.clientNameFallback',
  unresolvedBoth: 'schedule:calendar.unresolved.both',
  unresolvedScheduleOnly: 'schedule:calendar.unresolved.scheduleOnly',
  unresolvedClientOnly: 'schedule:calendar.unresolved.clientOnly',
  institutionLink: 'admin:mapping.schedule.legend.institutionLink',
  reminderSmsAria: Object.freeze({
    SENT: 'schedule:calendar.reminderSms.aria.SENT',
    PENDING: 'schedule:calendar.reminderSms.aria.PENDING',
    FAILED: 'schedule:calendar.reminderSms.aria.FAILED'
  }),
  legendStatus: 'schedule:calendar.legend.status',
  legendSms: 'schedule:calendar.legend.sms',
  legendUnresolved: 'schedule:calendar.legend.unresolved',
  legendHint: 'schedule:calendar.legend.hint'
});

const joinLabel = (parts) => parts.filter((part) => part != null && String(part).trim() !== '').join(' · ');

/**
 * @param {Function} translate
 * @param {string} key
 * @param {object} [options]
 * @returns {string}
 */
const translateLabel = (translate, key, options) => {
  if (typeof translate !== 'function') {
    return '';
  }
  const value = translate(key, options);
  return value == null ? '' : String(value);
};

/**
 * @param {{
 *   translate: Function,
 *   timeText?: string,
 *   clientName?: string,
 *   sessionAriaLabel?: string,
 *   statusLabel?: string,
 *   isSameDayPending?: boolean,
 *   institutionLabel?: string,
 *   reminderSmsStatus?: string,
 *   scheduleUnresolvedCount?: number,
 *   clientWideUnresolvedCount?: number
 * }} input
 * @returns {{
 *   ariaLabel: string,
 *   unresolvedText: string,
 *   sameDayPrefix: string,
 *   cancelledBadge: string,
 *   clientNameFallback: string,
 *   reminderSmsAria: string
 * }}
 */
export function buildIntegratedMonthChipCopy(input) {
  const translate = input?.translate;
  const sameDayPrefix = translateLabel(translate, INTEGRATED_MONTH_CHIP_I18N.sameDayPrefix);
  const cancelledBadge = translateLabel(translate, INTEGRATED_MONTH_CHIP_I18N.cancelledBadge);
  const clientNameFallback = translateLabel(translate, INTEGRATED_MONTH_CHIP_I18N.clientNameFallback);
  const scheduleCount = Number(input?.scheduleUnresolvedCount) || 0;
  const clientCount = Number(input?.clientWideUnresolvedCount) || 0;
  let unresolvedText = '';
  if (scheduleCount > 0 && clientCount > 0) {
    unresolvedText = translateLabel(translate, INTEGRATED_MONTH_CHIP_I18N.unresolvedBoth, {
      schedule: scheduleCount,
      client: clientCount
    });
  } else if (scheduleCount > 0) {
    unresolvedText = translateLabel(translate, INTEGRATED_MONTH_CHIP_I18N.unresolvedScheduleOnly, {
      count: scheduleCount
    });
  } else if (clientCount > 0) {
    unresolvedText = translateLabel(translate, INTEGRATED_MONTH_CHIP_I18N.unresolvedClientOnly, {
      count: clientCount
    });
  }

  const smsStatus = input?.reminderSmsStatus == null ? '' : String(input.reminderSmsStatus);
  const smsKey = INTEGRATED_MONTH_CHIP_I18N.reminderSmsAria[smsStatus];
  const reminderSmsAria = smsKey ? translateLabel(translate, smsKey) : '';

  const sessionAria = input?.sessionAriaLabel ? String(input.sessionAriaLabel).trim() : '';
  const clientName = input?.clientName == null ? '' : String(input.clientName);
  const namePart = sessionAria ? `${clientName} ${sessionAria}` : clientName;

  const ariaLabel = joinLabel([
    input?.isSameDayPending
      ? translateLabel(translate, INTEGRATED_MONTH_CHIP_I18N.sameDayAria)
      : '',
    input?.timeText,
    namePart,
    input?.statusLabel,
    input?.institutionLabel,
    reminderSmsAria,
    unresolvedText
  ]);

  return {
    ariaLabel,
    unresolvedText,
    sameDayPrefix,
    cancelledBadge,
    clientNameFallback,
    reminderSmsAria
  };
}
