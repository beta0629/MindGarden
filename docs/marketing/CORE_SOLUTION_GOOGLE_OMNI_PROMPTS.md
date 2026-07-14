# Core Solution 상담센터 — Google Omni (Veo·Gemini 영상) 프롬프트 · 합성·컷 가이드

**용도**: 홍보 영상의 **AI B-roll / 인트로 / 전환 / CTA**용. 제품 UI·실명 화면은 **화면녹화**로만 채운다.  
**대상 시청자**: 상담센터장·운영 실무 (제품명을 모르는 설명형)  
**연관**: [화면 촬영 스크립트](./CORE_SOLUTION_COUNSELING_CENTER_VIDEO_SHOOTING_SCRIPT.md) (§4.0·§4.2 타임코드 **유지**)  
**최종 갱신**: 2026-07-15

---

## 0. 금지 · 안전 (생성 전 필수)

| 금지 | 이유 |
|------|------|
| 실제 제품 UI·앱 화면을 AI에게 그리게 하기 | 가짜 한글 UI·로고 날조·신뢰 훼손 |
| 서류·모니터·휴대폰에 **읽히는 글씨**(한글/영문) | 가짜 UI·가짜 문서 |
| 실명·전화번호·얼굴 클로즈업·개인정보 | PII·초상권 |
| 브랜드 로고 날조·타사 로고 모방 | 상표·브랜드 리스크 |
| 병원 ER·수술·응급 분위기 | 상담센터 톤과 불일치 |

**원칙**: Omni = 분위기·공간·전환용 무빙 플레이스홀더. **기능 증거는 화면녹화 컷 01–11만**.

---

## 1. 사용 가이드 (짧게)

### 1.1 왜 영어 프롬프트인가

Google Omni / Veo 계열은 **영어 프롬프트**에서 구도·조명·네거티브 지시 일관성이 더 좋은 경우가 많다.  
아래는 **한국어 의도 1줄** + **복붙용 영어 prompt** + **negative** 세트다. 생성 후 한국어 자막·내레이션은 편집기에서 올린다(스크립트 §4.2 SRT).

### 1.2 화면녹화 + Omni 합성 (한 줄)

```
[ Omni OP ] → [ 화면녹화 컷 01… ] ↔ [ Omni 전환 ] → … → [ 화면녹화 컷 11 ] → [ Omni ED/CTA ]
```

- Omni 클립은 **화면 트랙만 교체/삽입**. **자막·내레이션 IN–OUT(§4.2 절대 타임코드)은 그대로** 둔다.  
- B-roll이 길면 앞뒤 **화면녹화**를 트림해 **같은 구간 길이**를 맞춘다 (스크립트 §4.0.3).

### 1.3 권장 생성 설정

| 항목 | 권장 |
|------|------|
| 길이 | 클립당 **4–8초** (전환 3–5초, OP/ED 6–10초) |
| 비율 | 본편 **16:9**, 숏폼 추출 시 **9:16 재생성** 또는 편집기 크롭 |
| 스타일 | §2 스타일 고정 문구를 **매 프롬프트 앞/뒤에 붙임** |
| 인물 | 등신대 이하·옆모습·손만 — 카메라 응시 길게 금지 |
| 재생성 | 같은 시드로 2–3안 뽑고, 읽히는 글씨·로고 있으면 폐기 |

---

## 2. 스타일 고정 문구 (공통)

모든 영어 prompt에 **그대로 붙인다** (hex 색상 코드·브랜드명 가짜 로고 금지).

### 2.1 Positive (공통 접미사)

```text
Cinematic B-roll, soft daylight through sheer curtains, Korean private counseling clinic interior, calm professional atmosphere, muted olive and sage green accents on walls and soft furnishings, warm wood and linen textures, shallow depth of field, gentle slow camera move, photorealistic, no readable text on papers screens or phones, no logos, no watermarks
```

### 2.2 Negative (공통)

```text
logos, watermarks, brand marks, readable UI text, Korean Hangul on screens, English letters on UI, fake software interface, laptop showing dashboard UI, hospital ER, surgical lights, cluttered medical equipment, bloody imagery, screaming patients, faces looking at camera for a long time, close-up faces, celebrity lookalikes, text overlays, subtitles burned in, QR codes, credit card numbers, phone numbers, neon cyberpunk, purple glow, stock photo watermark
```

