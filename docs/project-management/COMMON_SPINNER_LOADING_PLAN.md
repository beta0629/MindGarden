# 공통 스피너/로딩바 이상 동작 — 기획 정리

**위임 내용**: 사용자 요청에 따라 기획이 공통 스피너/로딩바 위치 파악, 이상 동작 원인 가설, 옵션 제안 및 다음 단계 태스크를 정리함.

---

## 1. 현재 공통 스피너/로딩바 위치 파악

### 1.1 공통 컴포넌트·스타일 정의

| 구분 | 위치 | 디자인/스타일 |
|------|------|----------------|
| **UnifiedLoading** (표준 통합 로딩) | `frontend/src/components/common/UnifiedLoading.js` | `main.css` → `styles/06-components/_loading.css` (`.mg-loading-spinner-icon`, `mg-spin` 1s linear) |
| **LoadingSpinner** | `LoadingSpinner.css` 존재, `LoadingSpinner.js`는 리포지터리에서 미확인 | `LoadingSpinner.css`: `.loading-spinner-icon`, `spin` 1s, **medium/large 시 60×40px 비정사각형** |
| **CommonLoading** | `frontend/src/components/common/CommonLoading.js` | 위 LoadingSpinner 래퍼 |
| **MGLoading** | `frontend/src/components/common/MGLoading.js` + `MGLoading.css` | BEM `.mg-loading-spinner__ring`, 자체 keyframes |
| **직접 `.mg-spinner` 사용** | 예: `ErpPurchaseRequestPanel.js`, `ConsultationRecordSection.js` | 전역 CSS의 `.mg-spinner`에 의존 |

### 1.2 전역 스타일에서의 로딩/스피너 정의

- **`styles/06-components/_loading.css`**: `.mg-loading-spinner-icon` (정사각형 32/40/48px), `@keyframes mg-spin` — UnifiedLoading의 실제 소스.
- **`styles/unified-design-tokens.css`**:  
  - **.mg-spinner**가 **두 번** 정의됨  
    - 약 2542행: `animation: spin 1s linear infinite`, 2rem  
    - 약 7573행: `animation: spinner-rotate 0.6s linear infinite`, 16px, `border-top-color: currentColor`  
  → 동일 클래스에 서로 다른 애니메이션·크기·속도가 있어, 로드 순서에 따라 후자가 일부 덮어쓰며 **일관성 깨짐 가능**.
- **`styles/mindgarden-design-system.css`**: `.mg-loading-spinner` 24px, `mg-spin` 1s (UnifiedLoading은 `.mg-loading-spinner-icon` 사용으로 선택자 차이 존재).
- **컴포넌트 로컬**: `HealingCard.css`, `MGFilter.css`, `ConsultantRecords.css` 등에서 `.mg-spinner` 또는 `spin` 키프레임을 별도 정의 — **중복·충돌 여지** 있음.

### 1.3 사용처 요약

- **UnifiedLoading**: CommonDashboard, WidgetBasedAdminDashboard, CacheMonitoringDashboard, AdminCommonLayout `loading`/`loadingText` 등.
- **`.mg-spinner` 직접 사용**: ErpPurchaseRequestPanel, ConsultationRecordSection 등 (전역 `.mg-spinner` 스타일 의존).
- **기타**: SmartNoteTab `.spinner`, ConsultantRecords `spinner-border text-primary`, MGFilter `.mg-filter__spinner` 등 — Bootstrap/로컬 클래스 혼재.

---

## 2. 이상 동작 가능 원인 가설

"로딩바가 이상하게 돌아간다"에 대한 코드/스타일 기준 가설은 아래와 같음.

| # | 가설 | 설명 | 확인 방법(재현·조건) |
|---|------|------|----------------------|
| 1 | **unified-design-tokens.css 내 .mg-spinner 중복 정의** | 동일 클래스에 `spin` 1s vs `spinner-rotate` 0.6s, 서로 다른 크기·테두리. 후행 규칙이 일부만 덮어써 속도·크기·모양이 섞일 수 있음. | `.mg-spinner`만 쓰는 화면(예: ErpPurchaseRequestPanel, ConsultationRecordSection)에서 로딩 시 속도·모양 확인. 개발자 도구로 해당 요소에 적용된 최종 `animation`/`width`/`height` 확인. |
| 2 | **LoadingSpinner.css의 비정사각형 크기** | `.loading-spinner-medium` / `.loading-spinner-large`가 **width: 60px, height: 40px**로 되어 있음. `border-radius: 50%`인 원이 타원으로 늘어나 회전 시 “이상하게 돌아가는” 느낌을 줄 수 있음. | LoadingSpinner(또는 CommonLoading)를 medium/large로 쓰는 화면에서 스피너 비율 확인. 해당 클래스가 적용된 요소의 computed width/height 확인. |
| 3 | **여러 CSS의 선택자·로드 순서 충돌** | `_loading.css`의 `.mg-loading-spinner-icon`, mindgarden-design-system의 `.mg-loading-spinner`, unified-design-tokens의 `.mg-spinner` 등이 서로 다른 크기·애니메이션을 적용. 페이지별 로드 순서·우선순위에 따라 특정 화면에서만 깨질 수 있음. | 문제가 되는 화면에서 스피너 요소의 적용 규칙(Cascade) 확인. main.css import 순서와 해당 페이지 추가 CSS 로드 순서 확인. |

