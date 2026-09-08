# Clinic-OS Ops Tenant Management (Core) UI/UX 스펙 (Design Handoff)

**대상**: Ops **테넌트** 본문 — center cards list UX (ops inspection · 정지/재개 · 선택적 결제 연결 보기)  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`  
**Shell / LNB IA**: `docs/design-system/OPS_SHELL_PHASE1_CLINIC_OS_HANDOFF.md` (**LNB 순서: 테넌트 · PG 승인 · 현황** — 본 문서가 테넌트 **main body** 계약)  
**PG 크롬 참조**: `docs/design-system/OPS_APPROVAL_CENTER_CLINIC_OS_HANDOFF.md` (quiet header · strip · stage · 행 CTA 36px twin)  
**센터 PG 경계**: `docs/design-system/TENANT_PG_CONFIGURATION_CLINIC_OS_HANDOFF.md` — **센터 `/tenant/pg-configurations` 재작업 금지**  
**브랜치**: `cursor/clinic-os-ops-shell-phase1-06c5` (구현은 core-coder)  
**작성**: core-designer · `/core-solution-design-handoff` · `/core-solution-common-modules` · `/core-solution-encapsulation-modularization`  
**권위**: 사용자 Must-ship 계약 (Unity `clinic-os-ops-tenants.md` 워크스페이스 부재 — **본 문서 + 사용자 계약이 SSOT**)  
**범위**: Frontend chrome / layout / IA / card anatomy / CTA·배지 시각 계약만. **승인 API·마스킹·Confirm 게이트(#919)·센터 장부·스케줄·급여 ops 이식 금지**.

---

## 0. 사용자 관점

| 항목 | 내용 |
|------|------|
| **사용성** | Ops만. LNB **첫 항목 = 테넌트**. 목록에서 센터 상태·격리·서브도메인을 한눈에 보고 **센터 들어가기**(검사) · ⋯(상세·정지·재개·선택 결제 연결 보기). |
| **정보 노출** | 센터명(한국어) first. **영문 `tenantId`를 제목으로 쓰지 않음**. 격리 배지는 quiet(slate/ghost) — **운영중 상태와 시각 경쟁 금지**. |
| **레이아웃** | Quiet header → strip3 → search/filter → **center cards** (본문). placeholder·러시 스텁 금지 — Clinic-OS 품질의 실제 list/cards UX. |

---

## 1. 개요·배경

Ops 테넌트 화면을 shell slot에서 **본체(main body)** 로 올린다. Phase 1 shell과 동일 slate LNB + quiet chrome을 유지하되, 테넌트는 **카드 그리드 본문**이 Must-ship이다. 센터 ledger/schedule/salary를 ops로 이식하지 않는다. 새 팔레트·B0KlA·Pencil·forest primary·구어체(예: 「손볼」) **금지**.

---

## 2. OUT OF SCOPE / Forbidden

| 항목 | 이유 |
|------|------|
| Center ledger · 통합스케줄 · 급여 · 경비를 ops로 port | Must-ship: Do NOT port |
| 영문 `tenantId` / UUID를 카드·페이지 제목으로 | 표준 한국어만 (센터명) |
| 카드·⋯ 메뉴에 **삭제** | no delete |
| Topbar에 긴 디자인 코멘트 카피 | product copy만: `ops · 테넌트 격리` |
| 새 팔레트 / B0KlA / Pencil / `#3D5246` primary / 좌측 4px accent | SSOT 위반 |
| `#919` Confirm·마스킹·센터 PG UI 재작업 | chrome/list만; PG 로직·센터 PG **diff 0** |
| LNB에 온보딩·요금제·Feature Flag·장부 등 추가 | shell 1차 3항만 |
| rushed empty placeholder를 「완료」로 표시 | 본체 UX 미달 = FAIL |

---

## 3. 레이아웃 트리 (위→아래)

### 3.1 Ops Shell 내 위치

