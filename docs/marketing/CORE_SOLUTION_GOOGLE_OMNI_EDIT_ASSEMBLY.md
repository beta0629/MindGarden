# Core Solution 상담센터 — 영상 합성·뒷부분 컷 가이드 (Omni + 화면녹화)

**목적**: Google Omni B-roll과 화면녹화를 **한 타임라인에 합치고**, 본편 후반을 **잘라** 60·90초 숏폼을 만드는 실무 절차.  
**프롬프트·실제 녹화 SSOT**: [CORE_SOLUTION_GOOGLE_OMNI_PROMPTS.md](./CORE_SOLUTION_GOOGLE_OMNI_PROMPTS.md) (§1 인벤토리 · §2 합성 순서)  
**보이스·자막 SSOT (R01–R10)**: [CORE_SOLUTION_VIDEO_NARRATION_CAPTIONS.md](./CORE_SOLUTION_VIDEO_NARRATION_CAPTIONS.md)  
**이상 컷(앱 포함)**: [촬영 스크립트 §4.0·§4.2·§4.3](./CORE_SOLUTION_COUNSELING_CENTER_VIDEO_SHOOTING_SCRIPT.md)  
**최종 갱신**: 2026-07-15 (보이스·자막 카피 문서 연동)

---

## 1. 합성 전 준비물

| # | 항목 | 확인 |
|---|------|------|
| 1 | Desktop 녹화 **R01–R10** (프롬프트 문서 §1) 또는 `cut-01`…`cut-11` | ☐ |
| 2 | Omni O1–O10 (선택 O11–O12) — 화면 글씨·로고 없음 | ☐ |
| 3 | 내레이션 WAV/AI 보이스 — [나레이션 문서](./CORE_SOLUTION_VIDEO_NARRATION_CAPTIONS.md) §2·§3 | ☐ |
| 4 | 자막 SRT — 본편/숏폼 각각 (동일 문서 SRT) | ☐ |
| 5 | CTA·로고 PNG (투명 배경) — **실사 브랜드 자산만**, AI 생성 로고 금지 | ☐ |

프로젝트: **1920×1080 · 30fps**. Desktop 원본은 **4096×1728 @120fps** → 다운스케일·컨텐츠 크롭(Dock/메뉴바 제거 권장).

---

## 2. 트랙 템플릿

```
V3  Titles / Logo / CTA text     ← 편집기만
V2  Omni B-roll                  ← O1–O12
V1  Screen recordings            ← R01 … R10 (A-roll)
A1  Narration
A2  Bed / ambience (optional)
S1  Subtitles (SRT)              ← burn-in은 최종 export 시에만
```

### 맥 편집툴 빠른 매핑

| 작업 | CapCut (맥) | Premiere Pro | Final Cut Pro |
|------|-------------|--------------|---------------|
| 마커 | 타임라인 마커 | Markers (M) | Markers (M) |
| 디졸브 | 叠化 | Cross Dissolve | Cross Dissolve |
| 자막 | 자막 임포트 / 자동 | Captions ← SRT | Roles → Titles 또는 SRT 도구 |
| 오디오 러프 | 자동 덕킹 | Essential Sound | Expand Audio |

---

## 3. 본편 조립 순서 (Desktop R01–R10, 권장)

1. **빈 시퀀스**에 마커:  
   `OP | R01 | R02 | R03 | R04 | R05 | R06 | R07 | R08 | R09 | R10 | ED`
2. **V1**에 [프롬프트 §2.1](./CORE_SOLUTION_GOOGLE_OMNI_PROMPTS.md) 순서로 올리고 **권장 편집 초**로 트림.  
   - **R04(≈196초)** → 본편 **28–45초**가 핵심 트림.  
3. **A1** 내레이션을 올리고 컷 경계를 0.2초 단위로 맞춤.  
4. **S1** 자막 IN–OUT을 **잠금** (Omni로 OUT을 늘리지 않음).  
5. **V2** Omni를 [프롬프트 §5 매핑](./CORE_SOLUTION_GOOGLE_OMNI_PROMPTS.md)대로 삽입.  
6. **V3** OP 타이틀, ED CTA.  
7. V1↔V2 디졸브 8–12f. **R03·R04 본문은 V1 불투명 유지**.  
8. 러프 재생 → 립싱크·자막만 수정.

### 레이어 규칙 (한 줄)

> **증거(화면) > 분위기(Omni) > 글자(타이틀)**. 같은 순간에 셋이 경쟁하면 증거를 남긴다.

---

## 4. 컷 ↔ Omni 삽입 퀵레퍼런스 (Desktop)

