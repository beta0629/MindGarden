/**
 * 카카오·국제 표기(+82 10-…) 등을 국내 휴대폰 11자리(010…)로 정규화.
 * 01로 시작하는 11자리가 아니면 undefined.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
export function normalizeKoreanMobileDigits(input: string | null | undefined): string | undefined {
  if (input == null) return undefined;
  const trimmed = String(input).trim();
  if (!trimmed) return undefined;

  const digits = trimmed.replace(/\D/g, '');
  if (!digits.length) return undefined;

  if (digits.length === 11 && digits.startsWith('01')) {
    return isKoreanMobile11(digits) ? digits : undefined;
  }

  if (digits.startsWith('82')) {
    const national = digits.slice(2);
    if (national.length === 10 && national.startsWith('10')) {
      const domestic = `0${national}`;
      return isKoreanMobile11(domestic) ? domestic : undefined;
    }
    if (national.length === 11 && national.startsWith('01')) {
      return isKoreanMobile11(national) ? national : undefined;
    }
  }

  if (digits.length === 10 && digits.startsWith('10')) {
    const domestic = `0${digits}`;
    return isKoreanMobile11(domestic) ? domestic : undefined;
  }

  return undefined;
}

function isKoreanMobile11(d: string): boolean {
  return /^01[016789]\d{8}$/.test(d);
}

/**
 * 휴대폰 번호를 가운데 4자리만 마스킹한 표시 형식(`010-****-1234`)으로 반환.
 * 정규화 실패 시 원본 문자열 또는 undefined.
 *
 * - PII 정책: 가운데 4자리는 항상 `****` 처리
 * - 한국 휴대폰 11자리만 정식 포맷, 그 외는 best-effort
 */
export function maskKoreanMobileForDisplay(
  input: string | null | undefined,
): string | undefined {
  if (input == null) return undefined;
  const trimmed = String(input).trim();
  if (!trimmed) return undefined;

  const normalized = normalizeKoreanMobileDigits(trimmed);
  if (normalized && normalized.length === 11) {
    const head = normalized.slice(0, 3);
    const tail = normalized.slice(-4);
    return `${head}-****-${tail}`;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 8) {
    const tail = digits.slice(-4);
    const head = digits.slice(0, 3);
    return `${head}-****-${tail}`;
  }

  return undefined;
}
