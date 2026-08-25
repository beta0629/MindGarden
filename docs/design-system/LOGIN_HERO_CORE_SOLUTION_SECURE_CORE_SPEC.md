# 로그인 히어로 — Core Solution Secure Core (시안 05) UI/UX 스펙

**대상 화면**: Unified Login (`/login`)  
**역할**: 비로그인 사용자(전체)  
**산출물 유형**: 디자인 스펙 (코드 없음)  
**관련 기획**: `docs/project-management/LOGIN_HERO_CORE_SOLUTION_PLAN_20260825.md`  
**참조**: `/core-solution-design-handoff`, `unified-design-tokens.css`, `docs/design-system/UNIFIED_LOGIN_REDESIGN_SPEC.md`

---

## 1. 개요·배경

플랫폼 HQ 로그인 좌측 히어로는 **Core Solution** 브랜드여야 한다. MindGarden은 테스트 테넌트/입점사일 뿐이며, 나비·골드 필기체·수채화 히어로는 사용하지 않는다.

## 2. 사용성·정보 노출·레이아웃 (§0.4)

| 항목 | 요구 |
|------|------|
| **사용성** | 좌측은 브랜드 신뢰만 전달. 인터랙션 없음(pointer-events: none). 우측에서 이메일·휴대폰·비밀번호·소셜·테넌트 선택. |
| **정보 노출** | 좌측: Mark(시안05) + `CoreSolution` + `코어 솔루션` + 태그라인 `상담센터 All-in-One 운영`. MindGarden·입점사 로고 비노출. 우측: 기존 폼 카피만 Core Solution 정렬. |
| **레이아웃** | 데스크톱 50/50 스플릿. 좌: full-bleed 다크 그라데이션(흰 inset·스톡 사진·수채화 PNG 없음). 우: 기존 폼 카드 유지. 모바일: 히어로 상단 축소 + 폼 하단. |

## 3. 레이아웃 구조

```
.mg-v2-login-container (flex row)
├── .mg-v2-login-hero          ← 좌측 full-bleed (배경만 CSS 그라데이션)
│   └── .mg-v2-login-hero-brand
│       └── .mg-v2-login-hero-lockup-wrapper
│           ├── h1.sr-only (CoreSolution)
│           └── SVG lockup (mark + wordmark + ko + tagline)
└── .mg-v2-login-content       ← 우측 기존 유지
    └── form (subtitle 카피만 조정)
```

- 히어로 **padding inset 제거**(또는 최소 내부 spacing만 lockup에). 흰 마진 프레임 금지.
- `login-hero-watercolor.png` / `core-logo-butterfly.png` / MindGarden trace SVG **히어로에서 제거**.
- `LoginHeroLottieOverlay` 히어로 미사용 유지(이미 미연결이면 신규 연결 금지).

## 4. Visual — Secure Core Mark (시안 05)

단일 SVG 락업 내 mark 영역 (권장 viewBox 예: `0 0 320 280` — 코더가 비율 조정 가능).

| 레이어 | 형태 | 색 (토큰) | Hex 참고(토큰 값) |
|--------|------|-----------|-------------------|
| 1. Rounded square | rx≈22% of mark size | `var(--cs-slate-900)` | `#0F172A` |
| 2. Outer shield | 방패 실루엣 fill | `var(--cs-teal-900)` | `#134E4A` |
| 3. Inner shield | 약간 작은 방패 | `var(--cs-teal-600)` | `#0D9488` |
| 4. Mint core | 중심 작은 방패/코어 | `var(--cs-teal-100)` | `#CCFBF1` |
| 5. Lock | 자물쇠 (몸통+고리) | `var(--cs-teal-600)` 또는 `var(--cs-teal-700)` | teal lock |

- 브랜드 SVG **고유 색은 SVG 클래스 + CSS 변수**로 지정. CSS 본문에 hex 남발 금지.
- 기존 Calm Forest **체크 실드 금지**. 반드시 lock 마크.

## 5. Typography · Copy (히어로)

| 요소 | 문안 | 스타일 |
|------|------|--------|
| Wordmark | `CoreSolution` (공백 없음) | Bold white sans, `var(--mg-white)` / `var(--cs-white)` |
| Korean | `코어 솔루션` | Regular/Medium, white 88~92% opacity |
| Tagline | `상담센터 All-in-One 운영` | Smaller, white ~70% opacity |
| (선택) 설명 | 목업에 짧은 1문장 있을 때만. 기본은 **생략** — tagline으로 충분 |

