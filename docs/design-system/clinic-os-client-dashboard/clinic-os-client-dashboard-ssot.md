# Clinic-OS · 내담자 대시보드 — 시각 SSOT (P0)

**현재 시안 = v4 「상담실 로비」** (2026-09-17). v3 파스텔 칩 콜라주 = 사용자 퀄리티 반려 · 백업만.  
대외 독립 DS · 운영 Clinic-OS 셸/IA 복제 금지 · 품질바만 공유(ink/slate·`#E2E8F0`·표준어·쉽고편하고가지고싶게) · 녹 선택링 금지 · 예약 생성 CTA 금지.

---
## 품질 바 (최상단 · 사용자)

1. **깔끔하고 예쁘게**
2. **누가 봐도 밝고 상쾌**
3. **들어오고 싶게**

**FAIL:** 투박 · 어두운 어드민티 · AI티 · 제네릭 SaaS 히어로(그라데이션+3카드+체크리스트) · 아이콘 그리드 남발 · 안전 네이비/퍼플 SaaS


## 톤 · 파스텔 다채 (MUST · 2026-09-17 user + 크리틱)

| 영역 | 규칙 |
|------|------|
| **면 · 칩 · 리본 · 악센트** | 파스텔 다채 OK — 민트 · 라벤더 · 피치 · 크림 (밝고 상쾌) |
| **핵심 타이포** | 본문 · 일시 · 숫자 · 이름 = **ink/slate** 유지. 파스텔만으로 쓰면 **대비 FAIL** |
| **Primary CTA** | `#0E5F5A` 유지 **또는** 파스텔 필 + **진한 글자**. 연한 글자 on 연한 면 금지 |
| **금지** | 녹링 · 파스텔 워시로 본문 흐림 · wellness 무지개 남발 |


## v3 파스텔 톤 (2026-09-17 user 확정 · Critic brief)

**무드:** 아침 상담실 빛 — soft mint wash on 「다음 한 장」만 · 라벤더/피치 칩 on 리본 · cream stage. 키즈 파티·제네릭 그라데이션 SaaS 아님. 절제·예쁨.

### 파스텔 필 토큰 (면·칩·리본 · 글자는 ink/slate)

| 토큰 | 필 값 | 라벨/본문 | 용도 |
|------|-------|-----------|------|
| Mint wash | `#E3F4EF` → `#D5EEE7` | ink `#0F172A` | 「다음 한 장」soft paper 워시 (주인공만) |
| Lavender chip | `#EDE8F8` | ink / slate | 리본·상태 칩 (예: 담당·결제) |
| Peach chip | `#FCE8DE` | ink / slate | 리본·상태 칩 (예: 다음 예약) |
| Cream stage | `#FAF7F2` / `#F7F3EC` | — | 데스크 스테이지 배경 |
| Mint soft chip | `#DFF3EC` | slate `#334155` | path-chip · soft accent |
| Ink | `#0F172A` | — | 본문·일시·숫자·이름 (파스텔 텍스트 금지) |
| Slate mute | `#64748B` / `#334155` | — | 보조·메타 |
| Primary CTA | `#0E5F5A` on cream/`#FAF9F7` | light on teal | **또는** mint fill `#D5EEE7` + **ink 라벨** |
| Package/단회기 chip | fill pastel OK | **ink/slate 글자** | 몰 DNA 유지 · 녹칩 금지 |
| Amber | `#D97706` / `#FFF7ED` | — | 미결제만 |

### 대비 규칙 (FAIL = 연한 글자 on 연한 면)

1. 파스텔은 **필(배경)** 전용. 타이포·숫자·이름은 항상 ink/slate.
2. CTA: teal `#0E5F5A` + 밝은 라벨 **또는** 파스텔 필 + **진한 ink 라벨**. 둘 다 허용. light-on-light 금지.
3. 칩 라벨(단회기/패키지·상태): 파스텔 필 + dark text.
4. 민트 워시는 「다음 한 장」카드에만 — 전면 rainbow wash 금지.
5. 녹 링 · wellness 4-KPI · equal-grid · 예약 생성 CTA · 어드민 네이비 — 계속 금지.

