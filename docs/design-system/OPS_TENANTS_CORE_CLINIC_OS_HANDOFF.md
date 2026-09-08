# Clinic-OS Ops Tenants — Phase 1.5 Must-ship Full Body UI/UX 스펙 (Design Handoff)

**대상**: Ops `/tenants` — **풀 관리 본문** (SummaryStrip3 · search/filter · TenantCenterCard)  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`  
**Shell / LNB IA**: `docs/design-system/OPS_SHELL_PHASE1_CLINIC_OS_HANDOFF.md` (slate LNB · quiet · paper **유지**)  
**센터 PG 경계**: `docs/design-system/TENANT_PG_CONFIGURATION_CLINIC_OS_HANDOFF.md` — **센터 `/tenant/pg-configurations` 재작업 금지**  
**브랜치**: `cursor/clinic-os-ops-tenants-e88c` (구현은 core-coder)  
**작성**: core-designer · `/core-solution-design-handoff` · `/core-solution-common-modules` · `/core-solution-encapsulation-modularization`  
**권위**: Leader Phase 1.5 Must-ship — Ops 테넌트 **풀 관리 본문**. Shell chrome(LNB 3항 · Topbar)은 Phase 1과 동일 유지.  
**범위**: Frontend chrome / layout / 카피 / 카드·스트립 시각 계약. **승인 API·마스킹·Confirm 게이트(#919)·센터 장부·스케줄·급여 ops 이식 금지**.

> ### Phase authority banner
>
> | Phase | 계약 |
> |-------|------|
> | **Phase 1.5 (본 문서 · Must-ship)** | LNB「테넌트」= **본문 풀 관리**. Layout: Quiet header → **SummaryStrip3**(전체·운영중·정지) → **search/filter** → **TenantCenterCard** grid. 「센터 들어가기」· ⋯(상세·정지·재개 · optional 결제 연결 보기) · status/isolation. Empty 0 = 「등록된 센터가 없습니다.」 |
> | **Phase 1 (historical / superseded for body)** | LNB slot + EmptyState twin(coming 카피). **본문 계약은 본 Must-ship으로 대체**. Shell chrome(LNB 순서·Topbar `ops · 테넌트 격리`)은 **유지**. coming 카피를 Empty 0에 재사용 = **FAIL**. |
> | **Later (out of this Must-ship)** | 온보딩·요금제·Feature Flag·삭제·장부/스케줄/급여 ops 이식 — **발명·러시 금지**. |

---

## 0. 사용자 관점

| 항목 | 내용 |
|------|------|
| **사용성** | Ops만. LNB 순서: **테넌트 · PG 승인 · 현황**. 테넌트 클릭 = **센터 목록·요약·들어가기·정지/재개**. |
| **정보 노출** | 센터명 · 상태(운영중/정지/승인 대기) · quiet isolation · 서브도메인 · count(전체/운영중/정지). 카피 **한국어만**. 이모지·영문 `tenantId` 제목 금지. UUID를 카드 제목으로 쓰지 않음. |
| **레이아웃** | Quiet header h1「테넌트」→ SummaryStrip3 → search/filter toolbar → TenantCenterCard grid (paper stage). |

---

## 1. 개요·배경

Phase 1.5에서 Ops 테넌트는 shell LNB 자리를 유지하고, 본문은 **등록된 센터를 훑고·필터하고·센터 컨텍스트로 들어가며·정지/재개**하는 Clinic-OS quiet 풀 관리다. Phase 1의 empty/coming 본문 계약은 **historical**이며, Empty 0은 coming 문구가 아니라 **목록 0건** 문구만 쓴다. 새 팔레트·B0KlA·Pencil·forest primary·구어체(예: 「손볼」) **금지**. 장부·통합스케줄·급여를 ops에 발명·이식하지 않는다.

---

## 2. OUT OF SCOPE / Forbidden

| 항목 | 이유 |
|------|------|
| Center ledger · 통합스케줄 · 급여 · 경비 ops port | Must-ship: Do NOT invent / port |
| 카드·⋯에서 **삭제** | 삭제 없음 (danger CTA 금지) |
| 온보딩·요금제·Feature Flag LNB/본문 | shell 1차 3항만 · 본 Must-ship 밖 |
| Phase 1 coming 카피를 Empty 0 / 본문에 유지 | superseded — Empty 0은 §8.2만 |
| 영문 `tenantId` / UUID를 페이지·카드 제목으로 | 표준 한국어만 |
| Topbar에 긴 디자인 코멘트 | product copy만: `ops · 테넌트 격리` |
| 새 팔레트 / B0KlA / Pencil / `#3D5246` primary / 좌측 4px accent | SSOT 위반 |
| `#919` Confirm·마스킹·센터 PG UI 재작업 | PG 로직·센터 PG **diff 0** (optional「결제 연결 보기」는 ops 카드 overflow만) |
| LNB에 온보딩·요금제·Feature Flag·장부 등 추가 | shell 1차 3항만 |
| 이모지 · 구어체「손볼」 · 영문 Coming soon 제목 | 카피 계약 위반 |
| isolation을 운영중보다 강조(강채색·solid badge) | quiet slate/ghost만 — 운영중보다 ** quieter** |

