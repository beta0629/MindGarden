# Core Solution 상담센터 — Google Omni (Veo) 프롬프트 · 실제 녹화 합성 가이드

**용도**: 2026-07-15 Desktop 화면녹화(A-roll) + Google Omni/Veo B-roll 합성용.  
**원칙**: 제품 UI·로고·읽히는 글씨는 **화면녹화만**. Omni는 분위기·전환·OP/ED만.  
**연관**: [화면 촬영 스크립트](./CORE_SOLUTION_COUNSELING_CENTER_VIDEO_SHOOTING_SCRIPT.md) · [합성·컷 상세](./CORE_SOLUTION_GOOGLE_OMNI_EDIT_ASSEMBLY.md) · [확인용 보이스·자막 R01–R10](./CORE_SOLUTION_VIDEO_NARRATION_CAPTIONS.md) · [가독성·줌·모션 구현](./CORE_SOLUTION_VIDEO_MOTION_AND_READABILITY.md)  
**최종 갱신**: 2026-07-15 (가독성·줌 구현 가이드 연동)

> **UI 확대**: Omni/AI로 하지 않는다. 편집기 키프레임·인서트 또는 재녹화 close-up → [모션·가독성 구현](./CORE_SOLUTION_VIDEO_MOTION_AND_READABILITY.md).

---

## 0. 금지 · 안전

| 금지 | 이유 |
|------|------|
| AI에게 제품 UI·대시보드·캘린더·표 그리게 하기 | 가짜 한글 UI·로고 날조 |
| 서류·모니터·휴대폰에 **읽히는 글씨** | 가짜 UI·가짜 문서 |
| 실명·전화번호·얼굴 클로즈업 | PII·초상권 (문서에도 실명 기재 금지) |
| 브랜드/타사 로고 날조 | 상표 리스크 |
| 병원 ER·수술·응급 분위기 | 상담센터 톤 불일치 |

**레이어 한 줄**: A-roll(녹화)=증거 · B-roll(Omni)=분위기 · V3 타이틀=글자만.

---

## 1. 실제 녹화 컷 인벤토리 (2026-07-15 Desktop)

출처: `/Users/mind/Desktop/*.mov` (macOS NFD 파일명 가능).  
공통: **4096×1728**, H.264, **120 fps** (편집 시 30fps 시퀀스에 맞게 처리).  
환경: 개발 호스트 `*.dev.core-solution.co.kr`, Whale 브라우저, macOS 메뉴바·Dock 포함 녹화.

| # | 파일명 | 길이 | 화면(확인된 UI) | 홍보에서의 역할 |
|---|--------|------|-----------------|-----------------|
| R01 | `메인페이지 및 로그인2026-07-15 오전 8.09.15.mov` | **73.1초** | 랜딩(기능 카드·도입 문의) → 로그인(스플릿·소셜 로그인) → admin dashboard V2 | 브랜드 인지 → 로그인 → “한눈에 운영” 진입 |
| R02 | `mvp 클릭2026-07-15 오전 8.13.53.mov` | **37.9초** | dashboard → 매칭/재무성 목록·매칭 캘린더(월간) 등 MVP 핵심 클릭 동선 | “핵심 운영 화면을 빠르게 훑는” 티저 |
| R03 | `대시보드 클릭2026-07-15 오전 8.15.16.mov` | **36.2초** | Admin Dashboard V2: KPI 카드·상담 추이 바차트·예약vs완료·상담사별 데이터 | 센터장용 “오늘 운영 한눈에” 본편 증거 |
| R04 | `통합스케쥴 1 2026-07-15 오전 8.16.27.mov` | **196.6초** | 통합 스케줄: 배정 목록+월 캘린더 → 새 미팅/패키지 선택 모달 → 일정 상세·예약 확정 | **가장 긴 핵심 컷** — 매칭·일정·확정 원스톱 |
| R05 | `통합스케줄2 2026-07-15 오전 8.20.12.mov` | **37.2초** | 통합 스케줄 후속(월간 캘린더·배정 목록·신규 배정/예약) | R04를 짧게 보강하거나 숏폼용 스케줄 클립 |
| R06 | `통합사용자 관리2026-07-15 오전 8.21.43.mov` | **73.7초** | 통합 사용자 관리: 내담자 탭·요약 KPI·카드/리스트·상세·수정 메뉴 | 상담사·내담자 계정 운영 |
| R07 | `재무관리2026-07-15 오전 8.23.53.mov` | **51.2초** | 수입·지출 개요·매칭 연동 요약·동기화/빠른 액션 영역 | 재무 “한눈에 수익·연동” |
| R08 | `재무관리2026-07-15 오전 8.25.12.mov` | **29.4초** | 재무 거래 내역·월별/세금 요약·상담료 거래 테이블 | 거래 상세·정산 느낌 (금액 클로즈업 과다 금지) |
| R09 | `자동문자 발송 2026-07-15 오전 8.28.34.mov` | **49.2초** | 알림/SMS 설정 → 발송 관리·히스토리 → SMS 템플릿(리마인더 등) | 자동 안내·노쇼 방지 메시지 |
| R10 | `상담일지 및 수정2026-07-15 오전 8.33.42.mov` | **29.8초** | 스케줄에서 진입 → **상담일지 작성(수정 모드)** 폼·위험도 스케일·저장/완료 | 상담 기록·품질 관리 클로징 증거 |

