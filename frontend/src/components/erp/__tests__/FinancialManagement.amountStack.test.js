/**
 * 재무 거래 금액 스택 SSOT(총액·부가세 포함가 배지·원천·카드 정산) 표시 규칙 단위 테스트.
 * @see ../../utils/erpFinancialAmountStack.js
 */
import {
  getDisplayWithholdingTaxAmount,
  getDisplaySupplyAmount,
  getDisplayVatAmount,
  legacyWithholdingAmountProbablyInTaxField,
  shouldShowCardSettlementSection,
  formatKrw,
  formatOptionalKrw,
  shouldShowIncomeWithholdingTax,
  shouldShowIncomeTaxIncludedLabel,
  FINANCIAL_AMOUNT_STACK_LABEL_TOTAL,
  FINANCIAL_AMOUNT_STACK_LABEL_SUPPLY,
  FINANCIAL_AMOUNT_STACK_LABEL_VAT
} from '../../../utils/erpFinancialAmountStack';

describe('FinancialManagement 금액 스택 SSOT', () => {
  describe('금액 스택 라벨 상수 (erpFinancialAmountStack 단일 출처)', () => {
    it('목록·테이블·카드가 동일 문자열을 참조하도록 고정', () => {
      expect(FINANCIAL_AMOUNT_STACK_LABEL_TOTAL).toBe('승인·청구 총액(거래 금액)');
      expect(FINANCIAL_AMOUNT_STACK_LABEL_SUPPLY).toBe('공급가액');
      expect(FINANCIAL_AMOUNT_STACK_LABEL_VAT).toBe('부가세(VAT)');
    });
  });

  describe('getDisplayWithholdingTaxAmount', () => {
    it('withholdingTaxAmount가 있으면(0 포함) 그 값을 쓴다', () => {
      expect(
        getDisplayWithholdingTaxAmount({
          withholdingTaxAmount: 0
        })
      ).toBe(0);
      expect(
        getDisplayWithholdingTaxAmount({
          withholdingTaxAmount: 3300,
          taxAmount: 9999
        })
      ).toBe(3300);
    });

    it('withholdingTaxAmount가 없을 때만 taxAmount 레거시를 쓴다', () => {
      expect(
        getDisplayWithholdingTaxAmount({
          taxAmount: 5000
        })
      ).toBe(5000);
    });
  });

  describe('getDisplayVatAmount / legacyWithholdingAmountProbablyInTaxField', () => {
    it('신규 경로: withholdingTaxAmount > 0 이면 taxAmount 를 부가세로 표시', () => {
      const tx = {
        transactionType: 'INCOME',
        taxAmount: 10000,
        withholdingTaxAmount: 3300,
        description: '상담료'
      };
      expect(getDisplayVatAmount(tx)).toBe(10000);
      expect(formatOptionalKrw(getDisplayVatAmount(tx))).toBe('10,000원');
      expect(getDisplayWithholdingTaxAmount(tx)).toBe(3300);
    });

    it('레거시: 원천만 tax_amount 에 있고 비고에 키워드가 있으면 부가세 칸은 —, 원천은 taxAmount', () => {
      const tx = {
        transactionType: 'INCOME',
        amount: 850000,
        taxAmount: 28050,
        withholdingTaxAmount: null,
        remarks: '사업소득 원천징수 예정'
      };
      expect(legacyWithholdingAmountProbablyInTaxField(tx)).toBe(true);
      expect(getDisplayVatAmount(tx)).toBe(null);
      expect(formatOptionalKrw(getDisplayVatAmount(tx))).toBe('—');
      expect(getDisplayWithholdingTaxAmount(tx)).toBe(28050);
    });

    it('레거시 휴리스틱: 대소문자 무시(영문 혼합 description)', () => {
      const tx = {
        transactionType: 'INCOME',
        taxAmount: 28050,
        description: 'WITHHOLDING 원천징수'
      };
      expect(legacyWithholdingAmountProbablyInTaxField(tx)).toBe(true);
      expect(getDisplayVatAmount(tx)).toBe(null);
    });

    it('지출(EXPENSE)은 taxAmount 를 그대로 부가세 칸에 사용', () => {
      const tx = {
        transactionType: 'EXPENSE',
        taxAmount: 900
      };
      expect(getDisplayVatAmount(tx)).toBe(900);
    });
  });

  describe('getDisplaySupplyAmount', () => {
    it('레거시·amountBeforeTax 비어 있으면 총액으로 공급가 보정', () => {
      const tx = {
        transactionType: 'INCOME',
        amount: 850000,
        amountBeforeTax: null,
        taxAmount: 28050,
        remarks: '사업소득'
      };
      expect(getDisplaySupplyAmount(tx)).toBe(850000);
      expect(formatOptionalKrw(getDisplaySupplyAmount(tx))).toBe('850,000원');
    });

    it('신규 분리 저장 시 공급가는 amountBeforeTax 유지', () => {
      const tx = {
        transactionType: 'INCOME',
        amountBeforeTax: 100000,
        taxAmount: 10000,
        withholdingTaxAmount: 3300
      };
      expect(getDisplaySupplyAmount(tx)).toBe(100000);
    });
  });

  describe('시나리오 (a)~(f) 표시 플래그', () => {
    it('(a) 부가세 포함 수입 + 원천: 배지·원천 행 모두 표시', () => {
      const tx = {
        transactionType: 'INCOME',
        taxIncluded: true,
        amount: 110000,
        withholdingTaxAmount: 3300
      };
      expect(shouldShowIncomeTaxIncludedLabel(tx)).toBe(true);
      expect(shouldShowIncomeWithholdingTax(tx)).toBe(true);
      expect(formatKrw(getDisplayWithholdingTaxAmount(tx))).toBe('3,300원');
    });

    it('(b) 부가세 포함가만(원천 없음): 배지만, 원천 행 숨김', () => {
      const tx = {
        transactionType: 'INCOME',
        taxIncluded: true,
        amount: 110000,
        withholdingTaxAmount: null,
        taxAmount: null
      };
      expect(shouldShowIncomeTaxIncludedLabel(tx)).toBe(true);
      expect(shouldShowIncomeWithholdingTax(tx)).toBe(false);
    });

    it('(c) 원천만(분리 과세·포함가 아님): 배지 없음, 원천 행 표시', () => {
      const tx = {
        transactionType: 'INCOME',
        taxIncluded: false,
        amount: 500000,
        withholdingTaxAmount: 10000
      };
      expect(shouldShowIncomeTaxIncludedLabel(tx)).toBe(false);
      expect(shouldShowIncomeWithholdingTax(tx)).toBe(true);
    });

    it('(d) 카드 정산: 수수료 또는 실입금 필드가 있으면 블록 표시', () => {
      expect(
        shouldShowCardSettlementSection({
          cardMerchantFeeAmount: 100
        })
      ).toBe(true);
      expect(
        shouldShowCardSettlementSection({
          cardNetDepositAmount: 9900
        })
      ).toBe(true);
      expect(shouldShowCardSettlementSection({})).toBe(false);
    });

    it('(e) 면세/부가세 미표시(포함가 아님): 부가세 포함가 배지 없음', () => {
      const tx = {
        transactionType: 'INCOME',
        taxIncluded: false,
        withholdingTaxAmount: null
      };
      expect(shouldShowIncomeTaxIncludedLabel(tx)).toBe(false);
    });

    it('(f) 원천 0(명시): 원천 행 숨김', () => {
      const tx = {
        transactionType: 'INCOME',
        taxIncluded: true,
        amount: 100000,
        withholdingTaxAmount: 0
      };
      expect(getDisplayWithholdingTaxAmount(tx)).toBe(0);
      expect(shouldShowIncomeWithholdingTax(tx)).toBe(false);
    });
  });

  describe('formatOptionalKrw', () => {
    it('null/빈값은 대시(—)', () => {
      expect(formatOptionalKrw(null)).toBe('—');
      expect(formatOptionalKrw('')).toBe('—');
    });
  });
});
