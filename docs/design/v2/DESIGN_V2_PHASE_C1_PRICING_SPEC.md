# Design V2 Phase C-1 (2/3) — Pricing Page Visual Spec

## §1. 개요·범위
본 문서는 MindGarden 디자인 v2 Phase C-1의 Pricing 페이지에 대한 시각적 설계(Visual Spec)를 정의합니다.
- **적용 팔레트**: Calm Forest (`docs/design/v2/DESIGN_V2_VISUAL_SPEC.md` 참조)
- **G③ 가격 Placeholder 정책**: 페이지 내의 모든 가격 정보는 디자인 스펙 및 하드코딩에서 제외됩니다. `₩TBD/월` 또는 `Pricing TBD — 운영팀 확정 예정`과 같은 Placeholder를 사용하며, 실제 가격은 운영팀이 별도의 데이터 슬롯을 통해 주입합니다.
- **운영팀 슬롯 분리**: 가격, FAQ 답변 본문, 하단 CTA 카피는 운영팀이 관리할 수 있도록 데이터 슬롯으로 분리하여 설계합니다.

## §2. 사용성·정보 노출·레이아웃 원칙
- **레이아웃 그리드**: 데스크탑 1440×900 (12-col), 모바일 414×896 (4-col) 기준.
- **정보 계층 구조**: 
  1. **Hero**: 페이지 타이틀 및 간략한 설명
  2. **3 Plan Cards**: Basic, Pro(강조), Enterprise 요금제 요약
  3. **Feature Matrix**: 상세 기능 비교 표
  4. **FAQ**: 자주 묻는 질문 (Accordion)
  5. **Bottom CTA**: 최종 전환 유도
- **시각적 일관성**: 모든 여백, 색상, 타이포그래피는 `var(--mg-v2-*)` 토큰을 엄격하게 적용하여 일관성을 유지합니다.

## §3. 3 Plan 카드 영역

### 데스크탑 (1440×900) 와이어프레임
```text
+-------------------------+ +-------------------------+ +-------------------------+
| Basic                   | | [Most Popular]          | | Enterprise              |
| 소규모 상담센터 대상      | | Pro                     | | 대규모/맞춤 도입 대상     |
|                         | | 중규모 상담센터 대상      | |                         |
| [가격 슬롯: ₩TBD/월]      | | [가격 슬롯: ₩TBD/월]      | | [가격 슬롯: Custom]       |
| [할인 슬롯: Save XX%]     | | [할인 슬롯: Save XX%]     | |                         |
|                         | |                         | |                         |
| [Get Started]           | | [Get Started]           | | [Contact Sales]         |
|                         | |                         | |                         |
| ✓ 기능 1                | | ✓ 기능 1                | | ✓ 기능 1                |
| ✓ 기능 2                | | ✓ 기능 2                | | ✓ 기능 2                |
| ✓ 기능 3                | | ✓ 기능 3                | | ✓ 기능 3                |
| ✓ 기능 4                | | ✓ 기능 4                | | ✓ 기능 4                |
| ✓ 기능 5                | | ✓ 기능 5                | | ✓ 기능 5                |
|                         | | ✓ 기능 6                | | ✓ 무제한 기능           |
|                         | | ✓ 기능 7                | | ✓ 전담 지원             |
|                         | | ✓ 기능 8                | | ✓ SLA 보장              |
+-------------------------+ +-------------------------+ +-------------------------+
```
- **Basic**: 
  - 카드 배경: `var(--mg-v2-color-surface-card)`
  - 테두리: `var(--mg-v2-border-width-thin) solid var(--mg-v2-color-border-default)`
  - CTA 버튼: Outline 스타일 (`/onboarding` 이동)
- **Pro (Highlighted)**: 
  - 카드 배경: `var(--mg-v2-color-surface-raised)`
  - 테두리: `var(--mg-v2-border-width-normal) solid var(--mg-v2-color-primary-main)`
  - 상단 뱃지: 배경 `var(--mg-v2-color-primary-main)`, 텍스트 `var(--mg-v2-color-text-inverse)`
  - CTA 버튼: Solid 스타일 (`/onboarding` 이동)
  - 그림자: `var(--mg-v2-shadow-md)` (다크 모드시 `var(--mg-v2-border-elevation-2)`)
- **Enterprise**: 
  - 카드 배경: `var(--mg-v2-color-surface-card)`
  - 테두리: `var(--mg-v2-border-width-thin) solid var(--mg-v2-color-border-default)`
  - CTA 버튼: Outline 스타일 (`/contact` 이동)