### v3가 유지하는 v2

- 「다음 한 장」desk · soft paper (이제 mint wash)
- 예정 상담 read-only · 「자세히 보기」만
- soft chip-flow status (파스텔 칩 필 + dark text)
- 세션 스탬프 · 단회기/패키지 ink-slate 라벨 (필만 파스텔 tint 가능)
- 예약 생성 CTA 없음 · soft desk · 웹 선행


---

## 정책 · 내담자 예약 생성 금지 (MUST · v2 · 2026-09-17 user)

| 규칙 | 내용 |
|------|------|
| **누가 예약을 만드나** | **관리자·스태프만** 일정/예약을 생성한다. 내담자(클라이언트)는 **예약 생성 불가**. |
| **홈 「다음 한 장」** | 안내 · 준비 · 남은 회기 · 쇼핑/결제 입구 · 담당 안내 — **예약 생성 CTA가 아님**. |
| **금지 CTA (홈·패널)** | 「새 예약」·「예약하기」·「일정에 담기」 등 **부킹/생성** 액션. |
| **허용** | 예정 예약 **읽기 전용** 안내 · 「자세히 보기」 · 「예정 목록 보기」 · 남은 회기 확인 · 쇼핑/결제 · 담당 안내 · 상담 준비. |
| **Panel B 예약 한눈** | **read-only** 예정 목록만. 「새 예약」 버튼 **없음**. |

Primary next actions (홈): **남은 회기 확인 · 쇼핑/결제 입구 · 담당 안내 · 상담 준비** — NOT booking.

**시각 soften (v2):** soft desk — warmer cream paper · rounder cards(20–24px) · breathing room · soft shadows · friendlier type · 상태 리본 = soft chips/flow (**rigid 4 equal-grid 금지**). Still bright / refreshing / want-to-enter. No admin navy LNB · no green rings · no AI-generic wellness 4-KPI.

### 웹 선행 · 앱 후행 동일 방향 (MUST · 2026-09-17 user)

| | 내용 |
|--|------|
| **리드** | **웹 P0**이 **새 부드러운 대외 DNA**를 먼저 잡는다. |
| **후행** | 앱은 **추후 개선**으로 같은 방향·같은 DNA를 따른다. |
| **금지** | **현행 앱 UI 복제** · 앱 탭바/밀도/카드 패턴을 웹에 이식 · 「앱이랑 비슷해 보이게」맞춤. |
| **허용** | 웹→앱 **같은 서사·카피·토큰·「다음 한 장」개념**만 공유. 시안은 웹 데스크톱 soft desk가 기준. |

시안이 현행 앱과 닮아 보이면 FAIL → 웹이 soft desk DNA를 **리드**.


---

## 운영 Clinic-OS와 관계 (독립 셸)

| | 내담자 대시보드 (대외) | 운영자 Clinic-OS |
|--|----------------------|------------------|
| 셸 · IA · LNB | **완전 독립** — 복제 금지 | 대시보드/키스트립/승인 레일 SSOT |
| 토큰 | **정렬만** (ink/slate · Primary · line) | 동일 토큰 팔레트 |
| 분위기 | 밝은 **웜 크림** soft desk · 여유 · 들어오고 싶게 · **딱딱한 corporate grid 금지** | 밀집 ops · 네이비 LNB 허용 |
| 네비 | 상단 라이트 크롬(워드마크 + 소프트 탭/아이콘 행) · 앱 하단 = **힌트/각주만** | 좌측 네이비 LNB |
| 정보 | 「다음에 할 일」1장 우선 · 상태 = soft chips 한눈 | KPI·테이블·승인 흐름 |

**절대 금지:** 운영자 LNB · 키스트립 · 승인 레일 · 어두운 툴바 · 밀집 테이블로 홈 시작.

---

## 공유 토큰 (정렬만 · v3 파스텔 확장)

