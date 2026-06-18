# Core Solution 디자인 현재 상태 분석 및 고도화 방향

> **Status**: Active  
> **Scope**: Core Solution 메인 앱 UI (`frontend/`, 로그인 후 `/` 허브 및 어드민 대시보드)  
> **Date**: 2026-06-18

---

## 1. Executive Summary

Core Solution 메인 앱(로그인 후 `/` 허브)의 디자인은 여러 차례의 부분 패치와 일괄 치환으로 인해 시각적 파편화가 누적된 상태입니다. `MGButton`과 레거시 `<button>`의 혼재, 하드코딩된 색상 및 극단적인 `z-index` 충돌, 그리고 B0KlA(AdminDashboardV2)와 비-B0KlA 페이지 간의 디자인 격차가 주요 문제로 파악됩니다. 이를 해결하기 위해 Calm Forest 팔레트(`--mg-v2-*`)를 기반으로 한 확고한 시안을 도출하고, 하향식(Top-down)으로 일관된 시각 언어를 정립하는 고도화 전략이 필요합니다.

---

## 2. 증상 및 코드 근거 (Symptoms vs Code Evidence)

| 증상 (사용자 경험) | 코드 근거 (실측 데이터) | 문제 파일 예시 |
|-------------------|----------------------|--------------|
| **레이아웃/중첩(Overlap)** | `z-index: 999999999`, `10000` 등 극단적 하드코딩 값과 인라인 스타일 덮어쓰기 혼재로 드롭다운/모달 가림 현상 발생 | `unified-design-tokens.css`, `CustomSelect.js`, `_z-index.css` |
| **버튼/액션 불일치** | `MGButton`과 네이티브 `<button>` 혼용, `btn-primary` 등 레거시 클래스와 `mg-v2-button` 혼재 | `AdminDashboardV2.js`, `ConsultantCard.js`, `AuthPageCommon.css` |
| **토큰/하드코딩** | `--mg-v2-*` 토큰 미사용, `#3B82F6`(SaaS Blue) 등 레거시 색상 하드코딩 잔존 | `AuthPageCommon.css`, `EmailServiceImpl.java` |
| **컴포넌트 이중화** | `UnifiedModal` 표준이 있음에도 커스텀 모달 병존, 중복된 카드/헤더 패턴 사용 | `AdminDashboardV2.js`, `EventModal.js` |
| **타이포/밀도/반응형** | 하드코딩된 `padding`(예: `16px`, `20px`) 산재, 모바일/데스크톱 간 여백 불일치 | `ConsultantSchedule.js`, `ClientManagement.js` |
| **다크모드 파편화** | `.dark-mode` 레거시 클래스와 `[data-theme="dark"]` 토큰 시스템 혼용 | `_session-management.css`, `_iphone17-cards.css` |

---

## 3. P0/P1/P2 문제 목록

### P0 (크리티컬 - 사용성 및 브랜드 훼손)
- **Z-Index 충돌**: 드롭다운이 모달 아래에 깔리거나, 오버레이가 콘텐츠를 가리는 현상 (`z-index` 하드코딩 및 JS 인라인 개입).
- **브랜드 색상 오염**: 앱 UI 내에 마케팅용 레거시 색상(SaaS Blue `#3B82F6` 등)이 하드코딩으로 남아 Calm Forest 정체성 훼손.

### P1 (메이저 - 컴포넌트 및 시각적 불일치)
- **버튼 파편화**: `MGButton` 컴포넌트와 일반 `<button>` 태그가 섞여 쓰이며, 크기/정렬/Variant가 제각각임.
- **모달 이중화**: `UnifiedModal` 도입 이후에도 기존 커스텀 모달이 다수 남아 있어 닫기 버튼, 패딩, 오버레이 스타일이 불일치함.

### P2 (마이너 - 디테일 및 유지보수성)
- **패딩/여백 하드코딩**: `var(--mg-v2-space-*)` 토큰 대신 `px` 단위가 직접 입력되어 반응형 레이아웃 시 간격이 깨짐.
- **다크모드 레거시**: `.dark-mode` CSS 선택자가 남아 있어 자동/수동 테마 전환 시 일부 UI가 누락됨.

---

## 4. 고도화 전략 2트랙

### Track A. Greenfield 시안 (새 레이아웃 시스템 기반 전면 재설계)
- **개요**: 기존의 덧대기식 패치를 버리고, 로그인 후 메인(`/`)부터 B0KlA 구조(사이드바 + 메인 섹션 블록)를 백지 상태에서 완벽하게 그리는 방식.
- **적용 시점**: 현재처럼 시각적 빚(Visual Debt)이 임계치를 넘어, 점진적 수정 시 사이드 이펙트(z-index 꼬임 등)가 계속 발생할 때.