---

## 3. 레이아웃 트리 (위→아래)

### 3.1 Ops Shell 내 위치

```
OpsShell (ops-only · slate LNB 260px)
├─ LNB  (순서 확정)
│    1. 테넌트     ← Must-ship full body (본 문서)
│    2. PG 승인    ← Phase 1 main chrome (변경 없음)
│    3. 현황       ← summary only
└─ Main column
   ├─ Topbar product copy: 「ops · 테넌트 격리」
   └─ Tenant page (풀 관리 본문)
```

경로(계약): frontend-ops `/tenants` · main FE ops tenants twin이 있으면 동일 IA/크롬. URL은 앱별 유지 가능, **시각·카피 계약 동일**.

### 3.2 테넌트 페이지 (Phase 1.5 Must-ship 본문)

```
Quiet header
  h1「테넌트」
  (optional) ghost「목록 새로고침」1개 — solid primary 헤더 CTA 없음 · primary 두 개 금지
└─ Page body (.ops-tenants / stage twin)
     ├─ 1) SummaryStrip3  (전체 · 운영중 · 정지)
     │     · count + 라벨 · 셀 클릭 = filter 앵커(선택·권장)
     ├─ 2) Toolbar
     │     · 검색: 센터명 · 서브도메인
     │     · filter: 상태(전체/운영중/정지/승인 대기) — Clinic-OS hairline · ghost 칩/셀렉트
     └─ 3) Paper stage (.ops-shell__stage / .ops-tenants__stage)
           border 1px var(--mg-v2-color-neutral-300)
           bg var(--mg-v2-color-neutral-50)
           radius var(--mg-v2-radius-lg) (또는 stage twin radius-md 정합)
           min-height ~36rem
           border-left: none !important
           └─ TenantCenterCard grid
                또는 Empty 0 (§8.2)
```

**선정 이유**: Clinic-OS quiet = header → strip3 → toolbar → single paper stage. 급여/승인 센터 strip+stage 트윈. 카드는 **상호작용 컨테이너**(들어가기·⋯)이므로 허용. B0KlA·좌측 accent 금지.

---

## 4. SummaryStrip3

| 셀 | 라벨 | 값 | 비고 |
|----|------|-----|------|
| 1 | **전체** | 등록 센터 수 | 건 |
| 2 | **운영중** | `ACTIVE`/운영중 count | 건 · 필터 앵커 |
| 3 | **정지** | 정지 count | 건 · 필터 앵커 |

- Band aria: **테넌트 요약** (또는「센터 요약」— 페이지 내 상수 단일).
- 패턴 트윈: `OpsApprovalSummaryStrip` / `SalarySummaryStrip` — surface `var(--mg-v2-color-neutral-100)` 또는 summary twin surface.
- Type: 라벨 `--mg-v2-font-size-caption` · `text-secondary` · 숫자 `--mg-v2-font-size-h2` weight 700 · `text-primary` (`KpiNumeral` 재사용 권장).
- **승인 대기**는 strip3 셀이 **아님** (toolbar filter / 카드 status로만). strip을 4셀로 늘리지 말 것.

