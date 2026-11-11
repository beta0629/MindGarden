export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

export function formatKstDateRange(start: string, end: string): string {
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  return `${sy}년 ${sm}월 ${sd}일 ~ ${ey}년 ${em}월 ${ed}일`;
}