| 시점 | V1 | V2 추가 |
|------|----|---------|
| OP | — | **O1** |
| R01 중간 / R01→R02 | R01 | O2 |
| R02↔R03 | R02, R03 | O3 (경계만) |
| R03→R04 | — | **O4** |
| R04·R05 | R04, R05 | O4 로딩만 |
| R05→R06 | — | **O5** |
| R06→R08 | R07, R08 | **O6** |
| R08→R09 | — | **O7** |
| R09→R10 | — | **O8** |
| ED | — | **O9 또는 O10** (+O12) + V3 CTA |

(앱 포함 이상본 `cut-01`…`cut-11`을 쓸 때는 촬영 스크립트 §4.2 + 기존 앱 브릿지 Omni를 병행.)

---

## 5. 뒷부분 자르기 — 본편 → 숏폼

### 5.1 원칙

- 본편 타임라인은 **보존**. 숏폼은 **복제 시퀀스**.  
- Desktop 기준 “뒷부분” = **R05 이후** 또는 **R04 후반(모달·확정 이후)** + R07–R10.  
- Outro/CTA는 **숏폼 끝에 1회**.

### 5.2 자를 지점 (Desktop)

| 작업 | 설명 |
|------|------|
| 센터장 60초 | OP + R01 짧게 + R03 + R04 앞 18–22초 + ED. **R05–R10 ripple delete** |
| 운영 60초 | R04 앞 + R06 + R09 + ED. R01–R03·재무·일지 과감히 축소 |
| 금액 과다 완화 | **R08** 삭제 또는 O6로 대체 |
| R04 트림 | 원본 196초 → 본편 28–45초; 패키지 모달·일정 상세는 각 3–5초만 |

### 5.3 60초 — 남길 / 버릴 (Desktop)

**A안 센터장**

| 남김 | 버림 |
|------|------|
| OP, R01(짧게), R03, R04 앞, ED | R02(또는 티저), R05–R10, R04 후반 |

**B안 운영·안내**

| 남김 | 버림 |
|------|------|
| R04 앞, R06, R09, ED | R01–R03 길게, R07–R08, R10 |

### 5.4 CapCut / Premiere에서 “후반 잘라내기”

1. 본편 시퀀스 **복제** → `promo-60-director`.  
2. playhead를 **R05 시작**(또는 R04 트림 끝)에 두고 razor → 오른쪽 **ripple delete**.  
3. 끝: **O4(2초)+R04 티저(선택)+O9(2초)+CTA**.  
4. 숏폼용 SRT를 **새로 임포트**.  
5. 총 길이 60±1초 — 넘으면 R03·R04를 줄인다.

### 5.5 90초 확장

1. A안 복제 → `promo-90-mix`.  
2. R06 + R09를 각 8–12초 추가.  
3. ED 3초. 90 초과 시 R04를 줄인다.

### 5.6 Outro/CTA 중복 방지

- [ ] 숏폼에 본편 ED가 **두 번** 있지 않다  
- [ ] Omni에 CTA burn-in 없음  
- [ ] V3 CTA가 마지막 **2–4초**만  
- [ ] 내레이션이 CTA보다 먼저 끝  
- [ ] 페이드 아웃 0.3–0.5초  

---

## 6. 오디오 · 자막 주의

- Omni 전환은 **내레이션 문장 경계**에서만.  
- 화면이 Omni여도 **자막 IN–OUT 유지**.  
- 숏폼 SRT는 본편 SRT를 슬라이스하지 말고 **새로** 잡는다.  
- 실명·전화는 자막에도 **쓰지 않음**.

---

## 7. Export

| 산출물 | 권장 |
|--------|------|
| 본편 3–5분 | H.264 / H.265, 1920×1080, 8–12 Mbps |
| 숏폼 60·90초 | 1080×1920 또는 16:9 |
| 마스터 | ProRes 422 (선택) |

파일명 예: `cs-counseling-desktop-main.mp4`, `cs-counseling-60-director.mp4`.

---

## 8. 관련 문서

- [Google Omni 프롬프트 · 실제 녹화 인벤토리](./CORE_SOLUTION_GOOGLE_OMNI_PROMPTS.md)  
- [확인용 보이스·자막 R01–R10](./CORE_SOLUTION_VIDEO_NARRATION_CAPTIONS.md)  
- [화면 촬영 스크립트](./CORE_SOLUTION_COUNSELING_CENTER_VIDEO_SHOOTING_SCRIPT.md)

---

*문서 위치: `docs/marketing/CORE_SOLUTION_GOOGLE_OMNI_EDIT_ASSEMBLY.md`*
