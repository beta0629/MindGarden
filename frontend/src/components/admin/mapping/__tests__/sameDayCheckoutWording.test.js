/**
 * 당일 결제 흐름 문구 회귀 가드 — 결제 방법(계좌이체·현금 등) 선택이 가능하므로
 * 사용자 노출 문구에 「당일 카드 결제」가 다시 들어가지 않도록 고정한다.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */

import koAdmin from '../../../../locales/ko/admin.json';
import { SAME_DAY_CHECKOUT_MSG_MAPPING_INCOMPLETE } from '../../../schedule/hooks/useScheduleDetailSameDayCheckout';

const CARD_ONLY_WORDING = '당일 카드 결제';

describe('당일 결제 흐름 문구', () => {
  const sameDay = koAdmin.mapping.checkout.sameDay;
  const paymentTiming = koAdmin.mappingCreation.paymentTiming;

  test('당일 결제 모달 성공·오류 문구는 중립 「당일 결제」', () => {
    expect(sameDay.success).toBe('당일 결제가 완료되고 배정이 활성화되었습니다.');
    expect(sameDay.error.generic).toBe('당일 결제 중 오류가 발생했습니다.');
  });

  test('배정 생성 완료 안내는 「당일 결제 모달」로 안내', () => {
    expect(paymentTiming.sameDayCardCompletionNotice).toContain('곧 열리는 당일 결제 모달에서');
  });

  test('admin.json 전체에 「당일 카드 결제」 문구가 없다', () => {
    expect(JSON.stringify(koAdmin)).not.toContain(CARD_ONLY_WORDING);
  });

  test('정보 누락 경고 문구도 중립', () => {
    expect(SAME_DAY_CHECKOUT_MSG_MAPPING_INCOMPLETE).not.toContain(CARD_ONLY_WORDING);
    expect(SAME_DAY_CHECKOUT_MSG_MAPPING_INCOMPLETE).toContain('당일 결제를 진행할 수 없습니다');
  });
});
