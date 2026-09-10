/**
 * consultationPackagePublic 정규화
 *
 * @author CoreSolution
 * @since 2026-09-10
 */

import {
  formatConsultationPackagePriceLabel,
  normalizeConsultationPackageList,
  normalizeConsultationPackageRow,
  CONSULTATION_PACKAGE_EMPTY_MESSAGE
} from '../consultationPackagePublic';

describe('consultationPackagePublic', () => {
  test('by-subdomain row → name/description/priceLabel', () => {
    const row = normalizeConsultationPackageRow({
      name: '10회 패키지',
      description: '기본 상담',
      price: 300000
    });
    expect(row).toEqual({
      name: '10회 패키지',
      description: '기본 상담',
      price: 300000,
      priceLabel: '300,000원'
    });
  });

  test('공통코드 row는 extraData.price·remark 를 사용한다', () => {
    const row = normalizeConsultationPackageRow({
      koreanName: '단회',
      codeDescription: '',
      extraData: JSON.stringify({ price: 50000, remark: '1회기' })
    });
    expect(row.name).toBe('단회');
    expect(row.description).toBe('1회기');
    expect(row.price).toBe(50000);
    expect(row.priceLabel).toBe('50,000원');
  });

  test('이름 없으면 null · 목록은 fail-closed 빈 배열', () => {
    expect(normalizeConsultationPackageRow({})).toBeNull();
    expect(normalizeConsultationPackageList(null)).toEqual([]);
    expect(normalizeConsultationPackageList(undefined)).toEqual([]);
    expect(normalizeConsultationPackageList([{}])).toEqual([]);
  });

  test('가격 없으면 미등록/확인 필요 라벨', () => {
    expect(formatConsultationPackagePriceLabel(null)).toBe(CONSULTATION_PACKAGE_EMPTY_MESSAGE);
    expect(formatConsultationPackagePriceLabel(undefined)).toBe(CONSULTATION_PACKAGE_EMPTY_MESSAGE);
  });
});
