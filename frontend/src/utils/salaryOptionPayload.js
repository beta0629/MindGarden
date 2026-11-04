/**
 * 급여 옵션 금액·페이로드 공통 변환 (ERP 급여 프로필 모달 공용)
 *
 * @author CoreSolution
 * @since 2026-11-03
 */

/**
 * 금액 값을 숫자로 변환한다. "50,000"·" 3000 "·"3000.00" 문자열 허용.
 *
 * @param {unknown} raw 원본 금액
 * @returns {number|null} 유한 숫자, 변환 불가면 null
 */
export const parseSalaryAmount = (raw) => {
    if (raw == null || raw === '') {
        return null;
    }
    if (typeof raw === 'number') {
        return Number.isFinite(raw) ? raw : null;
    }
    const cleaned = String(raw).replace(/[,\s원₩]/g, '');
    if (cleaned === '') {
        return null;
    }
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
};

/**
 * 옵션 행 하나를 {type, amount, name}으로 정규화한다. 타입이 없거나 금액을 해석할 수 없으면 null.
 *
 * @param {object|string} row 옵션 행
 * @returns {{type: string, amount: number, name: string}|null}
 */
export const normalizeSalaryOptionRow = (row) => {
    if (row == null || typeof row !== 'object') {
        return null;
    }
    const type = String(row.type || row.optionType || '').trim();
    const amount = parseSalaryAmount(row.amount != null && row.amount !== '' ? row.amount : row.optionAmount);
    if (!type || amount == null) {
        return null;
    }
    return { type, amount, name: row.name || row.optionName || row.optionDescription || '' };
};

/**
 * 저장용 options 페이로드를 만든다.
 * - 해석할 수 없는 행이 하나라도 있으면 undefined(필드 생략 → 서버 기존 옵션 유지)를 반환해 조용한 삭제를 막는다.
 * - 타입이 빈 작성 중 행과 금액 0 이하 행은 제외한다.
 *
 * @param {Array<object|string>} rows 옵션 행 목록
 * @returns {Array<{type: string, amount: number, name: string}>|undefined}
 */
export const buildSalaryOptionsPayload = (rows) => {
    if (!Array.isArray(rows)) {
        return undefined;
    }
    // 타입이 비어 있는 객체 행 = 작성 중 빈 행 → 제외
    const candidates = rows.filter((row) => !(row != null && typeof row === 'object'
        && !String(row.type || row.optionType || '').trim()));
    const normalized = candidates.map(normalizeSalaryOptionRow);
    if (normalized.some((r) => r == null)) {
        return undefined;
    }
    return normalized.filter((r) => r.amount > 0);
};
