import {
  EXTRA_DATA_KEYS,
  parseExtraData,
  buildExtraDataString,
  toPackageOption,
  parseCombinedPackageName,
  buildCombinedPackageName,
  renderCompactPackageName
} from '../packagePricing';
import { render } from '@testing-library/react';

describe('packagePricing', () => {
  describe('parseExtraData', () => {
    it('빈 값(null/undefined/빈 문자열)은 기본 객체를 돌려준다', () => {
      const empty = { sessions: null, price: null, remark: '', items: [], discountRate: 0, originalPrice: null };
      expect(parseExtraData(null)).toEqual(empty);
      expect(parseExtraData(undefined)).toEqual(empty);
      expect(parseExtraData('')).toEqual(empty);
    });

    it('JSON 문자열을 파싱해 sessions/price 는 Number, remark 는 String 으로 정규화한다', () => {
      const json = JSON.stringify({ sessions: '20', price: '200000', remark: '기본 패키지' });
      expect(parseExtraData(json)).toEqual({
        sessions: 20,
        price: 200000,
        remark: '기본 패키지',
        items: [],
        discountRate: 0,
        originalPrice: null
      });
    });

    it('이미 객체 형태인 경우에도 동일하게 동작한다', () => {
      const obj = { sessions: 10, price: 100000, remark: '단회', items: [], discountRate: 0, originalPrice: null };
      expect(parseExtraData(obj)).toEqual(obj);
    });

    it('잘못된 JSON 은 안전한 기본 객체를 돌려준다', () => {
      expect(parseExtraData('not-a-json')).toEqual({ sessions: null, price: null, remark: '', items: [], discountRate: 0, originalPrice: null });
    });

    it('sessions/price 가 누락되어도 null 을 유지하고 폴백을 만들지 않는다', () => {
      expect(parseExtraData(JSON.stringify({}))).toEqual({
        sessions: null,
        price: null,
        remark: '',
        items: [],
        discountRate: 0,
        originalPrice: null
      });
      expect(parseExtraData(JSON.stringify({ remark: '메모만' }))).toEqual({
        sessions: null,
        price: null,
        remark: '메모만',
        items: [],
        discountRate: 0,
        originalPrice: null
      });
    });

    it('숫자 변환 실패(NaN) 시 null 로 정규화된다', () => {
      expect(parseExtraData(JSON.stringify({ sessions: 'abc', price: 'xyz' }))).toEqual({
        sessions: null,
        price: null,
        remark: '',
        items: [],
        discountRate: 0,
        originalPrice: null
      });
    });
  });

  describe('buildExtraDataString', () => {
    it('지정한 키 순서대로 JSON 문자열을 생성한다', () => {
      const str = buildExtraDataString(20, 200000, '기본');
      expect(JSON.parse(str)).toEqual({
        [EXTRA_DATA_KEYS.SESSIONS]: 20,
        [EXTRA_DATA_KEYS.PRICE]: 200000,
        [EXTRA_DATA_KEYS.REMARK]: '기본',
        [EXTRA_DATA_KEYS.ITEMS]: [],
        [EXTRA_DATA_KEYS.DISCOUNT_RATE]: 0,
        [EXTRA_DATA_KEYS.ORIGINAL_PRICE]: 200000
      });
    });

    it('remark 가 falsy 면 빈 문자열로 직렬화된다', () => {
      expect(JSON.parse(buildExtraDataString(1, 30000, null))).toEqual({
        sessions: 1,
        price: 30000,
        remark: '',
        items: [],
        discountRate: 0,
        originalPrice: 30000
      });
    });
  });

  describe('toPackageOption', () => {
    const row = {
      codeValue: 'BASIC',
      codeLabel: 'BASIC',
      koreanName: '기본 10회기',
      sortOrder: 5,
      extraData: JSON.stringify({ sessions: 10, price: 300000, remark: '인기' })
    };

    it('공통코드 row 를 카드 옵션 형태로 변환한다', () => {
      expect(toPackageOption(row)).toEqual({
        value: 'BASIC',
        label: '기본 10회기',
        sessions: 10,
        price: 300000,
        remark: '인기',
        sortOrder: 5,
        items: [],
        discountRate: 0,
        originalPrice: null
      });
    });

    it('koreanName 이 없으면 codeLabel → codeValue 순으로 폴백된다', () => {
      expect(toPackageOption({ codeValue: 'X', codeLabel: 'X 라벨' }).label).toBe('X 라벨');
      expect(toPackageOption({ codeValue: 'X' }).label).toBe('X');
    });

    it('extraData 가 비어 있으면 sessions/price 는 null 로 유지된다 (하드코딩 폴백 금지)', () => {
      const opt = toPackageOption({ codeValue: 'EMPTY', koreanName: '빈 패키지' });
      expect(opt.sessions).toBeNull();
      expect(opt.price).toBeNull();
    });

    it('extraData.sessions=0 은 0으로 유지된다 (검사 단품 — falsy 폴백 금지)', () => {
      const opt = toPackageOption({
        codeValue: 'PSYCH_TEST',
        koreanName: '심리검사',
        extraData: JSON.stringify({ sessions: 0, price: 50000 })
      });
      expect(opt.sessions).toBe(0);
      expect(opt.price).toBe(50000);
    });
  });

  describe('parseCombinedPackageName', () => {
    it('빈 문자열이나 null이 주어지면 빈 배열을 반환한다', () => {
      expect(parseCombinedPackageName('')).toEqual([]);
      expect(parseCombinedPackageName(null)).toEqual([]);
    });

    it('단일 패키지명을 배열로 반환한다', () => {
      expect(parseCombinedPackageName('기본 10회기')).toEqual(['기본 10회기']);
    });

    it('"+" 로 구분된 다중 패키지명을 분리하고 공백을 제거한다', () => {
      expect(parseCombinedPackageName('기본 10회기 + 심리검사')).toEqual(['기본 10회기', '심리검사']);
      expect(parseCombinedPackageName('A+B + C')).toEqual(['A', 'B', 'C']);
    });
  });

  describe('buildCombinedPackageName', () => {
    it('빈 배열이나 유효하지 않은 값이 주어지면 빈 문자열을 반환한다', () => {
      expect(buildCombinedPackageName([])).toBe('');
      expect(buildCombinedPackageName(null)).toBe('');
    });

    it('단일 항목 배열은 그대로 문자열로 반환한다', () => {
      expect(buildCombinedPackageName(['기본 10회기'])).toBe('기본 10회기');
    });

    it('여러 항목 배열은 " + " 로 연결하여 반환한다', () => {
      expect(buildCombinedPackageName(['기본 10회기', '심리검사'])).toBe('기본 10회기 + 심리검사');
    });
  });

  describe('renderCompactPackageName', () => {
    it('빈 값이면 "-" 를 반환한다', () => {
      expect(renderCompactPackageName('')).toBe('-');
      expect(renderCompactPackageName(null)).toBe('-');
    });

    it('단일 패키지명이면 문자열 그대로 반환한다', () => {
      expect(renderCompactPackageName('기본 10회기')).toBe('기본 10회기');
    });

    it('다중 패키지명이면 첫 패키지명과 "+N" 뱃지를 포함한 React 노드를 렌더링한다', () => {
      const { container } = render(renderCompactPackageName('기본 10회기 + 심리검사 + 추가상담'));
      
      const nameSpan = container.querySelector('.mg-v2-package-compact__name');
      expect(nameSpan).not.toBeNull();
      expect(nameSpan.textContent).toBe('기본 10회기');
      expect(nameSpan.getAttribute('title')).toBe('기본 10회기 + 심리검사 + 추가상담');

      const badgeSpan = container.querySelector('.mg-v2-badge');
      expect(badgeSpan).not.toBeNull();
      expect(badgeSpan.textContent).toBe('+2');
    });
  });
});
