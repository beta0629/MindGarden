/**
 * MoneyLedgerStrip — 내용 문구는 장부 description+category 경로.
 * memo/remarks의 BANK_TRANSFER·세금 접미사 미사용.
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import { buildLedgerStripDescription } from '../MoneyLedgerStrip';
import { OFD_LEDGER } from '../../../../../constants/operatorFinanceDashboardStrings';

describe('buildLedgerStripDescription', () => {
  test('description + category 라벨 (장부 경로)', () => {
    const text = buildLedgerStripDescription({
      description: '상담료 입금 확인',
      category: 'CONSULTATION',
      memo: 'BANK_TRANSFER 원천세 3.3%',
      remarks: 'tax debug 3.3%'
    });
    expect(text).toContain('상담료 입금 확인');
    expect(text).not.toContain('BANK_TRANSFER');
    expect(text).not.toContain('3.3%');
  });

  test('memo/remarks만 있고 description 없으면 memo를 쓰지 않음', () => {
    const text = buildLedgerStripDescription({
      description: '',
      memo: 'BANK_TRANSFER · 원천세 3.3%',
      remarks: 'debug tax 3.3%',
      category: 'CONSULTATION'
    });
    expect(text).not.toContain('BANK_TRANSFER');
    expect(text).not.toContain('3.3%');
    expect(text).not.toBe(OFD_LEDGER.DASH);
  });

  test('description·category 모두 없으면 dash', () => {
    expect(buildLedgerStripDescription({
      memo: 'BANK_TRANSFER',
      remarks: '3.3%'
    })).toBe(OFD_LEDGER.DASH);
  });
});
