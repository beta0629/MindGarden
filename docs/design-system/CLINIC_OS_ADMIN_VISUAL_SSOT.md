# Clinic-OS 운영자/어드민 비주얼 SSOT

**대상**: 코더·디자이너가 Core Solution **운영자/어드민** 화면을 한 페이지씩 맞출 때  
**범위**: docs only — 이 문서는 스펙이다. 제품 UI 리스타일 금지.  
**배경**: 센터장(이재학) — 문제는 **불일치**. Clinic-OS LOCKED와 Legacy B0KlA/Pencil **두 디자인 언어**가 공존한다. 이후 어드민은 **이 문서 한 언어**만 따른다.

## Default format = Admin Dashboard V2 (opening contract)

**기본 포맷은 Admin Dashboard V2다.** 폰트·버튼 색·레이아웃 등 기본 요소는 **통일감**을 지킨다. 신규·리스타일 대상: 장부(`/erp/financial`), 이번 달 돈, 급여, 경비, 통합스케줄, 상담일지 및 기타 운영자/어드민 본문.

| # | 영역 | 계약 |
|---|------|------|
| 1 | **Type** | 4단계만 — h1 1.75rem/700, h2 1.375rem/700, body-md 0.875rem, caption 0.75rem. **추가 크기 금지.** `--mg-v2-font-family-base`(Admin Dashboard V2 폰트 스택, Pretendard/`Noto Sans KR`/system) 사용. |
| 2 | **Buttons** | `MGButton` **solid primary** dusty teal `#0E5F5A` / hover `#0A4F4B` / label `#FAF9F7`. Ghost = slate `#0F172A`. Danger = muted brick `#A84848` (**삭제만**). 페이지별 hex·one-off CSS 금지. dashboard CTA와 동일 높이·radius (~40px / 44px mobile, radius 10px). |
| 3 | **Layout** | quiet header + summary strip + **main stage 카드 하나**. 왼쪽 4px accent bar·스프라이트·Pencil/B0KlA 금지. spacing = `--mg-v2-space-*`. 테이블↔캘린더 등 뷰 토글 시 **동일 stage 기하**. |
| 4 | **Conformance** | 위와 다르면 **로컬 스타일이 아니라 SSOT 위반(버그)**. dashboard V2와 어긋나면 수정 대상. |

아래 §A–G는 위 opening contract의 **토큰·체크리스트 상세**다.

---

## A. Source of truth

| 항목 | 값 |
|------|-----|
| 비주얼 레퍼런스 | Admin Dashboard V2 (`AdminDashboardV2` / `.dev` 어드민 대시보드) |
| 토큰 | `frontend/src/styles/unified-design-tokens.css`, `frontend/src/styles/tokens/design-v2-tokens.css` (`--mg-v2-*`) |
| 셸 | `AdminCommonLayout` + `ContentArea` / `ContentHeader` / `ContentSection` / `ContentCard` |

이 문서는 운영자/어드민 화면에 대해 **`PENCIL_DESIGN_GUIDE.md`를 대체**한다. Pencil은 B0KlA 아티팩트용 역사 문서이며, **신규 어드민 화면에 쓰지 않는다.**

---

## B. Color

Hex는 **참고만**. 구현은 토큰. 새 팔레트 금지. 신규/개편 화면에서 forest `#3D5246`을 primary로 쓰지 않는다.

| 역할 | Hex (참고) | 토큰 |
|------|------------|------|
| text | `#0F172A` | `--mg-v2-color-text-primary` |
| secondary | `#475569` | `--mg-v2-color-text-secondary` |
| primary / teal | `#0E5F5A` | `--mg-v2-color-primary-main` |
| solid CTA | light `#0E5F5A` / dark `#0F766E` | `--mg-v2-color-primary-solid` |
| page | `#FAF9F7` | `--mg-v2-color-neutral-50` |
| surface | `#F5F3EF` | `--mg-v2-color-neutral-100` |
| hairline | `#D4CFC8` | `--mg-v2-color-neutral-300` (또는 `--mg-v2-color-border-default`) |
| danger | `#A84848` | `--mg-v2-color-semantic-error` |
| income (calendar money only) | `#A84848` | `--mg-v2-color-semantic-error` |
| expense (calendar money only) | `#0284C7` | `--mg-v2-color-semantic-info` |

> 구스펙의 `danger-main` 토큰명은 **존재하지 않는다**. danger는 반드시 `--mg-v2-color-semantic-error`만 쓴다.

### Calendar money color contract (LedgerCalendar only)

