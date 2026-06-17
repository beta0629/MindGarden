# Brand Decisions — Trinity × CoreSolution

**확정일**: 2026-06-17  
**범위**: Design v2 Refine (Trinity public + CoreSolution product identity)  
**상태**: 확정 — 구현·시안 반영 시 본 문서 SSOT

---

## 1. 확정 결정 (3건)

| # | 항목 | 결정 |
|---|------|------|
| 1 | **공식 표기** | `CoreSolution` (붙임). 코드·식별자 현행 유지. 문구·wordmark·카피에도 동일 적용. |
| 2 | **Trinity 헤더 (B안 이중 브랜드)** | **헤더·푸터**: Trinity 단독. **CoreSolution**: Welcome, Onboarding Step 3·5·6, Hero, Powered by 등 **제품 구간만** 노출. |
| 3 | **MindGarden v2 (#425–427)** | **Defer** — Trinity onboarding v2 + F1 develop 정착 후 재개. |

---

## 2. 로고 연계

| 브랜드 | SSOT | wordmark | preview |
|--------|------|----------|---------|
| **CoreSolution** | [`core-solution/CORE_SOLUTION_LOGO_DESIGN_SPEC.md`](./core-solution/CORE_SOLUTION_LOGO_DESIGN_SPEC.md) | **`CoreSolution`** (공백 없음) | [`core-solution/assets/core-solution-logo-preview.html`](./core-solution/assets/core-solution-logo-preview.html) |
| **Trinity** | [`trinity/TRINITY_LOGO_DESIGN_SPEC.md`](./trinity/TRINITY_LOGO_DESIGN_SPEC.md) | Trinity (F1 확정) | [`trinity/assets/trinity-logo-preview-final.html`](./trinity/assets/trinity-logo-preview-final.html) |

- CoreSolution 로고 컨셉(G1–G3) wordmark는 본 결정 #1에 따라 **`CoreSolution`** 으로 통일한다. (기존 preview의 `Core Solution` 표기는 후속 디자인 패스에서 정정.)
- Trinity F1은 `feat/design-v2-trinity-logo-concepts` 에 반영 완료. CoreSolution 컨셉은 `feat/design-v2-core-solution-logo-concepts` 에서 진행.

---

## 3. 반영 체크리스트

### 공통
- [ ] 카피·wordmark에 `CoreSolution` (붙임) 사용 — `Core Solution` / `Core-Solution` 금지
- [ ] 코드 식별자·패키지명 변경 없음 (현행 유지)

### Trinity public (B안)
- [ ] Global header / footer: Trinity 로고만
- [ ] Welcome, Step 3·5·6, Hero, Powered by: CoreSolution 로고·표기
- [ ] Pricing·Landing hero 등 제품 구간 placement는 [`CORE_SOLUTION_LOGO_DESIGN_SPEC.md` §4](./core-solution/CORE_SOLUTION_LOGO_DESIGN_SPEC.md) 와 본 문서 #2 정합

### CoreSolution 로고
- [x] preview·SVG wordmark → `CoreSolution`
- [x] G1–G3, H1–H3 중 최종 컨셉 선정(H2) 후 core-coder 핸드오프 (SPEC §5)

### Defer (MindGarden v2 #425–427)
- [ ] Trinity onboarding v2 + F1 develop merge·정착 확인
- [ ] 이후 MindGarden v2 landing/onboarding/pricing 재개 여부 재판단

---

## 4. 참조

- CoreSolution 로고 SPEC: `docs/design/v2/refine/core-solution/CORE_SOLUTION_LOGO_DESIGN_SPEC.md`
- Trinity 로고 SPEC: `docs/design/v2/refine/trinity/TRINITY_LOGO_DESIGN_SPEC.md` (원격 `feat/design-v2-trinity-logo-concepts`)
- Trinity orchestration: `docs/design/v2/refine/trinity/TRINITY_DESIGN_V2_ORCHESTRATION.md`
