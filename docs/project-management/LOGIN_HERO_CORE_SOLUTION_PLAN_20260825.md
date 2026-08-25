# 로그인 히어로 Core Solution 브랜드 교체 — 기획·분배실행

**브랜치**: `cursor/login-hero-core-solution-9616` (base: develop)  
**PR 대상**: develop → `deploy-frontend-dev.yml` (mindgarden.dev). 운영(main/prod) yml 변경 없음.  
**오케스트레이터**: core-planner  
**참고**: Task 도구 미가용 시 동일 에이전트가 역할 정의(`.cursor/agents/*.md`)·스킬을 따라 Phase 순차 실행.

---

## 1. 제목·목표

개발 로그인 좌측 히어로를 **MindGarden(입점사) 쇼케이스**에서 **Core Solution 플랫폼 브랜드(시안 05 Secure Core)** 목업으로 교체한다. 우측 로그인 폼·소셜·테넌트 동작은 유지한다.

## 2. 범위

| 포함 | 제외 |
|------|------|
| 좌측 히어로 비주얼·모션·락업 SVG | 운영 배포 워크플로 |
| 우측 subtitle 카피(ko) | 백엔드 auth API |
| UnifiedLogin.js/css, LoginHeroLineOverlay, 자산 | MobileLogin MindGarden 로고(별도 범위) |
| 하드코딩 게이트(색상→토큰) | cherry-pick `d4851a4ef` 전체 |

## 3. 의존성·순서

1. 인벤토리(탐색) → 2. 디자인 스펙 → 3. 코더 패치 → 4. 테스터 게이트 → 5. 기획 최종 보고  
모션 패턴만 이전 시도 참고(one-shot ~3s + reduced-motion). 비주얼은 시안 05 재구현.

## 4. 사용자 관점 (§0.4)

| 항목 | 내용 |
|------|------|
| **사용성** | HQ/테넌트 사용자 로그인 진입. 좌측은 플랫폼 신뢰 신호, 우측은 기존 폼으로 즉시 로그인. |
| **정보 노출** | 좌측: Core Solution 브랜드만(MindGarden 나비·필기체·수채화 금지). 우측: 기존 폼·소셜·테넌트. |
| **레이아웃** | 스플릿: 좌 full-bleed 다크 그라데이션 히어로 / 우 폼. 흰 inset 마진·스톡 사진 없음. |

## 5. 분배실행표

| Phase | 담당 | 병렬 | 전달 요약 | 스킬 |
|-------|------|------|-----------|------|
| 0 인벤토리 | explore(또는 기획 대행) | — | UnifiedLogin·LoginHero*·auth.json·자산·토큰 | — |
| 1 스펙 | **core-designer** | Phase0 후 | 시안05 Secure Core + 스플릿 히어로 UI/UX 스펙 문서. 코드 금지. model 권장 gemini | design-handoff, atomic, encapsulation |
| 2 구현 | **core-coder** | Phase1 후 | 스펙대로 패치. 폼 회귀·하드코딩 게이트 | frontend, code-style, encapsulation, standardization |
| 3 검증 | **core-tester** | Phase2 후 | 스모크·모션·reduced-motion·콘솔 0 | testing |

### Phase 1 프롬프트 (core-designer)

화면설계·스펙을 `docs/design-system/LOGIN_HERO_CORE_SOLUTION_SECURE_CORE_SPEC.md`에 작성. Visual target·Motion 확정안 반영. 토큰: `--cs-slate-*` / `--cs-teal-*` / `--cs-teal-100`(mint). 코드 작성 금지.

### Phase 2 프롬프트 (core-coder)

스펙 경로 준수. 후보: UnifiedLogin.js/css, LoginHeroLineOverlay(또는 락업 컴포넌트), SVG, ko auth.json. MindGarden 오버레이·Lottie 히어로 제거. 우측 폼 유지. §17·§1.3 하드코딩 게이트. 운영 yml 금지.

### Phase 3 프롬프트 (core-tester)

히어로=Secure Core+one-shot 모션, MindGarden 자산 미사용, subtitle, 폼 렌더, prefers-reduced-motion, 콘솔 에러 0.

## 6. Done when

- 좌측 = 시안05 mark + CoreSolution path-draw-once-and-stay + 한국어/태그라인  
- MindGarden butterfly/script/watercolor 없음  
- 우측 폼·subtitle Core Solution  
- develop PR용 커밋 가능, 운영 yml 무변경  

## 7. 화면설계서

`docs/design-system/LOGIN_HERO_CORE_SOLUTION_SECURE_CORE_SPEC.md`
