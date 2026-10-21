/**
 * displayId — UUID 축약 · 「패키지」→「상담 회차」 화면 치환
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

import {
  abbreviateUuidsInText,
  formatNotificationSummaryText,
  formatPersonalOrderNumber,
  replacePackageLabelForDisplay
} from '../displayId';

describe('formatPersonalOrderNumber', () => {
  test('UUID 는 앞 8자만 4-4 로 보여 준다', () => {
    expect(formatPersonalOrderNumber('6793a1f0-1111-2222-3333-444455556666')).toBe('6793-A1F0');
  });

  test('UUID 가 아니면 그대로, 비어 있으면 빈 문자열', () => {
    expect(formatPersonalOrderNumber('929')).toBe('929');
    expect(formatPersonalOrderNumber(null)).toBe('');
  });
});

describe('abbreviateUuidsInText', () => {
  test('본문 속 UUID 부분 문자열을 8자 형태로 바꾼다', () => {
    const text = '주문번호: 87f33a1f-488e-4b6c-8a8c-c28c76ac5988 확인';
    expect(abbreviateUuidsInText(text)).toBe('주문번호: 87F3-3A1F 확인');
  });

  test('UUID 가 없으면 원문 유지', () => {
    expect(abbreviateUuidsInText('일반 문구')).toBe('일반 문구');
  });
});

describe('replacePackageLabelForDisplay', () => {
  test('일반 「패키지」는 「상담 회차」로 바꾼다', () => {
    expect(replacePackageLabelForDisplay('10회기 패키지 결제')).toBe('10회기 상담 회차 결제');
  });

  test('「N회기 패키지 중 M회 남음」 관용 구문은 그대로 둔다', () => {
    expect(replacePackageLabelForDisplay('10회기 패키지 중 3회 남음')).toBe('10회기 패키지 중 3회 남음');
  });
});

describe('formatNotificationSummaryText', () => {
  test('UUID 축약 후 패키지 라벨을 치환한다', () => {
    const text = '패키지 주문 87f33a1f-488e-4b6c-8a8c-c28c76ac5988';
    expect(formatNotificationSummaryText(text)).toBe('상담 회차 주문 87F3-3A1F');
  });
});
