import {
  EXTRA_DATA_KEYS,
  parseExtraData,
  buildExtraDataString,
  toPackageOption
} from '../packagePricing';

describe('packagePricing', () => {
  describe('parseExtraData', () => {
    it('빈 값(null/undefined/빈 문자열)은 기본 객체를 돌려준다', () => {
      const empty = { sessions: null, price: null, remark: '' };
      expect(parseExtraData(null)).toEqual(empty);
      expect(parseExtraData(undefined)).toEqual(empty);
      expect(parseExtraData('')).toEqual(empty);
    });

    it('JSON 문자열을 파싱해 sessions/price 는 Number, remark 는 String 으로 정규화한다', () => {
      const json = JSON.stringify({ sessions: '20', price: '200000', remark: '기본 패키지' });
      expect(parseExtraData(json)).toEqual({
        sessions: 20,
        price: 200000,
        remark: '기본 패키지'
      });
    });

    it('이미 객체 형태인 경우에도 동일하게 동작한다', () => {
      const obj = { sessions: 10, price: 100000, remark: '단회' };
      expect(parseExtraData(obj)).toEqual(obj);
    });

    it('잘못된 JSON 은 안전한 기본 객체를 돌려준다', () => {
      expect(parseExtraData('not-a-json')).toEqual({ sessions: null, price: null, remark: '' });
    });

    it('sessions/price 가 누락되어도 null 을 유지하고 폴백을 만들지 않는다', () => {
      expect(parseExtraData(JSON.stringify({}))).toEqual({
        sessions: null,
        price: null,
        remark: ''
      });
      expect(parseExtraData(JSON.stringify({ remark: '메모만' }))).toEqual({
        sessions: null,
        price: null,
        remark: '메모만'
      });
    });

    it('숫자 변환 실패(NaN) 시 null 로 정규화된다', () => {
      expect(parseExtraData(JSON.stringify({ sessions: 'abc', price: 'xyz' }))).toEqual({
        sessions: null,
        price: null,
        remark: ''
      });
    });
  });

  describe('buildExtraDataString', () => {
    it('지정한 키 순서대로 JSON 문자열을 생성한다', () => {
      const str = buildExtraDataString(20, 200000, '기본');
      expect(JSON.parse(str)).toEqual({
        [EXTRA_DATA_KEYS.SESSIONS]: 20,
        [EXTRA_DATA_KEYS.PRICE]: 200000,
        [EXTRA_DATA_KEYS.REMARK]: '기본'
      });
    });

    it('remark 가 falsy 면 빈 문자열로 직렬화된다', () => {
      expect(JSON.parse(buildExtraDataString(1, 30000, null))).toEqual({
        sessions: 1,
        price: 30000,
        remark: ''
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
        sortOrder: 5
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
  });
});
