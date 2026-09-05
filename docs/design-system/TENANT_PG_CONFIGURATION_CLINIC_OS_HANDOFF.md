# 센터 PG 설정 Clinic-OS UI/UX 스펙 (Design Handoff)

**대상**: `/tenant/pg-configurations` (+ `/new`, `/:id`, `/:id/edit`)  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md` + MappingManagement Clinic-OS  
**트윈**: `MappingManagementPage` (`mapping-management--clinic-os`), `MappingListBlock` stage, `MappingKpiSection` summary strip  
**범위**: Frontend chrome only. 비즈니스 로직·API·라우트 path·금액/승인 계산 **변경 금지**.  
**작성**: core-planner 오케스트레이션 → core-designer 스펙 형식 (**Task 스폰 불가** 환경에서 기획이 스펙 문서화; `/core-solution-design-handoff` 준수)  
**OUT OF SCOPE**: `/admin/ops/pg-approval`, BE APIs, Flyway, ops home

---

## 0. 사용자 관점

| 항목 | 내용 |
|------|------|
| **사용성** | 센터 운영자(ADMIN/테넌트)가 PG 설정을 목록→등록→상세→(승인대기 시)수정. 헤더 CTA「새 PG 설정」이 유일한 primary. 자주 쓰는 동작(상세·연결테스트·수정·삭제)은 카드/상세 툴바에 유지. |
| **정보 노출** | 기존 필드·마스킹·키 복호화 흐름 유지. UI 제목·라벨은 **한국어**. 영문 코드키(`Content-Type`, `Version`, `PORTONE_SETTINGS_KEY_*`)는 제목으로 쓰지 않음 — 값은 코드/메타로만 표시. |
| **레이아웃** | quiet header → (목록만) optional 3-cell summary strip → filters → **single stage card**. Create/Edit/Detail도 ContentArea + ContentHeader + stage. 좌측 4px accent·B0KlA·Pencil 금지. |

---

## 1. 개요 및 배경

구 Pencil/B0KlA 스킨(`AdminDashboardB0KlA.css`, `mg-v2-ad-b0kla*`, ActionBarButton primary, hex 배지)이 Clinic-OS와 불일치한다. 본 작업은 **크롬만** Admin Dashboard V2 / Clinic-OS 토큰·패턴에 정렬한다. API·라우트·폼 검증·승인 상태 머신 **기능 유지**.

**버그 동시 수정**: Edit/Detail `useParams()`가 `configId`를 읽지만 라우트는 `:id` → `id`로 읽고 변수명만 `configId`로 유지(또는 `const { id: configId }`).

---

## 2. 레이아웃 구조 (위→아래)

### 2.1 List (`PgConfigurationList`)

```
AdminCommonLayout
└─ ContentArea (.mg-v2-pg-config-list.pg-config-list--clinic-os)
   ├─ ContentHeader (quiet) — title + MGButton solid primary「새 PG 설정」
   ├─ (optional) summary strip 3-cell — 전체 / 승인 대기 / 활성 (목록 데이터 파생, API 추가 금지)
   ├─ filters (search + status selects + 새로고침 MGButton secondary)
   └─ stage card (.pg-config-list__stage)
      └─ empty | cards grid (기존 카드 상호작용 유지)
```

### 2.2 Create / Edit

```
AdminCommonLayout
└─ ContentArea (.mg-v2-pg-config-create|--edit .pg-config-*--clinic-os)
   ├─ ContentHeader (quiet)
   └─ stage card (.pg-config-form-stage)
      └─ PgConfigurationForm
```

**금지**: `mg-v2-ad-b0kla` / `__container` 래퍼.

### 2.3 Detail

```
AdminCommonLayout
└─ ContentArea (.mg-v2-pg-config-detail.pg-config-detail--clinic-os)
   ├─ ContentHeader + header actions (MGButton only)
   └─ stage / sections (단일 stage 또는 section 카드 — border-left none, Clinic-OS tokens)
```

---

## 3. 세부 UI/UX 스펙

### 3.1 Quiet header

- **컴포넌트**: `ContentHeader` 유지.
- **List Primary CTA**: `ActionBarButton` → **`MGButton` variant="primary"** (dusty teal).
- **토큰**: fill `var(--mg-v2-color-primary-solid)`, hover `var(--mg-v2-color-primary-dark)`. 높이 `var(--button-height-sm)`.
- **금지**: `--ad-b0kla-green`, forest `#3D5246`, page hex.

### 3.2 Summary strip (List only, optional)

- 목록 `configurations`에서 파생: 전체 / 승인 대기(`approvalStatus===PENDING`) / 활성(`status===ACTIVE` 또는 `APPROVED`+ACTIVE — 기존 status enum 기준 ACTIVE).
- 패턴: MappingKpiSection 3-cell (`mapping-management-summary` 기하 참고) — **아이콘 타일·lucide KPI·좌측 accent 금지**.
- 클릭 필터는 **선택**: 있으면 기존 filter state만 갱신(API 추가 없음). 없으면 표시만.

### 3.3 Main stage