| 토큰 | 값 | 용도 |
|------|-----|------|
| Ink | `#0F172A` | 본문·제목 · **인사 이름** · 숫자 |
| Slate mute | `#64748B` / `#334155` | 보조·메타 |
| Line | `1px #E2E8F0` / soft `#E5DCCE` | 카드·구분 |
| Select | `#E2E8F0` 채움 + `1px #94A3B8` | 선택 상태 |
| Primary CTA | `#0E5F5A` (dusty teal) | **버튼만** (이름·링·칩에 쓰지 않음) · 또는 mint+ink |
| Stage | `#FAF7F2` ~ `#F7F3EC` cream | 데스크 배경 |
| Surface | `#FFFEFB` / mint wash on next-sheet | soft paper |
| Mint / Lavender / Peach | 위 v3 토큰 표 | 면·칩·리본 필 only |
| Warning | `#D97706` amber | 미결제 등 (녹 금지) |

- **녹 링 · 녹 선택 링 금지** (Primary CTA teal ≠ 면 워시 민트)
- 회기 칩 DNA = 몰 SSOT: 라벨 = ink/slate · 필 파스텔 tint OK
- 카드 radius **20–24px** · soft warm shadow · breathing room↑
- **대비:** 파스텔 필 + dark text · 파스텔-only 텍스트 FAIL

---

## 독특한 한 점 — 「다음 한 장」데스크 (v3 · mint soft paper)

홈은 **아침 상담실 빛** 아래, 책상 위에 다음 할 일 한 장이 부드럽게 펼쳐진 느낌으로 연다.

- **주인공:** 큰 「다음 한 장」카드 1장 — **soft mint wash** 만 이 카드에 (전면 rainbow 금지)
- **종이:** slight curl · warm soft shadow · radius 20–24px · cream stage
- **한눈:** 그 아래 **파스텔 soft chips/flow** — peach·lavender·mint tint 필 + **ink/slate 글자** · equal-grid 금지
- **하지 말 것:** 키즈 파티 파스텔 · 제네릭 그라데이션 SaaS · wellness 4카드 · corporate stiff grid · 파스텔 텍스트

---

## 「다음 한 장」우선순위 규칙 (예약 CTA 없음)

홈에 올리는 **다음 안내/액션은 항상 1개**. 아래 순으로 첫 충족 항목을 카드에 올린다.

| 순위 | 조건 | 카드 제목 예시 | 주 CTA (허용) |
|------|------|----------------|---------------|
| 1 | 확정된 **다음 예약** 있음 | **다가오는 상담** | **자세히 보기**(read) only · **일정에 담기 금지** |
| 2 | 남은 회기 = 0 (또는 구매 필요) | 회기 확인 / 회기 고르기 | 회기·쇼핑 입구 |
| 3 | 담당 **미확정 / 확인 중** | 담당 확인 중 | 안내 보기 |
| 4 | 미결제 있음 | 결제 확인 | 결제하기 |
| 5 | 위 모두 없음 | 오늘은 여유로운 날 | 남은 회기 보기 · 쇼핑 입구 (**예약하기 금지**) |

- 카드 본문: 날짜·시간 · 상담사 · 시간(분) · 짧은 안심/준비 문장
- 샘플(마인드가든): **9/20 14:00 · 김선희 상담사 · 50분** → 순위 1 「다가오는 상담」· CTA 「자세히 보기」만
- 인사 이름 = **ink** (`#0F172A`) · teal 금지

---

## 상태 리본 — soft chips / flow (콘텐츠 모델)

한 줄 **soft chips·flow**로 **스캔만** 되게. 클릭 시 해당 화면으로. **4 equal boxes 금지**.

| 슬롯 | 라벨 | 값 예시 | 상태 톤 |
|------|------|---------|---------|
| 예약 | 다음 예약 | 9/20 14:00 | 있음 / 없음 (안내만) |
| 회기 | 남은 회기 | **6회기** · 패키지 칩 | 충분 / 부족(0·1) |
| 배정 | 담당 | 담당 확정 · 김선희 | 확정 / 확인 중 |
| 결제 | 결제 | 최근 결제 완료 | 완료 / **미결제(amber 배지)** — **실제 상태만** (시안 설명문 금지) |

