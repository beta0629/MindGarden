# Clinic-OS Ops Shell Phase 1 UI/UX 스펙 (Design Handoff)

**대상**: Ops-only shell (slate LNB + quiet header + paper stage) · LNB 1차 IA · PG 승인 크롬  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`  
**테넌트 본문 (main)**: `docs/design-system/OPS_TENANTS_CORE_CLINIC_OS_HANDOFF.md` — **Layout+Critic PASS · 테넌트 = main body**  
**크롬 패턴 참조**: `docs/design-system/OPS_APPROVAL_CENTER_CLINIC_OS_HANDOFF.md` (quiet header + stage twin; **해당 문서의 PG file diff 0 조항은 승인 센터 작업용** — 본 Phase는 Ops PG **크롬만** 정렬)  
**경계 참조**: `docs/design-system/TENANT_PG_CONFIGURATION_CLINIC_OS_HANDOFF.md` (센터 PG — **본 Phase에서 센터 PG UI 재작업 금지**)  
**브랜치 컨텍스트**: `cursor/clinic-os-ops-shell-phase1-06c5` (구현은 core-coder)  
**작성**: core-designer · `/core-solution-design-handoff` · `/core-solution-atomic-design` · `/core-solution-encapsulation-modularization`  
**범위**: Frontend chrome / layout / IA / CTA 시각 계약만. **PG 비즈니스 로직·승인 API·마스킹 알고리즘·Confirm 게이트 동작 변경 금지** (#919 유지).

---

## 0. 사용자 관점

| 항목 | 내용 |
|------|------|
| **사용성** | **Ops만**. LNB로 **테넌트(main) / PG 승인 / 현황(summary)** 이동. 테넌트 = center cards 본체. PG = 목록 → **승인 검토** 또는 **거부 검토** → summary Confirm → 확정. |
| **정보 노출** | 현황 = **pending count만** (대시보드 KPI·장부·스케줄 덤프 금지). PG 마스킹·Confirm 게이트는 **#919 유지**. 테넌트 정보 계층은 tenants core 핸드오프. |
| **레이아웃** | slate LNB + quiet header + paper stage. **과밀 금지** (1차 메뉴 3개, 아이콘 그리드·스프라이트·좌측 4px accent 없음). |

---

## 1. 개요·배경

Ops 포털·메인 FE Ops PG 화면이 sticky top horizontal nav / 레거시 카드 스킨으로 Clinic-OS와 어긋난다. Phase 1은 **ops-only shell + LNB IA + PG 승인 크롬 계약**을 맞추고, **테넌트는 slot이 아니라 main body**다(상세 UX: tenants core 핸드오프). 새 팔레트·B0KlA·Pencil·풀 ops 대시보드(장부·스케줄·급여 이식) **금지**.

**LNB 순서 갱신 (Must-ship)**: 기존 핸드오프의 **현황 → PG 승인 → 테넌트(slot)** 는 **폐기**. 확정 순서 = **테넌트 · PG 승인 · 현황**.

---

## 2. OUT OF SCOPE (명시)

| 항목 | 이유 |
|------|------|
| Center LNB · `/tenant/pg-configurations` (+ `/new`, `/:id`, `/:id/edit`) | **#919 완료** — 본 Phase 재작업 금지 (패턴·경계만 참조) |
| 장부·급여·통합스케줄 ops 이식 | Must-ship: Do NOT port into ops |
| 새 디자인 시스템 / Pencil / B0KlA / forest `#3D5246` primary | SSOT 위반 |
| OPS_APPROVAL 문서 범위의 PG **비즈니스 로직** 변경 | chrome만 허용 |
| 구어체 카피 (예: 「손볼」) | 금지 |
| 테넌트 카드를 rushed placeholder로 대체 | tenants core = 본체 UX 필수 |

---

## 3. 레이아웃 트리 (위→아래)

### 3.1 Ops Shell (공통 골격)

```
OpsShell (ops-only)
├─ LNB (.mg-v2-desktop-lnb 계열 / slate)
│    background: var(--mg-v2-color-surface-sidebar)  /* #0F172A 참고 */
│    width: 260px (DesktopLnb twin)
│    items (확정 순서): 테넌트 · PG 승인 · 현황
└─ Main column
   ├─ Quiet header (페이지별 h1 + optional ghost 1개)
   ├─ (optional) Summary strip — 테넌트 strip3 / 현황 pending count; PG는 목록 상단 strip 최소화
   └─ Paper stage (.ops-shell__stage / PG는 .ops-approval__stage twin)
        border 1px var(--mg-v2-color-neutral-300)
        bg var(--mg-v2-color-neutral-50)
        radius var(--mg-v2-radius-lg) 또는 stage twin의 radius-md 정합
        min-height ~36rem
        border-left: none !important
```