**스캔 가능성**을 위해 캘린더 그리드·일별 상세 목록의 **금액 숫자만** 아래 색을 쓴다. 페이지 크롬·`MGButton` primary CTA(돈 기록, 이 날짜에 기록)는 dashboard dusty teal `#0E5F5A` 그대로 — teal을 수입색으로 쓰지 않는다.

| 의미 | 색 | 토큰 | 적용 |
|------|-----|------|------|
| 들어온 돈 (income) | muted brick red | `--mg-v2-color-semantic-error` | `+1,234,000원` · 모바일 income dot |
| 나간 돈 (expense) | clinic blue | `--mg-v2-color-semantic-info` | `−1,234,000원` · 모바일 expense dot |

- 접두 `+` / `−` 유지. 금액은 `formatKrw` → `1,234,000원`.
- 셀·금액 행: 8–12% `color-mix` wash (info/error tint). loud fill·neon blue 금지.
- 구현: `LedgerCalendar.css` — 컴포넌트에 hex 직접 금지.

### Button color contract — detail (§ opening #2)

페이지마다 버튼 색이 달라지면 **버그**다. [Default format §2](#default-format--admin-dashboard-v2-opening-contract)와 동일.

| 역할 | 구현 | 색·토큰 |
|------|------|---------|
| **Primary (페이지당 하나)** | `MGButton` **solid primary** only | Fill: `var(--mg-v2-color-primary-solid)` / `#0E5F5A` (dusty teal). Hover/active: `var(--mg-v2-color-primary-dark)` / `#0A4F4B`. Label on solid: `#FAF9F7` (또는 Admin Dashboard V2 CTA 텍스트 토큰). |
| **Secondary / ghost** | dashboard ghost | Transparent/neutral surface, slate text `#0F172A`, hairline `var(--mg-v2-color-neutral-300)`. **두 번째 “primary” 색을 만들지 않는다.** |
| **Danger (삭제만)** | solid danger variant | Muted brick `var(--mg-v2-color-semantic-error)` / `#A84848` — **페이지의 main CTA로 쓰지 않는다.** |

**치수 (desktop / mobile):** 높이 ~40px desktop · 44px mobile (`--mg-v2-touch-target-min`), radius 10px (`--mg-v2-radius-md`), padding 10–20px — **돈 기록** / dashboard primary와 동일.

**금지 (Forbidden):**

- Pencil/B0KlA forest `#3D5246`을 버튼 fill로
- 페이지별 custom hex·one-off CSS `color`/`background`로 primary 흉내
- leftover `--mg-color-error` pink를 일반 액션에
- 텍스트만 teal인 링크/ghost가 main CTA인 경우 (예: `ledger-calendar__add-on-date`가 `color: primary-main`만 주던 패턴)

**신규 어드민 화면**은 반드시 `MGButton` variant로만 액션 색을 표현한다. dashboard primary solid와 다르면 수정 대상이다.

---

## C. Type

[Default format §1](#default-format--admin-dashboard-v2-opening-contract) 상세. 4단계만. 5번째 추가 금지. caption 미만 축소 금지.

| 용도 | 토큰 | 크기 |
|------|------|------|
| 페이지 제목 | `--mg-v2-font-size-h1` | 1.75rem (28px) |
| 섹션·히어로 금액 | `--mg-v2-font-size-h2` | 1.375rem (22px) |
| 테이블·버튼·폼 | `--mg-v2-font-size-body-md` | 0.875rem (14px) |
| 라벨·보조 | `--mg-v2-font-size-caption` | 0.75rem (12px) |

- 제목·금액 weight: `--mg-v2-font-weight-semibold` (600) / `--mg-v2-font-weight-bold` (700)
- 숫자: `tabular-nums`
- 금액: `formatKrw` → `1,234,000원` (금액에 `건` 금지)

---

## D. Chrome contract (모든 어드민 페이지)

[Default format §3](#default-format--admin-dashboard-v2-opening-contract) 상세.

1. **Quiet page header**: 제목(h1) + 선택적 기간 세그먼트 + primary `MGButton` CTA **하나**. 테넌트 서브타이틀·「새로고침」 두번째 툴바 행·`ErpFilterToolbar`를 페이지 크롬으로 쓰지 않는다.
2. **선택 요약 스트립**: 동일 너비 3셀, surface + hairline. **왼쪽 4px 악센트 바 금지**. lucide/아이콘 타일 금지.
3. **Main stage**: 카드 기하 하나 — `border 1px` neutral-300, `--mg-v2-radius-lg`, `neutral-50`. 테이블·캘린더가 있으면 **같은 stage** (`min-height` ~36rem). 토글 시 높이 단차 금지.
4. **Actions**: `MGButton` / `ActionBar`만. **Primary = solid primary (dashboard teal) 하나.** Secondary = ghost/outline. 동일 높이 (~40px / 44px mobile). outline vs solid로 “두 primary” 금지. → [Button color contract](#button-color-contract-admin--operator-pages--hard-rule)
5. **Calendar** (있을 때): 7×6 가독 월. 일 숫자 + `formatKrw` 최대 2줄. **금액 색: income = `--mg-v2-color-semantic-error`(red), expense = `--mg-v2-color-semantic-info`(blue)** — [Calendar money color contract](#calendar-money-color-contract-ledgercalendar-only). lucide 칩·그리드 아래 B0KlA KPI 덤프·페이지 기간과 싸우는 두번째 월 nav 금지.
6. **Empty**: `EmptyState`, 이모지 없음.

---

## E. Forbidden (운영자/어드민 앞으로)

- 왼쪽 컬러 악센트 바 (B0KlA 섹션/카드 레일)
- 스프라이트·이모지·아이콘 그리드를 주 내비로
- 플랫폼 크롬에 MindGarden 로고/히어로 (테넌트는 테스트만)
- 회계사 균등 탭(차변/대변/대차)을 기본 뷰로
- 라벨 **순이익** → **남은 돈** 사용
- `ErpFilterToolbar` + lucide 덤프를 페이지 정체성으로
- **신규** organism에 `AdminDashboardB0KlA.css` import (레거시 대시보드만 잔존 허용, 해당 페이지 walk 시 제거)

---

## F. Page-walk order

이 PR은 **SSOT만**. 아래 페이지를 이 PR에서 구현·리스타일하지 않는다.

| # | 대상 | 비고 |
|---|------|------|
| 0 | 이 SSOT | 본 PR |
| 1 | `/erp/financial` 들어온 돈 · 나간 돈 | LedgerCalendar — income red / expense blue + design pass |
| 2 | `/erp/dashboard` 이번 달 돈 | |
| 3 | `/erp/salary` 상담사 지급 | |
| 4 | `/erp/purchase` 센터 경비 | |
| 5 | 통합스케줄 | |
| 6 | 상담일지 / 기타 어드민 본문 | |

Admin Dashboard V2는 **레퍼런스**다. 1차 패스에서 리스타일하지 않는다(이미 제거된 레일/스프라이트 잔여만 예외).

---

## G. Per-page checklist (복사해서 사용)

```text
[ ] Default format = Admin Dashboard V2 (type · buttons · layout 통일 — 어긋나면 버그)
[ ] Type: 4단계만 h1/h2/body-md/caption · V2 font stack · 추가 크기 없음
[ ] Quiet header: h1 + (선택) 기간 + primary MGButton 하나
[ ] 테넌트 서브타이틀 / 새로고침 2열 / ErpFilterToolbar 페이지 크롬 없음
[ ] 요약 스트립 있으면 3등분 · surface+hairline · 좌측 4px 바·아이콘 타일 없음
[ ] Main stage 하나: border 1px neutral-300, radius-lg, neutral-50
[ ] 테이블↔캘린더 동일 stage · min-height ~36rem · 단차 없음
[ ] Actions: MGButton/ActionBar만 · primary = dashboard solid teal 하나 · secondary ghost · danger = 삭제만
[ ] Primary buttons = dashboard MGButton solid (페이지마다 색 다르면 버그)
[ ] Calendar: 7×6 · day+formatKrw≤2줄 · income red / expense blue (calendar money only) · lucide칩/KPI덤프/이중월nav 없음
[ ] EmptyState · 이모지 없음
[ ] 색: --mg-v2-* 토큰만 · #3D5246 primary 아님 · danger = --mg-v2-color-semantic-error
[ ] 타이포 4단계만 · 제목/금액 600–700 · tabular-nums · formatKrw「원」
[ ] 「순이익」없음 → 「남은 돈」
[ ] AdminDashboardB0KlA.css 신규 import 없음
[ ] AdminCommonLayout + ContentArea/Header/Section/Card
```

---

## 참조

- 레거시(역사): [PENCIL_DESIGN_GUIDE.md](./PENCIL_DESIGN_GUIDE.md) — B0KlA/.pen 전용, 신규 어드민 금지
- 상위 진입: [MINDGARDEN_DESIGN_SSOT.md](./MINDGARDEN_DESIGN_SSOT.md)
- 토큰: `frontend/src/styles/tokens/design-v2-tokens.css`
