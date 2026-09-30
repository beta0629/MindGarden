# Clinic-OS · 내담자 온라인숍 — 목록·장바구니·체크아웃 SSOT (P0)

리더 P0 2026-09-18 · **Design only** · 한국어  
원칙: 쉽고·편하고·가지고 싶게 · **대외 독립 DS** · 어드민 Clinic-OS 셸/LNB 복제 금지

**현재 시안 = shop v1 「회기 선반」** — 홈 v4 「상담실 로비」와 **같은 대외 DNA**.

---

## 시안 ≠ 실물 기준 고정 (MUST · 리더)

| | |
|--|--|
| **시안(mock)** | 시각·카피·IA의 **목표(target)** |
| **라이브** | 시안을 **따라야** 함 · 시안이 라이브에 맞춰 후퇴하지 않음 |
| **금지** | 「실물에 이미 있으니까 시안을 실물처럼」역방향 고정 · AS-IS 비율/톤을 TO-BE로 합법화 |

포트원(PortOne) 웹 결제는 **숍 경로**로 진입한다. 본 SSOT는 진입 전 UX(목록→담기→확인→결제·로그인 게이트)를 고정한다.

---

## 품질 바 · 홈 v4 정렬

홈 SSOT와 **품질바·토큰만 공유** — 셸/IA는 독립.

1. 깔끔하고 예쁘게  
2. 누가 봐도 밝고 상쾌  
3. 들어오고 싶게 · **커머셜**(어드민 DS 느낌 FAIL)

**FAIL:** 투박 · 어두운 어드민티 · 네이비 LNB · 5탭 IA · v3 파스텔 칩 콜라주 · 녹 링 · 내담자 예약 생성 CTA · AI 제네릭 이커머스 그리드 스팸

연계: `clinic-os-client-dashboard-ssot.md` (v4 로비) · `clinic-os-client-cart.md` · `clinic-os-client-session-count.md`

---

## 대외 크롬 (v4 editorial · MUST)

| | 규칙 |
|--|------|
| **셸** | Soft daylight stage `#FAFAF8` · surface `#FFFFFF` · warm line `#E8E4DC` |
| **네비** | **상단 editorial** — MindGarden mark + 소프트 탭 · **ops LNB 금지** · 앱 필 탭바 금지 |
| **탭 힌트** | 홈 · 예정 · 회기 · **회기 고르기(=숍)** · 결제 · 프로필 — 메뉴 최소화 |
| **단계** | quiet step pill: **1 담기 → 2 확인 → 3 결제** (5탭 상품/장바구니/결제/구매/포인트 **폐기**) |
| **토큰** | Ink `#0F172A` · Mute `#64748B` · Line `#E2E8F0` · Chip `#F1EFEA` · Primary CTA `#0E5F5A` on `#FAF9F7` |
| **녹** | Primary **버튼만** · 녹 링·녹 칩·틸 워시 선택 강조 **금지** |

구 cart/mall 시안의 **다크 LNB 셸 = 폐기**. DNA(티켓·영수증·회기칩)만 살리고 **크롬을 v4 로비로 교체**.

### 공통 상단 헤더 (MUST · 2026-09-18)

원본: **`clinic-os-client-web-header.md`**

- **상단 헤더 필수** · **사이드바/LNB 없음**
- 홈 v4 · 숍 · 장바구니 · 체크아웃 = **동일 헤더 크롬**
- 슬롯: `{brand}` · `{centerName}` · 네비 텍스트 · (로그인 시) `{userName}` + **로그아웃** CTA
- 시안 샷: 헤더에 **로그아웃** 보이게
- 비로그인 목록 열람은 계속 허용 · **결제 전 로그인**은 체크아웃 **본문** 게이트(헤더와 분리)


---

## 독특한 한 점 — 「회기 선반」

상품 목록은 이커머스 카드 스팸이 아니라, **조용한 상담 회기 선반**이다.

- 각 카드 = 선반 칸: **회기 스탬프(횟수)** + 상품명 + 단회기/패키지 ink chip + 가격 + CTA  
- 그리드 과밀·배지 콜라주·히어로 그라데이션 금지  
- 장바구니 = 기존 **회기 티켓 + 영수증 레일**  
- 체크아웃 = **차분한 결제 데스크** + **「결제 전 로그인」** 스트립

---

## 플로우 · 로그인 게이트 (SSOT)

```
[목록 · 회기 선반]  ← 비로그인 열람 OK · 담기 OK(게스트 카트) ※정책 허용 시
        ↓
[장바구니 · 확인]   ← step 2 · 비로그인 유지 가능 · 로그인 강제 없음
        ↓
[체크아웃 · 결제]   ← step 3 · ★ 결제 직전 「결제 전 로그인」패널
        ↓
[PortOne 웹결제]    ← 로그인된 세션에서만 진입
```

| 규칙 | 내용 |
|------|------|
| **목록** | **비로그인 브라우징 허용** — 카탈로그를 로그인 모달로 **막지 않음** |
| **담기** | 게스트 담기 허용(시안 기본). 센터 정책으로 로그인 후 담기 강제 가능하나 **기본 SSOT = 목록 개방** |
| **로그인 게이트 위치** | **체크아웃 화면 안**, 결제 CTA **직전** — 예: 패널 제목 **「결제 전 로그인」** |
| **게이트 표현** | 명확한 **한 순간(moment)** — 스트립/패널. 카탈로그 전면 블로커·전역 모달 벽 **금지** |
| **게이트 후** | 로그인 완료 → 동의·담당·포인트·**결제하기** → PortOne |

---

## Anti-hardcode (SSOT · MUST)

SSOT·스펙 본문에 **테넌트/상품/카피를 시스템 진리로 하드코딩하지 않는다.**