- 회기 숫자·단회기/패키지 칩 = 몰과 **동일 DNA** (라벨 ink/slate · 필 파스텔 tint OK · 녹칩 금지)
- 리본 ≠ 4개 동일 KPI 타일 · ≠ rigid equal-grid
- v3: peach / lavender / mint soft 필 + dark text · 비대칭 soft chip flow

---

## 홈 IA (정보구조)

```
[상단 라이트 크롬]
  워드마크(센터/Clinic-OS 대외) · 소프트 탭: 홈 | 예정 | 회기 | 결제 · 프로필
  ※ 탭「예정」= 읽기 전용 예정 목록 · 「예약하기」입구 아님

[스테이지 · 웜 크림 soft desk]
  인사 (이름 = ink) · 짧은 날짜 맥락
  ┌─────────────────────────────┐
  │  「다음 한 장」 soft paper     │  ← 우선순위 1개 · 예약 생성 CTA 없음
  └─────────────────────────────┘
  상태 soft chips / flow (예약·회기·배정·결제)
  (선택·P0 약함) 짧은 도움/안심 한 줄 — 섹션 남발 금지
  [앱 방향] 힌트/각주만 — 라이브 하단 크롬처럼 보이면 FAIL
```

앱: 동일 서사 · 하단 소프트 내비는 **방향 노트/각주** — 웹 상단 탭과 **같은 방향**.

---

## P0 화면 목록 (초점 유지)

| ID | 화면 | P0 | 비고 |
|----|------|----|------|
| H | **홈** | ● | 「다음 한 장」+ soft chips · 주 시안 · **부킹 CTA 없음** |
| R | (다음) **예정 안내 / 자세히** | ● | read-only · 홈 카드·칩「예약」입구 · 「새 예약」없음 |
| S | **남은 회기** | ● | 잔량·패키지 DNA · 몰/구매 입구 |
| P | **결제/주문 요약** 입구 | ● | 최근 결제 · 미결제 amber · 상세는 몰/장바구니 트랙 |
| — | 메시지·힐링·평가 단독 섹션 | ○ 제외 | 홈에 올리지 않음 (P0) |

API 계약 개념은 유지: **회기 / 배정 / 결제 / 예약** 동일 정보 도메인 · UI만 재구성 · **예약 create는 스태프/관리자 측**.

---

## Web → App · **웹 선행 · 앱 후행** 동일 방향

| | Web (**P0 리드**) | App (**후행 · 추후 개선**) |
|--|----------|-----|
| 역할 | **새 soft 대외 DNA 기준** | 같은 방향·DNA로 따라감 |
| 셸 | 상단 라이트 크롬 + 소프트 탭 (앱 탭바 복제 금지) | 상단 미니 + 하단 내비는 **앱 개선 시** 맞춤 |
| 홈 서사 | 다음 한 장 soft paper → soft chips | 동일 순서·카피·카드 DNA |
| 스테이지 | 웜 크림 soft desk · 여유 · breathing | 동일 톤 · 터치 타깃↑ |
| 예약 | read-only · 생성 불가 | 동일 정책 |
| 금지 | ops LNB · **현행 앱 UI 복제** | ops 밀도·현행 앱 패턴 고착 |

시안은 **웹 데스크톱 ≥1440 soft desk**가 리드 · 시안 하단 앱 표기는 **방향 각주만**(라이브 앱 크롬처럼 보이면 FAIL).

---

## 카피 (표준어 · 샘플 · v2)

| 위치 | 카피 |
|------|------|
| 인사 | 안녕하세요, **이재학** 님 (이름 = **ink**) |
| 다음 한 장 라벨 | 다음 한 장 |
| 카드 제목 | **다가오는 상담** |
| 본문 | 9월 20일 토요일 · 오후 2:00 · 김선희 상담사 · 50분 |
| CTA | **자세히 보기** only · ~~일정에 담기~~ · ~~예약하기~~ |
| 리본 회기 | 남은 회기 **6회기** · 칩 「패키지」 |
| 리본 배정 | 담당 확정 |
| 리본 결제 | 최근 결제 완료 (실제 상태만) |
| Panel B | 예정 목록 · **새 예약 없음** · 「목록만 보기」톤 |