선택적(초상권 강화 시): `recognizable faces, direct eye contact with camera`

---

## 3. 클립별 프롬프트 (Omni / Veo)

파일명 예: `omni-01-intro-daylight.mp4`

### Clip O1 — Intro · 오프닝 (공간으로 브랜드 암시)

- **한국어 의도**: 조용한 한국형 상담센터 대기·로비, 아침 빛 — “운영 플랫폼” 진입 전 톤 세팅.  
- **끼우는 곳**: OP (0:00–0:10) 앞/전체, 또는 컷 01 직전 2–3초.  
- **복붙용 English prompt**:

```text
Slow push-in through a quiet Korean counseling clinic reception area in soft morning daylight, empty waiting chairs with muted olive and sage cushions, a plant and wooden side table, calm professional interior, no people in frame or only a distant silhouette from behind, no readable text on posters or brochures, cinematic B-roll, soft daylight through sheer curtains, Korean private counseling clinic interior, calm professional atmosphere, muted olive and sage green accents, warm wood and linen textures, shallow depth of field, gentle slow camera move, photorealistic, no logos, no watermarks
```

- **Negative**: (공통 §2.2)

---

### Clip O2 — Pain · 센터 운영 고충 (산만·과부하 암시, 드라마틱하지 않게)

- **한국어 의도**: 책상 위 종이·달력·여러 기기 — “분산된 운영”을 암시. UI·글씨는 흐리게.  
- **끼우는 곳**: 컷 01 직전 또는 OP 직후 1–2초 티저(선택). 숏폼에서는 생략 가능.  
- **복붙용 English prompt**:

```text
Overhead slow pan across a counselor office desk at end of day soft daylight, stacked paper planners with deliberately illegible blurred handwriting, two phones face-down, sticky notes with unreadable marks, mild sense of overwhelm without chaos, muted olive desk accessories, Korean counseling clinic office, no faces, no readable text on papers screens or phones, cinematic B-roll, calm professional atmosphere, muted olive and sage green accents, warm wood and linen textures, shallow depth of field, gentle slow camera move, photorealistic, no logos, no watermarks
```

- **Negative**: (공통 §2.2) + `dramatic storm lighting, horror mood, screaming, trash piles`

---

### Clip O3 — Trust · 차분한 클리닉 (치료실·상담실)

- **한국어 의도**: 빈 상담실, 소파 두 개, 따뜻한 빛 — 신뢰·안전감.  
- **끼우는 곳**: 컷 01↔02 사이, 또는 웹 구간 중 숨 고르기(1–2초).  
- **복붙용 English prompt**:

```text
Static then gentle dolly inside an empty Korean private counseling room, two soft sofas facing each other with sage throw pillows, soft daylight, uncluttered walls, tissue box and water glasses without labels, quiet and trustworthy mood, no people, no readable text, cinematic B-roll, soft daylight through sheer curtains, Korean private counseling clinic interior, calm professional atmosphere, muted olive and sage green accents, warm wood and linen textures, shallow depth of field, photorealistic, no logos, no watermarks
```

- **Negative**: (공통 §2.2)

---

### Clip O4 — Transition · 데스크 → 운영 리듬 (손·노트북 외형만)

- **한국어 의도**: 관리자가 조용히 일하는 손·어깨 너머. **화면 내용은 흐림/꺼짐** — UI 금지.  
- **끼우는 곳**: 컷 02→03, 03→04 사이 (웹 “상품→매칭” 전환).  
- **복붙용 English prompt**:

```text
Over-the-shoulder of a professional adult at a wooden desk in a Korean counseling center office, hands typing on a laptop whose screen is softly blurred out of focus with no readable UI, warm soft daylight, muted olive mug and notebook closed, calm focused workplace, camera slowly drifts sideways, no readable text on papers screens or phones, cinematic B-roll, Korean private counseling clinic interior, calm professional atmosphere, muted olive and sage green accents, warm wood and linen textures, shallow depth of field, photorealistic, no logos, no watermarks
```

- **Negative**: (공통 §2.2) + `sharp focus on laptop UI, software screenshots, fake CRM dashboard`

---

### Clip O5 — Transition · 캘린더·일정 분위기 (종이/벽 달력, 글씨 비독해)

- **한국어 의도**: “스케줄이 한곳에” 메시지를 공간으로 — 벽 달력·플래너는 **블러**.  
- **끼우는 곳**: 컷 03 직전/직후, 또는 컷 03↔04.  
- **복붙용 English prompt**:

