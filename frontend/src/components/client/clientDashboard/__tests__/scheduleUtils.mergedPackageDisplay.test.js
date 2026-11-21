/**
 * 내담자 결제 요약 행 — 병합 매핑은 displayPackageName을 표시하고 금액은 원본을 유지한다.
 */
import { render } from '@testing-library/react';
import { buildPaymentRows } from '../scheduleUtils';

describe('buildPaymentRows — 병합 패키지 displayPackageName', () => {
  const mapping = {
    id: 404,
    paymentDate: '2026-11-15',
    packageName: '단회기 90,000원',
    displayPackageName: '단회기 90,000원 + 기본10회기',
    mergedPackageNames: ['기본10회기'],
    packagePrice: 90000,
    paymentStatus: 'APPROVED'
  };

  test('결제 요약 패키지 칸은 결합 표시명을 쓰고 packagePrice는 합치지 않는다', () => {
    const rows = buildPaymentRows([mapping]);
    expect(rows).toHaveLength(1);
    const { container } = render(<div>{rows[0].packageName}</div>);
    expect(container).toHaveTextContent('단회기 90,000원');
    expect(container).toHaveTextContent('+1');
    expect(container).not.toHaveTextContent('890,000');
    expect(rows[0].amountLabel).toMatch(/90,000/);
    expect(mapping.packageName).toBe('단회기 90,000원');
  });
});