**원본 합계(미트림)**: 약 **614초 ≈ 10분 14초**. 본편 편집 후 권장 **약 3분 30초~5분**.

### 1.1 프레임 확인 요약 (PII)

- UI에 `DevUser-` / `DevConsultant-` 등 **개발용 식별자**가 다수 보임 → 문서·프롬프트에 **실명·전화·이메일을 적지 말 것**. 화면은 “admin dashboard”, “schedule calendar”, “user cards”, “finance ledger”, “SMS templates”, “counseling journal form”으로만 기술.
- Dock·메뉴바·브라우저 계정 UI가 보임 → 최종 납품 시 **크롭(브라우저 컨텐츠만)** 또는 블러 권장.
- 상담일지 본문·위험도 UI는 **민감** → A-roll은 짧게, 본문 텍스트 클로즈업 최소화.

---

## 2. 합성 순서 (이 녹화본 기준)

### 2.1 A-roll 순서 (사용자 지정)

```
[ Omni OP ]
→ R01 메인·로그인
→ R02 MVP 클릭
→ R03 대시보드
→ R04 통합스케줄1
→ R05 통합스케줄2
→ R06 통합사용자 관리
→ R07 재무관리(개요)
→ R08 재무관리(거래)
→ R09 자동문자
→ R10 상담일지
→ [ Omni ED / CTA ]
```

| 편집 # | 소스 | 권장 편집 초 | 내레이션 메시지(한 줄) |
|--------|------|--------------|------------------------|
| OP | Omni O1 | 6–10 | 상담센터 운영을 위한 Core Solution |
| A | R01 | 18–28 | 소개 페이지에서 로그인, 바로 운영 화면으로 |
| B | R02 | 10–16 | 매칭·운영 핵심을 한 번에 훑습니다 |
| C | R03 | 14–22 | 오늘 예약·추이·상담사 현황이 한눈에 |
| D | R04 | 28–45 | 캘린더와 배정·확정을 한 화면에서 |
| E | R05 | 8–14 | 일정 밀도를 한 번 더 보여 줌(또는 D에 흡수) |
| F | R06 | 12–20 | 내담자·상담사 계정을 카드로 관리 |
| G | R07 | 10–16 | 수입·연동 현황을 개요로 |
| H | R08 | 8–12 | 상담료 거래·정산 흐름 |
| I | R09 | 10–16 | 예약 리마인더·안내 문자를 자동으로 |
| J | R10 | 10–16 | 상담일지 작성·수정으로 기록을 남깁니다 |
| ED | Omni O9/O10 + 타이틀 | 4–8 | 데모·문의는 Core Solution으로 |

**본편 목표 런타임**: OP+트림 합 **약 3:40~4:50**.

### 2.2 뒷부분 컷 지점 (숏폼)

원본이 길어 R04(스케줄1)~이후를 “뒷부분”으로 본다. **본편 타임라인은 보존**, 숏폼은 **복제 시퀀스**에서 ripple delete.

