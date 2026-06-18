# Phase 3 Public Main Rebuild Spec (Phase 1)

> **Status**: Active
> **Scope**: Core Solution 메인 공개 페이지 (`frontend/`의 `/` 또는 `/landing`)
> **Goal**: 제품 도메인 첫인상 상용화 수준 Rebuild (Phase 3)

---

## 1. P0 문제 목록 (현황 분석)

스크린샷 및 코드(`Homepage.js`, `LandingPage.jsx`) 기준 관찰 결과:

- **GNB 버튼 배열**: "로그인"(outline)과 "회원가입"(solid) + 모바일 햄버거 메뉴 버튼의 정렬 및 스타일이 엉망이며, 통일성이 떨어짐.
- **로고 부재**: 상단에 단순 텍스트 "Core Solution"만 노출. 핵심 아이덴티티인 Shield H2 로고 없음.
- **카피 및 아이덴티티**: "비즈니스의 핵심을 솔루션하다" 등의 제네릭한 B2B SaaS Jargon을 사용. 실제 현장형 상담센터·CS 플랫폼으로서의 정체성 결여.
- **CTA 버튼 위계 약화**: "무료로 시작하기" CTA가 과도하게 넓거나 시각적 계층이 모호하여 전환을 이끄는 힘이 약함.
- **Hero 그라데이션 및 반응형**: 특색 없는 범용 그라데이션. 모바일(375px) 대비 데스크톱(1440px) 반응형 레이아웃 대응 부족 (중앙 Narrow column 등 문제).

---

## 2. Rebuild 방향성

Public Main은 **현장형 상담센터 플랫폼**의 정체성을 명확히 드러내야 합니다. B2B 일반 SaaS가 아닌, 상담센터의 원장/상담사/내담자가 매일 쓰는 운영 플랫폼(Calm Forest)의 톤 앤 매너를 유지합니다.

- **브랜드**: Shield 로고 + Calm Forest (`--mg-v2-*`) 색상 체계 준수. (`CORE_SOLUTION_IDENTITY.md`, `BRAND_SSOT_CORE_SOLUTION.md` 참조)
- **제네릭 Jargon 금지**: "멀티테넌트", "비즈니스 핵심" 대신 상담센터 운영의 본질을 찌르는 카피 사용.

---

## 3. 와이어프레임 및 레이아웃 스펙

### 3.1. GNB (Global Navigation Bar)
- **Left**: Shield 로고 (텍스트가 아닌 실제 SVG)
- **Center**: Nav items (선택적)
- **Right**: 액션 버튼 영역
  - Primary CTA 1개: "시작하기" (MGButton)
  - Secondary CTA: "로그인" (outline 또는 text link)
  - 모바일 해상도: 우측 끝에 햄버거 메뉴 아이콘

### 3.2. Hero Section
- **Fluid Layout**: 전체 화면의 너비를 유연하게 활용. 중앙 폭이 좁은 텍스트 기둥 형태 지양 (1440px 데스크톱, 375px 모바일 모두 안정적으로 보이게).
- **Tone**: Calm Forest 컬러의 배경/포인트 요소 활용. 기존 제네릭 그라데이션 제거.
- **카피 방향**: 상담센터가 마주하는 일정, 기록, 정산 문제를 해결해주는 실질적인 동반자 역할 강조.
- **CTA Hierarchy**: Main CTA는 단일 Primary Button 사용. 보조 CTA는 시각적 위계를 한 단계 낮춤.

### 3.3. Trust Strip / Empty Space
- **신뢰도 배지**: 중앙 센터 배치 등 하단에 Trust Strip 배치 (선택적, GDPR, 보안 등).
- **Empty State**: 여백(Whitespace)을 적극 활용해 Calm(차분함) 감성 강조.

---

## 4. 제약 사항

1. **Phase 3 Only**: 해당 Rebuild는 Phase 3 과정에서 일괄 처리. 중간 Hotfix 금지.
2. **코드 변경 금지**: 현재 문서 작업 단계에서는 `frontend/` 코드나 HTML mockup을 직수정하지 않음.
3. **Trinity 분리**: 본 스펙은 Core Solution(`frontend/`) 자체 라우트 전용. Trinity(`frontend-trinity/`) 랜딩과 혼용하거나 코드를 직접 공유하지 않음 (단, CTA 라우팅은 Trinity의 apply로 레퍼런스 연결 가능).
