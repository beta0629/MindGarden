# 테넌트 프로필·설정 페이지 레이아웃 아토믹 통일 오케스트레이션

**문서 버전**: 1.0  
**작성일**: 2026-03-21  
**담당**: core-planner  
**참조**: UNIFIED_LAYOUT_SPEC.md, ATOMIC_DESIGN_SYSTEM.md, LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md, 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample

---

## 1. 목표 및 배경

### 1.1 목표

테넌트 프로필·설정 관련 페이지의 **레거시 레이아웃을 아토믹 디자인(B0KlA·AdminCommonLayout·DashboardV2) 레이아웃으로 전면 수정**하여 다음을 달성한다.

- **디자인 통일**: B0KlA·unified-design-tokens 기반 일관된 비주얼
- **컴포넌트 통일**: ContentHeader, ContentArea, 섹션 블록 등 공통 컴포넌트 사용
- **레이아웃 통일**: GNB + LNB + 메인(ContentHeader + ContentArea) 구조 적용

### 1.2 배경

- 현재 테넌트 프로필·PG 설정 등 설정 관련 페이지 콘텐츠가 **아토믹 레이아웃이 아님**
- **AdminCommonLayout**은 사용 중이나, **본문(children) 내부**가 커스텀 클래스(`tenant-profile-*`, `pg-config-*` 등) 기반 레거시 구조
- ContentHeader, ContentArea, `mg-v2-content-*`, `mg-v2-ad-b0kla__*` 미사용

---

## 2. 범위

### 2.1 포함

| 구분 | 경로 | 컴포넌트 | 비고 |
|------|------|----------|------|
| 테넌트 프로필 | `/tenant/profile` | TenantProfile.js | 테넌트 상태·구독·결제 수단 탭 |
| 테넌트 설정 | `/tenant/settings` | TenantProfile.js | 동일 컴포넌트 |
| PG 설정 목록 | `/tenant/pg-configurations` | PgConfigurationList.js | 목록·필터·액션 |
| PG 설정 생성 | `/tenant/pg-configurations/new` | PgConfigurationCreate.js | PgConfigurationForm 사용 |
| PG 설정 상세 | `/tenant/pg-configurations/:id` | PgConfigurationDetail.js | 읽기 전용 |
| PG 설정 수정 | `/tenant/pg-configurations/:id/edit` | PgConfigurationEdit.js | PgConfigurationForm 사용 |
| 공유 폼 | — | PgConfigurationForm.js | 생성·수정 공통 |

### 2.2 제외

- LNB 메뉴 구조·권한(DB 기반) — 별도 작업
- 결제 수단·구독 관리 모달(SubscriptionManagement, PaymentMethodRegistration) — 이번 Phase에서는 TenantProfile 본문 블록 구조만 통일. 모달 내부는 후속 Phase

### 2.3 영향 받는 파일

| 파일 | 역할 |
|------|------|
| `frontend/src/components/tenant/TenantProfile.js` | 본문을 ContentHeader + ContentArea + 섹션 블록으로 전환 |
| `frontend/src/components/tenant/TenantProfile.css` | 레거시 클래스 → B0KlA·토큰 기반 정리 또는 삭제 |
| `frontend/src/components/tenant/PgConfigurationList.js` | ContentHeader + ContentArea + 블록 구조 적용 |
| `frontend/src/components/tenant/PgConfigurationList.css` | 레거시 → 토큰 정리 |
| `frontend/src/components/tenant/PgConfigurationCreate.js` | 본문 구조 통일 |
| `frontend/src/components/tenant/PgConfigurationDetail.js` | ContentHeader + ContentArea + 상세 블록 |
| `frontend/src/components/tenant/PgConfigurationEdit.js` | 본문 구조 통일 |
| `frontend/src/components/tenant/PgConfigurationForm.js` | 섹션 블록 내 폼 스타일 통일 |
| `frontend/src/components/tenant/PgConfigurationForm.css` | 토큰·B0KlA 적용 |

---

## 3. 현황 (레거시 vs 아토믹)

### 3.1 레이아웃 비교

