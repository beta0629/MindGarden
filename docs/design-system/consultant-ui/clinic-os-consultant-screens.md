# Clinic-OS · 상담사 화면 AS-IS → TO-BE

SSOT: `/consultant/dashboard` (mg-v2) · DS: `clinic-os-consultant-design-system.md`  
원칙: 쉽고·편하고·가지고 싶게 · **레이아웃 전체 통일** (사용자 확인 「레이아웃 전체를 다 바꿔야 해」)  
셸 크롬 = 기존 Admin/ConsultantCommonLayout 그대로 (시안 참조)

AS-IS 샷: `/workspace/counselor-ui-1007/shots/{dashboard,schedule,availability,clients,messages,consultation-records,consultation-logs,salary-settlement}.png`

---

## 0. 대시보드 (SSOT · 변경 최소)

| | |
| --- | --- |
| path | `/consultant/dashboard` |
| 상태 | **NEW** — 시각 SSOT |
| priority | — (기준면) |

**유지:** stage `#FAF9F7`/`#FAFAF8` · 흰 카드 `#E2E8F0` · primary `#0E5F5A` · KPI·빠른액션·표·empty  
**타 화면이 맞출 것:** 패딩·카드·버튼 h36·칩·empty·금액「N원」

---

## 1. 전체 스케줄 — **P0**

| | |
| --- | --- |
| path | `/consultant/schedule` |
| AS-IS | `shots/schedule.png` · `data-layout-context="consultant-legacy-schedule"` |
| TO-BE 시안 | `clinic-os-consultant-schedule-tobe.html` · `shot-consultant-schedule-tobe-{1440,390}.png` |

### AS-IS 문제
1. 셸은 mg-v2인데 본문이 **legacy-schedule** — 안내 박스·로딩 스피너·달력 밀도가 대시보드와 단절.
2. 로딩 중에도 빈 월 그리드+파란 스피너만 보여 **스켈레톤/상태 카피**가 대시보드 empty와 불일치.
3. 공휴일 워시·범례가 무거워 「가지고 싶게」밀도 미달 · 관리자 통합스케줄 TO-BE 크롬과 미공유.

### TO-BE 계층
1. 제목행: **내 일정** + 부제 「나의 상담 일정을 확인합니다」 + ghost「새로고침」(**primary fill 0** — 등록 CTA 없음)
2. 요약 3칸(선택): 오늘 일정 / 이번 주 / 일지 미작성
3. 툴바: 월 네비 · 월|주|일 · 상태 칩(전체·예정·완료·취소) — **뷰 토글·필터 모두 slate 선택 칩** (틸 solid 금지)
4. 본문 패널: 월 달력 + 셀 슬롯(샘플 내담자코드) · 하단 mute 안내 1줄
5. Empty/Loading: DS §4.4

### 컴포넌트 맵
`PageHeader` · `SummaryStrip`(옵션) · `CalendarToolbar` · `MonthGrid` · `StatusChip` · `EmptyState` · `LoadingSkeleton`

### 제목 vs 내비
- 페이지 h1 = **「내 일정」** (시안·구현 SSOT).
- LNB 「전체 스케줄」은 기존 내비 유지 가능 — 차이 OK. 이후 내비 라벨을 「내 일정」으로 맞추는 것은 선택(리더).

### 관리자 cross-walk
- 공유: 달력 셀 r8 · 슬롯 틴트 `#E6F2F1`(DS 4.4 허용) · 칩·empty/loading 토큰 (`clinic-os-integrated-schedule.md`)
- 다름: 상담사 = **본인 달력만** · 「신규 배정」CTA·배정 목록 2단 **없음**

---

## 2. 급여 정산 — **P0**

| | |
| --- | --- |
| path | `/consultant/salary-settlement` |
| AS-IS | `shots/salary-settlement.png` · `cr-salary-settlement` |
| TO-BE 시안 | `clinic-os-consultant-salary-tobe.html` · `shot-consultant-salary-tobe-{1440,390}.png` |

### AS-IS 문제
1. **레거시 stone/베이지 카드** — 대시보드 흰 카드와 즉시 이질감.
2. 금액이 **₩** 표기 — SSOT는 「N원」.
3. 목록만 있고 대시보드형 **요약 스트립·상태 칩 필터**가 없어 운영 급여 TO-BE hand-feel과 단절 · 읽기 전용 위계 약함.

### TO-BE 계층
1. 제목행: **급여 정산** + 부제 「관리자가 확정한 결과만 표시됩니다」
2. 안내 1줄(mute/slate notice): 매출·수입·지출 리포트는 제공하지 않음
3. 요약 3칸: 최근 실수령 / 지급 대기 / 지급 완료(건수) — **CTA 없음**
4. 필터 칩: 전체 · 지급 대기 · 지급됨 (slate 선택)
5. 월 카드 리스트: 기간 · slate 상태칩 · 회기 · 급여/수당/세전/공제/실수령(「N원」·**금액 ink** · 공제만 파랑) · 정산 수단
6. Empty: 「확정된 정산 내역이 없습니다」