톤: 쉽고·편하고·가지고 싶게 · 내부 코드값·ops 용어 비노출 · soft desk not corporate.

---

## 시안 파일 경로

| 산출물 | 경로 |
|--------|------|
| 본 SSOT | `/workspace/core-solution-unity/clinic-os-client-dashboard-ssot.md` |
| TO-BE HTML | `/workspace/core-solution-unity/clinic-os-client-dashboard-tobe.html` |
| 샷 | `/workspace/core-solution-unity/shot-client-dashboard-tobe.png` |
| 무드 참고(복제 금지) | `/workspace/mg-expo-ota/docs/design-system/client-dashboard-renewal-mood-concept.png` |
| 회기 DNA | `clinic-os-client-session-count.md` |
| 몰·장바구니(덮지 않음) | `clinic-os-client-cart.md` · `clinic-os-client-mall-session-*` |

---

## 하지 말 것

- 앱/웹 **구현 코드**
- 운영자 대시보드·LNB·승인 레일 복제
- 녹색 선택 링·워시·칩
- cart / admin-mall 파일 덮어쓰기
- wellness 4-KPI 템플릿·제네릭 SaaS 히어로 복제
- **내담자 예약 생성 CTA** (새 예약 · 예약하기 · 일정에 담기)
- 딱딱한 equal-grid ribbon · hard rect paper · corporate stiff desk

---

## 제출 게이트 (셀프 체크)

- [ ] 밝고 상쾌 · 들어오고 싶게 (cream stage + mint next-sheet)
- [ ] 어드민티 없음 (네이비 LNB·키스트립·승인 레일 없음)
- [ ] AI 슬롭·제네릭 히어로 아님 — 「다음 한 장」mint soft paper가 한눈에
- [ ] 상태 = 파스텔 soft chips/flow ≠ 동일 4타일 equal-grid
- [ ] 회기 = 몰 DNA · 라벨 ink/slate · 필 파스텔 OK
- [ ] Primary CTA `#0E5F5A` 또는 pastel+ink · 녹링 없음 · 인사 이름 = ink
- [ ] **대비 OK** — 파스텔-only 텍스트 없음 · light-on-light 없음
- [ ] **예약 생성 CTA 없음** (자세히 보기 / 읽기 전용만)
- [ ] 하단 앱내비 = 힌트/각주만
- [ ] **웹 선행 soft DNA** · 현행 앱과 닮아 보이지 않음
- [ ] 아침 상담실 빛 · 키즈 파티/무지개 SaaS 아님

---

## 핸드오프

1. Layout: md + html + shot 본 경로 — **크리틱 PASS · Ship** 유지 · **v2 revision 2026-09-17 user** (예약 정책 + soften)
2. Worth → 구현·다음 컷 (아래)
3. 구현 라우팅: @코어개발 (웹 FE → 앱)

---

## 크리틱 (2026-09-17) — PASS · Ship

Worth (구현·다음 컷) — **유지**:
1. 인사 **이름 = ink** (Primary teal 금지 · CTA만 `#0E5F5A`)
2. 결제 리본 = **실제 상태만** (「미결제 시…」시안 설명문 금지)
3. 하단 앱내비 = **「앱 방향」힌트/각주**로 격하 (웹 라이브 크롬처럼 보이면 FAIL)
4. 가능 시 마인드가든 **공식 워드마크** (`MG` 사각 대체)
5. 상태 리본 더 비대칭·소프트 칩 흐름(선택) → **v2에서 soft chips로 반영**

### v2 revision 2026-09-17 user
- 내담자 **예약 생성 금지** 정책 상단 고정
- 시각 **soften** (soft desk · warmer cream · rounder · breathing · soft chips)
- **웹 선행 · 앱 후행** · 현행 앱 UI 복제 금지
- PASS Ship worth notes **유지**

핸드오프: @코어개발 — Ship OK · Worth는 구현·다음 컷 · v2 정책/soften 반영.


---

## 크리틱 (2026-09-17) — v2 PASS · Ship

정책·soft desk·웹 선행 확인됨. Fix first 없음.