| 숏폼 | Keep (A-roll) | Cut / 과감히 줄임 | Outro |
|------|---------------|-------------------|--------|
| **60초 센터장** | OP + R01(짧게) + R03 + R04(앞 18–22초) + ED | R02 티저만 or 생략, R05–R10 전체, R04 후반 모달 상세 | Omni 2–3초 + CTA 1회 |
| **60초 운영** | R04 앞 + R06 + R09 + ED | R01–R03 짧게, R07–R08·R10 | CTA 1회 |
| **90초 혼합** | R01·R03·R04·R06·R09 + ED | R02 생략, R05·R07·R08·R10 압축 | CTA 1회 |
| **본편에서 통째 제거 후보** | — | **R05** (R04와 중복이면), **R08** (금액 과다), R10 본문 클로즈업 | — |

**자를 때**: R04 **196초 원본 → 본편 28–45초**가 1차 트림. 모달(패키지 선택·일정 상세)은 **각 3–5초만** 남기고 반복 클릭은 삭제.

### 2.3 어디에 깔까 (A-roll / B-roll)

| 트랙 | 소스 | 언제 |
|------|------|------|
| **V1 A-roll** | Desktop `.mov` R01–R10 | 제품 증거가 필요한 전 구간. 기본 **불투명 100%** |
| **V2 B-roll Omni** | 아래 §4 클립 O1–O12 | OP·ED, 컷 사이 디졸브 1–3초, 긴 클릭 로딩 메우기. **R03·R04 본문은 Omni로 덮지 말 것** |
| **V3 타이틀** | 편집기 텍스트/로고 PNG | OP 카피, ED CTA만. Omni에 글자 생성 금지 |
| **A1 / S1** | 내레이션 + SRT | [보이스·자막 문서](./CORE_SOLUTION_VIDEO_NARRATION_CAPTIONS.md) R순서 SSOT (Omni 길이에 자막 OUT을 늘리지 않음) |

```
[Omni OP] → R01 ↔(O-login)→ R02 ↔(O-ops)→ R03
  ↔(O-schedule)→ R04 → R05 ↔(O-people)→ R06
  ↔(O-finance)→ R07 → R08 ↔(O-message)→ R09
  ↔(O-care)→ R10 → [Omni ED + CTA]
```

맥 툴: CapCut / Premiere / FCP. 시퀀스 **1920×1080 · 30fps** 권장(원본 4096×1728을 다운스케일·센터 크롭).

---

## 3. 사용 가이드 (짧게)

### 3.1 왜 영어 프롬프트인가

Omni/Veo는 영어 프롬프트에서 구도·네거티브 일관성이 나은 경우가 많다.  
아래는 **한국어 의도** + **복붙용 English prompt** + **negative**.

### 3.2 권장 생성 설정

| 항목 | 권장 |
|------|------|
| 길이 | 클립당 **4–8초** (전환 3–5초, OP/ED 6–10초) |
| 비율 | 본편 **16:9** |
| 스타일 | §3.3을 매 프롬프트에 붙임 |
| 인물 | 옆모습·손만 · 카메라 응시 금지 |
| 재생성 | 글씨·로고 나오면 폐기 |

### 3.3 스타일 고정

**Positive 접미사 (공통)**:

```text
Cinematic B-roll, soft daylight through sheer curtains, Korean private counseling clinic interior, calm professional atmosphere, muted olive and sage green accents on walls and soft furnishings, warm wood and linen textures, shallow depth of field, gentle slow camera move, photorealistic, no readable text on papers screens or phones, no logos, no watermarks
```

**Negative (공통)**:

```text
logos, watermarks, brand marks, readable UI text, Korean Hangul on screens, English letters on UI, fake software interface, laptop showing dashboard UI, calendar UI on screen, spreadsheet UI, hospital ER, surgical lights, cluttered medical equipment, bloody imagery, faces looking at camera, close-up faces, celebrity lookalikes, text overlays, subtitles burned in, QR codes, credit card numbers, phone numbers, neon cyberpunk, purple glow, stock photo watermark
```

---

## 4. 화면 구간별 Omni B-roll (이 녹화 흐름용)

파일명 예: `omni-r01-landing-morning.mp4`. 각 클립은 **해당 A-roll 앞·사이·받침**에만 끼움.