---

## 5. Toolbar — search / filter

| 요소 | 계약 |
|------|------|
| 검색 | 센터명 · 서브도메인. placeholder 한국어(예: 「센터명 또는 서브도메인」). hairline input · `--mg-v2-*` |
| 상태 filter | 전체 / 운영중 / 정지 / 승인 대기. ghost chip 또는 BadgeSelect twin. solid primary 필터 금지 |
| 배치 | strip 아래 · stage 위. gap `--mg-v2-space-*`. ErpFilterToolbar 페이지 크롬 복제·영문 서브타이틀 금지 |
| 빈 결과(필터 후 0) | stage 안 Empty twin — title「조건에 맞는 센터가 없습니다.」· supporting 1문장 optional. Empty 0(등록 없음) 카피와 **구분** |

---

## 6. TenantCenterCard

### 6.1 카드 anatomy (위→아래 · 좌→우)

```
TenantCenterCard (paper cell · hairline · radius-md/lg · NO left 4px accent)
├─ Row: 센터명 (primary text · weight 600–700 · SafeText)
│        + status badge (운영중 | 정지 | 승인 대기)
├─ quiet isolation  (slate/ghost · caption — 운영중 배지보다 quieter)
├─ subdomain        (secondary/caption · SafeText · 없으면 숨김 또는 「—」)
└─ Actions row
     ├─ CTA「센터 들어가기」  height ~36 (var(--mg-spacing-36) / touch twin)
     └─ ⋯ overflow          EntityRowActions twin
```

### 6.2 필드·시각

| 요소 | 토큰 / 규칙 |
|------|-------------|
| 카드 surface | `var(--mg-v2-color-neutral-50)` 또는 stage와 구분되는 `neutral-100` — **한 페이지 내 단일 선택** · hairline `neutral-300` · `border-left: none` |
| 센터명 | `--mg-v2-font-size-body-lg` 또는 h3 twin · `text-primary` · UUID/`tenantId` 제목 금지 |
| Status — 운영중 | quiet success/slate badge twin · 과한 chroma 금지 |
| Status — 정지 | muted / secondary badge · danger solid 금지(정지는 삭제 아님) |
| Status — 승인 대기 | ghost/secondary badge |
| **quiet isolation** | **slate/ghost caption only** — 운영중 배지보다 채도·대비 **낮음**. 강채색 pill·solid primary isolation 금지 |
| Subdomain | `text-secondary` · caption/body-sm |
| 「센터 들어가기」 | `MGButton` — primary 또는 quiet solid twin · **height ~36** (`var(--mg-spacing-36)`) · radius `--mg-v2-radius-md` · label 한국어 고정 |
| ⋯ | ghost icon button · 동일 행 높이 계열 |

### 6.3 Overflow ⋯ 메뉴

| 항목 | 필수 | 비고 |
|------|------|------|
| **상세** | 필수 | 상세 패널/모달 — UnifiedModal twin. 로직 non-goal이면 크롬만 |
| **정지** | 운영중일 때 | Confirm은 UnifiedModal — #919 센터 PG Confirm과 **파일/카피 혼용 금지** |
| **재개** | 정지일 때 | 동일 |
| **결제 연결 보기** | optional | 있으면 overflow만. 센터 PG 설정 화면 재작업·이식 금지 |
| **삭제** | **금지** | 메뉴·danger CTA 없음 |

### 6.4 승인 대기 · 들어가기

| 상태 | 「센터 들어가기」 |
|------|------------------|
| 운영중 | 허용 |
| 정지 | 허용(읽기/점검 목적 — 제품 정책이 막으면 별도 권위에서만; **본 스펙 기본 = 허용**) |
| **승인 대기** | **허용 (enter still allowed)** — CTA 숨기거나 disable 하지 않음 |

### 6.5 그리드

