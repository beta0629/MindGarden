# DEPRECATED — Core Solution 다크 대비 + 이모지 오케스트레이션

> **상태**: **DEPRECATED** (2026-08-26)  
> **사유**: 사용자 정정 — 배치 범위가 “다크 AA + 이모지”로 **잘못 좁혀짐**.  
> **대체 문서**: [`CORE_SOLUTION_PRODUCT_VISUAL_TOKEN_SSOT_ORCHESTRATION.md`](./CORE_SOLUTION_PRODUCT_VISUAL_TOKEN_SSOT_ORCHESTRATION.md)  
>   - 제품 **전체** 비주얼 언어(라이트+다크)  
>   - dense SaaS 정돈 (마케팅 sparse 금지)  
>   - **토큰 SSOT + 하드코딩 이관** (화면별 paint job 금지)

아래 본문은 **이력 보관용**이다. Phase 2~4 프롬프트로 **사용하지 말 것**.

---

# (archived) Core Solution — 다크 대비(AA) + 이모지/장식 SVG 제거 오케스트레이션

**역할**: core-planner  
**브랜치**: `cursor/core-solution-dark-contrast-emoji-efe3` (base: develop)  
**범위**: frontend/theme/copy only — 백엔드 변경 금지  
**플랫폼 브랜드**: Core Solution (sian 05 Secure Core) — slate `#0F172A` / teal `#0D9488` / mint `#CCFBF1`  
**금지**: MindGarden 테넌트 비주얼(나비·수채화·골드 스크립트·Calm Forest olive)로 플랫폼 재스타일

> 원본 Phase 1 탐색 수치·파일 목록은 git 이력 `4af0f237b` 및 대체 오케스트레이션 §3 참고용으로만 사용.

## Archived goals (obsolete scope)

1. 다크 모드 WCAG 2.1 AA만 중심 — **폐기됨 (라이트+다크·전체 chrome으로 확대)**
2. 이모지/장식 SVG 제거 — **유지하되 배치 중심 아님**
3. 로그인 히어로 유지 — **유지**

See superseding document for current Do/Don't, Phase prompts, and designer handoff requirements.
