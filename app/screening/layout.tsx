/**
 * 간이 체크리스트 허브·주제별 플로우 — GNB/LNB/푸터 없이 집중형 화면(각 page에서 Navigation·Footer 미사용).
 * 배경 워터마크는 globals.css `.screening-layout` 참고.
 */
export default function ScreeningLayout({ children }: { children: React.ReactNode }) {
  return <div className="screening-layout">{children}</div>;
}