- `.pg-config-list__stage` / form stage:  
  `min-height: 36rem`,  
  `border: 1px solid var(--mg-v2-color-neutral-300)`,  
  `background: var(--mg-v2-color-neutral-50)`,  
  `border-radius: var(--mg-v2-radius-lg)`,  
  `border-left: none !important`.
- Form: `max-width: 800px` 좁은 카드 해제 → stage 안에서 full content width (또는 `min(100%, var(--container-lg))`).

### 3.4 Typography (4-step only)

- h1 `var(--mg-v2-font-size-h1)` 1.75rem  
- h2 `var(--mg-v2-font-size-h2)` 1.375rem  
- body `var(--mg-v2-font-size-body-md)` 0.875rem  
- caption `var(--mg-v2-font-size-caption)` 0.75rem  
- text: `--mg-v2-color-text-primary` / secondary

### 3.5 Detail chrome

- status-badge hex (`#155724`, `#e2e3e5`, `#357abd` 등) → semantic/neutral tokens.
- history-item `border-left` accent → `border-left: none` + hairline border 전체.
- key-copy hover `#357abd` → `var(--mg-v2-color-primary-dark)`.

### 3.6 Form Korean titles

| Before (UI title) | After |
|-------------------|--------|
| `Content-Type` (dt) | 콘텐츠 유형 |
| `Version` (dt) | 버전 |
| `{PORTONE_SETTINGS_KEY_WEBHOOK_SECRET} (선택)` label | 웹훅 시크릿 (선택) |
| help 내 raw key span | 보조 설명에만 코드 표기 유지 가능, **라벨은 한국어** |
| `mg-v2-ad-b0kla-info-box` | Clinic-OS info surface (`pg-config-form__info` + `--mg-v2-*`) |

값(`application/json` 등)은 그대로 SafeText.

### 3.7 Modals

- UnifiedModal `className="mg-v2-ad-b0kla"` 제거.
- 삭제 확인: `MGButton` outline/secondary + danger (ActionBarButton 제거 권장).

### 3.8 Import 제거

- List/Create/Edit/Detail에서 **`AdminDashboardB0KlA.css` import 제거**.
- 페이지 스코프 `*--clinic-os` 클래스 부여(테스트 락).

### 3.9 사용 토큰 목록

| 역할 | 토큰 |
|------|------|
| text | `--mg-v2-color-text-primary`, `--mg-v2-color-text-secondary` |
| primary CTA | `--mg-v2-color-primary-solid`, `--mg-v2-color-primary-dark` |
| page/surface | `--mg-v2-color-neutral-50`, `--mg-v2-color-neutral-100` |
| hairline | `--mg-v2-color-neutral-300` |
| success/warn/error | `--mg-v2-color-semantic-*` / 기존 mg-v2 semantic |
| type | `--mg-v2-font-size-h1\|h2\|body-md\|caption` |
| space/radius | `--mg-v2-space-*`, `--mg-v2-radius-md\|lg` |
| button height | `--button-height-sm` |

**금지**: hex 리터럴, `--ad-b0kla-*`, Pencil accent bar.

### 3.10 아토믹·공통 모듈

| 계층 | 재사용 |
|------|--------|
| Atoms | `MGButton`, `SafeText`, `StatusBadge`(가능 시), `KpiNumeral`(strip 시) |
| Molecules | summary strip 패턴 (Mapping 참고) |
| Organisms | 기존 Form/List/Detail (리스킨) |
| Template | `AdminCommonLayout` + `ContentArea`/`ContentHeader` + `UnifiedModal` |

신규 공통 모듈 불필요.

---

## 4. 상호작용·상태

| 상태 | 동작 |
|------|------|
| 목록 필터·검색·CRUD·연결테스트 | **변경 없음** |
| Empty | 이모지 과다 금지; empty CTA = `MGButton` primary |
| Loading | 기존 AdminCommonLayout loading |
| 모달 | 로직 유지; B0KlA class 제거 |
| Edit/Detail params | `id` ← route `:id` |

---

## 5. 코더 완료 조건 (체크리스트)

- [ ] in-scope 파일에서 `AdminDashboardB0KlA.css` / `mg-v2-ad-b0kla` 제거
- [ ] ContentArea `*--clinic-os` + ContentHeader + MGButton primary header CTA
- [ ] List stage Clinic-OS geometry; Form stage 동일 계열
- [ ] Detail/List CSS hex → tokens; accent border-left 제거
- [ ] 한국어 UI 제목 (Content-Type/Version/PORTONE key 라벨)
- [ ] `useParams` `id` 수정 (Edit/Detail)
- [ ] API/라우트 path/비즈니스 로직 무변경
- [ ] `PgConfiguration.clinicOsChrome.test.js` (Mapping 패턴)
- [ ] hardcoding gate §17 / SETTINGS §1.3

---

## 6. 참조

- `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`
- `docs/design-system/MAPPING_MANAGEMENT_CLINIC_OS_HANDOFF.md`
- `frontend/src/components/admin/mapping-management/__tests__/MappingManagement.clinicOsChrome.test.js`
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17
- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
- 스킬: `/core-solution-design-handoff`, `/core-solution-atomic-design`, `/core-solution-common-modules`, `/core-solution-frontend`