| 항목 | 규칙 |
|------|------|
| Desktop | 반응형 카드 그리드 — gap `--mg-v2-space-4`/`-5` · 대략 2–3열(뷰포트). 테이블로 바꾸지 말 것(본 Must-ship = card grid) |
| Narrow | 1열. CTA·⋯ 터치 타깃 유지 |
| Stage | 카드는 stage **안**. strip/toolbar는 stage 밖(승인/급여 트윈과 동일 계층) |

---

## 7. 토큰 표 (요약)

| 역할 | 토큰 |
|------|------|
| Page / stage paper | `var(--mg-v2-color-neutral-50)` |
| Strip surface | `var(--mg-v2-color-neutral-100)` 또는 summary twin |
| Hairline | `var(--mg-v2-color-neutral-300)` |
| Text | `--mg-v2-color-text-primary` / `--mg-v2-color-text-secondary` |
| LNB slate | `var(--mg-v2-color-surface-sidebar)` |
| Primary CTA | `--mg-v2-color-primary-solid` (Clinic-OS dusty teal SSOT) — 헤더에 올리지 말 것 |
| Ghost / isolation | slate text + hairline · caption |
| Type | h1 / h2(strip) / body / caption (`--mg-v2-font-size-*`) |
| Space / radius | `--mg-v2-space-*` · `--mg-v2-radius-md`/`lg` |
| CTA / ⋯ height | `var(--mg-spacing-36)` (~36) |
| Stage min-height | `36rem` (ops-approval / shell stage twin) |

**금지**: 신규 hex, `--ops-color-*`를 Clinic-OS primary로 유지, `--ad-b0kla-*`, 좌측 4px accent, B0KlA class.

---

## 8. Topbar / Quiet header / 상태·Empty 카피

### 8.1 Chrome 카피

| 위치 | 카피 | 금지 |
|------|------|------|
| Topbar product | **`ops · 테넌트 격리`** | 긴 디자인 코멘트·영문 설명 문장 |
| Quiet h1 | **테넌트** | 「Tenant Management」「tenantId: …」 |
| Strip 라벨 | 전체 · 운영중 · 정지 | 영문 KPI |
| CTA | **센터 들어가기** | Enter tenant / Open |
| ⋯ | 상세 · 정지 · 재개 · (optional) 결제 연결 보기 | Delete / 삭제 |

### 8.2 Empty · 상태 카피

| 역할 | 문구 |
|------|------|
| **Empty 0 (목록 없음)** | **등록된 센터가 없습니다.** |
| Empty 0 supporting (optional 1문장) | 예: 「새 센터가 등록되면 여기에 표시됩니다.」— coming/준비 중 문구 **금지** |
| 필터 후 0 | 「조건에 맞는 센터가 없습니다.」 |
| Status | **운영중** / **정지** / **승인 대기** |
| Phase 1 coming (historical) | ~~테넌트 관리를 준비 중입니다~~ / ~~센터 목록과 운영 도구는 이후 단계에서 제공됩니다.~~ — **본문 Must-ship에서 사용 금지** |

**금지 카피**: `Coming soon` · `Tenant management` · `tenantId: …` · 「손볼」· 이모지 · Phase 1 coming을 Empty 0에 재사용.

---

## 9. 아토믹·공통 모듈 (재사용 우선)

| 계층 | 재사용 (새로 발명 금지) |
|------|-------------------------|
| Atoms | `MGButton` · `SafeText` / 표시 경계 · `KpiNumeral` · (선택) 단색 icon atom |
| Molecules | `EmptyState` / `ErpEmptyState` · `UnifiedModal`(상세·정지/재개 Confirm) · BadgeSelect / ghost chip filter · search input twin |
| Organisms | `DesktopLnb` · QuietHeader twin (`OpsApprovalQuietHeader` / `SalaryQuietHeader`) · **SummaryStrip3** (`OpsApprovalSummaryStrip` / `SalarySummaryStrip` 트윈) · **TenantCenterCard** · `EntityRowActions`(⋯) |
| Template | `ErpPageShell` · Ops shell stage · `AdminCommonLayout`/`ContentArea`(main FE ops) |