### Clip O1 — OP · 센터 공간 (R01 전)

- **한국어 의도**: 조용한 한국형 상담센터 로비 — 제품 등장 전 톤.  
- **끼우는 곳**: OP 전체 또는 R01 직전 2–3초.  
- **English prompt**:

```text
Slow push-in through a quiet Korean counseling clinic reception in soft morning daylight, empty waiting chairs with muted olive and sage cushions, plant and wooden side table, calm professional interior, no people or only a distant silhouette from behind, no readable text on posters or brochures, cinematic B-roll, soft daylight through sheer curtains, muted olive and sage green accents, warm wood and linen textures, shallow depth of field, gentle slow camera move, photorealistic, no logos, no watermarks
```

- **Negative**: (공통 §3.3)

---

### Clip O2 — R01 로그인 브릿지 (랜딩→로그인 숨고르기)

- **한국어 의도**: “전문 공간으로 들어간다”는 입구·복도 암시. UI 없음.  
- **끼우는 곳**: R01 중간(랜딩→로그인) 1–2초, 또는 R01→R02.  
- **English prompt**:

```text
Gentle tracking shot down a calm modern clinic corridor with soft daylight, frosted glass and warm wood, muted olive accents, empty and orderly Korean private counseling center, no people in frame, no signage text, cinematic B-roll, shallow depth of field, photorealistic, no logos, no watermarks, no readable text
```

- **Negative**: (공통) + `door signs with text, reception desk computer UI`

---

### Clip O3 — R02/R03 운영 리듬 (대시보드 전후)

- **한국어 의도**: 관리자가 차분히 일하는 손·어깨 너머. **노트북 화면은 블러/꺼짐**.  
- **끼우는 곳**: R02↔R03, R03 직전. **대시보드 본문은 V1만**.  
- **English prompt**:

```text
Over-the-shoulder of a professional adult at a wooden desk in a Korean counseling center office, hands typing on a laptop whose screen is softly blurred with no readable UI, warm soft daylight, muted olive mug and closed notebook, calm focused workplace, camera slowly drifts sideways, cinematic B-roll, sage green accents, warm wood and linen textures, shallow depth of field, photorealistic, no logos, no watermarks
```

- **Negative**: (공통) + `sharp focus on laptop UI, software screenshots, fake CRM dashboard, KPI charts on screen`

---

### Clip O4 — R04/R05 스케줄 분위기 (종이/벽 달력, 글씨 비독해)

- **한국어 의도**: “일정이 정리된다”를 공간으로. 소프트웨어 캘린더는 A-roll만.  
- **끼우는 곳**: R03→R04, R04↔R05 (1–3초). R04 긴 클릭 중 로딩 메우기용.  
- **English prompt**:

```text
Close slow tilt on a wall planner and desk calendar in a counseling clinic office, dates and handwriting intentionally blurred and unreadable, soft daylight, sage thumbtack and olive ribbon accent, calm organized mood implying scheduling without showing software, Korean private counseling clinic interior, cinematic B-roll, muted olive and sage green accents, warm wood and linen textures, shallow depth of field, gentle slow camera move, photorealistic, no readable text, no logos, no watermarks
```

- **Negative**: (공통) + `digital calendar UI, Google Calendar lookalike, appointment software`

---

### Clip O5 — R06 사람·계정 관리 암시

- **한국어 의도**: 카드·명함 정리 — 사용자 관리 느낌. **글씨 없는** 빈 카드.  
- **끼우는 곳**: R05→R06, R06 받침.  
- **English prompt**:

```text
Top-down slow pan of blank cream cards with no printed text neatly arranged on a warm wooden desk next to a closed notebook, soft daylight, muted olive tray and soft sage plant leaf, implies organized client records without any readable labels, Korean counseling office, cinematic B-roll, shallow depth of field, photorealistic, no logos, no watermarks, no readable text
```

- **Negative**: (공통) + `printed names on cards, ID photos, passport, business card logos`

---

### Clip O6 — R07/R08 재무·정산 분위기

- **한국어 의도**: 차분한 장부·계산기 제스처. **숫자·영수증 글씨 비독해**. 금액 UI는 A-roll만.  
- **끼우는 곳**: R06→R07, R07↔R08. R08 금액 클로즈업 대체용 짧게.  
- **English prompt**:

```text
Soft daylight close-up of professional hands resting near a closed ledger book and a calculator with display deliberately blurred unreadable, warm wood desk, muted olive ceramic cup, calm Korean counseling center back-office mood implying tidy finances without any readable numbers or UI, cinematic B-roll, shallow depth of field, photorealistic, no logos, no watermarks
```

- **Negative**: (공통) + `readable receipts, bank statements, spreadsheet grids, credit cards facing camera, currency amounts in focus`

---

### Clip O7 — R09 자동 안내·메시지 분위기

- **한국어 의도**: 조용한 알림·연락 암시. **폰 화면 꺼짐/블러**. SMS UI는 A-roll만.  
- **끼우는 곳**: R08→R09, R09 전후.  
- **English prompt**:

```text
Medium shot of a smartphone lying face-down on a wooden reception desk then a soft hand briefly tapping it, screen blacked out with no UI, quiet Korean counseling clinic, soft daylight, muted olive accents, calm notification mood without showing messages, cinematic B-roll, shallow depth of field, photorealistic, no logos, no watermarks, no readable text
```

- **Negative**: (공통) + `chat bubbles, SMS screenshots, Kakao UI, notification banners with text`

---

### Clip O8 — R10 상담·기록 신뢰감

- **한국어 의도**: 빈 상담실·노트 — 일지/기록의 돌봄 톤. 일지 폼은 A-roll만.  
- **끼우는 곳**: R09→R10, R10 직전.  
- **English prompt**:

```text
Static then gentle dolly inside an empty Korean private counseling room, two soft sofas facing each other with sage throw pillows, soft daylight, uncluttered walls, tissue box and water glasses without labels, quiet trustworthy mood for clinical documentation without showing forms, no people, no readable text, cinematic B-roll, muted olive and sage green accents, warm wood and linen textures, shallow depth of field, photorealistic, no logos, no watermarks
```

- **Negative**: (공통) + `medical charts with text, therapy notes readable, clipboard forms`

---

### Clip O9 — ED · 공간 아웃트로

- **한국어 의도**: 빈 로비·문 — **문구는 편집기 CTA만**.  
- **끼우는 곳**: R10 이후 ED.  
- **English prompt**:

```text
Slow pull-back from empty Korean counseling clinic doorway toward soft daylight lobby, calm hopeful ending mood, empty chairs with muted olive cushions, plant silhouette, professional clean interior, no people or distant soft silhouette only, absolutely no on-screen text no titles no logos, cinematic B-roll, sage green accents, warm wood and linen textures, shallow depth of field, photorealistic, no watermarks
```

- **Negative**: (공통) + `title cards, motto text, website URL burned into video, call-to-action text generated in frame`

---

### Clip O10 — ED · CTA 보조

- **한국어 의도**: 문의 유도. **명함·태블릿에 글자 없음**.  
- **끼우는 곳**: O9와 교차 디졸브, 또는 O9 대신.  
- **English prompt**:

```text
Close gentle shot of professional hands placing a blank cream card with no printed text next to a tablet with black muted screen on a wooden reception desk, soft daylight, muted olive ceramic cup, Korean counseling clinic reception, inviting calm CTA mood without any words in frame, cinematic B-roll, sage accents, shallow depth of field, photorealistic, no logos, no watermarks, no readable text
```

- **Negative**: (공통) + `printed business card text, URL, QR code, fake logo on card`

---

### Clip O11 — (선택) Pain · 운영 분산 암시

- **한국어 의도**: 종이·여러 기기 — “분산된 운영” 티저. OP 직후 선택.  
- **English prompt**:

```text
Overhead slow pan across a counselor office desk at end of day soft daylight, stacked paper planners with deliberately illegible blurred handwriting, two phones face-down, sticky notes with unreadable marks, mild sense of overwhelm without chaos, muted olive desk accessories, Korean counseling clinic office, no faces, no readable text on papers screens or phones, cinematic B-roll, calm professional atmosphere, shallow depth of field, photorealistic, no logos, no watermarks
```

- **Negative**: (공통) + `dramatic storm lighting, horror mood, screaming, trash piles`