```text
Close slow tilt on a wall planner and desk calendar in a counseling clinic office, dates and handwriting intentionally blurred and unreadable, soft daylight, sage thumbtack and olive ribbon accent, calm organized mood implying scheduling without showing software, Korean private counseling clinic interior, cinematic B-roll, muted olive and sage green accents, warm wood and linen textures, shallow depth of field, gentle slow camera move, photorealistic, no readable text, no logos, no watermarks
```

- **Negative**: (공통 §2.2)

---

### Clip O6 — Transition · 모바일·현장 (앱 구간 브릿지, 화면 꺼짐/블러)

- **한국어 의도**: 상담사가 복도·상담실 앞에서 휴대폰을 보는 제스처 — **화면은 꺼지거나 블러**.  
- **끼우는 곳**: 컷 04→05 (웹→상담사 앱), 컷 07 전후.  
- **복붙용 English prompt**:

```text
Medium shot of a counselor in smart casual attire walking a quiet clinic hallway holding a smartphone with screen blacked out or heavily blurred no UI visible, soft daylight, muted olive and sage accents on walls, calm professional Korean counseling clinic, brief profile view not staring at camera, gentle tracking shot, cinematic B-roll, warm wood and linen textures, shallow depth of field, photorealistic, no readable text on papers screens or phones, no logos, no watermarks
```

- **Negative**: (공통 §2.2) + `phone screen showing app UI, fake mobile dashboard, Korean text on phone`

---

### Clip O7 — Trust · 내담자 안내 공간 (대기실·안내)

- **한국어 의도**: 내담자가 편히 앉는 공간 — 앱 구간(08–10) 앞 톤. 얼굴 정면 금지.  
- **끼우는 곳**: 컷 07→08, 또는 08 직전.  
- **복붙용 English prompt**:

```text
Wide calm shot of a counseling clinic waiting area with soft sage seating and a small side table, soft daylight, one adult client from behind sitting quietly, another empty chair, professional and welcoming Korean private practice, no eye contact with camera, no readable magazines or posters, cinematic B-roll, muted olive and sage green accents, warm wood and linen textures, shallow depth of field, gentle slow camera move, photorealistic, no logos, no watermarks
```

- **Negative**: (공통 §2.2)

---

### Clip O8 — Transition · 웹↔앱 연결 암시 (탁상 노트북 + 폰, 둘 다 비독해)

- **한국어 의도**: “같은 운영 흐름”을 기기 두 개로 암시 — 컷 11·클로징용.  
- **끼우는 곳**: 컷 10→11, 컷 11 위/아래.  
- **복붙용 English prompt**:

```text
Top-down slow orbit of a closed notebook, a laptop with blurred dark screen, and a smartphone face-down on a warm wooden desk in a Korean counseling office, soft daylight, muted olive tray and sage plant leaf in corner, implies connected center operations without any software UI, cinematic B-roll, calm professional atmosphere, shallow depth of field, photorealistic, no readable text on papers screens or phones, no logos, no watermarks
```

- **Negative**: (공통 §2.2)

---

### Clip O9 — Outro · 엔딩 공간 (CTA 배경용, 텍스트 없이)

- **한국어 의도**: 빈 로비·문 프레임 — **문구는 편집기 타이틀로만**. AI에 글자 넣지 말 것.  
- **끼우는 곳**: ED (3:32–3:38), 숏폼 엔딩.  
- **복붙용 English prompt**:

```text
Slow pull-back from empty Korean counseling clinic doorway toward soft daylight lobby, calm hopeful ending mood, empty chairs with muted olive cushions, plant silhouette, professional clean interior, no people or distant soft silhouette only, absolutely no on-screen text no titles no logos, cinematic B-roll, sage green accents, warm wood and linen textures, shallow depth of field, photorealistic, no watermarks
```

- **Negative**: (공통 §2.2) + `title cards, motto text, website URL burned into video, call-to-action text generated in frame`

---

### Clip O10 — Outro · CTA 보조 (손 + 명함/태블릿 외형, 글씨 없음)

- **한국어 의도**: 문의·데모 유도 분위기. **명함·화면에 글자 없음**. CTA 카피는 Premiere/CapCut 타이틀.  
- **끼우는 곳**: ED 위 O9와 교차 디졸브, 또는 O9 대신.  
- **복붙용 English prompt**:

