import scheduleKo from '../../locales/ko/schedule.json';
import commonKo from '../../locales/ko/common.json';
import { resolveScheduleActionFailureMessage } from '../scheduleActionFailureMessage';

const interpolate = (template, params) => template.replace(
  /\{\{(\w+)\}\}/g,
  (_, key) => (params && params[key] != null ? String(params[key]) : '')
);

describe('일정 확정·취소 실패 토스트', () => {
  const confirmTemplate = scheduleKo.ScheduleDetailModal.t_fd96349e;
  const cancelTemplate = scheduleKo.ScheduleDetailModal.t_dc4ce696;
  const kakaoTemplate = commonKo.utils.socialLogin.t_8cdad74b;
  const subdomainTemplate = commonKo.utils.socialLogin.t_9caeef26;

  test('i18n 리소스에 ${ 리터럴이 없다', () => {
    expect(confirmTemplate).not.toContain('${');
    expect(cancelTemplate).not.toContain('${');
    expect(kakaoTemplate).not.toContain('${');
    expect(subdomainTemplate).not.toContain('${');
    expect(confirmTemplate).toContain('{{message}}');
    expect(cancelTemplate).toContain('{{message}}');
  });

  test('확정 실패 토스트는 서버 사유를 보여주고 ${ 를 남기지 않는다', () => {
    const reason = '입금 전 일정은 회기를 차감하지 않습니다';
    const message = resolveScheduleActionFailureMessage(
      (key, params) => (key === 'with-reason'
        ? interpolate(confirmTemplate, params)
        : '예약 확정에 실패했습니다.'),
      { response: { data: { message: reason } }, message: '${error.message}' },
      'with-reason',
      'fallback'
    );

    expect(message).toContain(reason);
    expect(message).not.toContain('${');
    expect(message).not.toContain('error.message');
  });

  test('취소 실패도 오류 객체 메시지를 보간한다', () => {
    const message = resolveScheduleActionFailureMessage(
      (key, params) => interpolate(cancelTemplate, params),
      new Error('이미 취소된 일정입니다'),
      'with-reason',
      'fallback'
    );

    expect(message).toBe('예약 취소에 실패했습니다: 이미 취소된 일정입니다');
    expect(message).not.toContain('${');
  });

  test('사유가 없으면 폴백만 반환한다', () => {
    const message = resolveScheduleActionFailureMessage(
      (key) => (key === 'fallback' ? '예약 확정에 실패했습니다.' : confirmTemplate),
      {},
      'with-reason',
      'fallback'
    );

    expect(message).toBe('예약 확정에 실패했습니다.');
    expect(message).not.toContain('${');
  });
});