```
OpsShell (ops-only · slate LNB 260px)
├─ LNB  (순서 확정 — 기존 현황→PG→테넌트 폐기)
│    1. 테넌트     ← MAIN (본 문서)
│    2. PG 승인
│    3. 현황       ← summary only
└─ Main column
   ├─ Topbar product copy: 「ops · 테넌트 격리」
   └─ Tenant page (본문)
```

경로(계약): frontend-ops `/tenants` · main FE ops tenants twin이 있으면 동일 IA/크롬. URL은 앱별 유지 가능, **시각·카피 계약 동일**.

### 3.2 테넌트 페이지 (본문)

```
Quiet header
  h1「테넌트」
  (optional) ghost 1개 — 예:「새로고침」; solid primary 헤더 CTA 없음
└─ Summary strip3  (동일 너비 3셀 · surface + hairline · 좌측 4px·아이콘 타일 금지)
     ├─ 전체   (count)
     ├─ 운영중 (count)
     └─ 정지   (count)
└─ Toolbar (search / filter) — stage 밖 또는 stage 상단 1행; ErpFilterToolbar를 페이지 정체성으로 쓰지 않음
└─ Paper stage (.ops-shell__stage / .ops-tenants__stage twin)
     border 1px var(--mg-v2-color-neutral-300)
     bg var(--mg-v2-color-neutral-50)
     radius var(--mg-v2-radius-lg) (또는 stage twin radius-md 정합)
     min-height ~36rem
     border-left: none !important
     └─ Center cards grid
          └─ TenantCenterCard × N
```

**선정 이유**: SSOT Default format = quiet header + summary strip + main stage. strip3는 필터 앵커(전체·운영중·정지). 카드는 센터 단위 상호작용 컨테이너(들어가기·⋯)이므로 카드 허용(SSOT: interaction container).

---

## 4. Strip3 (요약 스트립)

| 셀 | 라벨 | 값 | 역할 |
|----|------|-----|------|
| 1 | 전체 | tabular count | 기본 필터 / 전체 목록 |
| 2 | 운영중 | tabular count | 운영중만 |
| 3 | 정지 | tabular count | 정지된 센터만 |

- 타이포: 숫자 `--mg-v2-font-size-h2` · weight 700 · `tabular-nums`; 라벨 `--mg-v2-font-size-caption` · `--mg-v2-color-text-secondary`
- Surface: `var(--mg-v2-color-neutral-100)` · hairline `var(--mg-v2-color-neutral-300)`
- 트윈: `OpsApprovalSummaryStrip` / Salary summary strip — **3등분 · 아이콘 타일 없음**
- 셀 클릭 = 목록 필터(토글). 활성 셀은 quiet emphasis(헤어라인 강조 또는 surface wash) — **solid teal fill로 strip을 CTA화 금지**

---

## 5. Search / Filter

| 요소 | 스펙 |
|------|------|
| 검색 | 센터명·서브도메인 검색. placeholder 한국어. 입력 height는 form twin(`--mg-v2-component-height-md` 등) |
| 필터 | strip3와 중복이면 strip이 primary. 추가 드롭다운은 최소화 |
| 배치 | header/strip 아래 · cards 위. 과밀 툴바·lucide 덤프 금지 |

공통 모듈: 기존 FormInput / search field 재사용. 신규 filter organism 발명 금지.

---

## 6. Card anatomy (TenantCenterCard)

카드는 **상호작용 컨테이너**. 제거해도 이해되는 장식 border/shadow는 최소화 — stage 안 **hairline + radius**만.

```
┌─────────────────────────────────────────────────────────┐
│  [센터명]                          [운영중|정지|승인대기] │  ← title first + status badge
│  [격리] (quiet slate/ghost)                              │  ← isolation — status와 경쟁 금지
│  subdomain.example …                                     │  ← caption / secondary
│                                                          │
│  [ 센터 들어가기 ]                              [ ⋯ ]    │  ← CTA h=36 · overflow menu
└─────────────────────────────────────────────────────────┘
```

### 6.1 필드 계층