```text
Close gentle shot of professional hands placing a blank cream card with no printed text next to a tablet with black muted screen on a wooden reception desk, soft daylight, muted olive ceramic cup, Korean counseling clinic reception, inviting calm CTA mood without any words in frame, cinematic B-roll, sage accents, shallow depth of field, photorealistic, no logos, no watermarks, no readable text
```

- **Negative**: (공통 §2.2) + `printed business card text, URL, QR code, fake logo on card`

---

## 4. 촬영 스크립트 컷 ↔ Omni 매핑

촬영 스크립트 **§4.2 절대 타임코드** 기준. Omni는 **앞에 끼우기 / 사이에 디졸브 / 뒤에 받침**만. 길이는 해당 자막 구간을 넘기지 않게 트림.

| Omni | 역할 | 본편에 끼울 위치 | 절대 구간(기준) | 비고 |
|------|------|------------------|-----------------|------|
| O1 | Intro | **OP 전체** 또는 OP+컷01 페이드인 | 0:00–0:10 | 로고 타이틀은 편집기 레이어 |
| O2 | Pain | OP 끝↔컷01 사이 **선택 1–2초** | ~0:08–0:12 | 본편에서 생략해도 됨 |
| O3 | Trust | 컷01↔02 / 웹 숨고르기 | ~0:36–0:40 | 짧게 |
| O4 | Transition | 컷02↔03 | ~0:52–0:56 | |
| O5 | Transition | 컷03 전후 | ~0:54 / ~1:30 | 통합 스케줄 강조 |
| O6 | Transition | **컷04→05** (웹→앱) | ~1:46–1:52 | 권장 필수 브릿지 |
| O7 | Trust | **컷07→08** (상담사→내담자) | ~2:36–2:42 | |
| O8 | Transition | 컷10→11 / 컷11 받침 | ~3:20–3:32 | “웹과 앱” 메시지 |
| O9 | Outro | **ED** | 3:32–3:38 | 타이틀 오버레이 |
| O10 | CTA | ED와 교차 | 3:32–3:38 | O9와 **둘 중 하나** 또는 3초+3초 |

**화면녹화만 두는 구간(Omni 최소화)**: 컷 01·03·05 — 제품 증거가 핵심이므로 B-roll을 덮지 말 것.

---

## 5. 합성(합치기) 워크플로

상세 절차·숏폼 자르기는 아래 요약으로 충분하면 이 절만 쓰고, 더 긴 체크리스트는 [합성·컷 전용 문서](./CORE_SOLUTION_GOOGLE_OMNI_EDIT_ASSEMBLY.md)를 본다.

### 5.1 트랙 구성 (위에서 아래)

| 트랙 | 내용 | 소스 |
|------|------|------|
| V3 | 타이틀·로고·CTA 문구 | 편집기 (AI에 글자 생성 금지) |
| V2 | Omni B-roll (O1–O10) | Google Omni/Veo export |
| V1 | 화면녹화 컷 01–11 | `cut-01-….mov` … (스크립트) |
| A1 | 내레이션(성우/더빙) | 스크립트 §4.1 내레이션 |
| A2 | 앰비언스/床音乐 (선택, -18~-24 LUFS) | 잔잔한 앰비언스 |
| S1 | 자막 | 스크립트 **§4.2 SRT** |

맥 기준 툴: **CapCut (맥)** / **Premiere Pro** / **Final Cut Pro** — 프로젝트 프레임레이트는 녹화와 맞춤(보통 30fps).

### 5.2 길이 맞춤 규칙

1. 시퀀스에 §4.2 마커(OP, 컷01…11, ED)를 먼저 찍는다.  
2. V1에 화면녹화를 올리고 **편집 초**(스크립트 §5.1)에 맞게 트림.  
3. V2 Omni를 **매핑 표(§4)** 지점에만 올린다. 디졸브 8–12프레임.  
4. Omni가 해당 자막 구간보다 길면 **Omni를 자른다** (자막 OUT을 늘리지 않음).  
5. A1·S1을 맞춘 뒤 V3에 CTA만 올린다.

### 5.3 레이어 우선순위

- 제품 증거가 필요한 순간 → **V1 100% opaque**.  
- 전환·숨고르기 → V2 위에 짧게.  
- OP/ED → V2 + V3 (텍스트는 V3만).

---

## 6. 뒷부분 컷 · 숏폼 편집