---

## 3. 기획 관점 결론 및 제안

### 옵션 A — 원인 규명 후 최소 수정(버그 픽스)

- **정리**: 위 가설 1~3을 **core-debugger**에게 전달해, “어디서 재현되는지·어떤 클래스가 적용되는지” 기준으로 원인 규명을 의뢰한 뒤, **최소 수정**으로 해결할 수 있음.
- **가능한 수정 예시** (구현은 core-coder 담당):  
  - unified-design-tokens.css 내 `.mg-spinner` 정의 **하나로 통일** (한 곳만 두고, 나머지 제거 또는 비공통 용도로 클래스명 분리).  
  - LoadingSpinner.css의 medium/large를 **정사각형**(예: 40×40, 48×48)으로 변경.  
  - 특정 컴포넌트에서만 쓰는 `.mg-spinner`는 **스코프 강화**(예: 부모 클래스 하위로 한정) 또는 UnifiedLoading으로 대체 검토.

### 옵션 B — 디자인 시스템에 맞는 새 컴포넌트로 교체

- **정리**: 현재처럼 **여러 소스**(UnifiedLoading, LoadingSpinner, MGLoading, 직접 `.mg-spinner`)가 혼재하면 유지보수와 일관성이 어렵다. **공통 스피너/로딩은 UnifiedLoading + `_loading.css` 한 갈래로 통일**하고, `.mg-spinner` 직접 사용처는 **UnifiedLoading(또는 디자인 시스템에서 정한 한 컴포넌트)**로 교체하는 것이 좋음.
- **참고할 샘플/가이드**:  
  - **admin-dashboard-sample** (예: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample) 의 로딩 UI.  
  - **디자인 시스템**: `styles/06-components/_loading.css`, `unified-design-tokens.css` 내 로딩 관련 토큰·애니메이션.  
  - **공통 모듈 가이드**: `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`, `/core-solution-common-modules` 스킬 — “공통 모듈 우선 사용” 원칙에 맞춰 UnifiedLoading을 기본으로 고정.

### 권장 흐름

1. **우선 core-debugger**에게 아래 “다음 단계 태스크”를 전달해 **원인 규명** (증상·재현 위치·확인할 CSS/클래스).  
2. **원인에 따라**:  
   - **옵션 A**: 규명된 원인만 최소 수정(중복 제거, 비정사각형 수정, 선택자 정리).  
   - **옵션 B**: 디자이너(core-designer)에게 “공통 스피너/로딩바 디자인 시스템 스펙(한 컴포넌트 기준)” 요청 후, core-coder가 UnifiedLoading 통일 및 `.mg-spinner` 사용처 교체 진행.

---

## 4. 다음 단계 태스크 (서브에이전트 전달용)

- **Phase 1 — 원인 분석 (core-debugger)**  
  “공통 스피너/로딩바가 이상하게 돌아간다”는 증상을 재현할 수 있는 **화면·경로**와 **사용 중인 로딩 방식**(UnifiedLoading / `.mg-spinner` 직접 / LoadingSpinner 등)을 확인한 뒤, 위 **가설 1~3**(unified-design-tokens 내 `.mg-spinner` 중복, LoadingSpinner 60×40 비정사각형, 여러 CSS 선택자·로드 순서)을 우선 검증하고, **원인 후보 1~3가지와 각각에 대한 확인 방법**을 보고해 주세요.

- **Phase 2a — 최소 수정 (core-coder, 옵션 A 선택 시)**  
  core-debugger 보고를 바탕으로, **unified-design-tokens.css의 `.mg-spinner` 중복 정리**, **LoadingSpinner.css의 medium/large 크기 정사각형으로 수정**, 필요 시 **충돌하는 로딩 관련 선택자 정리**를 진행해 주세요. 표준은 `styles/06-components/_loading.css`, `/core-solution-frontend`·`/core-solution-design-system-css`를 참고해 주세요.

- **Phase 2b — 교체 (core-designer → core-coder, 옵션 B 선택 시)**  
  **core-designer**: admin-dashboard-sample·디자인 시스템을 참고해 **공통 스피너/로딩바 한 가지 스타일 스펙**(UnifiedLoading 기준 권장)을 정리해 주세요.  
  **core-coder**: 해당 스펙에 맞춰 **UnifiedLoading을 기본으로 유지**하고, **`.mg-spinner` 직접 사용처**(ErpPurchaseRequestPanel, ConsultationRecordSection 등)를 **UnifiedLoading(또는 지정한 공통 컴포넌트)**로 교체해 주세요. `/core-solution-common-modules`와 `COMMON_MODULES_USAGE_GUIDE.md`를 따르면 됩니다.

---

*기획(core-planner)이 위임받아 정리한 결과입니다. 실제 원인 분석·수정·디자인은 해당 서브에이전트에 의뢰해 주세요.*
