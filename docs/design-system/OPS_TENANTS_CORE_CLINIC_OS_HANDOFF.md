# Clinic-OS Ops Tenants — Phase 1 Empty / Coming UI/UX 스펙 (Design Handoff)

**대상**: Ops `/tenants` — **empty / coming 본문만** (풀 관리 본체 아님)  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`  
**Shell / LNB IA**: `docs/design-system/OPS_SHELL_PHASE1_CLINIC_OS_HANDOFF.md` (slate LNB · quiet · paper **유지**)  
**센터 PG 경계**: `docs/design-system/TENANT_PG_CONFIGURATION_CLINIC_OS_HANDOFF.md` — **센터 `/tenant/pg-configurations` 재작업 금지**  
**브랜치**: `cursor/clinic-os-ops-shell-phase1-06c5` (구현은 core-coder)  
**작성**: core-designer · `/core-solution-design-handoff` · `/core-solution-common-modules` · `/core-solution-encapsulation-modularization`  
**권위**: Leader Phase 1 축소 — **Phase 1 = ops shell + PG only**. 테넌트는 **LNB slot + clean empty/coming**.  
**범위**: Frontend chrome / empty anatomy / 카피 계약만. **승인 API·마스킹·Confirm 게이트(#919)·센터 장부·스케줄·급여 ops 이식 금지**.

> ### Phase authority banner
>
> | Phase | 계약 |
> |-------|------|
> | **Phase 1 (본 문서 · Must-ship)** | LNB「테넌트」= **slot**. 본문 = Clinic-OS 품질 **EmptyState twin** (title + supporting 1문장). strip3 · search · cards · ⋯ · 들어가기 · 정지/재개 **OUT**. |
> | **Phase 1.5 / 2 (Deferred)** | 풀 관리 Layout TO-BE — SummaryStrip3 · search/filter · TenantCenterCard · 「센터 들어가기」· ⋯(상세·정지·재개) · status/isolation 배지. **본 Phase에서 구현·와이어·러시 스텁으로 「완료」표시 = FAIL**. |

---

## 0. 사용자 관점

| 항목 | 내용 |
|------|------|
| **사용성** | Ops만. LNB 순서: **테넌트 · PG 승인 · 현황**. 테넌트 클릭 = **empty/coming** (관리 본체 아님). |
| **정보 노출** | 테넌트 목록·상태 count·서브도메인·정지/재개 CTA·센터 들어가기 **비노출**. 카피 **한국어만**. 이모지·영문 `tenantId` 제목 금지. |
| **레이아웃** | Quiet header h1「테넌트」→ paper stage → **EmptyState twin**. strip3 / search / cards / overflow / 들어가기 **OUT**. |

---

## 1. 개요·배경

Phase 1에서 Ops 테넌트는 shell LNB에 자리를 두되, 본문은 **관리 기능이 아직 제공되지 않음**을 Clinic-OS 톤으로 명확히 알리는 **clean empty / coming**만 둔다. 급하게 넣은 placeholder·러시 스텁·슬oppy stub는 FAIL. 새 팔레트·B0KlA·Pencil·forest primary·구어체(예: 「손볼」) **금지**.

---

## 2. OUT OF SCOPE / Forbidden

| 항목 | 이유 |
|------|------|
| strip3 · SummaryStrip · 상태 count | Phase 1 정보 비노출 · Deferred |
| search / filter · 카드 그리드 · TenantCenterCard | 풀 관리 = Phase 1.5/2 |
| 「센터 들어가기」· ⋯ overflow · 정지/재개 · 결제 연결 보기 | Deferred Layout TO-BE |
| Center ledger · 통합스케줄 · 급여 · 경비 ops port | Must-ship: Do NOT port |
| 영문 `tenantId` / UUID를 페이지·Empty 제목으로 | 표준 한국어만 |
| Topbar에 긴 디자인 코멘트 | product copy만: `ops · 테넌트 격리` |
| 새 팔레트 / B0KlA / Pencil / `#3D5246` primary / 좌측 4px accent | SSOT 위반 |
| `#919` Confirm·마스킹·센터 PG UI 재작업 | chrome/empty만; PG 로직·센터 PG **diff 0** |
| LNB에 온보딩·요금제·Feature Flag·장부 등 추가 | shell 1차 3항만 |
| 이모지 · 구어체「손볼」 · 영문 Coming soon 제목 | 카피 계약 위반 |
| rushed empty를 「풀 관리 완료」로 표시 | FAIL |