| 항목 | 현재(레거시) | 목표(아토믹) |
|------|-------------|--------------|
| 래퍼 | AdminCommonLayout ✓ | AdminCommonLayout 유지 |
| 본문 구조 | `tenant-profile`, `tenant-profile-header`, `tenant-profile-tabs` 등 커스텀 div | ContentHeader + ContentArea + 섹션 블록 |
| 헤더 | `tenant-profile-header` (커스텀) | ContentHeader (mg-v2-content-header) |
| 본문 영역 | `tenant-profile-content`, `tenant-profile-overview` | ContentArea (mg-v2-content-area) + 섹션 블록 |
| 탭 | `tenant-profile-tabs`, `tenant-profile-tab` (커스텀 버튼) | 공통 탭 컴포넌트 또는 B0KlA 탭 스펙 |
| 카드/블록 | `tenant-info-card`, `tenant-info-grid` | 섹션 블록(mg-v2-*), B0KlA 카드 |
| 폼 | `PgConfigurationForm` 내부 커스텀 div | 섹션 블록 내 폼, 토큰 적용 |

### 3.2 LNB 메뉴 (설정 하위)

| menu_code | 메뉴명 | menu_path | sort_order |
|-----------|--------|-----------|------------|
| ADM_SETTINGS_TENANT | 테넌트 프로필 | /tenant/profile | 1 |
| ADM_SETTINGS_SYSTEM | 시스템 설정 | /admin/system-config | 2 |
| ADM_SETTINGS_CODES | 공통코드 | /admin/common-codes | 3 |
| ADM_SETTINGS_PG | PG 설정 | /tenant/pg-configuration → /tenant/pg-configurations | 4 |

### 3.3 참조 스펙·문서

- `docs/design-system/UNIFIED_LAYOUT_SPEC.md` — ContentHeader, ContentArea, 섹션 블록 배치
- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md` — 아토믹 계층
- `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` — 반응형
- `frontend/src/components/dashboard-v2/content/ContentHeader.js`, `ContentArea.js` — 기존 구현

---

## 4. 의존성 및 순서

1. **선행**: explore 인벤토리(Phase 0) — tenant·PG 설정 컴포넌트 목록·클래스 사용 현황
2. **설계**: core-designer — B0KlA·아토믹 기준 UI·UX·비주얼 스펙
3. **컴포넌트**: core-component-manager — 중복·적재적소 배치 제안 (Phase 1과 병렬 가능)
4. **퍼블리싱**: core-publisher — 설계 스펙 기반 HTML 마크업 (Phase 1 결과 의존)
5. **구현**: core-coder — publisher HTML → JSX·스타일 연동
6. **검증**: core-tester — 회귀·스모크·콘솔 오류 0건

---

## 5. Phase 목록 및 분배실행

### Phase 0: 인벤토리 (탐색)

**담당**: `explore`

**목표**: 테넌트·PG 설정 관련 컴포넌트·클래스·스타일 사용 현황 정리.

**호출 시 전달할 프롬프트**:
```
테넌트 프로필·설정 페이지 레이아웃 통일을 위한 인벤토리를 수행해 주세요.

범위: frontend/src/components/tenant/
목적:
1. TenantProfile, PgConfigurationList, PgConfigurationDetail, PgConfigurationCreate, PgConfigurationEdit, PgConfigurationForm의 현재 DOM 구조·클래스 사용 목록
2. ContentHeader, ContentArea 사용 여부
3. tenant-profile-*, pg-config-* 등 레거시 클래스 목록
4. mg-v2-*, mg-v2-ad-b0kla__* 등 아토믹/B0KlA 클래스 사용 여부
5. 참조: docs/design-system/UNIFIED_LAYOUT_SPEC.md

산출: 마크다운 요약(컴포넌트별 구조·클래스 목록, 레거시 vs 아토믹 구분)
```

**산출물**: `docs/project-management/attachments/SETTINGS_PAGES_LAYOUT_INVENTORY_YYYYMMDD.md`

---

### Phase 1: 디자인 스펙 (설계)

**담당**: `core-designer`  
**의존성**: Phase 0 결과(선택, 없으면 기획서 기반)

**목표**: B0KlA·아토믹 기준 테넌트 프로필·PG 설정 페이지 UI·UX·비주얼 스펙 정리.

**호출 시 전달할 프롬프트**:
```
테넌트 프로필·PG 설정 페이지를 아토믹 디자인(B0KlA) 레이아웃으로 통일하기 위한 화면설계 스펙을 작성해 주세요.