**공통 모듈 검토**

- **재사용**: DesktopLnb, QuietHeader twin, SummaryStrip twin, EmptyState, MGButton, EntityRowActions, UnifiedModal, SafeText, KpiNumeral, ErpPageShell  
- **신규 허용**: `TenantCenterCard` organism(또는 molecule) — 본 Must-ship 카드 anatomy만. 장부/스케줄/급여 카드 복제 금지  
- **신규 금지**: ops ledger strip · schedule widget · payroll todo · custom overlay shell · 삭제 danger 플로우

캡슐화: **Shell IA**(`OPS_SHELL_PHASE1…`) / **Tenant full body**(본 문서 Phase 1.5) / **PG approval chrome** / **#919 로직** / **센터 PG** 경계 분리.

---

## 10. 상호작용·상태

| 상태 | 스펙 |
|------|------|
| Default (목록 ≥1) | strip3 + toolbar + card grid. 각 카드: 이름·status·isolation·subdomain·들어가기·⋯ |
| Empty 0 | strip는 0/0/0 유지 가능 · toolbar 유지 · stage 안 Empty「등록된 센터가 없습니다.」— **coming 카피 금지** |
| 필터 후 0 | strip는 전체 count 유지(또는 필터 반영 — 구현 단일 선택) · Empty「조건에 맞는 센터가 없습니다.」 |
| Loading | stage 안 skeleton/UnifiedLoading twin · 이모지 없음 |
| Error | stage 안 짧은 한국어 caption + ghost「다시 시도」· 카드/스트립 폴백으로 에러 숨기지 말 것 |
| Forbidden / 비Ops | 기존 ProtectedRoute / ops auth. 짧은 Forbidden 메시지(한국어) |
| 정지 / 재개 | ⋯ → UnifiedModal Confirm → 성공 시 목록·strip 갱신. 삭제 UI 없음 |
| 들어가기 (승인 대기 포함) | 센터 컨텍스트 진입 — CTA 활성 유지 |
| Phase 1 coming body | **제거·대체** (historical). Shell Topbar/LNB만 유지 |

---

## 11. Historical — Phase 1 empty/coming (superseded for body)

> 아래는 **이전 Phase 1 Must-ship**이다. Shell chrome은 유효하나, **본문 empty/coming 계약은 Phase 1.5로 대체**되었다. 코더가 coming 카피·Empty-only 본문을 「완료」로 두면 FAIL.

| 블록 | 이전 계약 (본문 · superseded) |
|------|-------------------------------|
| 본문 | Quiet header → paper stage → EmptyState twin only |
| Title | 테넌트 관리를 준비 중입니다 |
| Supporting | 센터 목록과 운영 도구는 이후 단계에서 제공됩니다. |
| OUT이었던 것 | strip3 · search · cards · 들어가기 · ⋯ · 정지/재개 |

**유지되는 Phase 1 shell 계약**: LNB **테넌트 → PG 승인 → 현황** · Topbar **`ops · 테넌트 격리`** · slate LNB · `--mg-v2-*` · B0KlA 없음.

---

## 12. #919 / Shell / 본 문서 경계

