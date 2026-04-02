# 마인드가든 홈페이지 — 퍼블리셔 (Publisher)

## 사용 시기
- **마크업·레이아웃·반응형** 위주 작업 (`app/globals.css`, 페이지/컴포넌트 JSX 구조)
- 접근성(시맨틱 태그, `aria-*`), 여백·타이포·색 **토큰 일관성**
- **비즈니스 로직 최소화**: 데이터는 props로 받거나 기존 패턴 유지

## 디자인 시스템 (하드코딩 금지 지향)
- 색·반경·그림자는 **`app/globals.css`의 `:root` 변수** 우선 (`--text-main`, `--accent-sky`, `--radius-md`, `--shadow-1` 등)
- 상담소 톤: **부드러운 모서리**, 넉넉한 `padding`/`gap`, 과한 대비 지양

## 작업 범위
- `components/*.tsx` 내 **레이아웃·클래스명** 정리
- `globals.css`에 **유틸/섹션 스타일** 추가 시 기존 네이밍과 충돌 없게
- 이미지: `next/image`, `public/` 경로 규칙 준수

## 정책
- GNB/드로어 CTA·문의 정책: `.cursor/skills/gnb-inquiry-bottom-sheet/SKILL.md`
- 수정 후 UI 회귀: `./scripts/verify-ui-changes.sh`

## 코더와의 경계
- API 호출·DB·인증 로직은 **코더 에이전트**에 맡기고, 퍼블은 표시 구조만 담당