대상 페이지:
- /tenant/profile (테넌트 프로필: 개요·구독 관리·결제 수단 탭)
- /tenant/pg-configurations (PG 설정 목록)
- /tenant/pg-configurations/new (PG 설정 생성)
- /tenant/pg-configurations/:id (PG 설정 상세)
- /tenant/pg-configurations/:id/edit (PG 설정 수정)

요구사항 (§0.4 참조):
1. 사용성: ADMIN/STAFF가 테넌트 정보·구독·결제·PG 설정을 확인·관리하는 흐름. 자주 쓰는 동작(개요 보기, PG 목록) 배치.
2. 정보 노출 범위: 테넌트 ID, 이름, 업종, 상태, 구독 요금제, 결제 수단, PG 설정 목록·상세·폼 필드. 민감 정보(API Key 등) 마스킹 유지.
3. 레이아웃: AdminCommonLayout children으로 ContentHeader + ContentArea. 탭은 개요/구독/결제. 목록은 필터 + 테이블 또는 카드 그리드. 상세·폼은 섹션 블록.

참조:
- docs/design-system/UNIFIED_LAYOUT_SPEC.md (ContentHeader, ContentArea, 섹션 블록)
- docs/design-system/ATOMIC_DESIGN_SYSTEM.md
- mindgarden-design-system.pen B0KlA
- 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample
- frontend/src/styles/unified-design-tokens.css

산출: 화면별 레이아웃·블록 구성·클래스명·디자인 토큰 명세. 코드 작성 없음.
```

**산출물**: `docs/design-system/SCREEN_SPEC_TENANT_SETTINGS_LAYOUT.md`

---

### Phase 1-B: 컴포넌트 분석 (병렬 가능)

**담당**: `core-component-manager`  
**병렬**: Phase 1과 동시 호출 가능

**목표**: tenant·PG 설정 페이지에서 사용 중인 컴포넌트의 중복·적재적소 배치 제안.

**호출 시 전달할 프롬프트**:
```
테넌트 프로필·PG 설정 페이지(frontend/src/components/tenant/)의 컴포넌트 구조를 분석하고, 아토믹 레이아웃 통일 시 재사용·적재적소 배치를 제안해 주세요.

확인 항목:
1. tenant-profile-header, tenant-profile-tabs 등 — ContentHeader, 공통 탭 컴포넌트로 치환 가능 여부
2. tenant-info-card, pg-config-* 카드 — 섹션 블록(mg-v2-*) 또는 공통 카드 컴포넌트와 중복 여부
3. PgConfigurationForm — MGForm, MGFilter 등 공통 모듈 사용 가능 여부
4. docs/standards/COMMON_MODULES_USAGE_GUIDE.md, /core-solution-common-modules 참조

산출: 중복 목록·치환 제안서. 코드 직접 작성 없음.
```

**산출물**: `docs/project-management/attachments/SETTINGS_PAGES_COMPONENT_ANALYSIS_YYYYMMDD.md`

---

### Phase 2: 퍼블리싱 (HTML 마크업)

**담당**: `core-publisher`  
**의존성**: Phase 1(디자인 스펙) 결과

**목표**: Phase 1 스펙 기반 아토믹·BEM HTML 마크업 제안.

**호출 시 전달할 프롬프트**:
```
테넌트 프로필·PG 설정 페이지를 docs/design-system/SCREEN_SPEC_TENANT_SETTINGS_LAYOUT.md 스펙에 따라 HTML 마크업으로 작성해 주세요.

대상: TenantProfile(개요·구독·결제 탭), PgConfigurationList, PgConfigurationDetail, PgConfigurationCreate/Edit(폼)
규칙: 아토믹 디자인, BEM, mg-v2-*, mg-v2-ad-b0kla__* 클래스. ContentHeader, ContentArea 구조.
참조: /core-solution-publisher, /core-solution-atomic-design
산출: HTML 블록(또는 JSX 구조 설명). JS/React·CSS 수정 없음.
```

**산출물**: `docs/design-system/TENANT_SETTINGS_LAYOUT_MARKUP.md` 또는 퍼블리셔 지정 형식

---

### Phase 3: 구현 (코드)

**담당**: `core-coder`  
**의존성**: Phase 1 + Phase 2 결과

**목표**: Phase 1 스펙 + Phase 2 HTML(마크업)을 기준으로 JSX·스타일·로직 연동.

**호출 시 전달할 프롬프트**:
```
테넌트 프로필·PG 설정 페이지를 아토믹 레이아웃으로 전면 수정해 주세요.

