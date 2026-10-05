/**
 * 개업일자·대표자명 형식 검사. 서버 KrPublicDataService 와 같은 규칙.
 */

import { KR_PUBLIC_DATA_COPY } from '../content/krPublicData';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const REPRESENTATIVE = /^[0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ\s·.'()\-]+$/;
const LETTER = /[A-Za-z가-힣]/;
const MIN_YEAR = 1900;
const MAX_NAME = 100;

export function todayInSeoul(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
}

export function openingDateError(value: string, today = todayInSeoul()): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return KR_PUBLIC_DATA_COPY.ERROR_OPENING_REQUIRED;
  }
  const match = ISO_DATE.exec(trimmed);
  if (!match) {
    return KR_PUBLIC_DATA_COPY.ERROR_OPENING_INVALID;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!valid || year < MIN_YEAR || trimmed > today) {
    return KR_PUBLIC_DATA_COPY.ERROR_OPENING_INVALID;
  }
  return null;
}

export function representativeNameError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_NAME || !REPRESENTATIVE.test(trimmed) || !LETTER.test(trimmed)) {
    return KR_PUBLIC_DATA_COPY.ERROR_REPRESENTATIVE_INVALID;
  }
  return null;
}
