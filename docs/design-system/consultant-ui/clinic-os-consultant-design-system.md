# Clinic-OS · 상담사(Consultant) 디자인 시스템

원칙: **쉽고·편하고·가지고 싶게** · 존댓말 준비 · 표준 문어 · AI티·범용 SaaS 슬롭 금지  
범위: `/consultant/*` 8화면 · **시안·스펙만** (제품 코드·커밋·배포 없음)

---

## 1. SSOT · 역할 표면 결정

| 항목 | 값 |
| --- | --- |
| **상담사 시각 SSOT** | `/consultant/dashboard` (mg-v2) |
| **셸 크롬** | 기존 `Admin/ConsultantCommonLayout` 그대로 (헤더·LNB·검색·세션) — 시안은 참조용 |
| **셸 폭** | `clinic-os-shell-width.md` · **본문 패딩 = 대시보드** · 중앙 max-width 카드 스택 금지 |
| **관리자 스케줄/급여 hand-feel** | `clinic-os-integrated-schedule.md` · `clinic-os-salary.md` — 역할만 다름(상담사 본인 달력 / 읽기 전용 정산) |

### 패널 표면 충돌 해소 (필수)

| 출처 | 바깥 패널 |
| --- | --- |
| 관리자 마이페이지 Q5 (리더 확정) | stone `#F5F3EF` · `1px #D4CFC8` · r12 · 그림자 없음 |
| **라이브 상담사 대시보드 (본 SSOT)** | **흰 카드 `#FFFFFF` · `1px #E2E8F0` · r12 · 그림자 없음** · stage `#FAF9F7`≈`#FAFAF8` |
| 레거시 급여(`cr-salary-settlement`) | stone/베이지 카드 — **폐기 대상** |

**결정: 상담사 SSOT = `/consultant/dashboard`(mg-v2).**  
관리자 stone을 상담사 스위트에 강제하지 않는다. 관리자 페이지는 Q5 stone 유지. 상담사는 **흰 카드 on warm stage**.

---

## 2. 실측 토큰 (대시보드 PNG · viewport ≈ 1272×2499)

> 샷이 1440 풀폭이 아님 → 절대 px는 추정 병기. 비율·색은 실측.

| 토큰 | 실측 / 권장 | 비고 |
| --- | --- | --- |
| Stage / canvas | `#FAF9F7` (250,249,247) · 문서상 `#FAFAF8` 동일 계열 | 급여 AS-IS `#FAFAFA`는 stage만 가깝고 **카드가 stone** → 교정 |
| Card / panel bg | `#FFFFFF` | |
| Card border | `1px #E2E8F0` (226,232,240) | 그림자 **없음** |
| Card radius | **12** | KPI·리스트 카드 공통 |
| LNB bg | `#0F172A` (15,23,42) | |
| LNB width | **260** | 실측 우엣지 ≈ x260 |
| LNB active | fill `#0E5F5A` · 흰 글자 · r8 | 크롬 유지 |
| Header | h≈**64** · `#FFFFFF` · bottom `1px` warm/`#E2E8F0` | quiet |
| Primary | `#0E5F5A` | CTA·차트·강조 숫자 |
| Content pad (LNB→카드) | **64** (260+64→**x324** @1440) | `main 32 + ContentArea 32` · 시안 `.stage{padding: 32px **64px** …}` · **대시보드와 동일 필수** |
| Content right edge | **x1376** @1440 (1440−64) | 카드·스트립 우엣지 · full-bleed ≠ 엣지 붙임 |
| 버튼 (라이브 대시보드 primary) | **h36** · fill `#0E5F5A` | 「일지 작성」실측 fill h≈36 |
| 버튼 권장 (스위트 공유) | **MGButton 기본 h36 · r8** | 칩/필터 denser는 h32 r8 허용. **한 화면 안에서 32·36 혼용 금지** |
| Selection (콘텐츠) | bg `#E2E8F0` · border `1px #94A3B8` | **teal ring / teal wash 금지** |
| Ink | `#0F172A` | 제목 |
| Mute | `#64748B` | 부제·메타 |
| Sub | `#475569` | 라벨 |
| Disabled | `#94A3B8` | |
| Spacing scale | **8 / 12 / 16 / 24 / 32** | 섹션 간격 24–32 · 카드 내 16–24 |
| Type | Pretendard / system-ui | H1 ≈ 1.75rem · H2 ≈ 1.125–1.375rem · body 0.875 · cap 0.75 |
| Money | **`N원`** (예: `4,440,000원`) · 금액 색 **ink `#0F172A`** | **₩ · ￦ · WON 금지** · 실수령·KPI **틸/초록 금지** · 공제(out) 파랑 허용 · PG 벤더명 UI 노출 금지 |
| 숫자 | tabular-nums · 천단위 콤마 | |

---

## 3. 셸 · 레이아웃

```
┌─ Header 64 (quiet) ─────────────────────────────┐
│ brand │ 통합 검색… │ 알림 · 프로필 · 세션 잔여   │
├─ LNB 260 ─┬─ Stage (canvas) ────────────────────┤
│ 상담       │  pad 32(+ContentArea 32) full-bleed │
│ · 대시보드 │  제목행 → (요약/필터) → 본문 카드   │
│ · …        │  중앙 max-width 스택 금지           │
└───────────┴─────────────────────────────────────┘
```

- **1440 게이트:** 본문 카드 좌우 엣지 = **x324–x1376** (대시보드 Ship 게이트와 동일). 패딩 32만 두면 FAIL.
- **모바일 390:** LNB 접힘(기존 셸) · 본문 단일 열 · 가로 스크롤 금지 · pad 16–24.
- 페이지 전용 좁은 max-width 래퍼 = FAIL (`clinic-os-shell-width.md`).