| 순위 | 요소 | 토큰·규칙 | 비고 |
|------|------|-----------|------|
| 1 | **센터명** | `--mg-v2-font-size-body-md` 또는 카드 타이틀 twin · weight 600–700 · `--mg-v2-color-text-primary` | **first**. 영문 tenantId 제목 금지 |
| 2 | **Status badge** | 운영중 / 정지 / 승인 대기 — semantic 또는 quiet fill; 페이지 primary CTA와 경쟁하지 않는 **배지** | 시각 1순위 상태 |
| 3 | **Isolation badge** | 「격리」등 — **slate/ghost** · hairline · secondary text | **quiet**. 운영중 teal/강조와 동시 loud 금지 |
| 4 | **Subdomain** | `--mg-v2-font-size-caption` · `--mg-v2-color-text-secondary` · ellipsis | 보조 |
| 5 | **「센터 들어가기」** | compact solid primary · **height 36** | 카드 primary action |
| 6 | **⋯ menu** | ghost icon/button · height 36 twin | 상세·정지·재개·optional 결제 연결 |

### 6.2 Status vs Isolation (시각 계층)

| 배지 | 목적 | 시각 | 금지 |
|------|------|------|------|
| **Status** | 운영 생명주기 (운영중·정지·승인 대기) | 상태별 구분 가능. 운영중 = quiet success/teal wash 또는 SSOT semantic twin; 정지 = muted/neutral 또는 warn wash; 승인 대기 = secondary/info quiet | Status를 solid danger fill로 |
| **Isolation** | 테넌트 격리 표시 | **slate/ghost** · `var(--mg-v2-color-text-secondary)` · border `var(--mg-v2-color-neutral-300)` · bg transparent 또는 `neutral-100` | Isolation을 primary teal solid·큰 칩·아이콘 타일로 키워 status와 경쟁 |

**규칙**: 한 카드에서 눈이 먼저 가는 것은 **센터명 → status**. Isolation은 두 번째 시선·보조 메타.

### 6.3 「센터 들어가기」 CTA

| 항목 | 계약 |
|------|------|
| 라벨 | **「센터 들어가기」** (표준 한국어) |
| Variant | `MGButton` **solid primary** (dusty teal) — 카드 인라인 compact |
| Height | **36** — `var(--mg-v2-space-9)` (목표 2.25rem). 토큰 파일에 `--mg-v2-space-9` 부재 시 **승인 센터·메뉴권한 twin** `var(--mg-spacing-36)` (동일 36px). 페이지 헤더 ~40px primary와 **의도적 구분**(카드 compact) |
| Radius | `var(--mg-v2-radius-md)` |
| 승인 대기 | **유지** — ops inspection allowed (비활성/숨김 금지) |
| 정지 | 들어가기 **유지**(검사) 또는 제품 정책이 막으면 ghost disabled + 사유 caption — 기본 Must-ship은 **유지** |

페이지당 “헤더 solid primary 하나” 원칙과 충돌하지 않음: 헤더에 solid 없음 · **카드 행마다 동일 compact primary** (PG 행「승인 검토」패턴과 동형).

### 6.4 ⋯ overflow menu

| 항목 | 스펙 |
|------|------|
| 트리거 | ⋯ (또는 동등 ghost) · 카드 CTA와 **동일 height 36** |
| 메뉴 항목 | **상세** · **정지** · **재개** · (optional) **결제 연결 보기** |
| **삭제** | **없음** (no delete) |
| 정지/재개 | 상태에 따라 상호 배타 표시 (운영중→정지, 정지→재개) |
| 결제 연결 보기 | optional — 있으면 ghost/secondary 메뉴; 센터 PG 설정 화면 이식 아님 · 읽기 전용 연결 요약/딥링크 수준 |
| 모달 | Confirm·상세는 **UnifiedModal** / ConfirmModal 트윈. 커스텀 오버레이 금지 |
| Danger | 삭제 없으므로 solid danger **페이지에 없음**. 정지 Confirm은 warn/outline 또는 secondary confirm — **삭제용 danger fill 오용 금지** |

