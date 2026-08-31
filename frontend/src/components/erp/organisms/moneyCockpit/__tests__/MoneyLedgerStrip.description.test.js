/**
 * MoneyLedgerStrip — 내용 문구는 description 클리닉 부분만.
 * 결제코드 괄호는 billing SSOT, trailing 디버그 브래킷 제거.
 * memo/remarks·카테고리 미사용 (§8.1).
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import { buildLedgerStripDescription } from '../MoneyLedgerStrip';
import { OFD_LEDGER } from '../../../../../constants/operatorFinanceDashboardStrings';
import { MAPPING_PAYMENT_METHOD_LABELS } from '../../../../../constants/billing';

describe('buildLedgerStripDescription', () => {
  test('BANK_TRANSFER 괄호 → 계좌이체, 정확한금액 브래킷 제거', () => {
    const text = buildLedgerStripDescription({
      description: '상담료 입금 확인 - 기본20회기 (BANK_TRANSFER) [정확한금액: 1,600,000원]',
      category: 'CONSULTATION',
      memo: 'ignore me BANK_TRANSFER',
      remarks: 'tax debug'
    });
    expect(text).toBe('상담료 입금 확인 - 기본20회기 (계좌이체)');
    expect(text).toContain('상담료 입금 확인');
    expect(text).toContain(`(${MAPPING_PAYMENT_METHOD_LABELS.BANK_TRANSFER})`);
    expect(text).not.toContain('BANK_TRANSFER');
    expect(text).not.toContain('정확한금액');
    expect(text).not.toContain('·');
  });

  test('원천징수 등 tax trailing 브래킷 제거 — 3.3%·BANK_TRANSFER 미노출', () => {
    const text = buildLedgerStripDescription({
      description:
        '상담료 입금 확인 - 기본20회기 (BANK_TRANSFER) [정확한금액: 1,600,000원] [부가세 분리: 공급가 1,454,545 / 부가세 145,455] [사업소득 원천징수 3.3% 적용]',
      memo: '3.3% memo',
      remarks: 'BANK_TRANSFER remarks'
    });
    expect(text).toBe('상담료 입금 확인 - 기본20회기 (계좌이체)');
    expect(text).not.toContain('3.3%');
    expect(text).not.toContain('BANK_TRANSFER');
    expect(text).not.toContain('부가세');
    expect(text).not.toContain('원천징수');
  });

  test('memo/remarks는 description 없을 때에도 쓰지 않음', () => {
    const text = buildLedgerStripDescription({
      description: '',
      memo: 'BANK_TRANSFER · 원천세 3.3%',
      remarks: 'debug tax 3.3%',
      category: 'CONSULTATION'
    });
    expect(text).toBe(OFD_LEDGER.DASH);
    expect(text).not.toContain('BANK_TRANSFER');
    expect(text).not.toContain('3.3%');
  });

  test('description·category 모두 없으면 dash (memo 무시)', () => {
    expect(buildLedgerStripDescription({
      memo: 'BANK_TRANSFER',
      remarks: '3.3%'
    })).toBe(OFD_LEDGER.DASH);
  });

  test('CARD_TERMINAL 괄호는 SSOT 라벨로 치환', () => {
    const text = buildLedgerStripDescription({
      description: '단말 결제 확인 (CARD_TERMINAL)'
    });
    expect(text).toBe(`단말 결제 확인 (${MAPPING_PAYMENT_METHOD_LABELS.CARD_TERMINAL})`);
    expect(text).not.toContain('CARD_TERMINAL');
  });

  test('CARD 괄호는 SSOT 라벨로 치환', () => {
    const text = buildLedgerStripDescription({
      description: '온라인 카드 입금 (CARD) [정확한금액: 100,000원]'
    });
    expect(text).toBe(`온라인 카드 입금 (${MAPPING_PAYMENT_METHOD_LABELS.CARD})`);
    expect(text).not.toContain('CARD');
    expect(text).not.toContain('정확한금액');
  });

  test('CREDIT_CARD 괄호는 SSOT 라벨로 치환', () => {
    const text = buildLedgerStripDescription({
      description: '기타 (CREDIT_CARD)'
    });
    expect(text).toBe(`기타 (${MAPPING_PAYMENT_METHOD_LABELS.CREDIT_CARD})`);
    expect(text).not.toContain('CREDIT_CARD');
  });

  test('맵에 없는 코드 괄호는 임의 치환하지 않음 (SSOT만)', () => {
    const text = buildLedgerStripDescription({
      description: '기타 (FOO_PAY)'
    });
    expect(text).toBe('기타 (FOO_PAY)');
    expect(Object.prototype.hasOwnProperty.call(
      MAPPING_PAYMENT_METHOD_LABELS,
      'FOO_PAY'
    )).toBe(false);
  });

  test('카테고리를 내용 문자열에 붙이지 않음', () => {
    const text = buildLedgerStripDescription({
      description: '상담료 입금 확인',
      category: 'CONSULTATION'
    });
    expect(text).toBe('상담료 입금 확인');
    expect(text).not.toMatch(/·/);
  });
});
