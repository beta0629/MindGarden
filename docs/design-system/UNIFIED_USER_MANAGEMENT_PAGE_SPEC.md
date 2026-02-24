# 통합 사용자 관리 페이지 스펙

**버전**: 1.0.0  
**최종 업데이트**: 2026-02-24  
**기준**: CONSULTANT_CLIENT_UNIFIED_MANAGEMENT_REVIEW (Phase 1~4), CONSULTANT_CLIENT_MANAGEMENT_DESIGN_SPEC  
**대상**: "사용자 관리" 통합 페이지(단일 진입점) — 레이아웃·탭·URL 연동

---

## 1. 페이지 개요

### 1.1 URL

| 항목 | 값 |
|------|-----|
| **기본 URL** | `/admin/user-management` |
| **타입 전환** | 쿼리 파라미터 `?type=consultant` \| `?type=client` 로 상담사/내담자 전환 |

### 1.2 기존 URL 리다이렉트

| 기존 경로 | 리다이렉트 대상 |
|-----------|-----------------|
| `/admin/consultant-comprehensive` | `/admin/user-management?type=consultant` |
| `/admin/client-comprehensive` | `/admin/user-management?type=client` |

- 북마크·외부 링크로 기존 URL 접근 시 위 경로로 자동 리다이렉트하여 동일한 타입(상담사/내담자)을 유지한다.

---

## 2. 레이아웃 구조

### 2.1 전체 구조 (아토믹·기존 스펙과 동일)

- **루트**: `AdminCommonLayout` 유지. (사이드바 + 메인 영역 구조 변경 없음.)
- **내부**: `ContentArea` > **상단 타입 전환** + **타입별 콘텐츠**.

```
AdminCommonLayout
└── main
    └── ContentArea (mg-v2-content-area)
        ├── 상단 타입 전환 (1단계 네비게이션)
        └── 타입별 콘텐츠
            ├── type=consultant → 상담사 관리 콘텐츠
            └── type=client     → 내담자 관리 콘텐츠
```

### 2.2 상단 타입 전환 (1단계 네비게이션)

| 항목 | 스펙 |
|------|------|
| **역할** | 상담사 / 내담자 모드 전환. 1단계 네비게이션. |
| **클래스** | `mg-v2-ad-b0kla__pill-toggle` |
| **Pill 개수** | 2개 |
| **Pill 라벨** | "상담사", "내담자" |
| **활성 Pill** | `mg-v2-ad-b0kla__pill--active` |
| **URL 동기화** | 활성 pill과 URL 쿼리 `type=consultant` \| `type=client` 가 항상 동기화됨. pill 클릭 시 해당 `type`으로 URL 갱신. |

- 배치: `ContentArea` 내부 최상단, ContentHeader 위 또는 바로 아래(설계 일관성에 따라 한 위치로 고정).
- 비주얼: CONSULTANT_CLIENT_MANAGEMENT_DESIGN_SPEC의 탭 바 규격과 동일(`mg-v2-ad-b0kla__pill-toggle`, `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active`).

### 2.3 타입별 콘텐츠

- **`type=consultant`**  
  - 기존 **상담사 관리** 콘텐츠와 동일한 구조.  
  - ContentHeader title "상담사 관리" + subtitle(기존과 동일) + action "새 상담사 등록".  
  - KPI → 검색 → 목록(및 상담사 전용 탭: 종합관리/기본관리) 등 CONSULTANT_CLIENT_MANAGEMENT_DESIGN_SPEC의 상담사 관리 레이아웃 유지.

- **`type=client`**  
  - 기존 **내담자 관리** 콘텐츠와 동일한 구조.  
  - ContentHeader title "내담자 관리" + subtitle(기존과 동일) + action "새 내담자 등록".  
  - KPI → 검색 → 탭 4개(개요/상담이력/매칭/통계) 및 탭별 콘텐츠 등 CONSULTANT_CLIENT_MANAGEMENT_DESIGN_SPEC의 내담자 관리 레이아웃 유지.

- 각 타입별 콘텐츠는 **기존 CONSULTANT_CLIENT_MANAGEMENT_DESIGN_SPEC**의 섹션 순서·클래스·비주얼을 그대로 따른다.

---

## 3. ContentHeader 규격

### 3.1 클래스

- 컨테이너: `mg-v2-content-header`
- 왼쪽: `mg-v2-content-header__title`, `mg-v2-content-header__subtitle`
- 오른쪽(액션): `mg-v2-content-header__right`

### 3.2 모드별 copy

