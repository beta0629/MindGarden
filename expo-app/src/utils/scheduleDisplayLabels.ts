/**
 * 스케줄·상담 카드 표시용 — API 코드값 → 한글 라벨 (웹 ScheduleDetailModal 과 정합)
 */
const CONSULTATION_TYPE_KO: Record<string, string> = {
  INDIVIDUAL: '개인상담',
  COUPLE: '부부상담',
  FAMILY: '가족상담',
  GROUP: '그룹상담',
  INITIAL: '초기상담',
  FOLLOW_UP: '후속상담',
  REGULAR: '정기상담',
  EMERGENCY: '긴급상담',
  CRISIS: '위기상담',
  ASSESSMENT: '평가상담',
};

/**
 * 상담 유형 코드(영문)·이미 한글인 값 모두 안전하게 표시용 문자열로 변환
 */
export function consultationTypeToKorean(type: string | null | undefined): string {
  if (type == null || String(type).trim() === '') {
    return '상담';
  }
  const raw = String(type).trim();
  const upper = raw.toUpperCase();
  if (CONSULTATION_TYPE_KO[upper]) {
    return CONSULTATION_TYPE_KO[upper];
  }
  if (/[가-힣]/.test(raw)) {
    return raw;
  }
  return raw;
}

/**
 * 스케줄 API 행에서 내담자 표시명. `clientName` 비어 있거나 알 수 없음이면 닉네임·내담자 ID로 보강.
 */
export function resolveClientNameForScheduleRow(
  row: Record<string, unknown>,
  clientId: number,
): string {
  const raw = row.clientName;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.length > 0 && t !== '알 수 없음') {
      return t;
    }
  }
  const nick = row.nickname;
  if (typeof nick === 'string' && nick.trim().length > 0) {
    return nick.trim();
  }
  if (Number.isFinite(clientId) && clientId > 0) {
    return `내담자 #${clientId}`;
  }
  return '내담자';
}