---

## 7. 토큰 표 (요약)

| 역할 | 토큰 |
|------|------|
| Page / stage paper | `var(--mg-v2-color-neutral-50)` |
| Strip / card surface | `var(--mg-v2-color-neutral-100)` (필요 시) |
| Hairline | `var(--mg-v2-color-neutral-300)` |
| Text | `--mg-v2-color-text-primary` / `--mg-v2-color-text-secondary` |
| Primary CTA fill | `var(--mg-v2-color-primary-solid)` · hover `var(--mg-v2-color-primary-dark)` |
| LNB slate | `var(--mg-v2-color-surface-sidebar)` |
| Type | h1 / h2 / body-md / caption only (`--mg-v2-font-size-*`) |
| Space / radius | `--mg-v2-space-*` · `--mg-v2-radius-md`/`lg` |
| CTA h=36 | `var(--mg-v2-space-9)` 또는 twin `var(--mg-spacing-36)` |
| Stage min-height | `36rem` (ops-approval / shell stage twin) |

**금지**: 신규 hex, `--ops-color-*`를 Clinic-OS primary로 유지, `--ad-b0kla-*`, 좌측 4px accent.

---

## 8. Topbar / Quiet header 카피

| 위치 | 카피 | 금지 |
|------|------|------|
| Topbar product | **`ops · 테넌트 격리`** | 긴 디자인 코멘트·영문 설명 문장 |
| Quiet h1 | **테넌트** | 「Tenant Management」「tenantId: …」 |
| Strip | 전체 · 운영중 · 정지 | 영문 ALL/ACTIVE/SUSPENDED를 UI 라벨로 |
| CTA | 센터 들어가기 | Enter center / Open tenant |

---

## 9. 아토믹·공통 모듈 (재사용 우선)

| 계층 | 재사용 (새로 발명 금지) |
|------|-------------------------|
| Atoms | `MGButton`, `SafeText` / 표시 경계, badge atom(기존 status badge twin) |
| Molecules | `EmptyState`, ConfirmModal / **UnifiedModal**, search field, overflow menu(기존 Action/Dropdown twin) |
| Organisms | `DesktopLnb`, QuietHeader twin (`OpsApprovalQuietHeader` / `SalaryQuietHeader`), SummaryStrip twin, TenantCenterCard(본 스펙 범위의 얇은 organism) |
| Template | `ErpPageShell` · Ops shell stage · `AdminCommonLayout`/`ContentArea`(main FE ops) |

캡슐화: **Shell IA**(`OPS_SHELL_PHASE1…`) / **Tenant body**(본 문서) / **PG approval chrome** / **#919 로직** 경계 분리. 카드 메뉴·들어가기만 테넌트 모듈에 둔다.

---

## 10. 상호작용·상태

| 상태 | 스펙 |
|------|------|
| Loading | stage `aria-busy` 또는 카드 스켈레톤(이모지 없음). strip count는 placeholder 「—」또는 숨김 |
| Empty (전체 0) | `EmptyState` · 「등록된 센터가 없습니다.」등 한국어 · stage 안 |
| Empty (필터 0) | `EmptyState` · 「조건에 맞는 센터가 없습니다.」· 필터 초기화 ghost 선택 |
| Error | stage 안 오류 caption + ghost「다시 시도」· 이모지 없음 |
| 승인 대기 카드 | status「승인 대기」+ **「센터 들어가기」유지** |
| 정지 카드 | status「정지」+ ⋯에「재개」·「센터 들어가기」유지(기본) |
| 비Ops / Forbidden | 기존 ProtectedRoute / ops auth. 본문 대신 짧은 Forbidden 메시지(한국어) · LNB 노출은 권한 정책 twin |
| 삭제 시도 UI | **제공하지 않음** |

---

## 11. #919 / Shell / 본 문서 경계