---

## 3. 레이아웃 트리 (위→아래)

### 3.1 Ops Shell 내 위치

```
OpsShell (ops-only · slate LNB 260px)
├─ LNB  (순서 확정)
│    1. 테넌트     ← SLOT (본 문서 = empty/coming 본문)
│    2. PG 승인    ← Phase 1 main chrome
│    3. 현황       ← summary only
└─ Main column
   ├─ Topbar product copy: 「ops · 테넌트 격리」
   └─ Tenant page (empty/coming only)
```

경로(계약): frontend-ops `/tenants` · main FE ops tenants twin이 있으면 동일 IA/크롬. URL은 앱별 유지 가능, **시각·카피 계약 동일**.

### 3.2 테넌트 페이지 (Phase 1 본문)

```
Quiet header
  h1「테넌트」
  (optional) ghost 없음 권장 — solid primary 헤더 CTA 없음 · 새로고침도 불필요(목록 없음)
└─ Paper stage (.ops-shell__stage / .ops-tenants__stage twin)
     border 1px var(--mg-v2-color-neutral-300)
     bg var(--mg-v2-color-neutral-50)
     radius var(--mg-v2-radius-lg) (또는 stage twin radius-md 정합)
     min-height ~36rem
     border-left: none !important
     └─ EmptyState twin (수직·수평 중앙 또는 stage 상단 1/3 앵커 — PG/현황 empty twin과 동일 정렬)
          ├─ title (한국어)
          └─ supporting 1문장 (한국어)
          └─ primary CTA: 없음 (또는 non-action — 클릭 없는 caption만)
```

**선정 이유**: Phase 1 권위 = shell + PG. 테넌트는 LNB 항복만 유지하고 본문은 정보·액션을 숨긴 clean coming. SSOT Empty = `EmptyState` · 이모지 없음.

---

## 4. EmptyState twin anatomy

### 4.1 구조

| 요소 | 계약 |
|------|------|
| 컨테이너 | stage 안 단일 EmptyState molecule — **카드 그리드·스트립과 병행 금지** |
| Title | `--mg-v2-font-size-h2` · weight 700 · `var(--mg-v2-color-text-primary)` |
| Supporting | `--mg-v2-font-size-body-md` · `var(--mg-v2-color-text-secondary)` · **1문장만** |
| Icon | 선택. 있으면 단색 slate/ghost · lucide 1개 이하. **이모지 금지**. 아이콘 타일·스프라이트 금지 |
| Primary CTA | **없음**. solid primary 버튼 배치 금지 |
| Secondary / non-action | 필요 시 caption만 (예: 경로 안내 문구 없음 — 기본은 title+supporting만) |

### 4.2 확정 카피 (한국어)

| 역할 | 문구 |
|------|------|
| **Title** | 테넌트 관리를 준비 중입니다 |
| **Supporting** | 센터 목록과 운영 도구는 이후 단계에서 제공됩니다. |

**금지 카피**: `Coming soon` · `Tenant management` · `tenantId: …` · 「손볼 예정」· 이모지 · 영문 stub.

### 4.3 정렬·여백

| 항목 | 토큰 / 규칙 |
|------|-------------|
| Stage 패딩 | `--mg-v2-space-*` (승인 stage twin과 동일 계열) |
| Empty 블록 gap (title↔supporting) | `--mg-v2-space-2` 또는 `--mg-v2-space-3` |
| 텍스트 정렬 | 중앙 (Clinic-OS EmptyState twin) |
| max-width supporting | 가독용 약 36–40ch · 하드코딩 hex 없음 |

---

## 5. 토큰 표 (요약)