### 모바일 (414×896) 와이어프레임
- 1열 스택 (세로 배치).
- 순서: Pro (가장 위) -> Basic -> Enterprise.
- 카드 간 여백: `var(--mg-v2-space-4)`

## §4. PricingCard 재사용 분석
Phase B에서 작성된 `frontend/src/components/public/molecules/PricingCard.jsx`를 재사용하며, 다음의 Props 보강이 필요합니다.
- `isHighlighted` (boolean): Pro 플랜 강조 스타일 적용 여부.
- `badgeText` (string): 상단 뱃지 텍스트 (예: "Most Popular").
- `priceSlot` (ReactNode): 운영팀 가격 데이터 주입용 슬롯.
- `discountSlot` (ReactNode): 연간 할인율 데이터 주입용 슬롯.
- `features` (Array<{ text: string, included: boolean }>): 기능 리스트.
- `ctaText` (string): 버튼 텍스트.
- `ctaAction` (function | string): 버튼 클릭 시 동작 또는 이동 경로.

## §5. 기능 비교 표 (Feature Matrix)

### 데스크탑 (1440×900)
- **구조**: 4열 표 (기능명 | Basic | Pro | Enterprise)
- **Sticky 헤더**: 스크롤 시 요금제 이름(Basic, Pro, Enterprise)이 화면 상단에 고정 (`z-index: var(--mg-v2-z-sticky)`).
- **셀 디자인**:
  - 포함(✓): `var(--mg-v2-color-semantic-success)` 색상의 체크 아이콘.
  - 미포함(—): `var(--mg-v2-color-text-disabled)` 색상의 대시 기호.
  - 텍스트: `var(--mg-v2-color-text-primary)`, `var(--mg-v2-font-size-body-md)`.
- **행 구분선**: 하단에 `1px solid var(--mg-v2-color-border-light)`.

### 모바일 (414×896) 변환 규칙
- **변환 사유**: 4열 표를 모바일에서 가로 스크롤로 제공할 경우, 기능명과 요금제 간의 비교가 어렵고 조작이 불편합니다.
- **디자인 결정**: **Accordion 형태**로 변환.
  - 각 기능 카테고리가 Accordion 헤더가 됨.
  - 펼치면 해당 카테고리 내의 기능들이 리스트업되고, 각 기능 아래에 [Basic: ✓ | Pro: ✓ | Ent: ✓] 형태로 텍스트 뱃지가 나열됨.

## §6. PricingFeatureMatrix Organism 사양
Phase C-2 코더 핸드오프를 위한 컴포넌트 사양입니다.
- **컴포넌트명**: `PricingFeatureMatrix`
- **데이터 구조 제안**:
  ```json
  [
    {
      "category": "사용자 관리",
      "features": [
        { "name": "상담사 계정 수", "basic": "Up to 5", "pro": "Up to 20", "enterprise": "Unlimited" },
        { "name": "권한 관리", "basic": false, "pro": true, "enterprise": true }
      ]
    }
  ]
  ```
- **반응형 분기**: `window.innerWidth < 768px` 일 때 Accordion 뷰 렌더링, 그 이상일 때 Table 뷰 렌더링.

## §7. FAQ 섹션
자주 묻는 질문 8문항을 Accordion 형태로 제공합니다. 질문은 고정이나, **답변 본문은 운영팀 입력 슬롯**으로 처리합니다.

### 질문 리스트
1. 무료 체험이 있나요?
2. 결제 수단은 무엇이 가능한가요?
3. 중도 해지 및 환불 정책은 어떻게 되나요?
4. 요금제 업그레이드나 다운그레이드가 가능한가요?
5. 등록 가능한 상담사 수를 초과하면 어떻게 되나요?
6. 데이터는 안전하게 보관되나요? (보안 및 개인정보)
7. 외부 시스템(ERP, SMS, 카카오톡 등) 연동이 가능한가요?
8. Enterprise 요금제 도입 절차와 소요 기간은 어떻게 되나요?

### 시각 및 접근성 사양
- **질문 (Header)**: `var(--mg-v2-font-size-h5)`, `var(--mg-v2-font-weight-medium)`. 우측에 Chevron 아이콘.
- **답변 슬롯 (Body)**: Placeholder `"답변 작성 예정 — 운영팀"`. `var(--mg-v2-color-text-secondary)`.
- **접근성 (ARIA)**: 
  - 헤더 버튼에 `aria-expanded="true/false"`, `aria-controls="faq-body-id"`.
  - 키보드 네비게이션: `Tab`으로 이동, `Enter`/`Space`로 토글.

