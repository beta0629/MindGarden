# Clinic-OS · 통합스케줄 사이드바 카드 (v2)

**범위**: 통합스케줄 사이드바 카드만  
**원칙**: 쉽고·편하고·가지고 싶게 · Clinic-OS · ink/slate · 녹색 칩/라인 금지 · 표준어 · AI티/템플릿 금지  
**v1**: 칩 나열 + 가로 3버튼 / 세로 4버튼 SaaS — **폐기**.

참조: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md` (teal CTA, brick danger).  
시안 SSOT: `clinic-os-sidebar-cards-tobe.html` v2 (토큰은 본 문서에 고정).

---

## TO-BE v2

1. **이중 신원 스택** — 상담 / 내담자 두 줄(역할 caption 위, 이름 bold) · 패키지는 내담자 이름 아래 muted  
2. **회기** — 카드 상단 ink 헤어라인 트랙(티켓) · 수치(잔여 등)는 메타 mute 문장에  
3. **메타** — 칩 구름 금지. 할 일만 amber 필 1개(예: 결제 대기). 나머지 `잔여 0 · 일정 미등록` mute 문장. 녹색 칩/라인 금지.  
4. **액션** — 1행 `일정 등록` ghost + `당일 결제` primary(틸=CTA만) · 2행 `패키지 변경` · `배정 취소` 둘 다 ghost · **카드 액션 버튼 height 36** (row1+row2) · 배정 취소 brick 글자 `#A84848` + soft border `#F1D4D4`  
5. **카드**: paper `#FAF9F7` · 1px `#E2E8F0` · radius ~14 · 선택 시 `#E2E8F0` fill + 1px `#94A3B8`

**독특한 점**: 티켓 상단 트랙 + 할 일 필 하나. 보조 ghost 2열.  
**Worth fixing**: 티켓 레일 대비↑; 할 일 없으면 mute meta만.

### 토큰 (tobe HTML v2)

| 요소 | 값 |
|------|-----|
| Paper fill | `#FAF9F7` |
| Paper / ghost border | 1px `#E2E8F0` |
| Card radius | ~14 (`14px`) |
| Selected fill / border | `#E2E8F0` / `#94A3B8` |
| Ticket track height | **3px** |
| Ticket rail bg | `#E2E8F0` (별도 dark border 없음) |
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

### 제약

- Screen-local styles OK. 글로벌 DS 신규 발명 금지. Hex 화면 로컬 허용.  
- 핸들러 유지 (DOM restyle only).  
- React #130: `safeDisplay` / `SafeText` / `toDisplayString` 유지.

---

## Ship checklist

- [x] SessionProgressIndicator 카드에서 제거/대체 → ticket track  
- [x] dual identity captions (상담/내담자)  
- [x] package muted under client name  
- [x] ≤1 amber todo pill (`#FEF3C7`/`#92400E`, no amber border); no green chip classes on card meta  
- [x] mute meta sentence includes remaining + schedule  
- [x] 2-row actions; row1 schedule ghost + 당일 결제 primary teal; row2 package+cancel ghost; **all card action btns h36**; cancel brick text `#A84848` + soft border `#F1D4D4`  
- [x] paper `#FAF9F7` · radius ~14 · border `#E2E8F0`  
- [x] ticket track **3px** · rail `#E2E8F0` · fill `#0F172A` (no dark rail border)  
- [x] selected chrome SSOT5 only (tabs/status v3 untouched)  
- [x] UI copy 「배정」 not 「매칭」; API matching ids unchanged  
- [x] handlers preserved (DOM restyle only)  
- [x] Compact row out of scope (no behavior change)  
- [x] i18n checkoutSameDayPayment → 「당일 결제」  
- [x] structure + CSS token tests green (`#FAF9F7`, `#F1D4D4`, ticket 3px/`#0F172A`/`#E2E8F0`)  
