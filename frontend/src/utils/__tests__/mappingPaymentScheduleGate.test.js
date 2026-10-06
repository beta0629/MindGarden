import {
  alignMappingCreatePaymentMethod,
  allowsScheduleConfirm,
  allowsTentativeBeforeDeposit,
  blocksSessionConsumeFallback,
  defaultSameDayCardPaymentMethod
} from '../mappingPaymentScheduleGate';

describe('mappingPaymentScheduleGate', () => {
  test('선납 결제 대기는 가예약 거절, 확정 허용, 대체 차감 거절', () => {
    const mapping = { status: 'PENDING_PAYMENT', paymentTiming: 'ADVANCE' };
    expect(allowsTentativeBeforeDeposit(mapping)).toBe(false);
    expect(allowsScheduleConfirm(mapping)).toBe(true);
    expect(blocksSessionConsumeFallback(mapping)).toBe(true);
  });

  test('사후 카드 결제 대기는 가예약·확정 허용, 대체 차감 거절', () => {
    const mapping = { status: 'PENDING_PAYMENT', paymentTiming: 'same_day_card' };
    expect(allowsTentativeBeforeDeposit(mapping)).toBe(true);
    expect(allowsScheduleConfirm(mapping)).toBe(true);
    expect(blocksSessionConsumeFallback(mapping)).toBe(true);
  });

  test('ACTIVE 는 가예약·확정 허용, 기관연계 ACTIVE 가예약은 거절', () => {
    expect(allowsTentativeBeforeDeposit({ status: 'ACTIVE', paymentTiming: 'ADVANCE' })).toBe(true);
    expect(allowsScheduleConfirm({ status: 'ACTIVE', paymentTiming: 'ADVANCE' })).toBe(true);
    expect(allowsTentativeBeforeDeposit({
      status: 'ACTIVE',
      paymentTiming: 'INSTITUTION_LINK'
    })).toBe(false);
    expect(blocksSessionConsumeFallback({ status: 'ACTIVE', paymentTiming: 'ADVANCE' })).toBe(false);
  });

  test('상태 없는 매핑은 확정 거절', () => {
    expect(allowsScheduleConfirm(null)).toBe(false);
    expect(allowsScheduleConfirm({ paymentTiming: 'ADVANCE' })).toBe(false);
    expect(blocksSessionConsumeFallback(null)).toBe(false);
  });

  test('사후 카드로 바꾸면 계좌이체 기본값이 카드가 되고, 다시 고른 계좌이체는 유지', () => {
    expect(defaultSameDayCardPaymentMethod(null)).toBe('CARD');
    expect(alignMappingCreatePaymentMethod({
      nextTiming: 'SAME_DAY_CARD',
      paymentMethod: 'BANK_TRANSFER',
      previousTiming: 'ADVANCE'
    })).toBe('CARD');
    expect(alignMappingCreatePaymentMethod({
      nextTiming: 'SAME_DAY_CARD',
      paymentMethod: 'BANK_TRANSFER',
      previousTiming: 'SAME_DAY_CARD'
    })).toBe('BANK_TRANSFER');
    expect(alignMappingCreatePaymentMethod({
      nextTiming: 'SAME_DAY_CARD',
      paymentMethod: 'CASH',
      previousTiming: 'ADVANCE'
    })).toBe('CASH');
    expect(alignMappingCreatePaymentMethod({
      nextTiming: 'ADVANCE',
      paymentMethod: 'CARD',
      previousTiming: 'SAME_DAY_CARD'
    })).toBe('BANK_TRANSFER');
  });

  test('공통코드에 CREDIT_CARD 가 있으면 그 값을 사후 카드 기본 수단으로 쓴다', () => {
    const codes = [{ codeValue: 'CREDIT_CARD', extraData: '{"cardMerchantFeeEligible":true}' }];
    expect(alignMappingCreatePaymentMethod({
      nextTiming: 'SAME_DAY_CARD',
      paymentMethod: 'BANK_TRANSFER',
      previousTiming: 'ADVANCE',
      codes
    })).toBe('CREDIT_CARD');
  });
});