대상 파일:
- frontend/src/components/tenant/TenantProfile.js, TenantProfile.css
- frontend/src/components/tenant/PgConfigurationList.js, PgConfigurationList.css
- frontend/src/components/tenant/PgConfigurationDetail.js
- frontend/src/components/tenant/PgConfigurationCreate.js, PgConfigurationEdit.js
- frontend/src/components/tenant/PgConfigurationForm.js, PgConfigurationForm.css

요구:
1. AdminCommonLayout children을 ContentHeader + ContentArea + 섹션 블록 구조로 변경
2. ContentHeader, ContentArea는 frontend/src/components/dashboard-v2/content/ 에서 import
3. 레거시 클래스(tenant-profile-*, pg-config-*) → mg-v2-*, B0KlA·토큰 기반으로 치환
4. docs/design-system/SCREEN_SPEC_TENANT_SETTINGS_LAYOUT.md, TENANT_SETTINGS_LAYOUT_MARKUP.md 참조
5. /core-solution-frontend, /core-solution-atomic-design, docs/standards/COMMON_MODULES_USAGE_GUIDE.md 적용
6. SafeText, toDisplayString, toSafeNumber 등 safeDisplay 패턴 유지(COMMON_DISPLAY_BOUNDARY_MEETING_20260322)

완료 기준:
- /tenant/profile, /tenant/pg-configurations, /tenant/pg-configurations/new, /tenant/pg-configurations/:id, /tenant/pg-configurations/:id/edit 모두 ContentHeader + ContentArea 구조
- 레거시 tenant-profile-*, pg-config-* 클래스 제거 또는 최소화
- 콘솔 오류 0건, 기존 기능 동작 유지
```

**산출물**: 수정된 JS/CSS 파일, PR

---

### Phase 4: 검증 (테스트)

**담당**: `core-tester`  
**의존성**: Phase 3(코드 변경) 완료

**목표**: 역할별 스모크·회귀·React #130 0건 확인.

**호출 시 전달할 프롬프트**:
```
테넌트 프로필·PG 설정 페이지 레이아웃 통일 후 회귀·스모크 테스트를 수행해 주세요.

대상 경로:
- /tenant/profile (ADMIN/STAFF)
- /tenant/settings (동일)
- /tenant/pg-configurations
- /tenant/pg-configurations/new
- /tenant/pg-configurations/:id
- /tenant/pg-configurations/:id/edit