| 플레이스홀더 | 의미 |
|--------------|------|
| `{centerName}` | 센터 표시명 |
| `{productName}` | 상품명 |
| `{sessionCount}` | 회기수 (정수 ≥1) |
| `{sessionKind}` | `단회기` \| `패키지` (`clinic-os-client-session-count.md`) |
| `{durationMin}` | 회당 분 |
| `{unitPrice}` | 단가 |
| `{qty}` | 수량 |
| `{lineTotal}` | 줄합계 |
| `{counselorName}` | 담당 상담사 (미정이면 결제 게이트) |
| `{guestLabel}` | 비로그인 상태 카피 |

**시안 HTML 샘플**은 예시 라벨로 채워도 된다 — 반드시 **「예시 · 샘플」**로 표시. 샘플 ≠ 전 테넌트 고정값.

---

## A · 상품 목록 (회기 선반 · step 1 담기)

| 요소 | 규칙 |
|------|------|
| **크롬** | v4 editorial top · 탭「회기 고르기」ON 또는 숍 입구 |
| **히어로** | 짧은 editorial 인트로만 — 「{centerName}에서 고르는 상담 회기」톤 · 예약 CTA 없음 |
| **카드** | 선반 행: 스탬프 `{sessionCount}`회기 · `{productName}` · chip `{sessionKind}` · `{durationMin}분` · 가격 `{unitPrice}` |
| **CTA** | **담기** (primary soft 또는 teal) · **자세히** (ghost) |
| **회기** | 카드에 **회기수 필수 가시** · 단회기/패키지 칩 ink/slate (`clinic-os-client-session-count.md`) |
| **로그인** | 목록에 로그인 벽 **없음** · 우상단 「로그인」은 선택 진입만 |

---

## B · 장바구니 (step 2 확인)

기존 cart DNA 유지 · **크롬만 v4**:

- quiet steps: 1 담기 ✓ · **2 확인 ON** · 3 결제  
- 티켓 행: `{productName}` · 회기×수량 칩 `{sessionCount}회기 × {qty} = …` · ± · 줄합계 · **⋯ 제거**  
- 우측 **주문 영수증** sticky · **결제하러 가기**  
- **녹 링 금지** · 선택 = `#E2E8F0` + `1px #94A3B8`

상세 필드: `clinic-os-client-cart.md` (본 문서가 플로우 SSOT · cart는 티켓/영수증 DNA 소유).

---

## C · 체크아웃 (step 3 결제 · 로그인 게이트)

| 블록 | 내용 |
|------|------|
| steps | 1·2 done · **3 결제 ON** |
| 주문 요약 | 티켓 읽기 전용 · 동일 회기×수량 칩 |
| **「결제 전 로그인」** | **게이트 패널** — 비로그인 시: 안내 + 「로그인」/「회원가입」 CTA. 로그인 후: 「{guestLabel} → 로그인됨」확인 스트립으로 접힘 |
| 담당 | picker + 「변경」 · 미정이면 결제 불가 힌트 |
| 포인트·동의 | 동의 hit ≥24×24px |
| CTA | **결제하기** → PortOne (로그인·동의·담당 충족 시에만) |
| 금액 | 최종액 **ink** 대비 · teal은 CTA만 |

---

## PortOne

- 진입: 숍 체크아웃 **결제하기** 이후  
- UX 범위 밖(PG 위젯)은 본 SSOT 비소유 · **게이트·동의·주문서**까지가 P0 시안

---

## 시안 파일

| 산출물 | 경로 |
|--------|------|
| 공통 헤더 | `clinic-os-client-web-header.md` |
| 본 SSOT | `/workspace/core-solution-unity/clinic-os-client-shop.md` |
| TO-BE HTML | `/workspace/core-solution-unity/clinic-os-client-shop-tobe.html` |
| 샷 (종합 · 권장) | `/workspace/core-solution-unity/shot-client-shop-tobe.png` ≥1440 |
| (선택) 목록 단독 | `shot-client-shop-list-tobe.png` |
| 홈 v4 DS | `clinic-os-client-dashboard-ssot.md` · `clinic-os-client-dashboard-tobe.html` |
| 회기 DNA | `clinic-os-client-session-count.md` |
| 장바구니 DNA | `clinic-os-client-cart.md` (크롬 → v4 포인터) |

시안 레이아웃: **A목록 · B장바구니 · C체크아웃** 각각 **full-width 셸**을 **세로 스택** (반폭 스플릿 금지 · cart v2와 동일).

---

## 하지 말 것

- 어드민 네이비 LNB · **사이드바** · Clinic-OS ops 셸 복제
- 공통 헤더에서 **로그아웃** 누락(로그인 시)  
- 5탭 IA · v3 파스텔 칩 콜라주  
- 녹 링 · 녹 단회기/패키지 칩  
- 내담자 **예약하기 / 일정에 담기** CTA  
- 목록을 로그인으로 전면 차단  
- SSOT에 센터명·상품명을 **시스템 진리**로 하드코딩  
- 시안을 실물 AS-IS에 맞춰 후퇴(「시안 ≠ 실물 기준 고정」위반)

---

## 제출 게이트

- [ ] stage `#FAFAF8` · editorial top · **LNB 없음**  
- [ ] 「회기 선반」카드 · 회기수+단회기/패키지 가시  
- [ ] cart: 티켓·영수증·⋯·회기×수량 · steps 2 ON  
- [ ] checkout: **「결제 전 로그인」** 패널 · 목록은 비로그인 열람  
- [ ] Primary `#0E5F5A` · 녹링 없음 · placeholders in SSOT  
- [ ] 샷 ≥1440 · 세로 full-bleed 스택  
- [ ] **시안 = target** 문구 명시

핸드오프: @코어개발 — Design only · PortOne은 숍 경로 · 웹 선행.