| 유지 (#919 · 센터 PG) | Shell | 본 문서 (Tenants Phase 1.5) |
|------------------------|-------|------------------------------|
| Confirm 게이트·마스킹·승인 API | slate LNB + quiet + stage | 테넌트 **풀 관리 본문** |
| Center `/tenant/pg-configurations` | LNB 3항 순서·라벨 | Quiet「테넌트」· strip3 · cards |
| PG「승인 검토」「거부 검토」시각 | 현황 = summary | Topbar `ops · 테넌트 격리` |
| | PG = Phase 1 main chrome | optional「결제 연결 보기」= overflow only · 센터 PG **diff 0** |

상호 링크:

- Shell: `docs/design-system/OPS_SHELL_PHASE1_CLINIC_OS_HANDOFF.md`
- 본문: `docs/design-system/OPS_TENANTS_CORE_CLINIC_OS_HANDOFF.md` (이 파일)

---

## 13. Layout + Critic PASS 체크 (디자이너 고정 · Phase 1.5 Must-ship)

- [x] LNB: **테넌트 → PG 승인 → 현황**
- [x] 본문: Header → SummaryStrip3(전체·운영중·정지) → search/filter → TenantCenterCard grid
- [x] Card: 센터명 · status · quiet isolation(slate/ghost · quieter) · subdomain · 「센터 들어가기」h~36 · ⋯(상세·정지·재개 · optional 결제 연결 · **삭제 없음**)
- [x] 승인 대기에서도 「센터 들어가기」허용
- [x] Empty 0: 「등록된 센터가 없습니다.」— Phase 1 coming 카피 미사용
- [x] Topbar: `ops · 테넌트 격리`
- [x] `--mg-v2-*` only · B0KlA/새 팔레트/구어체 없음 · 좌측 4px accent 없음
- [x] 장부·스케줄·급여 ops 이식·발명 없음 · #919 / 센터 PG 재설계 없음
- [x] Phase 1 empty/coming = historical (shell chrome만 유지)

---

## 14. 코더 체크리스트 (Must-ship full body)

- [ ] `--mg-v2-*`만 · 신규 hex·B0KlA·좌측 accent 없음
- [ ] LNB 순서: **테넌트 · PG 승인 · 현황** (`opsShell` IA 상수와 문서 일치)
- [ ] Quiet header「테넌트」+ Topbar「ops · 테넌트 격리」
- [ ] **SummaryStrip3**: 전체 · 운영중 · 정지 (count + 라벨 · SummaryStrip twin)
- [ ] **Toolbar**: 센터명/서브도메인 검색 + 상태 filter(전체/운영중/정지/승인 대기)
- [ ] **TenantCenterCard grid** in paper stage: 센터명 · status · quiet isolation(slate/ghost) · subdomain
- [ ] CTA「**센터 들어가기**」height ~36 (`var(--mg-spacing-36)`) — **승인 대기 포함 활성**
- [ ] ⋯: **상세 · 정지 · 재개** · (optional) **결제 연결 보기** — **삭제 없음**
- [ ] Empty 0: 「**등록된 센터가 없습니다.**」— Phase 1 coming 카피(**준비 중입니다** 등) **제거·미사용**
- [ ] Phase 1 EmptyState-only 본문 제거(또는 Must-ship 본문으로 대체) · shell chrome 유지
- [ ] UnifiedModal로 상세/정지·재개 Confirm · EntityRowActions ⋯ 재사용
- [ ] 이모지 없음 · 영문 tenantId 제목 없음 · 구어체 없음
- [ ] #919 · 센터 PG · 장부/스케줄/급여 **회귀·이식·발명 없음**
- [ ] `safeDisplay` / SafeText 표시 경계
- [ ] hardcoding gate §17 / SETTINGS §1.3 / PRE_PRODUCTION — 신규 CSS hex 금지
- [ ] DesktopLnb · QuietHeader · SummaryStrip twin · ErpPageShell / stage · EmptyState · MGButton 재사용

---

## 15. 참조

- `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`
- `docs/design-system/OPS_SHELL_PHASE1_CLINIC_OS_HANDOFF.md`
- `docs/design-system/OPS_APPROVAL_CENTER_CLINIC_OS_HANDOFF.md` (quiet · SummaryStrip · stage twin)
- `docs/design-system/TENANT_PG_CONFIGURATION_CLINIC_OS_HANDOFF.md` (센터 경계)
- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` (EmptyState · UnifiedModal · BadgeSelect 우선)
- `frontend/src/styles/tokens/design-v2-tokens.css` (`--mg-v2-*`)
- Twins: `OpsApprovalQuietHeader`, `OpsApprovalSummaryStrip`, `SalaryQuietHeader`, `SalarySummaryStrip`, `EmptyState` / `ErpEmptyState`, `EntityRowActions`, `.ops-approval__stage`, `ErpPageShell`, `DesktopLnb`, `MGButton`, `UnifiedModal`
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17
- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