| 역할 | 토큰 |
|------|------|
| Page / stage paper | `var(--mg-v2-color-neutral-50)` |
| Hairline | `var(--mg-v2-color-neutral-300)` |
| Text | `--mg-v2-color-text-primary` / `--mg-v2-color-text-secondary` |
| LNB slate | `var(--mg-v2-color-surface-sidebar)` |
| Type | h1 / h2 / body-md / caption only (`--mg-v2-font-size-*`) |
| Space / radius | `--mg-v2-space-*` · `--mg-v2-radius-md`/`lg` |
| Stage min-height | `36rem` (ops-approval / shell stage twin) |

**금지**: 신규 hex, `--ops-color-*`를 Clinic-OS primary로 유지, `--ad-b0kla-*`, 좌측 4px accent, SummaryStrip surface를 empty와 함께 깔기.

---

## 6. Topbar / Quiet header 카피

| 위치 | 카피 | 금지 |
|------|------|------|
| Topbar product | **`ops · 테넌트 격리`** | 긴 디자인 코멘트·영문 설명 문장 |
| Quiet h1 | **테넌트** | 「Tenant Management」「tenantId: …」 |
| Empty title / supporting | §4.2 | 영문 Coming soon / 구어체 |

---

## 7. 아토믹·공통 모듈 (재사용 우선)

| 계층 | 재사용 (새로 발명 금지) |
|------|-------------------------|
| Atoms | `SafeText` / 표시 경계 · (선택) 단색 icon atom |
| Molecules | **`EmptyState`** / `ErpEmptyState` twin — **필수**. ConfirmModal·overflow·search **Phase 1 미사용** |
| Organisms | `DesktopLnb` · QuietHeader twin (`OpsApprovalQuietHeader` / `SalaryQuietHeader`) — SummaryStrip·TenantCenterCard **Deferred** |
| Template | `ErpPageShell` · Ops shell stage · `AdminCommonLayout`/`ContentArea`(main FE ops) |

캡슐화: **Shell IA**(`OPS_SHELL_PHASE1…`) / **Tenant empty body**(본 문서 Phase 1) / **Tenant full management**(Deferred §9) / **PG approval chrome** / **#919 로직** 경계 분리.

---

## 8. 상호작용·상태

| 상태 | 스펙 |
|------|------|
| Default (Phase 1) | stage 안 EmptyState twin §4.2 — **목록 fetch UI·count 없음** |
| Loading | 목록을 부르지 않으면 loading 스켈레톤 **불필요**. 라우트 전환 시 기존 shell busy만 |
| Error | API를 호출하지 않는 계약이면 error UI 없음. 호출이 남아 있으면 stage 안 짧은 한국어 caption + ghost「다시 시도」· 이모지 없음 — **카드/스트립으로 폴백 금지** |
| Forbidden / 비Ops | 기존 ProtectedRoute / ops auth. 본문 대신 짧은 Forbidden 메시지(한국어) |
| Empty vs Coming | Phase 1은 **동일 컴포넌트·동일 카피**로 통일 (별도 “빈 목록 0건” UI 없음 — 목록 자체가 OUT) |

---

## 9. Deferred — Phase 1.5 / 2 Layout TO-BE (구현 금지 · 스펙 보관)

> 아래는 **이전 Must-ship이었던 풀 관리 와이어**다. Phase 1에서 코드·시각으로 끌어오지 말 것. 후속 Phase 권위가 열릴 때 이 섹션을 승격한다.

| 블록 | TO-BE 요약 |
|------|------------|
| SummaryStrip3 | 전체 · 운영중 · 정지 count · 필터 앵커 |
| Toolbar | 센터명·서브도메인 검색 / filter |
| TenantCenterCard | 센터명 first · status · quiet isolation · subdomain · 「센터 들어가기」h=36 · ⋯(상세·정지·재개 · optional 결제 연결 · **삭제 없음**) |
| 상태 카피 | 운영중 / 정지 / 승인 대기 · 들어가기는 승인 대기에서도 유지 |
| Empty (목록 0) | 「등록된 센터가 없습니다.」등 — **Phase 1 coming 카피와 별개** |