본편(약 3:38)을 만든 뒤, **후반(앱·CTA)** 을 잘라 **60초·90초**를 만든다. (스크립트 §4.3·§5.2와 정합)

### 6.1 자를 지점 (본편 절대 타임코드)

| 숏폼 | 권장 남길 구간 | 본편에서 가져올 컷 | 버릴/과감히 줄일 컷 |
|------|----------------|--------------------|---------------------|
| **60초 A · 센터장** | 웹 전면 | 01, 03, 04 + 05 티저 | 02 짧게 or 생략, 06–11, ED 길게 |
| **60초 B · 상담사** | 앱+웹 브릿지 | 05, 06, 03, 07 | 01–02, 08–11 |
| **60초 C · 내담자** | 내담자 앱 | 08, 09, 10 + 01/03 짧은 받침 | 02, 04–07, 긴 ED |
| **90초 혼합** | A안 + 앱 브릿지 | 01, 03, 04, 05, 08 티저 + ED 짧은 CTA | 02 생략, 06–07·09–10 압축, 11 생략 |

**본편 후반을 “통째로 자르는” 경우 (센터장 숏폼)**:

- 자름 IN: 대략 **1:49** (컷05 시작) 이후를 본편에서 **제외**하고, 필요 시 **0–2초 Omni O6 + 컷05 앞부분 8초**만 티저로 붙인 뒤 ED.  
- ED는 **한 번만** (O9 또는 O10 + 타이틀). 본편 ED를 숏폼에 **중복 붙여넣지 말 것**.

### 6.2 60초 타임라인 스케치 (A안 예시)

| 숏폼 절대 | 소스 | 초 |
|-----------|------|-----|
| 0:00–0:03 | O1 (Intro trim) | 3 |
| 0:03–0:18 | 컷01 | 15 |
| 0:18–0:40 | 컷03 | 22 |
| 0:40–0:52 | 컷04 | 12 |
| 0:52–0:58 | 컷05 앞 + O6 짧게 | 6 |
| 0:58–1:00 | O9 + CTA 타이틀 | 2 |

자막은 스크립트 **§4.3 A안 SRT** 사용. Omni를 끼워도 **자막 IN–OUT은 유지**.

### 6.3 Outro/CTA 트림 체크리스트

- [ ] CTA 문장이 **한 번만** 나오는가 (본편 ED + 숏폼 ED 중복 없음)  
- [ ] AI 영상에 **글자·URL·QR이 burn-in** 되지 않았는가  
- [ ] CTA 길이가 숏폼 **마지막 2–4초**로 제한됐는가  
- [ ] “데모·문의는 Core Solution으로” 카피는 **V3 타이틀**인가  
- [ ] 페이드 아웃과 내레이션이 동시에 끊기지 않는가 (내레이션 먼저 끝 → 0.3초 여유)

### 6.4 90초안 (간단)

1. A안 60초 구조 유지.  
2. **0:52 이후**에 컷05 **전체 근처(12–15초)** + O7 **2초** + 컷08 **8초** 추가.  
3. 끝 3초 O9+CTA.  
4. 총합이 90을 넘으면 컷03을 18초로 줄인다.

---

## 7. 납품 패키지 체크리스트

- [ ] Omni 클립 O1–O10 (또는 사용분만) export, 읽히는 글씨·로고 없음  
- [ ] 화면녹화 `cut-01` … `cut-11` (개발 URL·익명화 확인)  
- [ ] 본편 타임라인 + §4.2 SRT  
- [ ] 숏폼 60초 (A/B/C 중 필요분) + §4.3 SRT  
- [ ] (선택) 90초 혼합  
- [ ] CTA는 편집기 타이틀만 — Omni에 텍스트 없음  

---

## 8. 문서 링크

| 문서 | 역할 |
|------|------|
| [화면 촬영 스크립트](./CORE_SOLUTION_COUNSELING_CENTER_VIDEO_SHOOTING_SCRIPT.md) | 컷 01–11, 내레이션, SRT, 금지 촬영 |
| [합성·컷 상세](./CORE_SOLUTION_GOOGLE_OMNI_EDIT_ASSEMBLY.md) | CapCut/Premiere/FCP 단계, 숏폼 자르기 확장 |

---

*문서 위치: `docs/marketing/CORE_SOLUTION_GOOGLE_OMNI_PROMPTS.md`*