| 유지 (#919 · 센터 PG) | Shell Phase 1 | 본 문서 (Tenants core) |
|------------------------|---------------|-------------------------|
| Confirm 게이트·마스킹·승인 API | slate LNB + quiet + stage | 테넌트 **main body** cards |
| Center `/tenant/pg-configurations` | LNB 3항 순서·라벨 | strip3 · card anatomy · CTA 36 · ⋯ |
| PG「승인 검토」「거부 검토」시각 | 현황 = summary | Topbar `ops · 테넌트 격리` |
| | 테넌트를 slot→**main**으로 상향(쉘 문서 패치) | 장부/스케줄/급여 **non-port** |

상호 링크:

- Shell: `docs/design-system/OPS_SHELL_PHASE1_CLINIC_OS_HANDOFF.md`
- 본문: `docs/design-system/OPS_TENANTS_CORE_CLINIC_OS_HANDOFF.md` (이 파일)

---

## 12. Layout + Critic PASS 체크 (디자이너 고정)

- [x] LNB: **테넌트 → PG 승인 → 현황** (구 순서 폐기)
- [x] 테넌트 = main body (slot 아님)
- [x] Header → strip3 → search/filter → center cards
- [x] Card: 센터명 first · status · quiet isolation · subdomain · 들어가기 h=36 · ⋯ (no delete)
- [x] 승인 대기에서도 들어가기 유지
- [x] Topbar: `ops · 테넌트 격리`
- [x] `--mg-v2-*` only · B0KlA/새 팔레트/구어체 없음
- [x] 장부·스케줄·급여 ops 이식 없음
- [x] 영문 tenantId 제목 없음

---

## 13. 코더 체크리스트

- [ ] `--mg-v2-*`만 (CTA 36은 `--mg-v2-space-9` 또는 twin `--mg-spacing-36`) · 신규 hex·B0KlA·좌측 accent 없음
- [ ] LNB 순서: **테넌트 · PG 승인 · 현황** (`opsShell` IA 상수와 문서 일치)
- [ ] Quiet header「테넌트」+ Topbar「ops · 테넌트 격리」
- [ ] strip3: 전체 · 운영중 · 정지 (3등분 · 아이콘 타일 없음)
- [ ] search/filter → **center cards** (테이블-only로 본체 대체 금지; 카드가 Must-ship)
- [ ] Card: 센터명 first · status badge · quiet isolation badge · subdomain
- [ ] 「센터 들어가기」solid primary · height 36 · 승인 대기에서도 노출
- [ ] ⋯: 상세 · 정지 · 재개 · optional 결제 연결 보기 · **삭제 없음**
- [ ] EmptyState / loading / Forbidden · 이모지 없음
- [ ] UnifiedModal/Confirm twin · 커스텀 오버레이 금지
- [ ] #919 · 센터 PG · 장부/스케줄/급여 **회귀·이식 없음**
- [ ] `safeDisplay` / SafeText 표시 경계
- [ ] hardcoding gate §17 / SETTINGS §1.3 / PRE_PRODUCTION — 신규 CSS hex 금지
- [ ] DesktopLnb · QuietHeader · SummaryStrip · ErpPageShell / stage 트윈 재사용

---

## 14. 참조

- `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`
- `docs/design-system/OPS_SHELL_PHASE1_CLINIC_OS_HANDOFF.md`
- `docs/design-system/OPS_APPROVAL_CENTER_CLINIC_OS_HANDOFF.md` (strip · stage · 36px CTA twin)
- `docs/design-system/TENANT_PG_CONFIGURATION_CLINIC_OS_HANDOFF.md` (센터 경계)
- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` (UnifiedModal · EmptyState · BadgeSelect 검토)
- `frontend/src/styles/tokens/design-v2-tokens.css` (`--mg-v2-*`)
- `frontend/src/styles/unified-design-tokens.css` (`--mg-spacing-36` twin)
- Twins: `OpsApprovalQuietHeader`, `OpsApprovalSummaryStrip`, `.ops-approval__stage`, `SalaryQuietHeader`, `ErpPageShell`, `DesktopLnb`, `MGButton`
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17
- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