**Deferred one-liner**: 카드 그리드 · strip3 · 정지/재개 · 들어가기 = Layout TO-BE (Phase 1.5/2).

---

## 10. #919 / Shell / 본 문서 경계

| 유지 (#919 · 센터 PG) | Shell Phase 1 | 본 문서 (Tenants Phase 1) |
|------------------------|---------------|---------------------------|
| Confirm 게이트·마스킹·승인 API | slate LNB + quiet + stage | 테넌트 **LNB slot** + empty/coming |
| Center `/tenant/pg-configurations` | LNB 3항 순서·라벨 | Quiet「테넌트」· EmptyState twin |
| PG「승인 검토」「거부 검토」시각 | 현황 = summary | Topbar `ops · 테넌트 격리` |
| | PG = Phase 1 main chrome | 풀 관리 = **Deferred** |

상호 링크:

- Shell: `docs/design-system/OPS_SHELL_PHASE1_CLINIC_OS_HANDOFF.md`
- 본문: `docs/design-system/OPS_TENANTS_CORE_CLINIC_OS_HANDOFF.md` (이 파일)

---

## 11. Layout + Critic PASS 체크 (디자이너 고정 · Phase 1)

- [x] LNB: **테넌트 → PG 승인 → 현황**
- [x] 테넌트 = **slot** (main body 풀 관리 아님)
- [x] Header「테넌트」→ paper stage → EmptyState twin only
- [x] strip3 / search / cards / 들어가기 / ⋯ / 정지·재개 **OUT**
- [x] Empty 카피 한국어 twin · primary CTA 없음 · 이모지 없음
- [x] Topbar: `ops · 테넌트 격리`
- [x] `--mg-v2-*` only · B0KlA/새 팔레트/구어체 없음
- [x] 장부·스케줄·급여 ops 이식 없음 · #919 / 센터 PG 재설계 없음
- [x] Deferred 섹션에 풀 관리 Layout TO-BE 보관

---

## 12. 코더 체크리스트

- [ ] `--mg-v2-*`만 · 신규 hex·B0KlA·좌측 accent 없음
- [ ] LNB 순서: **테넌트 · PG 승인 · 현황** (`opsShell` IA 상수와 문서 일치)
- [ ] Quiet header「테넌트」+ Topbar「ops · 테넌트 격리」
- [ ] stage 안 **EmptyState twin만** — title「테넌트 관리를 준비 중입니다」· supporting「센터 목록과 운영 도구는 이후 단계에서 제공됩니다.」
- [ ] strip3 · search · cards · 「센터 들어가기」· ⋯ · 정지/재개 **미구현·미노출** (잔존 UI 제거)
- [ ] primary CTA / solid primary 버튼 없음 · 이모지 없음 · 영문 tenantId 제목 없음
- [ ] UnifiedModal/Confirm · 목록 API UI **Phase 1 불필요** (잔존 호출이 있으면 empty로만 귀결, 카드 폴백 금지)
- [ ] #919 · 센터 PG · 장부/스케줄/급여 **회귀·이식 없음**
- [ ] `safeDisplay` / SafeText 표시 경계
- [ ] hardcoding gate §17 / SETTINGS §1.3 / PRE_PRODUCTION — 신규 CSS hex 금지
- [ ] DesktopLnb · QuietHeader · ErpPageShell / stage · EmptyState 트윈 재사용

---

## 13. 참조

- `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`
- `docs/design-system/OPS_SHELL_PHASE1_CLINIC_OS_HANDOFF.md`
- `docs/design-system/OPS_APPROVAL_CENTER_CLINIC_OS_HANDOFF.md` (quiet · stage twin)
- `docs/design-system/TENANT_PG_CONFIGURATION_CLINIC_OS_HANDOFF.md` (센터 경계)
- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` (EmptyState 우선)
- `frontend/src/styles/tokens/design-v2-tokens.css` (`--mg-v2-*`)
- Twins: `EmptyState` / `ErpEmptyState`, `OpsApprovalQuietHeader`, `SalaryQuietHeader`, `.ops-approval__stage`, `ErpPageShell`, `DesktopLnb`
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17
- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