### 3.2 테넌트 (main body)

```
Quiet header — h1「테넌트」· topbar product「ops · 테넌트 격리」
└─ strip3 (전체 · 운영중 · 정지)
└─ search/filter
└─ stage → center cards
   — 전문 스펙: docs/design-system/OPS_TENANTS_CORE_CLINIC_OS_HANDOFF.md
   — slot/placeholder 아님
```

### 3.3 PG 승인 (메인 FE · frontend-ops 동일 크롬)

```
Quiet header — h1「PG 승인」+ ghost「새로고침」(primary 두 개 금지)
└─ stage
   ├─ filters (검색·센터 ID — 기존 필드 유지, 크롬만 토큰화)
   └─ list (카드 또는 테이블 — 기존 상호작용 유지)
      row/card actions:
        · 상세보기 (ghost/secondary)
        · 연결 시험 (ghost/secondary)
        · 승인 검토 (solid primary teal)
        · 거부 검토 (warn outline — muted brick border)
```

Confirm flow (#919 **유지**): 검토 폼 → summary ConfirmModal → 확정 API.

### 3.4 현황 (summary)

```
Quiet header — h1「현황」
└─ stage
   └─ pending count summary only (숫자 + caption「승인 대기」등)
      — KPI 그리드·차트·장부 위젯 금지
```

---

## 4. LNB IA (Phase 1 · 과밀 금지)

| # | 라벨 | 경로 (계약) | 상태 |
|---|------|-------------|------|
| 1 | **테넌트** | frontend-ops `/tenants` 등 | **main body** — cards UX (`OPS_TENANTS_CORE_CLINIC_OS_HANDOFF.md`) |
| 2 | PG 승인 | Main FE: `/admin/ops/pg-approval` · frontend-ops: `/pg-approval` | 본 Phase chrome |
| 3 | 현황 | ops home / dashboard 자리 | **summary** — pending count만 |

**폐기**: 구 순서(현황 → PG 승인 → 테넌트 slot). 구현 IA 상수·LNB 렌더도 본 표에 맞출 것.

**금지 (LNB)**: 온보딩·요금제·Feature Flag·장부·급여 등 Phase 1 1차 메뉴 추가.  
**frontend-ops 전환**: 현재 `layout__header` sticky + horizontal `layout__nav` → **slate LNB + quiet content**. 로그인 등 public path는 기존과 같이 shell 밖.

**LNB 트윈**: `DesktopLnb` (`.mg-v2-desktop-lnb`, `--mg-v2-color-surface-sidebar`). 신규 LNB organism 발명 금지 — 재사용·얇은 ops wrapper만.

---

## 5. Quiet header / Stage 토큰표

| 역할 | 토큰 / 규칙 | 트윈 |
|------|-------------|------|
| LNB 배경 | `var(--mg-v2-color-surface-sidebar)` | `DesktopLnb` |
| LNB on-fill | `var(--mg-v2-color-text-on-sidebar-active)` | DesktopLnb |
| Page / paper | `var(--mg-v2-color-neutral-50)` | Clinic-OS stage |
| Surface strip | `var(--mg-v2-color-neutral-100)` 또는 summary twin surface | `OpsApprovalSummaryStrip` |
| Hairline | `var(--mg-v2-color-neutral-300)` | `.ops-approval__stage` |
| Text primary / secondary | `--mg-v2-color-text-primary` / `--mg-v2-color-text-secondary` | SSOT §B |
| Quiet h1 | `--mg-v2-font-size-h1` · weight 700 | `OpsApprovalQuietHeader` / `SalaryQuietHeader` |
| Body / caption | `--mg-v2-font-size-body-md` / `--mg-v2-font-size-caption` | 4단계만 |
| Space / radius | `--mg-v2-space-*`, `--mg-v2-radius-md`/`lg` | ErpPageShell / stage |
| Stage min-height | `36rem` (승인 센터 twin) | `.ops-approval__stage` |
| Shell 배치 | `ErpPageShell` (headerSlot + children) 패턴 | salary / ops-approval |
| 테넌트 카드 CTA h=36 | `var(--mg-v2-space-9)` 또는 twin `var(--mg-spacing-36)` | tenants core |

**금지**: hex 리터럴 신규, `--ops-color-*`를 Clinic-OS primary로 유지, `--ad-b0kla-*`, 좌측 4px accent, ContentHeader를 Ops quiet 자리에 강제(트윈이 QuietHeader면 그쪽 재사용).

---

## 6. PG 승인·거부 CTA 시각 계약

| CTA | 라벨 (통일) | 시각 | 토큰 | 비고 |
|-----|-------------|------|------|------|
| 승인 검토 | **「승인 검토」** | `MGButton` **solid primary** | fill `var(--mg-v2-color-primary-solid)` · hover `var(--mg-v2-color-primary-dark)` · label paper/on-solid | 페이지당 solid primary **하나** 원칙 — 행 CTA는 동일 variant |
| 거부 검토 | **「거부 검토」** | **warn / outline** — fill 없음 · **muted brick border** | border·text: `var(--mg-v2-color-semantic-error)` (muted brick) · bg transparent 또는 `var(--mg-v2-color-semantic-error-light)` 8–12% wash 선택 | **solid danger 금지** (danger fill = 삭제만, SSOT) |
| 상세보기 / 연결 시험 / 새로고침 | 기존 상수 | ghost / secondary | slate text + hairline | |
| Confirm 승인 확정 | 「승인 확정」 등 #919 | ConfirmModal primary | teal solid | 게이트 **유지** |
| Confirm 거부 확정 | 「거부 확정」 등 #919 | ConfirmModal danger/warn | 기존 게이트 **유지** | |

### 6.1 카피 정렬 (chrome · 상수만)

현재 `REJECT: '거부'` (main `pgApproval.js` · frontend-ops `pgApproval.ts` · locale) → **목록/행 CTA 라벨을 「거부 검토」로 통일**.  
Confirm 제목·확정 버튼(「거부 확인」「거부 확정」)은 #919 의미 유지 가능 — **검토 단계 라벨만** 「거부 검토」로 맞출 것.  
구현 시 상수 키 예: `REVIEW_REJECT: '거부 검토'` (또는 `REJECT` 값 교체). **API·상태 enum 변경 아님**.

### 6.2 frontend-ops vs Main FE — 공통 / 차이

| | 공통 (Phase 1 계약) | 차이 (허용) |
|--|---------------------|-------------|
| Shell | slate LNB + quiet header + paper stage | 앱 루트: main=`AdminCommonLayout`/ops layout · ops=`frontend-ops` Next layout |
| 토큰 | **`--mg-v2-*`만** (ops 로컬 `--ops-color-*` primary 폐기 방향; PG 페이지 스코프부터) | ops 레거시 페이지(온보딩 등)는 Phase 1 미대상이면 잔존 가능 |
| LNB 순서 | **테넌트 · PG 승인 · 현황** | URL만 앱별 |
| PG 경로 | 동일 IA 라벨「PG 승인」 | URL: `/admin/ops/pg-approval` vs `/pg-approval` |
| 테넌트 | 동일 cards/크롬 계약 | 상세: `OPS_TENANTS_CORE_CLINIC_OS_HANDOFF.md` |
| CTA | 「승인 검토」teal · 「거부 검토」brick outline | 컴포넌트 파일은 각 앱 유지, **시각·라벨 계약 동일** |
| #919 | ConfirmModal summary · merchant 마스킹 · 상수 헬퍼 | 각 앱 기존 Confirm 구현 유지 |
| 목록 UI | stage 안 배치 | 카드 vs 테이블 기존 구조 유지 가능 (신규 발명 금지) |

---

## 7. 아토믹·공통 모듈 (재사용 우선)

| 계층 | 재사용 (새로 발명 금지) |
|------|-------------------------|
| Atoms | `MGButton`, `SafeText` / 표시 경계, `KpiNumeral`(현황 count · strip) |
| Molecules | ConfirmModal / UnifiedModal 게이트(#919), EmptyState |
| Organisms | `DesktopLnb` · `OpsApprovalQuietHeader` / `SalaryQuietHeader` 패턴 · `OpsApprovalSummaryStrip` 패턴 · TenantCenterCard(tenants core) |
| Template | `ErpPageShell` · `AdminCommonLayout` + `ContentArea` (main FE) · ops RootLayout 재구성 |

캡슐화: **Shell / LNB IA / PG stage chrome / Tenant body** 경계를 나누고, PG API·마스킹은 기존 모듈에 둔다.

---

## 8. #919 vs 신규 (구분)

| #919 **유지·회귀 금지** | Phase 1 **신규 (chrome)** |
|-------------------------|---------------------------|
| ConfirmModal 게이트 (검토→summary→확정) | Ops slate LNB shell |
| 가맹 ID 마스킹 · center/PG display helpers | LNB 1차: **테넌트(main) / PG 승인 / 현황(summary)** |
| Center LNB hide · 센터 `/tenant/pg-configurations` | quiet header + paper stage 정렬 |
| Flyway 라벨 · `pgApproval` 상수·헬퍼 의미 | 「거부」→「거부 검토」라벨 + warn outline 시각 |
| 승인 API·거부 사유 최소 길이 등 로직 | frontend-ops horizontal nav → LNB |
| | main FE + frontend-ops **동일 크롬 계약** |
| | 테넌트 main body → `OPS_TENANTS_CORE_CLINIC_OS_HANDOFF.md` |

---

## 9. 상호작용·상태

| 상태 | 스펙 |
|------|------|
| 현황 empty | pending `0` 표시 · 이모지 없음 |
| PG empty | EmptyState · 기존 문구 · stage 안 |
| 테넌트 empty/loading/Forbidden | tenants core §10 |
| Loading | stage `aria-busy` 또는 기존 inline loading |
| 승인/거부 검토 | 모달·폼 기존 유지 → Confirm 게이트 |
| 비Ops | 기존 ProtectedRoute / ops auth 유지 |

---

## 10. 코더 체크리스트

- [ ] `--mg-v2-*`만 · 새 팔레트·B0KlA·Pencil·좌측 accent 없음
- [ ] Ops shell: slate LNB 260px (`--mg-v2-color-surface-sidebar`) + quiet header + paper stage
- [ ] LNB 1차 3항만 · **순서: 테넌트(main) · PG 승인 · 현황(summary)** — 구 순서 폐기
- [ ] 테넌트 본문: `OPS_TENANTS_CORE_CLINIC_OS_HANDOFF.md` 준수 (strip3 · cards · CTA 36 · ⋯ · no delete)
- [ ] frontend-ops: top sticky horizontal nav → LNB (공개 로그인 제외)
- [ ] PG CTA: 「승인 검토」= solid primary teal; 「거부 검토」= muted brick border outline (solid danger 아님)
- [ ] 상수/locale에서 행 CTA「거부」→「거부 검토」통일 (Confirm 게이트 로직 무변경)
- [ ] Main FE `/admin/ops/pg-approval` · frontend-ops `/pg-approval` 동일 크롬 계약
- [ ] #919: Confirm · 마스킹 · 센터 PG/LNB · Flyway · API **회귀 없음**
- [ ] `/tenant/pg-configurations` · Center LNB **OUT OF SCOPE** (파일 손대지 않음)
- [ ] 장부·스케줄·급여 ops 이식 없음
- [ ] 트윈 재사용: QuietHeader / stage / ErpPageShell / DesktopLnb — 신규 DS 발명 금지
- [ ] hardcoding gate §17 / SETTINGS §1.3 / PRE_PRODUCTION — 신규 CSS hex 금지
- [ ] `safeDisplay` / SafeText 표시 경계 유지

---

## 11. 참조

- `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`
- `docs/design-system/OPS_TENANTS_CORE_CLINIC_OS_HANDOFF.md` (**테넌트 main · Layout+Critic PASS**)
- `docs/design-system/OPS_APPROVAL_CENTER_CLINIC_OS_HANDOFF.md` (quiet + stage; PG 로직 diff 금지 취지 유지)
- `docs/design-system/TENANT_PG_CONFIGURATION_CLINIC_OS_HANDOFF.md` (센터 경계)
- `frontend/src/styles/tokens/design-v2-tokens.css` (`--mg-v2-*`)
- Twins: `OpsApprovalQuietHeader`, `OpsApprovalSummaryStrip`, `.ops-approval__stage`, `SalaryQuietHeader`, `ErpPageShell`, `DesktopLnb`
- Constants: `frontend/src/constants/pgApproval.js`, `frontend-ops/src/constants/pgApproval.ts`, `frontend-ops/src/constants/opsShell.ts` (LNB 순서 정정 대상)
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17
- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
