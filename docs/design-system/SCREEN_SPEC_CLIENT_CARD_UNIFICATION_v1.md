# 내담자 카드 UI 통일 — B0KlA 내담자 선택 모달 (UI/UX 스펙 v1 초안)

**문서 유형**: 화면·컴포넌트 설계 (코더 전달용)  
**버전**: v1 초안 (Phase C)  
**작성일**: 2026-04-25  
**연계 기획**: `docs/project-management/2026-04-25/CLIENT_CARD_UNIFICATION_ORCHESTRATION.md` §1~3, §2 앵커 표  
**참조 스크린샷**: `design-element-0d423701-8653-457a-8893-3a008985e781.png` (내담자 선택 그리드·상태 배지)  
**디자인 단일 소스**: `docs/design-system/PENCIL_DESIGN_GUIDE.md`, `mindgarden-design-system.pen` (B0KlA), `frontend/src/styles/unified-design-tokens.css`, `frontend/src/styles/dashboard-tokens-extension.css` (`--ad-b0kla-*`)

---

## 목차

1. [개요 및 배경](#1-개요-및-배경)  
2. [역할·사용성·정보 노출 범위](#2-역할사용성정보-노출-범위)  
3. [레이아웃·DOM 앵커](#3-레이아웃dom-앵커)  
4. [카드 정보 계층·노출 순서](#4-카드-정보-계층노출-순서)  
5. [상태 배지·토큰 매핑](#5-상태-배지토큰-매핑)  
6. [CTA·포커스·호버](#6-ctapocus호버)  
7. [반응형·그리드·간격](#7-반응형그리드간격)  
8. [접근성](#8-접근성)  
9. [아토믹·공통 모듈](#9-아토믹공통-모듈)  
10. [코더 완료 기준 체크리스트](#10-코더-완료-기준-체크리스트)  
11. [Revision](#revision)

---

## 1. 개요 및 배경

**목적**: 관리자 B0KlA 스케줄 플로우의 **내담자 선택 모달**(`mg-modal--large` + `client-selection-step` + `client-selector`)에서 사용하는 **내담자 카드**의 정보 밀도, 상태 배지, 타이포, 간격을 **단일 패턴**으로 맞춘다. 동일 도메인의 다른 목록·카드와 시각 언어가 어긋나지 않게 한다.

**해결 과제**: 카드별로 상태·메타·CTA의 위계가 일관되게 읽히도록 하고, 키보드·스크린리더 사용자에게 **이름 + 상태 + 선택 동작**이 한 흐름으로 전달되게 한다. 동적 필드는 표시 경계(SSOT: `safeDisplay` 등)를 훼손하지 않는다(오케스트레이션 §0.2).

---

## 2. 역할·사용성·정보 노출 범위

| 항목 | 명세 |
|------|------|
| **역할** | **관리자(ADMIN)** — B0KlA 스케줄에서 상담사·내담자 매칭 단계 중 **내담자 선택**만 담당. |
| **사용성** | 모달 내에서 카드를 스캔 → 한 명 **선택하기** → 하단 **이전/다음**으로 단계 이동. 자주 쓰는 1차 동작은 **카드 CTA(선택하기)**. |
| **정보 노출** | 카드당: **이니셜(원형 아바타)**, **표시명(이름)**, **진행 상태(배지)**, **부가 메타**(최근 상담 요약, 총 N회, 진행률 %, 담당 상담사 등 — 데이터는 테넌트·권한 정책에 따름), **선택하기** CTA. 상단 컨텍스트(예: 선택된 상담사·전문 분야 요약)는 **스텝 헤더** 영역에 유지. |
| **비노출·마스킹** | 본 스펙은 레이아웃·비주얼만 정의. PII 마스킹·필드 단위 권한은 제품 정책·mapper와 별도 합의. |

---

## 3. 레이아웃·DOM 앵커

| 레이어 | 클래스·역할 (구현 앵커) |
|--------|-------------------------|
| 오버레이·B0KlA 톤 | `mg-modal-overlay`, `mg-modal-overlay--visible`, **`mg-v2-ad-b0kla`** (오케스트레이션 §2 표) |
| 모달 크기 | **`mg-modal--large`** — 카드 그리드가 주 콘텐츠이므로 가로 폭·패딩은 large 기준 유지. |
| 스텝 래퍼 | **`client-selection-step`**, **`mg-v2-ad-client-step`** (제품 마크업 기준; 코더는 실제 JSX와 일치시킴) |
| 목록 컨테이너 | **`client-selector`** — 카드 그리드·스크롤 영역의 부모. |

**레이아웃 구조 (위→아래)**  
1) 스텝 상단: 컨텍스트 텍스트(선택된 상담사 등)  
2) **`client-selector`**: 반응형 카드 그리드  
3) 스텝 푸터: **이전**(outline) · **다음**(primary, 비활성 시 토큰 기반 muted)

---

## 4. 카드 정보 계층·노출 순서

**시각·읽기 순서 (Z/reading order 통일)** — 스크린샷·오케스트레이션 관찰과 정렬.

| 순서 | 영역 | 내용 |
|:----:|------|------|
| 1 | **상태 배지** | 카드 **우상단** 절대 배치(또는 우측 상단 flex 정렬). 라벨: 예) 진행중, 대기중. |
| 2 | **이니셜** | 카드 상단 중앙, **원형** 아바타. 한 글자(성 초 등) 중심. |
| 3 | **이름** | 이니셜 바로 아래, **본문 강조** 타이포. 1줄 우선, 길면 말줄임(ellipsis). |
| 4 | **메타 블록** | 세로 스택: 최근 상담 한 줄, 총 N회, 진행률 %, 담당 상담사 등. 라벨+값 또는 문장형 중 **한 패턴**으로 통일(코더·카피는 Phase B SSOT와 정합). |
| 5 | **CTA** | 카드 하단 **전폭 또는 우측 정렬** 버튼/링크형 **「선택하기」**. |

**카드 컨테이너 비주얼**  
- 배경·테두리·모서리: B0KlA 카드 토큰 — `var(--ad-b0kla-card-bg)`, `1px solid var(--ad-b0kla-border)`, `border-radius: var(--ad-b0kla-radius-sm)`.  
- 그림자(선택): `var(--ad-b0kla-shadow)`; 호버 시 `var(--ad-b0kla-shadow-hover)` (과한 elevation 금지).

---

## 5. 상태 배지·토큰 매핑

배지는 **pill** 형태, 아이콘+텍스트 병행 가능. 색은 **프로젝트 토큰만** 사용.

| 상태(예시 라벨) | 배경 토큰 | 텍스트·아이콘 토큰 | 비고 |
|------------------|-----------|-------------------|------|
| **진행중** | `var(--ad-b0kla-green)` 또는 `var(--mg-success-600)`와 동일 계열 채움 배지 | `var(--mg-white)` 또는 `var(--ad-b0kla-card-bg)` 대비 충분한 **on-success** 텍스트 | 스크린샷의 녹색 pill에 대응; WCAG 대비 충족 확인. |
| **대기중** | `var(--ad-b0kla-blue-bg)` (`--mg-primary-50` 계열) | `var(--ad-b0kla-blue)` 또는 `var(--mg-primary-600)` | 연한 배경 + 진한 텍스트로 **대비 확보**(연한 텍스트만 쓰지 말 것). |

**플레이스홀더 (토큰 미확정 시)**  
- 추가 상태(예: 완료, 중단)가 생기면: `[TBD: --mg-neutral-* / --mg-warning-* 배지 쌍]` — **추가 전** `docs/design-system/PENCIL_DESIGN_GUIDE.md` 및 `unified-design-tokens.css`에서 기존 시맨틱(success/warning/neutral) 중 선택.  
- 배지 전용 토큰이 없으면 **기존 Badge/Molecule**에 정의된 클래스·토큰을 component-manager 합의 후 단일 지정.

---

## 6. CTA·포커스·호버

**「선택하기」**  
- 유형: **주조(Primary) 소형** 또는 카드 내 **텍스트+배경 버튼** — B0KlA와 충돌 없이 `var(--ad-b0kla-green)` 배경 + `var(--mg-white)` 또는 대비 확보된 전경색.  
- `disabled`: `var(--ad-b0kla-placeholder)` 또는 `var(--mg-gray-400)` 전경 + 배경 `var(--mg-gray-100)` 수준(정확한 쌍은 토큰 표 준수).  
- **전체 카드 클릭**과 CTA 중복 시: 한 패턴만 탭 정지(§8) — 중복 초점 방지는 코더·접근성 합의.

**포커스 링 (키보드 `:focus-visible`)**  
- 카드가 포커스 가능한 단일 위젯인 경우: `outline` 또는 `box-shadow`로 **2px** 계열 — `var(--mg-focus)` 또는 `var(--color-border-focus)` (`--mg-primary-500` 계열), **offset** `var(--focus-outline-offset)` / `var(--focus-ring-offset)` (토큰 파일: `--focus-outline`, `--focus-ring-width` 참고).  
- B0KlA primary 버튼과 동일 계열 색으로 **모달 내 시각 일관** 유지.

**호버**  
- 카드: 테두리 또는 그림자만 미세 증가(`--ad-b0kla-shadow-hover`).  
- CTA: 기존 `mg-btn` / `mg-v2-button` 호버 규칙 재사용 권장.

---

## 7. 반응형·그리드·간격

| 항목 | 명세 |
|------|------|
| **컨테이너** | `mg-modal--large` 본문 패딩은 기존 모달 토큰·클래스 유지; **`client-selector`** 안쪽이 그리드의 유일한 스크롤 영역이 될 수 있음. |
| **그리드** | `display: grid`; 최소 카드 폭 기준으로 **auto-fill / minmax** — 좁으면 1열, 넓으면 2열(스크린샷)·그 이상은 뷰포트에 따라 증가. |
| **행·열 간격 (gap)** | **`var(--cs-spacing-md)`** (16px)를 기본; 카드 밀도가 높으면 **`var(--cs-spacing-sm)`** (8px)로만 하향(한 플로우 내 단일 값). |
| **카드 내부 패딩** | **`var(--cs-spacing-md)`** ~ **`var(--cs-spacing-lg)`** (16~24px); 세로 gap between 메타 줄은 **`var(--cs-spacing-sm)`**. |
| **모서리** | `var(--ad-b0kla-radius-sm)` (12px). |

---

## 8. 접근성

| 주제 | 권고 |
|------|------|
| **대비** | 본문 `var(--ad-b0kla-title-color)` / 보조 `var(--ad-b0kla-text-secondary)` on `var(--ad-b0kla-card-bg)` — **4.5:1** 이상 목표. 대기중 배지는 연한 배경+진한 글자 조합으로 약한 대비 조합 금지. |
| **키보드 탭 순서** | (1) 모달 포커스 트랩 내 첫 포커스 가능 요소 → (2) **카드 목록** 위→아래, 좌→우(그리드 row-major) → (3) 각 카드 내 **선택하기**가 카드 단일 탭스톱이면 카드 한 번에 선택 실행 가능 → (4) **이전** → **다음**. 스크롤 컨테이너는 `tabIndex=0` 남발 금지; Roving tabindex는 component-manager·코더 합의. |
| **스크린리더** | 카드 루트에 **요약 라벨**: 예) `aria-label` 또는 내부 **visually hidden** 텍스트 — **「{이름}, {상태}, {핵심 메타 한 문장}」** 후 CTA는 **「선택하기, {이름}」** 또는 중복 최소화를 위해 버튼만 **「{이름} 선택」**. 상태 배지 텍스트는 시각과 동일 문자열을 DOM에 노출. |
| **아이콘** | 추세·시계 등 장식 아이콘은 **`aria-hidden="true"`** + 의미는 텍스트로 전달. |

---

## 9. 아토믹·공통 모듈

- **계층**: 카드 = **Organism**(또는 Molecule 조합: Avatar + Badge + Meta + Button); 목록 = **client-selector** Organism.  
- **구현 SSOT**: 오케스트레이션 가설에 따라 `ClientCard` 및 `frontend/src/components/ui/Card/ClientCard.js` 중심 여부는 **explore 인벤토리 + core-component-manager** 확정 후 본 문서 §5~7에 수치·클래스만 동기화.  
- **모달**: `UnifiedModal` 패턴·`mg-modal--large`와 충돌 없이 스타일 적용.  
- **공통 모듈**: `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` — 기존 Badge/Button 재사용 가능 시 스펙 확정본에 **컴포넌트명 명시** 예정.

---

## 10. 코더 완료 기준 체크리스트

- [x] 정보 순서가 §4와 일치(배지 위치·이름·메타·선택하기).  
- [x] 상태별 색이 §5 토큰만 사용(임의 hex 없음).  
- [x] 그리드 gap·카드 padding이 §7 토큰과 일치.  
- [x] `:focus-visible` 링이 §6 토큰 기반.  
- [x] §8 탭 순서·라벨 권고 반영 또는 문서화된 예외.  
- [x] `client-selection-step` / `client-selector` / B0KlA 모달 클래스와 충돌 없음.

---

## Revision

- **explore·component-manager 반영 (2026-04-25 Phase D):** SSOT `ClientCard.js`에 `scheduleClientSelectMode`/`selectDisabled`로 B0KlA 단일 CTA·버튼 전용 포커스·`toSafeNumber`/`toDisplayString` 표시 경계 적용; `ClientSelector`는 `detailed` 고정·해당 props 전달; `ScheduleB0KlA.css`의 `.mg-v2-ad-b0kla` 하에서 그리드 gap `var(--cs-spacing-md)`, 카드 패딩·메타 gap 토큰, §5 배지(진행중 채움/대기중 blue-bg+primary-600), CTA `:focus-visible`, disabled CTA 토큼 스타일 보강.

---

*본 문서는 Phase C 설계 초안이며, 소스 코드를 직접 수정하지 않는다. 구현은 core-coder, 검증은 core-tester.*