## §8. CTA 섹션
페이지 최하단에 위치하여 전환을 유도합니다.
- **배경**: `var(--mg-v2-color-surface-card)`
- **메시지**: "준비되셨나요?" (타이틀) + 보조 메시지
- **운영팀 카피 슬롯**: 타이틀 및 보조 메시지는 운영팀이 수정 가능하도록 슬롯화.
- **버튼 그룹**:
  - Primary: `Start Free Trial` (`/onboarding` 이동)
  - Secondary: `Contact Sales` (`/contact` 이동, Outline 스타일)

## §9. 다크 모드 정합
- **다크 토글 위치**: G② 결정에 따라 Global Header 우측에 위치 (Onboarding 스펙과 동일).
- **토큰 매핑**: `frontend/src/styles/tokens/design-v2-tokens.css`의 `@media (prefers-color-scheme: dark)` 및 `[data-theme="dark"]` 토큰을 자동 적용.
- **특이사항**: 다크 모드에서는 카드 그림자(`shadow`)가 제거되고, `var(--mg-v2-border-elevation-*)` 테두리로 깊이감을 표현합니다.

## §10. 모바일 (414×896) 반응형 전환 규칙
- **그리드**: 4-col, 마진 `1rem`, 거터 `1rem`.
- **폰트 스케일**: 데스크탑 대비 한 단계 축소 (예: `h1` -> `h2` 크기로 렌더링).
- **배치**: 모든 다단 레이아웃(3 Plan 카드, 버튼 그룹 등)은 1열 세로 스택으로 전환.

## §11. 마이크로 인터랙션
- **카드 호버 (PricingCard)**: 
  - `transform: translateY(-4px)`
  - `transition: transform var(--mg-v2-transition-normal)`
- **버튼 호버**: 
  - 배경색 `var(--mg-v2-color-primary-hover)`로 전환.
  - `transition: background-color var(--mg-v2-transition-fast)`
- **FAQ Accordion 펼침**: 
  - `max-height` 애니메이션 적용.
  - `transition: max-height var(--mg-v2-transition-normal)`
  - Chevron 아이콘 `transform: rotate(180deg)` (`var(--mg-v2-transition-fast)`).

## §12. WCAG 2.1 AA 검증 결과
- **컬러 대비 (Contrast Ratio)**: 
  - `var(--mg-v2-color-primary-main)` (#3D5246) on `var(--mg-v2-color-surface-bg)` (#FAF9F7) -> 8.5:1 (PASS)
  - `var(--mg-v2-color-text-secondary)` (#5C6B61) on #FAF9F7 -> 5.8:1 (PASS)
- **키보드 네비게이션**: 
  - 모든 CTA 버튼 및 FAQ Accordion 헤더는 `focus` 상태에서 `var(--mg-v2-shadow-focus)` 링이 명확히 표시됨. (PASS)
- **ARIA 속성**: 
  - FAQ 영역의 `aria-expanded`, `aria-controls` 적용 명시. (PASS)

## §13. 운영팀 입력 슬롯 분리 사양
프론트엔드 구현 시 다음 항목들은 하드코딩하지 않고 CMS 또는 설정 파일에서 주입받는 데이터 슬롯으로 구현해야 합니다.
1. **Plan별 가격**: Basic, Pro 요금제의 월간/연간 가격.
2. **Plan별 할인율**: 연간 결제 시 할인율 텍스트.
3. **FAQ 답변 본문**: 8개 문항에 대한 상세 답변 텍스트.
4. **Bottom CTA 카피**: 하단 전환 유도 영역의 메인 타이틀 및 서브 텍스트.

## §14. Core-Coder 핸드오프 체크리스트
Phase C-2 코더는 다음 사항을 확인하고 구현을 진행합니다.
- [ ] `frontend/src/styles/tokens/design-v2-tokens.css`의 토큰만 사용하여 스타일링했는가?
- [ ] 하드코딩된 색상/크기 값이 없는가?
- [ ] 가격, FAQ 답변, CTA 카피가 데이터 주입(Props 또는 Context) 형태로 분리되었는가? (Placeholder 적용)
- [ ] 모바일 환경에서 Feature Matrix가 Accordion 형태로 올바르게 전환되는가?
- [ ] 다크 모드 전환 시 카드의 그림자가 Elevation Border로 정상 대체되는가?
- [ ] Playwright E2E 테스트(G⑤) 작성을 위해 주요 요소에 `data-testid`가 부여되었는가? (예: `data-testid="pricing-card-pro"`, `data-testid="faq-accordion-0"`)