우측 폼:

| 키 | 변경 |
|----|------|
| `auth:unifiedLogin.subtitle` (ko) | `CoreSolution에 로그인하세요` |
| title 등 | 기존 유지(MindGarden 혼합 금지) |

영문 `auth.json` 없음 — ko만 조정.

## 6. Motion (확정)

**One-shot → stay. ~3s ease-out. infinite / sparkle / traveling-light / erase·reset 금지.**

| 단계 | 대상 | 타이밍 |
|------|------|--------|
| 1 | Shield outline(s) stroke draw → fill | 0~≈1.2s, ease-out |
| 2 | CoreSolution wordmark stroke-draw → fill stay | ≈0.3s delay, ~3s total ease-out |
| 3 | Korean + tagline fade-in | wordmark 이후(~2.2s~) opacity 0→1 |

- `animation-iteration-count: 1` + `forwards`만.
- `@media (prefers-reduced-motion: reduce)`: 모든 요소 **최종 filled/opacity:1 즉시**, animation none.

모션 패턴 참고(비주얼 재사용 금지): 이전 시도 `d4851a4ef`의 one-shot keyframes 구조만.

## 7. 배경

```css
background-color: var(--cs-slate-900);
background-image: linear-gradient(
  160deg,
  var(--cs-slate-900) 0%,
  var(--cs-slate-800) 42%,
  var(--cs-teal-900) 100%
);
```

- 스톡 오피스 사진·webp/png 히어로 미디어 **사용 안 함**.
- 기존 `::before` 수채화용 하단 페이드는 **제거 또는 무색** (다크 풀블리드만).

## 8. 아토믹·모듈

| 단위 | 계층 | 책임 |
|------|------|------|
| Secure Core mark paths | Atom (SVG) | 브랜드 마크 |
| LoginHeroBrandLockup | Molecule | mark+wordmark+ko+tagline + 모션 클래스 |
| UnifiedLogin hero 영역 | Organism 일부 | 배경·배치만. 폼 Organism 변경 최소화 |

공통 모듈: 신규 모달 불필요. 기존 UnifiedLogin 유지.

## 9. 토큰 제안

이미 `unified-design-tokens.css`에 존재 — **신규 토큰 추가 불필요**(없으면 추가 제안):

- `--cs-slate-900` `#0f172a`
- `--cs-slate-800` `#1e293b`
- `--cs-teal-900` `#134e4a`
- `--cs-teal-600` `#0d9488`
- `--cs-teal-100` `#ccfbf1`
- `--cs-white` / `--mg-white`

로그인 히어로 전용 별칭(선택, 가독용):

```css
--mg-login-hero-bg-start: var(--cs-slate-900);
--mg-login-hero-bg-mid: var(--cs-slate-800);
--mg-login-hero-bg-end: var(--cs-teal-900);
--mg-login-hero-mark-plate: var(--cs-slate-900);
--mg-login-hero-shield-outer: var(--cs-teal-900);
--mg-login-hero-shield-inner: var(--cs-teal-600);
--mg-login-hero-core: var(--cs-teal-100);
```

스펙상 권장. 코더가 UnifiedLogin.css `:root` 또는 `.mg-v2-login-hero` 스코프에 둘 수 있음.

## 10. 코더 완료 체크리스트

- [ ] 수채화·butterfly·MindGarden script path 히어로에서 제거
- [ ] Secure Core lock mark + CoreSolution + 한국어 + 태그라인
- [ ] one-shot ~3s, no infinite/traveling-light/sparkle
- [ ] prefers-reduced-motion → 최종 상태
- [ ] 우측 폼·소셜·테넌트 동작 유지
- [ ] subtitle `CoreSolution에 로그인하세요`
- [ ] CSS hex 남발 없음(SVG 클래스→변수)
- [ ] deploy-frontend / prod yml 미변경
- [ ] 하드코딩 게이트 §17 / §1.3 준수

## 11. 참조

- `frontend/src/styles/unified-design-tokens.css` (`--cs-slate-*`, `--cs-teal-*`)
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17
- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3
- 이전 모션만: `origin/cursor/login-hero-handwriting-draw-87fe` @ `d4851a4ef` (Calm Forest·수채화 재사용 금지)
