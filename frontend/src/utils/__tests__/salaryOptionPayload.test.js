import { parseSalaryAmount, buildSalaryOptionsPayload, normalizeSalaryOptionRow } from '../salaryOptionPayload';

describe('parseSalaryAmount', () => {
    it('문자열 금액을 숫자로 변환', () => {
        expect(parseSalaryAmount('50,000')).toBe(50000);
        expect(parseSalaryAmount('3000.00')).toBe(3000);
        expect(parseSalaryAmount(' 2000 ')).toBe(2000);
        expect(parseSalaryAmount(5000)).toBe(5000);
    });
    it('해석 불가는 null', () => {
        expect(parseSalaryAmount('')).toBeNull();
        expect(parseSalaryAmount(null)).toBeNull();
        expect(parseSalaryAmount('abc')).toBeNull();
    });
});

describe('buildSalaryOptionsPayload (등급 미변경·옵션만 변경)', () => {
    it('문자열 금액 옵션이 0으로 사라지지 않는다', () => {
        const rows = [
            { optionType: 'FAMILY_CONSULTATION', optionAmount: '3000.00', optionName: '가족' },
            { type: 'INITIAL_CONSULTATION', amount: '7,000', name: '초기' }
        ];
        expect(buildSalaryOptionsPayload(rows)).toEqual([
            { type: 'FAMILY_CONSULTATION', amount: 3000, name: '가족' },
            { type: 'INITIAL_CONSULTATION', amount: 7000, name: '초기' }
        ]);
    });
    it('해석 불가 행(문자열 코드 등)이 있으면 undefined로 필드 생략 → 서버 기존 옵션 유지', () => {
        expect(buildSalaryOptionsPayload(['FAMILY_CONSULTATION'])).toBeUndefined();
        expect(normalizeSalaryOptionRow('X')).toBeNull();
    });
    it('금액 0 행은 제외', () => {
        expect(buildSalaryOptionsPayload([{ type: 'A', amount: 0 }, { type: 'B', amount: 1 }]))
            .toEqual([{ type: 'B', amount: 1, name: '' }]);
    });
    it('타입 빈 작성 중 행은 무시하고 나머지 저장', () => {
        expect(buildSalaryOptionsPayload([{ type: '', amount: 0 }, { type: 'B', amount: '2000' }]))
            .toEqual([{ type: 'B', amount: 2000, name: '' }]);
    });
});
