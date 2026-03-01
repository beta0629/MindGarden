---
name: core-solution-design-handoff
description: 디자이너(core-designer) 설계 산출물 형식·코더 전달 시 필수 포함 항목. 코드 작성 없이 스펙·시안만 출력할 때 적용.
---

# 디자인 산출물·코더 전달 스킬 (Design Handoff)

**core-designer**가 새 화면·컴포넌트·레이아웃을 설계할 때, **코더가 코드로 구현할 수 있도록** 산출물 형식을 맞출 때 이 스킬을 적용합니다. 디자이너는 **코드를 작성하지 않고** 스펙·시안 설명만 출력합니다.

## 적용 시점

- 새 페이지·화면 레이아웃 설계
- 새 컴포넌트(모달·위젯·카드) 설계
- 기존 화면 개선 시 변경 구역·토큰·구성 명시
- 코더에게 "이렇게 구현해 달라"는 요구를 **문서·스펙**으로 전달할 때

## 산출물 필수 포함 항목

설계 시 아래를 반드시 포함하여 **core-coder**에게 전달합니다.

| 항목 | 설명 |
|------|------|
| **개요·배경** | 해당 화면/기능의 목적, 해결하려는 문제 1~2문장 |
| **레이아웃 구조** | 상단/좌측/우측/본문 구역, 스플릿·드로어·탭 등 선택 이유(간단히) |
| **사용 토큰** | 색상·간격·폰트에 쓸 **CSS 변수만** 명시. 예: `var(--mg-color-primary-main)`, `var(--mg-spacing-24)`. 하드코딩 값(#hex, 16px 등) 금지. |
| **아토믹 계층** | 해당 화면/블록이 Atoms / Molecules / Organisms / Template 중 어디에 해당하는지, 기존 컴포넌트명(MGButton, FormInput 등) 재사용 여부 |
| **상태·예외** | 비활성, 로딩, 에러, 빈 목록 등 표시 방식(문구·아이콘·레이아웃) |
| **참조 문서** | 참고한 기존 스펙 또는 디자인 시스템 문서 경로. 예: `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`, `docs/design-system/v2/MATCHING_SCHEDULE_INTEGRATION_SPEC.md` |

## 산출물 형식 (문서 구조)

기존 디자인 스펙과 동일한 구조를 따르면 코더가 구현 시 참고하기 쉽습니다.

1. **제목**: 화면/기능명 + "UI/UX 스펙" (또는 "Design Spec")
2. **1. 개요 및 배경**
3. **2. 레이아웃/아이디어** (선정된 안과 이유)
4. **3. 세부 UI/UX 스펙**
   - 전체 레이아웃 (상단바·본문·패딩·gap)
   - 섹션별: 제목·컨테이너 스타일(토큰)·내용·버튼/입력 컴포넌트
   - 사용 토큰 목록 정리
5. **4. 상호작용·상태** (클릭·드롭·에러·빈 데이터)
6. **(선택) 5. 참조** — `unified-design-tokens.css`, `AdminDashboardB0KlA.css`, 기존 스펙 링크

## 참조 문서

- **디자이너 필수 숙지**: `docs/design-system/PENCIL_DESIGN_GUIDE.md` — 펜슬(.pen) 단일 소스, B0KlA 팔레트·레이아웃·체크리스트. 일관된 디자인을 위해 설계 전 반드시 참조.
- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md` — 계층(Atoms→Pages)·컴포넌트 규칙
- `docs/design-system/v2/MATCHING_SCHEDULE_INTEGRATION_SPEC.md` — 스펙 문서 구조 예시
- `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md` — 토큰·중앙화 원칙
- `frontend/src/styles/unified-design-tokens.css` — 사용 가능한 `var(--mg-*)` 목록

## 규칙

- **단일 소스**: `mindgarden-design-system.pen`, `unified-design-tokens.css`, `AdminDashboardB0KlA.css`에 정의된 토큰만 사용. 새 색·간격이 필요하면 먼저 토큰 추가를 제안하고, 승인 전까지 기존 토큰으로 대체.
- **코드 미작성**: 디자이너는 HTML/CSS/JS 코드를 작성하지 않습니다. 스펙·설명만 작성하고, 구현은 **core-coder**가 수행합니다.
- **연관 요소 명시**: 해당 화면에서 열리는 모달·탭·드로어가 있으면 같은 스펙 문서에 포함하거나, 별도 섹션으로 명시합니다.

이 스킬은 **/core-solution-standardization** 과 함께 사용합니다. standardization은 전반 디자인·표준 원칙, handoff는 **산출물 형식·코더 전달**에 초점을 둡니다.
