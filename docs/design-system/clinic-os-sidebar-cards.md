# Clinic-OS · 통합스케줄 사이드바 카드 (v2.1)

**범위**: 통합스케줄 사이드바 카드만  
**원칙**: 쉽고·편하고·가지고 싶게 · Clinic-OS · ink/slate · 녹색 칩/라인 금지 · 표준어 · AI티/템플릿 금지  
**v1**: 칩 나열 + 가로 3버튼 / 세로 4버튼 SaaS — **폐기**.  
**v2**: 세로 dual-identity 스택 — **폐기**. **v2.1 = PASS·Ship.**

참조: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md` (teal CTA, brick danger).  
시안 SSOT: 본 문서 토큰 고정 (ops rail contrast 반영).

---

## TO-BE v2.1

1. **Horizontal identity** — 한 줄: `상담 {name}` | `내담자 {name}` (역할 regular + 이름 bold). **세로 dual-identity 스택 금지.**  
2. **패키지명**(있을 때) — 수평 신원 라인 **아래** muted subtitle (client identity 세로 블록 안이 아님).  
3. **회기(티켓 트랙)** — 카드 상단 ink 헤어라인 progress rail · 수치(잔여 등)는 메타 mute. **대비 수정**: rail bg `#CBD5E1`(구 `#E2E8F0`는 paper `#FAF9F7`에서 안 보임) · fill `#0F172A` · height **3px**.  
4. **메타** — 칩 구름 금지. ≤1 amber todo pill (`#FEF3C7`/`#92400E`). 없으면 mute만: `잔여 N · 일정 미등록`. **녹색/틸 status 칩 금지.**  
5. **액션** — Row1: ghost `일정 등록` + primary teal `당일 결제`(짧은 라벨). Row2: ghost `패키지 변경` + ghost brick `배정 취소`(`#A84848` / border `#F1D4D4`). Height **36**. **세로 4 equal CTA 금지.** Face 「상세」 **제거** — peek는 카드 body 클릭(`onOpenPeek`).  
6. **카드 크롬**: paper `#FAF9F7` · 1px `#E2E8F0` · radius ~14 · 선택 시 `#E2E8F0` fill + 1px `#94A3B8`.

**독특한 점**: 티켓 상단 트랙 + 할 일 필 하나. 보조 ghost 2열.  
**Worth fixing**: 긴 이름 truncate(ellipsis); 티켓 레일 대비; 할 일 없으면 mute meta만.

### 토큰 (v2.1)

| 요소 | 값 |
|------|-----|
| Paper fill | `#FAF9F7` |
| Paper / ghost border | 1px `#E2E8F0` |
| Card radius | ~14 (`14px`) |
| Selected fill / border | `#E2E8F0` / `#94A3B8` |
| Ticket track height | **3px** |
| Ticket rail bg | `#CBD5E1` (별도 dark border 없음) |
| Ticket fill (progress) | `#0F172A` |
| Amber todo pill | bg `#FEF3C7` / text `#92400E` (amber border 없음) |
| Primary CTA | teal `#0E5F5A` |
| Cancel text | `#A84848` |
| Cancel border | `#F1D4D4` |
| Card action button height | **36px** (row1+row2) |

### Amber 할 일 필 — 우선순위 (≤1)

동시에 여러 할 일이 있어도 **하나만** 표시한다.

| 순위 | 조건 | 라벨 |
|------|------|------|
| 1 | `status === PENDING_PAYMENT` | 결제 대기 |
| 2 | desync CANCEL | 배정 취소 필요 |
| 3 | desync CLEANUP | 일정 정리 필요 |
| 4 | desync STATUS | 상태 불일치 |
| 5 | `pendingSessionExtension` | 회기추가 입금대기 (+N회기) |

할 일이 없으면 amber 필 없이 mute 문장만.

### Mute meta 문장

형식: `잔여 {n} · {일정 상태 라벨}`  
예: `잔여 0 · 일정 미등록`, `잔여 8 · 일정 등록 · 7/20`

### Selected chrome (SSOT5 only)

| 상태 | fill | border |
|------|------|--------|
| default | `#FAF9F7` | 1px `#E2E8F0` |
| selected (peek) | `#E2E8F0` | 1px `#94A3B8` |

탭/상태 필터 v3 CSS·마크업 변경 금지. Compact row out of scope.

### Copy

- UI: 「배정」 not 「매칭」; API matching ids unchanged  
- i18n `mapping.card.actions.checkoutSameDayPayment` → 「당일 결제」  
- 배정 취소 라벨 유지  
- Face 「상세」 미사용 (body click peek)

### 제약

- Screen-local styles OK. 글로벌 DS 신규 발명 금지. Hex 화면 로컬 허용.  
- 핸들러 유지 (DOM restyle + face 상세 제거만).  
- React #130: `safeDisplay` / `SafeText` / `toDisplayString` 유지.

---

## Ship checklist

- [x] SessionProgressIndicator 카드에서 제거/대체 → ticket track  
- [x] **Horizontal identity** (`상담 {name}` | `내담자 {name}`); vertical dual-identity stack discarded  
- [x] package muted **below** parties-line (not nested under client identity column)  
- [x] ≤1 amber todo pill (`#FEF3C7`/`#92400E`, no amber border); no green chip classes on card meta  
- [x] mute meta sentence includes remaining + schedule (no-pill → mute only)  
- [x] 2-row actions; row1 schedule ghost + 당일 결제 primary teal; row2 package+cancel ghost; **all card action btns h36**; cancel brick text `#A84848` + soft border `#F1D4D4`  
- [x] Face 「상세」 removed; peek via card body (`onOpenPeek`)  
- [x] paper `#FAF9F7` · radius ~14 · border `#E2E8F0`  
- [x] ticket track **3px** · rail `#CBD5E1` · fill `#0F172A` (no dark rail border)  
- [x] selected chrome SSOT5 only (tabs/status v3 untouched)  
- [x] long-name truncate (ellipsis) on identity names  
- [x] UI copy 「배정」 not 「매칭」; API matching ids unchanged  
- [x] handlers preserved (DOM restyle + remove face 상세 only)  
- [x] Compact row out of scope (no behavior change)  
- [x] i18n checkoutSameDayPayment → 「당일 결제」  
- [x] structure + CSS token tests green (`#FAF9F7`, `#F1D4D4`, ticket 3px/`#0F172A`/`#CBD5E1`)  