Worth (구현·다음 컷):
1. **제품면 시안 설명문 제거** — 배너/「시안 노트」류는 구현·핸드오프용, 라이브 UI에 안 남김
2. **상태 더 칩 플로우** — 리본을 더 soft chip flow로 (등분 그리드 잔재 줄이기)

구현: @코어개발 · 웹 선행 후 앱 동일 DNA.


---

## v3 revision 2026-09-17 user · 파스텔 톤

- Critic brief + user 확정: **파스텔 다채** on 면·칩·리본 · **코어 타이포 ink/slate**
- Unique: mint wash on 「다음 한 장」만 · lavender/peach ribbon chips · cream stage
- v2 유지: 예약 생성 금지 · soft desk · 웹 선행 · 자세히 보기 only
- 산출: `clinic-os-client-dashboard-tobe.html` (v3) · `shot-client-dashboard-tobe.png` · v2 백업 `*.v2.*`
- 핸드오프: @코어개발 — Design only · 구현 코드 금지


---

## 벤치 메모 (craft only · 브랜드 복제 금지) · 2026-09-17 v4

품질 바를 **프리미엄 대외 제품 · 벤치 대비 손맛**으로 상향. 벤치에서 가져올 것은 **감각·구조 원칙**뿐 — 로고·팔레트·카피·그리드 복제 금지.

| 벤치 | 가져올 손맛 | MindGarden에 적용 |
|------|------------|-------------------|
| **Headspace Today** | **one clear next** · curated, not library dump | 홈 히어로 = 다가오는 상담 **1장만**. 콘텐츠 덤프·칩 콜라주 금지 |
| **Sentur** | calm minimal · 낮은 인지 부하 · clinical+warm | `#FAFAF8` soft daylight · 여백 · 절제 타입 위계 · 과한 장식 없음 |
| **BetterHelp-class** | **upcoming session + counselor relationship** 중심 홈 | 히어로에 일시·상담사 이름·이니셜 아바타·「자세히 보기」만. 관계 중심 |
| **Trost / MindCafe** | 마켓플레이스 UX (참고만) | MindGarden = **단일 센터 멤버 포털** → 홈에 상담사 쇼핑 그리드 **없음** |
| **Therhappy / Sessions / Mediyn / 밍글** | 홈 = **다음 일정 · 할일 · 회기 · 결제/문서** · 메뉴 최소화 · 모바일우선·차분 톤 | 동일 정보 축. **관리자 셸/표/KPI IA 복제 금지**. 예약 등록 CTA 없음 |
| **Premium consumer** | 넉넉한 whitespace · editorial type · photography · restrained color | 실사 로비 스트립 · ink 타이포 · 파스텔 스티커 칩 / AI soft-desk / 제품면 annotation 배너 **폐기** |

### 대외 독립 DS (품질바만 공유)

| 공유 | 독립 |
|------|------|
| ink/slate · line `#E2E8F0` · Primary `#0E5F5A` · 표준어 | 셸 · IA · 네비 · 카드 문법 · 스테이지 |
| — | 운영 Clinic-OS LNB/키스트립/표/KPI **복제 금지** |

정책 유지: 내담자 **예약 생성 불가** · 웹 선행 · 앱 후행 · 「새 예약」「예약하기」「일정에 담기」 금지.


---

## v4 대외 로비 — 「상담실 로비」 (2026-09-17)

**컨셉:** 좋은 상담센터 로비에 들어선 느낌. Soft daylight stage · 실사 포토 스트립 · editorial 인사 · **one hero** next counseling · 조용한 회기/결제 한 줄 · 우아한 예정 목록.

### v3 → v4 (폐기 · 상향)

| v3 (폐기) | v4 |
|-----------|-----|
| 파스텔 equal ribbon 카드 · chip 콜라주 | **조용한 텍스트 라인** + ink chips (패키지/단회기만) |
| Paper-curl / desk 메타포 과잉 | Flat premium surface · soft shadow only |
| 제품면 AS-IS/TO-BE callout 배너 | 노트는 **프레임 밖** 또는 최소 footer |
| Mint wash 「다음 한 장」+ 4 pastel tiles | White hero card · one CTA · no rainbow |
| Soft desk cream 과다 장식 | `#FAFAF8` warm off-white · photography |