확인 항목:
1. 각 페이지 로드·렌더링 정상
2. 탭 전환(개요/구독/결제) 동작
3. PG 설정 목록·필터·등록·상세·수정 플로우
4. 콘솔 React #130 (Objects are not valid as React child) 0건
5. 반응형(모바일·태블릿) 레이아웃 정상
6. /core-solution-testing 스킬 적용
```

**산출물**: 테스트 결과 요약, 이슈 목록(있을 경우)

---

## 6. 회의·분배 계획

### 6.1 회의 순서

| 순서 | 단계 | 담당 | 산출 |
|------|------|------|------|
| 1 | 기획 | core-planner | 본 문서 |
| 2 | 인벤토리 | explore | SETTINGS_PAGES_LAYOUT_INVENTORY_*.md |
| 3 | 설계·컴포넌트 | core-designer, core-component-manager | SCREEN_SPEC, COMPONENT_ANALYSIS (병렬) |
| 4 | 협의 | core-planner | 스펙·제안서 합의 |
| 5 | 퍼블리싱 | core-publisher | HTML 마크업 |
| 6 | 구현 | core-coder | JS/CSS 수정 |
| 7 | 검증 | core-tester | 회귀·스모크 결과 |

### 6.2 서브에이전트 역할 분배 요약

| Phase | subagent_type | 적용 스킬 |
|-------|---------------|-----------|
| 0 | explore | — |
| 1 | core-designer | /core-solution-atomic-design, /core-solution-standardization |
| 1-B | core-component-manager | /core-solution-encapsulation-modularization, /core-solution-common-modules |
| 2 | core-publisher | /core-solution-publisher, /core-solution-atomic-design |
| 3 | core-coder | /core-solution-frontend, /core-solution-atomic-design |
| 4 | core-tester | /core-solution-testing |

---

## 7. 마이그레이션 단계 (Phase 1~N)

| Phase | 범위 | 설명 |
|-------|------|------|
| Phase 1 | TenantProfile | 테넌트 프로필(/tenant/profile, /tenant/settings) 본문을 ContentHeader + ContentArea + 탭·섹션 블록으로 전환 |
| Phase 2 | PgConfigurationList | PG 설정 목록 페이지 구조 통일 |
| Phase 3 | PgConfigurationDetail | PG 설정 상세 페이지 구조 통일 |
| Phase 4 | PgConfigurationCreate/Edit + Form | PG 설정 생성·수정·폼 컴포넌트 구조 통일 |
| (선택) Phase 5 | 모달·하위 컴포넌트 | SubscriptionManagement, PaymentMethodRegistration 등 모달 내부 스타일 통일 |

구현 Phase(Phase 3)에서는 위 Phase 1~4를 한 번에 처리하거나, 파일 단위로 순차 진행 가능. 코더 호출 시 범위를 명시.

---

## 8. 체크리스트

### 8.1 통일 대상 페이지 목록

- [ ] /tenant/profile
- [ ] /tenant/settings (TenantProfile 동일)
- [ ] /tenant/pg-configurations
- [ ] /tenant/pg-configurations/new
- [ ] /tenant/pg-configurations/:id
- [ ] /tenant/pg-configurations/:id/edit

### 8.2 완료 기준

- [ ] 모든 대상 페이지가 ContentHeader + ContentArea 구조 사용
- [ ] 레거시 tenant-profile-*, pg-config-* 클래스 제거 또는 B0KlA·토큰으로 치환
- [ ] unified-design-tokens.css, B0KlA 클래스 준수
- [ ] 반응형 동작 정상
- [ ] core-tester 회귀·스모크 통과
- [ ] 콘솔 React #130 0건

### 8.3 회의·산출물 마일스톤

| 마일스톤 | 일정(예시) | 산출물 |
|----------|------------|--------|
| M1 | D+0 | 본 오케스트레이션 문서 |
| M2 | D+1 | Phase 0 인벤토리 |
| M3 | D+2 | Phase 1·1-B 설계·컴포넌트 분석 |
| M4 | D+3 | Phase 2 퍼블리싱 마크업 |
| M5 | D+5 | Phase 3 구현 PR |
| M6 | D+6 | Phase 4 검증 완료 |

---

## 9. 리스크·제약

- **기존 기능 유지**: 레이아웃 변경 시 구독·결제·PG CRUD 동작 회귀 없어야 함
- **세션·인증**: TenantProfile은 tenantId 없으면 리다이렉트. ProtectedRoute 적용 여부 확인
- **COMMON_DISPLAY_BOUNDARY**: SafeText, toDisplayString, toSafeNumber 등 기존 safeDisplay 패턴 유지

---

## 10. 실행 요청문

**다음 순서로 서브에이전트를 호출해 주세요.**

1. **Phase 0**: `explore` — tenant·PG 설정 컴포넌트 인벤토리
2. **Phase 1**: `core-designer` — B0KlA·아토믹 기준 화면설계 스펙 (Phase 0 완료 후 또는 병렬)
3. **Phase 1-B**: `core-component-manager` — 중복·적재적소 제안 (Phase 1과 병렬 가능)
4. **Phase 2**: `core-publisher` — Phase 1 스펙 기반 HTML 마크업
5. **Phase 3**: `core-coder` — Phase 1+2 결과 기반 JS/React·스타일 구현
6. **Phase 4**: `core-tester` — 회귀·스모크·콘솔 오류 0건 검증

각 Phase 호출 시 위 **"호출 시 전달할 프롬프트"**를 해당 서브에이전트에 전달한다. 결과는 기획(core-planner)에게 보고받아 사용자에게 최종 요약 전달한다.

---

*본 문서는 core-planner 오케스트레이션 산출물이다. 코드·디자인 직접 수정은 해당 서브에이전트에 위임한다.*
