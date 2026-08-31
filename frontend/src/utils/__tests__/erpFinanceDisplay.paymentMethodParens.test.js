/**
 * localizePaymentMethodParens — description 괄호 enum → billing SSOT 한국어
 * codeValue 병합·저장값 변경 없음 (표시만).
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import {
  localizePaymentMethodParens,
  stripTrailingDebugBrackets
} from '../erpFinanceDisplay';
import { MAPPING_PAYMENT_METHOD_LABELS } from '../../constants/billing';

describe('localizePaymentMethodParens', () => {
  test('(BANK_TRANSFER) → 계좌이체', () => {
    const text = localizePaymentMethodParens(
      '상담료 입금 확인 - 기본20회기 (BANK_TRANSFER)'
    );
    expect(text).toBe('상담료 입금 확인 - 기본20회기 (계좌이체)');
    expect(text).toContain(`(${MAPPING_PAYMENT_METHOD_LABELS.BANK_TRANSFER})`);
    expect(text).not.toContain('BANK_TRANSFER');
  });

  test('(CREDIT_CARD) → 신용카드', () => {
    const text = localizePaymentMethodParens('기타 (CREDIT_CARD)');
    expect(text).toBe(`기타 (${MAPPING_PAYMENT_METHOD_LABELS.CREDIT_CARD})`);
    expect(text).not.toContain('CREDIT_CARD');
  });

  test('혼합 괄호 (1회 추가, CREDIT_CARD) → 신용카드 (금액·추가 문구 유지)', () => {
    const input =
      '추가 회기 상담료 입금 확인 - 단회기 75,000원 (1회 추가, CREDIT_CARD)';
    const text = localizePaymentMethodParens(input);
    expect(text).toBe(
      `추가 회기 상담료 입금 확인 - 단회기 75,000원 (1회 추가, ${MAPPING_PAYMENT_METHOD_LABELS.CREDIT_CARD})`
    );
    expect(text).toContain('75,000원');
    expect(text).toContain('1회 추가');
    expect(text).not.toContain('CREDIT_CARD');
  });

  test('(CARD_TERMINAL) → 신용카드(단말)', () => {
    const text = localizePaymentMethodParens('단말 결제 확인 (CARD_TERMINAL)');
    expect(text).toBe(`단말 결제 확인 (${MAPPING_PAYMENT_METHOD_LABELS.CARD_TERMINAL})`);
    expect(text).not.toContain('CARD_TERMINAL');
  });

  test('맵에 없는 코드는 그대로 유지 (병합·임의 치환 없음)', () => {
    expect(localizePaymentMethodParens('식대 (MEAL)')).toBe('식대 (MEAL)');
    expect(localizePaymentMethodParens('식대 (EAT)')).toBe('식대 (EAT)');
    expect(localizePaymentMethodParens('이체 (internst)')).toBe('이체 (internst)');
  });

  test('빈·null 입력은 안전하게 처리', () => {
    expect(localizePaymentMethodParens('')).toBe('');
    expect(localizePaymentMethodParens(null)).toBe('');
    expect(localizePaymentMethodParens(undefined)).toBe('');
  });
});

describe('stripTrailingDebugBrackets', () => {
  test('trailing 디버그 브래킷만 제거', () => {
    expect(stripTrailingDebugBrackets(
      '상담료 (BANK_TRANSFER) [정확한금액: 1,600,000원]'
    )).toBe('상담료 (BANK_TRANSFER)');
  });
});