### 토큰 (v4)

| 토큰 | 값 | 용도 |
|------|-----|------|
| Stage | `#FAFAF8` | soft daylight 배경 |
| Surface | `#FFFFFF` | 히어로·리스트 카드 |
| Ink | `#0F172A` | 인사 이름 · 일시 · 숫자 · 본문 |
| Slate / Mute | `#334155` / `#64748B` | 보조·메타 |
| Line | `#E2E8F0` | 카드·구분 |
| Warm line | `#E8E4DC` | 셸 외곽 |
| Chip bg | `#F1EFEA` | 패키지/단회기 ink chip 필 |
| Primary CTA | `#0E5F5A` on `#FAF9F7` | 「자세히 보기」만 |
| Amber | 미결제 시에만 | 시안 샘플은 결제 완료 텍스트 |

### 홈 IA (v4)

```
[상단 editorial]
  MindGarden · 마인드가든 | 홈 | 예정 | 회기 | 결제 | 프로필
  ※ 앱 필 탭바 없음 · ops LNB 없음 · 메뉴 최소화

[실사 포토 스트립] (선택)
  center-40 로비 크롭 · 인물 없음 · soft daylight wash overlay

[스테이지]
  Display 인사 (이름 = ink) · 날짜 맥락
  ┌─ Hero: 다가오는 상담 ─────────────────┐
  │  큰 일시 · 상담사 이니셜+이름 · 50분   │
  │  CTA 「자세히 보기」 only              │
  └────────────────────────────────────────┘
  Secondary: 「남은 회기 6」 + ink chips + 결제 텍스트
  Panel B: 예정 목록(센터 메모) · 회기 잔량 (스탬프 원 금지)
```

### 「다음 한 장」우선순위 (v4 유지 · CTA 정책 동일)

순위 1 다음 예약 → 「다가오는 상담」· **자세히 보기** only  
2 회기 0 → 회기/쇼핑 입구 · 3 담당 미확정 → 안내 · 4 미결제 → 결제 · 5 여유 → 회기 보기  
**예약 생성 CTA 없음.**

### 포토

| | |
|--|--|
| 사용 | `assets/lobby-strip-center-40.jpg` ← `photos/center-40.jpeg` (로비: 데스크·좌석·브랜드월) |
| 처리 | 세로 38–72% furniture band · slight warm/desat · 하단 soft wash into stage · **인물 없음** (블러 불필요) |
| 워드마크 | `assets/mg-butterfly.png` ← 공식 `brand/logo.png` (검정 배경 제거) |
| 폴백 | 실사 없을 때 abstract soft gradient + typography only (AI 일러스트 스팸 금지) |

### 시안 파일 (v4)

| 산출물 | 경로 |
|--------|------|
| SSOT (본 문서) | `clinic-os-client-dashboard-ssot.md` |
| TO-BE HTML | `clinic-os-client-dashboard-tobe.html` |
| v3 백업 | `clinic-os-client-dashboard-tobe.v3.html` · `shot-client-dashboard-tobe.v3.png` |
| 샷 | `shot-client-dashboard-tobe.png` ≥1440 |
| 로비 스트립 | `assets/lobby-strip-center-40.jpg` |

### 제출 게이트 (v4)

- [x] 프리미엄 대외 · 벤치 손맛 · AI-pastel / 칩 콜라주 아님
- [x] one hero next counseling · BetterHelp-class 관계 중심
- [x] 남은 회기 + 결제 = **텍스트 라인** ≠ 4 equal pastel tiles
- [x] 예약 생성 CTA 없음 · 자세히 보기 only
- [x] editorial top · ops LNB/표/KPI 없음
- [x] 제품면만 shippable · critique notes 프레임 밖
- [x] 실사 또는 premium gradient · AI illustration spam 없음
- [x] 이름 = ink · Primary `#0E5F5A` · 녹링 없음

핸드오프: @코어개발 — Design only · v4 로비 DNA · 웹 선행.
