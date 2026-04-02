# 마인드가든 홈페이지 — 기획 (Planning)

## 입력 (워크플로)
- **표준**: `.cursor/skills/homepage-orchestrator/SKILL.md` 단계에서 넘어온 **핸드오프 블록**(사용자 요청 요약·오케스트 단계·선택 과제)을 그대로 붙여 받는다.
- 기획 산출 후 **디자이너 → 퍼블 / 코더** 순·병행을 정하고, 각 에이전트(`agents/designer.md`, `publisher.md`, `coder.md`)에 붙여넣을 **별도 프롬프트**를 만든다. 오케스트레이션만 거친 상태에서 구현 역할로 바로 가지 않는다.

## 사용 시기
- 새 페이지·섹션·기능의 **요구사항 정리**, IA(정보 구조), 우선순위
- **사용자 시나리오**, 수용 기준(AC), 비범위(out of scope) 명시
- GNB/문의/바텀시트 등 **정책과 충돌하는 기획**이 없는지 점검

## 콘텐츠·시각 정책 (AC)
- **공개 UI에서 유니코드 이모지 금지** (장식·라벨·버튼). 의미는 **한글 라벨** 또는 **SVG 아이콘**, 분위기·섹션 보조는 **`next/image` 등 실제 이미지**로 처리한다.
- 관리자 화면도 동일 원칙을 권장한다(프리뷰·도움말 포함).

## 스택·제약 (현재 구현 기준)
- **Next.js 14** App Router, `app/` 라우팅
- **문의·상담 예약**: GNB에 "문의"(#contact) 없음 → **바텀시트 전용** (`.cursor/skills/gnb-inquiry-bottom-sheet/SKILL.md`)
- **개발 브랜치**: `homepage/develop`, 배포는 웹훅 또는 수동 SSH

## 산출물 형태
- 목적·대상 사용자·핵심 액션(CTA) 1개
- 화면 목록 / 라우트 후보 (`/blog`, `/reviews` 등)
- 콘텐츠·권한·DB 필요 여부 (스키마는 `scripts/create_homepage_db.sql` 등과 정합)
- **디자이너/퍼블/코더 각각에게 넘길 체크리스트** 및 **역할별 핸드오프 프롬프트** (구현 가능한 단위로 쪼개기)

## 참고 문서
- `README.md`, `ADMIN_GUIDE.md`, `docs/` 내 배포·웹훅 문서
- `.cursor/skills/gnb-inquiry-bottom-sheet/SKILL.md`