---

## 4. 컴포넌트

### 4.1 버튼
| 종류 | 스펙 |
| --- | --- |
| Primary | h36 · r8 · bg `#0E5F5A` · 글자 `#FAF9F7` · **화면당 1개** |
| Ghost / secondary | h36 · r8 · bg `#FFF` · `1px #E2E8F0` · ink |
| Icon / kebab | 36×36 · r8 · 동일 ghost |
| Chip (필터·뷰 토글) | h32 · r8 · idle: `#FFF`+`#E2E8F0` · **선택: `#E2E8F0`+`1px #94A3B8`** (월/주/일·상태 필터 동일 · teal fill 금지 — LNB만 teal) |
| Danger | 상담사 스위트 기본 없음 (삭제·지급 CTA 없음) |

### 4.2 카드 · 패널 · KPI
- Outer: `#FFF` · `1px #E2E8F0` · r12 · shadow **none** · pad 16–24
- KPI 스트립: 4열(데스크톱) / 2열(390) · 라벨 mute · 값 ink bold · 단위 「건」「명」
- 리스트 행: 가로 divider `#E2E8F0` · 세로선 없음 · row min ≈ 48

### 4.3 칩 · 상태
| 상태 | 톤 |
| --- | --- |
| 완료 / 지급됨 | `#F1F5F9` bg · `#475569` text (slate · **틸/초록 필 금지**) |
| 대기 / 지급대기 | `#F1F5F9` bg · `#475569` text |
| 높음(위험) | `#FFF7ED` · `#C2410C` |
| 진행중 | `#F1F5F9`/`#EBE6DF` bg · ink `#0F172A` (slate · **초록 필 금지**) |
| 필터 선택 | **slate** `#E2E8F0`/`#94A3B8` — teal 아님 |

### 4.4 달력 (상담사 본인 일정 · P0)
관리자 통합스케줄과 **크롬·칩·empty/loading 토큰 공유**. 역할 차이만 유지.

| 요소 | 스펙 |
| --- | --- |
| 월 네비 | ⟨ ⟩ · `YYYY년 M월` · 월/주/일 세그먼트 = **선택 칩** (`#E2E8F0` + `1px #94A3B8`) · **primary fill 금지** (primary는 행동 CTA 전용) |
| 그리드 | 7열 · 셀 r8 · 셀 구분 `#E2E8F0` · 주말/공휴일 워시 과하지 않게 (연한 warm 또는 토·일 텍스트 색만) |
| 이벤트 슬롯 | 짧은 바 · `#E6F2F1` bg · `#0E5F5A` text · 내담자 표시명은 샘플(실명·전화 금지) |
| 로딩 | 스피너 + 「일정을 불러오는 중…」 · 달력 골격은 유지(스켈레톤) — AS-IS처럼 빈 그리드+파란 스피너만 두지 말 것 |
| Empty | 아이콘 mute + 「이 기간에 일정이 없습니다」 + 보조 「가능 시간 설정에서 예약 가능 시간을 확인해 주세요」 |
| 안내 배너 | 무거운 풀폭 회색 박스 축소 → 한 줄 mute 캡션 또는 접이식 |

상담사 화면에는 **신규 배정 CTA 없음** (관리자 통합스케줄 전용).

### 4.5 급여 카드 (상담사 · 읽기 전용 · P0)
- 관리자 급여 hand-feel(요약→목록)을 **읽기 전용**으로 다운스케일
- **승인·지급 CTA 금지** · 「관리자가 확정한 결과만 표시」안내 유지
- 월 카드: 기간 · 상태칩 · 회기수 · 항목 행(라벨|금액) · **실수령액** ink `#0F172A` 강조(틸/초록 금액 금지) · 공제(out)는 파랑 허용
- 금액: `4,440,000원` · 공제는 `−147,840원` · 수당 `+40,000원`
- 정산 수단: 값 없으면 `—` (벤더명 금지)

### 4.6 Empty / Loading / Error
| 상태 | 패턴 |
| --- | --- |
| Empty | 중앙 mute 아이콘(24–40) · 제목 1줄 · 보조 1줄 · (선택) ghost CTA |
| Loading | 스켈레톤 행/카드 또는 인라인 스피너+문구 · 레이아웃 점프 최소화 |
| Error | 짧은 문장 · 「다시 시도」 ghost · 기술 스택 문구 금지 |

### 4.7 빠른 액션 스트립 (대시보드)
- 가로 스크롤 없이 wrap · primary 1개만 solid · 나머지는 텍스트/ghost 링크

---

## 5. 타이포 · 카피

- UI 라벨 **한국어만** (영문 key·내부 enum 노출 금지)
- 존댓말 준비: 안내·empty·에러는 「~합니다 / ~해 주세요」
- 구어·이모지 남발 금지 (메시지 본문 예외는 최소화)
- 페이지 H1 + mute 부제 1줄

---

## 6. 하지 말 것

- 상담사 페이지에 관리자 stone 패널 강제
- ₩ · PG 벤더명 · 승인/지급 CTA(상담사 급여)
- 콘텐츠 선택에 teal ring
- 화면마다 다른 본문 max-width · 카드 LNB 엣지 붙임
- 그림자·그라데이션 버튼(레거시 「상담일지 조회」룩)
- 실 내담자 전화·이메일 시안 노출

---

## 7. 관련 문서

- `clinic-os-shell-width.md`
- `clinic-os-integrated-schedule.md` + `shot-schedule-tobe.png`
- `clinic-os-salary.md` + `shot-salary-tobe.png`
- 화면 명세: `clinic-os-consultant-screens.md`
- P0 시안: `clinic-os-consultant-schedule-tobe.html` · `clinic-os-consultant-salary-tobe.html`