### Track B. Incremental 고도화 (점진적 컴포넌트 치환)
- **개요**: 현재 `AdminDashboardV2.js`의 틀을 유지한 채, 하드코딩된 CSS와 레거시 버튼/모달을 하나씩 `--mg-v2-*` 토큰과 `MGButton`, `UnifiedModal`로 교체.
- **적용 시점**: 당장의 리소스가 부족하고 기능 배포가 우선일 때.

> **권장 전략 (v1.1 갱신)**: [COMMERCIALIZATION_DESIGN_PLAN.md](./COMMERCIALIZATION_DESIGN_PLAN.md) — **메인 셸(`/`) Greenfield 시안 1벌 + LNB/GNB·버튼·모달·카드 B0KlA 확장(Refactor)**. 전면 Greenfield는 ROI·비용 기준으로 해당 영역만.  
> **이전 초안**: Track A 전면 Greenfield — 점검·투입 자산(MGButton·B0KlA·토큰) 고려 시 v1.1에서 **선택적 Rebuild**로 조정됨.

---

## 5. Phase 1 시안 브리프 (Designer 가이드)

디자이너가 바로 시안 작업에 착수할 수 있도록 정의된 가이드라인입니다.

- **레이아웃 구조**: 
  - **좌측 사이드바**: 고정 260px, 배경 Dark(`#2C2C2C`), 활성 메뉴 주조색(`#3D5246`).
  - **메인 영역**: 배경 Off-White(`#FAF9F7`), 상단 브레드크럼/타이틀 바 포함.
- **섹션 블록 (콘텐츠 래퍼)**:
  - 배경 `#F5F3EF`, 테두리 1px `#D4CFC8`, Corner Radius 16px.
  - 섹션 제목 좌측에 4px 두께의 악센트 바(Primary `#3D5246`, radius 2px) 배치.
- **컴포넌트 위계**:
  - **버튼**: Radius 10px, 높이 40px. Primary 버튼은 `#3D5246` 배경에 `#FAF9F7` 텍스트.
  - **카드/메트릭**: 내부 패딩 24px, 숫자 24px(Bold), 라벨 12px.
- **색상 토큰 (Calm Forest)**:
  - 오직 `mindgarden-design-system.pen` 및 `--mg-v2-*` 토큰만 사용.
- **금지사항**:
  - SaaS Blue(`#3B82F6`) 등 타 팔레트 사용 절대 금지.
  - Trinity(퍼블릭) 랜딩 페이지의 컴포넌트나 로고 혼용 금지.
  - React/HTML 코드 선행 작성 금지 (시안 확정 후 코딩).

---

## 6. 벤치마크 대비 갭 (KR_SAAS_BENCHMARK 참조)

| 항목 | 국내 Top-tier B2B SaaS 벤치마크 | Core Solution 현재 상태 | 갭 극복 방향 |
|---|---|---|---|
| **여백 (Spacing)** | 섹션 간 80~120px의 넉넉한 수직 패딩으로 숨 쉴 공간 확보 | 패딩이 좁고 하드코딩(`16px`, `20px`)되어 답답함 | 토큰 기반의 과감한 여백(`--mg-v2-space-8` 이상) 적용 |
| **색상 (Color)** | 화이트/미색 캔버스에 포인트 컬러 절제 사용 | 여러 색상과 레거시 그라데이션 잔존 | Calm Forest 단일 팔레트로 통일 및 절제 |
| **곡률 (Radius)** | 버튼 10px, 카드 16px 등 엄격한 위계 적용 | 임의의 px 값 혼재 | `--mg-v2-radius-*` 토큰으로 강제 통일 |
| **시각화 (Hero)** | 실제 동작하는 UI 목업 중심 | 추상적 아이콘/일러스트 혼용 | B0KlA 기반의 실제 대시보드 UI를 시안에 전면 배치 |

---

## 7. 측정 가능한 완료 기준 (Phase 1 → Phase 3 반영 시)

1. **하드코딩 제로**: 메인 라우트(`/`) 및 관련 CSS에서 `#3B82F6` 등 비표준 HEX 색상 0건.
2. **Z-Index 정상화**: `z-index: 9999` 이상의 임의 하드코딩 0건 (모두 `--mg-v2-z-*` 토큰으로 대체).
3. **버튼/모달 단일화**: 메인 라우트 내 레거시 `<button className="btn-*">` 사용 0건, 커스텀 모달 0건 (`MGButton`, `UnifiedModal` 100% 달성).
4. **시안 일치율**: 확정된 Phase 1 시안과 React 구현물 간의 Visual Regression 차이 0%.