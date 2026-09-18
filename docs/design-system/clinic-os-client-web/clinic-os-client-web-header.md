# Clinic-OS · 내담자 웹 — 공통 상단 헤더 SSOT

리더 P0 보강 2026-09-18 · Design only · 한국어  
범위: **홈 v4 · 숍 목록 · 장바구니 · 체크아웃** — **동일 크롬**

---

## MUST

| 규칙 | 내용 |
|------|------|
| **상단 헤더 필수** | 내담자 웹은 **항상** editorial **상단 헤더** |
| **사이드바/LNB 없음** | ops Clinic-OS **네이비 LNB · 좌측 사이드바 복제 금지** |
| **동일 크롬** | 홈 · 숍 · 장바구니 · 체크아웃 = **같은 헤더 DNA** (마크·브랜드·테넌트·네비·우측 메타) |
| **로그아웃 CTA** | **로그인 상태** 헤더에 **「로그아웃」** 필수 노출 (시안 샷에 보이게) |
| **Anti-hardcode** | `{brand}` `{centerName}` `{userName}` — 시안 샘플은 「예시」라벨 |

---

## 구조 (좌→우)

```
[마크] {brand} · {centerName}     홈 | 예정 | 회기 | 회기 고르기 | 결제
                                  …  {userName} [아바타]  [로그아웃]
```

| 슬롯 | 내용 |
|------|------|
| **브랜드** | MindGarden 마크(가능 시 `assets/mg-butterfly.png`) + `{brand}` 워드 |
| **테넌트** | `·` 구분 + `{centerName}` (mute) |
| **네비** | 텍스트 탭 · 현재면 underline ink · **앱 필 탭바 아님** |
| **우측 (로그인)** | `{userName}` · 아바타 이니셜 · **로그아웃** CTA (ghost 버튼) |
| **우측 (비로그인)** | 「둘러보기」또는 생략 · **로그인** CTA — 목록 브라우징용. **결제 게이트는 체크아웃 본문** (`clinic-os-client-shop.md`) |

네비 「회기 고르기」= 숍 입구. 「예정」= read-only · 예약 생성 아님.

---

## 토큰 (홈 v4와 동일)

| | |
|--|--|
| Stage 헤더 면 | `rgba(250,250,248,.92)` + blur · border-bottom warm `#E8E4DC` |
| Ink / Mute | `#0F172A` / `#64748B` |
| 로그아웃 | ghost · `1px #E2E8F0` · ink 라벨 · **Primary teal 아님**(로그아웃≠주 CTA) |
| 높이 | ~64px · padding 좌우 ~48–56px |

---

## 연계

| 문서 | 역할 |
|------|------|
| 본 문서 | **공통 헤더** 원본 |
| `clinic-os-client-dashboard-ssot.md` | 홈 v4 · 헤더 절 → 본 문서 |
| `clinic-os-client-shop.md` | 숍 플로우 · 헤더 = 본 문서 · 결제 전 로그인 게이트는 체크아웃 본문 |
| `clinic-os-client-cart.md` | 티켓 DNA · 크롬 = 본 문서 |

---

## 하지 말 것

- 사이드바 / LNB / ops 셸  
- 헤더에 예약하기 CTA  
- 테넌트·유저명 SSOT 하드코딩(시스템 진리)  
- 로그아웃을 숨기거나 햄버거 속에만 두기(데스크톱 P0)

시안 ≠ 실물 역고정 금지 · mock = target.