---

### Clip O12 — (선택) 웹↔현장 연결

- **한국어 의도**: 노트북+폰(둘 다 비독해) — 클로징 전 “운영이 이어진다”.  
- **끼우는 곳**: R10↔ED.  
- **English prompt**:

```text
Top-down slow orbit of a closed notebook, a laptop with blurred dark screen, and a smartphone face-down on a warm wooden desk in a Korean counseling office, soft daylight, muted olive tray and sage plant leaf in corner, implies connected center operations without any software UI, cinematic B-roll, calm professional atmosphere, shallow depth of field, photorealistic, no readable text on papers screens or phones, no logos, no watermarks
```

- **Negative**: (공통)

---

## 5. A-roll ↔ Omni 매핑 표

| 시점 | V1 (녹화) | V2 Omni | 비고 |
|------|-----------|---------|------|
| OP | — | **O1** | 타이틀은 V3 |
| R01 중간 | R01 | O2 선택 | 랜딩→로그인 |
| R01→R02 | — | O2/O3 | 짧게 |
| R02·R03 | R02, R03 | O3만 경계 | **차트/KPI는 V1** |
| R03→R04 | — | **O4** | 권장 |
| R04·R05 | R04, R05 | O4 로딩만 | **캘린더·모달은 V1** |
| R05→R06 | — | **O5** | |
| R06 | R06 | — | 사용자 카드 V1 |
| R06→R08 | R07, R08 | **O6** | 금액 과다 시 O6로 가림 |
| R08→R09 | — | **O7** | |
| R09 | R09 | — | 템플릿 UI V1 (본문 짧게) |
| R09→R10 | — | **O8** | |
| R10 | R10 | — | 일지 본문 클로즈업 최소화 |
| ED | — | **O9 또는 O10** (+O12 선택) | CTA는 V3 |

---

## 6. 촬영 스크립트(컷 01–11)와의 관계

기존 [촬영 스크립트](./CORE_SOLUTION_COUNSELING_CENTER_VIDEO_SHOOTING_SCRIPT.md)의 웹+Expo 컷 01–11은 **앱 구간 포함 이상본**이다.  
**이번 Desktop 10본**은 **웹 어드민 중심 MVP 스토리**로, 합성 시:

- 본편이 **이 녹화본만**이면 → **본 문서 §2 순서**가 SSOT.
- 나중에 Expo 컷을 붙이면 → 스크립트 §4.2에 O6/O7(앱 브릿지) 클립을 기존 Omni 세트에서 재사용.

합성이 길면 [EDIT_ASSEMBLY](./CORE_SOLUTION_GOOGLE_OMNI_EDIT_ASSEMBLY.md)의 트랙·숏폼 절차를 따르되, **소스 파일은 R01–R10**으로 치환한다.

---

## 7. 납품 체크리스트

- [ ] R01–R10 A-roll 트림(특히 R04) + Dock/메뉴바 처리  
- [ ] Omni O1–O10 (선택 O11–O12), 읽히는 글씨·로고 없음  
- [ ] 본편 타임라인 §2 순서  
- [ ] 숏폼: 뒷부분(R05–R10 또는 R04 후반) cut 지점 적용, CTA 1회만  
- [ ] 문서·자막·내레이션에 **실명·전화 미기재**  
- [ ] 비즈니스 로직/코드 변경 없음 (마케팅 문서만)

---

## 8. 문서 링크

| 문서 | 역할 |
|------|------|
| [화면 촬영 스크립트](./CORE_SOLUTION_COUNSELING_CENTER_VIDEO_SHOOTING_SCRIPT.md) | 이상적 컷·내레이션·SRT (앱 포함) |
| [확인용 보이스·자막](./CORE_SOLUTION_VIDEO_NARRATION_CAPTIONS.md) | R01–R10 VO·하단 자막·챕터·SRT (본편·숏폼) |
| [합성·컷 상세](./CORE_SOLUTION_GOOGLE_OMNI_EDIT_ASSEMBLY.md) | 편집기 절차 (본 문서 R순서와 병행) |

---

*문서 위치: `docs/marketing/CORE_SOLUTION_GOOGLE_OMNI_PROMPTS.md`*