### 컴포넌트 맵
`PageHeader` · `Notice` · `SummaryStrip` · `FilterChips` · `SalaryMonthCard` · `MoneyText` · `EmptyState`

### 관리자 cross-walk
- 공유: 요약→목록 흐름 · 돈 위계 · 상태칩 (`clinic-os-salary.md`)
- 다름: **승인·지급·계산 CTA 전부 없음** · 상담사 본인 행만 · PG/벤더명 없음

---

## 3. 가능 시간 설정 — P1

| | |
| --- | --- |
| path | `/consultant/availability` |
| AS-IS | `shots/availability.png` · NEW |

### AS-IS 문제
1. 톤은 이미 신형이나 **primary+ghost 버튼 키**·empty 아이콘이 대시보드 스트립과 1px 단차 가능.
2. 빈 상태 카피·CTA 위치가 화면 중앙에만 있어 **목록형 전환(추가 후)** 대비 계층이 약함.
3. 카드 r·패딩이 DS와 문서화되지 않음.

### TO-BE (톤 정리)
- 제목행 우측: primary「상담 가능 시간 추가」1개 · ghost「새로고침」
- Empty: DS empty · CTA는 헤더 primary와 중복 시 empty에는 ghost만
- 슬롯 리스트(데이터 있을 때): 흰 카드 행 · 요일·시간 · slate 선택 · 삭제 확인은 기존 정책 유지(시안 비범위)

---

## 4. 내 내담자 목록 — P1

| | |
| --- | --- |
| path | `/consultant/clients` |
| AS-IS | `shots/clients.png` · NEW |

### AS-IS 문제
1. 필터 칩 **활성=teal fill** — 콘텐츠 선택은 slate로 통일 필요.
2. 검색+칩+카드 그리드 간격이 넉넉하나 KPI/대시보드 표 **밀도**와 맞추면 좋음.
3. 안내 배너(파란 info)를 slate notice로 맞출지 리더 확인 여지.

### TO-BE (톤)
- 필터 선택 = `#E2E8F0`/`#94A3B8` · primary 0 (행동 CTA 없으면)
- 「진행중」초록 필 → **slate 칩** (`#E2E8F0`/`#EBE6DF` + ink)
- 카드: `#FFF` · `#E2E8F0` · r12
- 생성/수정/삭제 안내 유지 · primary CTA 없음(관리자·스태프만)

---

## 5. 상담사 메시지 — P1

| | |
| --- | --- |
| path | `/consultant/messages` |
| AS-IS | `shots/messages.png` · NEW |

### AS-IS 문제
1. 「새 메시지」**풀폭 primary** — 대시보드 대비 과중 · 제목행 우측 h36으로 이동.
2. 카드 본문 중앙 정렬·이모지·여백이 커 **목록 스캔성** 저하.
3. 유형 칩 teal fill → slate 선택.

### TO-BE (톤)
- 「새 메시지」= 제목행 **우측** small primary **1개만** (풀폭 바 금지)
- 유형 필터 = slate 선택 칩 (「전체 유형」틸 solid 금지)
- 리스트: 좌측 정렬 행/카드 · 시간 mute · 관련 내담자 · 유형 칩
- 검색 + 유형 칩 한 툴바

---

## 6. 상담 일지 관리 — P1

| | |
| --- | --- |
| path | `/consultant/consultation-records` |
| AS-IS | `shots/consultation-records.png` · NEW |

### AS-IS 문제
1. 필터「전체」teal · 상태 버튼 정렬 들쭉.
2. 「상담일지 조회」버튼이 **레거시 ghost/아이콘** 룩.
3. 카드 그리드 정보 위계(날짜·회기·내담자·상태·액션) 재정돈 여지.

### TO-BE (톤)
- 화면 제목 = 내비와 동일 **「상담 일지」** (AS-IS 「상담 기록 조회」불일치 해소)
- 칩 slate 한 줄 · 「완료」틸 뱃지 → slate/중립 칩
- 카드 액션 = ghost h36「일지 보기」
- 검색+상태 칩 단일 툴바 · primary 없음(작성이면 대시보드/스케줄에서 진입)

---

## 7. 상담 리포트/로그 — P1

| | |
| --- | --- |
| path | `/consultant/consultation-logs` |
| AS-IS | `shots/consultation-logs.png` · NEW |

### AS-IS 문제
1. 뷰 전환「목록」이 **두꺼운 teal 바** — Calendar/Table 칩과 위계 붕괴.
2. 카드가 ID만 나열해 **플레이스홀더형** · 대시보드 표 밀도 미달.
3. 「기본 보기로」「현재 뷰 저장」outline이 primary와 경쟁.

