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