| 모드 | title | subtitle | action |
|------|--------|-----------|--------|
| **상담사** | "상담사 관리" | "상담사의 모든 정보를 종합적으로 관리하고 분석할 수 있습니다" | "새 상담사 등록" (또는 "➕ 새 상담사 등록") |
| **내담자** | "내담자 관리" | "내담자 정보·상담 이력·매칭·통계를 종합 관리합니다" | "새 내담자 등록" (또는 "➕ 새 내담자 등록") |

- 기존 CONSULTANT_CLIENT_MANAGEMENT_DESIGN_SPEC의 ContentHeader 규격과 동일.

---

## 4. URL·상태 연동

### 4.1 초기 진입

- **`?type` 없이 접근** (`/admin/user-management`):  
  - 기본값을 **한 가지로 명시**한다. 권장: **`client`** (내담자).  
  - 즉, `?type` 없으면 `type=client`로 간주하고 내담자 pill 활성 + 내담자 콘텐츠만 렌더. (필요 시 URL을 `/admin/user-management?type=client`로 한 번 갱신해도 됨.)

### 4.2 Pill 클릭 시

- "상담사" pill 클릭 → `history` 또는 `navigate`로 `?type=consultant` 반영. 상담사 콘텐츠만 렌더.
- "내담자" pill 클릭 → `?type=client` 반영. 내담자 콘텐츠만 렌더.

### 4.3 외부 링크·북마크

- `/admin/user-management?type=consultant` 접근 → 상담사 pill 활성, 상담사 콘텐츠만 렌더.
- `/admin/user-management?type=client` 접근 → 내담자 pill 활성, 내담자 콘텐츠만 렌더.

### 4.4 요약

- URL의 `type`이 **단일 소스 of truth**. pill 선택 상태는 항상 `type` 쿼리와 동기화한다.

---

## 5. core-coder 체크리스트

- [ ] **라우트**: 단일 라우트 `/admin/user-management` 추가. 기존 `/admin/consultant-comprehensive`, `/admin/client-comprehensive` 는 **Redirect** 컴포넌트로 각각 `/admin/user-management?type=consultant`, `/admin/user-management?type=client` 로 리다이렉트.
- [ ] **메뉴**: "사용자 관리" **한 항목**만 노출. path `/admin/user-management`. 기존 "상담사 관리", "내담자 관리" 두 메뉴 항목 제거 또는 통합.
- [ ] **통합 페이지 컴포넌트**: `UserManagementPage.js` 또는 `UnifiedUserManagement.js` 로 구현. 하나의 Layout + 상단 타입 전환(pill) + 타입별 콘텐츠 렌더 담당.
- [ ] **상담사/내담자 콘텐츠 재사용**:  
  - `ConsultantComprehensiveManagement`, `ClientComprehensiveManagement` 를 **레이아웃 없이** 렌더하도록 리팩터.  
  - 예: 두 컴포넌트를 **ContentArea / AdminCommonLayout 을 감싸지 않고** 콘텐츠만 렌더하거나, props 로 `embedded: true` 시 레이아웃 미렌더.  
  - 통합 페이지가 `AdminCommonLayout` + `ContentArea` + 상단 pill + `type`에 따라 위 두 컴포넌트 중 하나만 렌더하므로, 기존 두 컴포넌트는 **콘텐츠만** 담당.
- [ ] **상단 타입 전환**: `mg-v2-ad-b0kla__pill-toggle`, pill 두 개("상담사", "내담자"), 활성 `mg-v2-ad-b0kla__pill--active`, URL `type`과 동기화.
- [ ] **ContentHeader**: 통합 페이지가 타입에 따라 title/subtitle/action을 바꾸거나, 각 타입별 콘텐츠(ConsultantComprehensiveManagement / ClientComprehensiveManagement)가 embedded 시 자체 ContentHeader를 그대로 사용하도록 설계. 최종 비주얼은 위 ContentHeader 규격과 일치.
- [ ] **대시보드·위젯·기타 링크**: 상담사/내담자 관리로 연결되던 링크를 `/admin/user-management?type=consultant`, `/admin/user-management?type=client` 로 변경.

---

**문서 끝.**  
구현 시 `docs/planning/CONSULTANT_CLIENT_UNIFIED_MANAGEMENT_REVIEW.md`, `docs/design-system/CONSULTANT_CLIENT_MANAGEMENT_DESIGN_SPEC.md`, `AdminCommonLayout`, `ContentArea`, `ContentHeader`, B0KlA pill 탭 스타일을 함께 참고하면 됩니다.