### TO-BE (톤)
- 뷰 토글: 상단 **한 줄** 선택 칩 h32 (`#E2E8F0`+`1px #94A3B8`) · **세로 틸 버튼·전폭 초록「목록」바 제거**
- 「기본 보기로」「현재 뷰 저장」초록 outline → ghost/slate
- 필터 행: 내담자 · 기간 · ghost「조회」
- 결과: records와 공유 카드(일시·회기·상태·「일지 보기」) · empty DS
- 「뷰 저장」은 kebab/secondary로 강등

---

## P1 한눈에 (조일 것)

| 화면 | 조일 포인트 |
| --- | --- |
| availability | empty·버튼 키·추가 후 리스트 계층 |
| clients | 필터 teal→slate · 「진행중」초록→slate · 카드 r/border |
| messages | 「새 메시지」헤더 우측 only · 유형 칩 slate · 리스트 스캔성 |
| consultation-records | 제목「상담 일지」IA · 완료 틸뱃지→slate · 액션 ghost |
| consultation-logs | 세로 틸+초록「목록」바 제거 · 선택 칩 한 줄 · records 카드 공유 |

---

## Cursor 구현 지시

```text
# Clinic-OS 상담사 UI 통일 — 구현 지시 (시안 기준 · API 변경 없음)

## 목표
/consultant/* 8화면의 레이아웃·컴포넌트·토큰을 /consultant/dashboard(mg-v2) SSOT에 맞춘다.
스펙: clinic-os-consultant-design-system.md · clinic-os-consultant-screens.md
시안(P0): clinic-os-consultant-schedule-tobe.html · clinic-os-consultant-salary-tobe.html
셸 폭: clinic-os-shell-width.md (본문 패딩=대시보드 · 중앙 max-width 스택 금지)

## 금지
- API·스키마·권한 변경 없음
- 하드코딩 색/간격/카피 난립 — 공유 토큰·공유 컴포넌트만
- 상담사 급여에 승인·지급 CTA · ₩ · PG 벤더명
- 콘텐츠 선택 teal ring/wash (LNB active만 teal)
- MindGarden 제품 레포에 시안 HTML 커밋/배포할 필요 없음 — 앱 코드만 토큰 준수 구현
- 관리자 stone(#F5F3EF/#D4CFC8)을 상담사 바깥 패널에 강제하지 말 것
  → 상담사 SSOT = 흰 카드 #FFF + 1px #E2E8F0 on stage #FAF9F7/#FAFAF8

## 역할 설정
- surface/role = consultant → panel=white/E2E8F0 (admin mypage stone과 분리)
- schedule: 본인 달력 only · 신규 배정 CTA 없음
- salary: read-only · 관리자 확정 결과만

## 우선순위
### P0
1. /consultant/schedule — legacy-schedule 제거 · DS 달력·칩·empty/loading
2. /consultant/salary-settlement — cr-salary-settlement 제거 · 흰 카드 · 「N원」 · 요약+칩+월카드

### P1
3. availability · clients · messages · consultation-records · consultation-logs
   — 칩 선택 slate · primary 1개/화면 · 레거시 버튼룩·풀폭 CTA·두꺼운 teal 바 제거

## 공유 컴포넌트 (예시명 · 기존 디자인시스템 이름에 매핑)
PageHeader, SummaryStrip, FilterChips(selection=slate), MGButton(h36 r8),
MoneyText(「N원」), StatusChip, EmptyState, LoadingSkeleton,
CalendarToolbar, MonthGrid (관리자 통합스케줄 토큰 공유), SalaryMonthCard

## 수락 체크리스트
- [ ] 대시보드와 나란히: stage·카드 border·본문 패딩 동일 · **1440 카드 엣지 x324–1376**
- [ ] 상담사 카드 = 흰/#E2E8F0 · shadow 없음
- [ ] primary 화면당 ≤1 · 버튼 h36 r8 (칩 h32 가능, 혼용 규칙 DS 준수)
- [ ] 선택 = #E2E8F0 + 1px #94A3B8
- [ ] 금액 「N원」 only · ₩ 없음 · 실수령·KPI **ink** (틸 금액 금지) · 뷰 토글=slate 칩
- [ ] schedule: 로딩/empty DS · 신규 배정 CTA 없음
- [ ] salary: 읽기 전용 · 승인/지급 없음
- [ ] 390 가로 스크롤 없음 · 한국어 라벨만
- [ ] API 변경 없음 · 역할 설정으로 admin/consultant 표면 분기
```

---

## 열린 결정 (리더/사용자)

1. **콘텐츠 필터·뷰 토글:** 전면 slate 확정 (크리틱 2026-10-07). LNB만 teal. primary는 행동 CTA ≤1.
2. **안내 배너:** clients 파란 info를 slate notice로 통일할지, info-blue 유지할지.
3. **버튼 높이:** 라이브 대시보드 primary=h36 · 마이페이지 토큰 일부 h32 — **상담사 스위트는 h36으로 고정** 권장(본 DS). h32 전면 전환 시 대시보드도 동시 조정 필요.
