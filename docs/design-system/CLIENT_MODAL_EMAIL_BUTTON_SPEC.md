# 내담자 등록 모달(ClientModal) — 이메일 행 중복확인 버튼 스펙

**대상**: `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row` 내부의 **중복확인** 버튼  
**목적**: 버튼이 너무 크게 보인다는 피드백에 따라, **이메일 input 대비 작고 일관된 비율**로 줄인 디자인 스펙 제안.  
**참조**: PENCIL_DESIGN_GUIDE.md, B0KlA·unified-design-tokens, 어드민 대시보드 샘플.

---

## 1. 현재 상태 요약

| 항목 | 현재 값 |
|------|--------|
| 위치 | `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row` 내부 |
| 버튼 클래스 | `mg-v2-button mg-v2-button-secondary` |
| 전역 `.mg-v2-button` (unified-design-tokens) | padding 6px 12px, min-height 32px, font-size 0.8rem |
| 행 레이아웃 | flex, gap 12px, input `flex: 1`, 버튼 `flex-shrink: 0` |
| 이메일 input 높이 | 폼 기본 input 높이 40px (`--input-height-default`) |

---

## 2. 중복확인 버튼 전용 크기 권장안

**이메일 input(40px) 대비 약 0.7 높이**로 줄여, 한 줄에서 input이 주인공이고 버튼은 보조 액션으로 보이도록 한다.

| 속성 | 권장 값 | 토큰·비고 |
|------|---------|------------|
| **padding (상하)** | 4px | `var(--cs-spacing-xs)` (0.25rem = 4px) |
| **padding (좌우)** | 8px | `var(--cs-spacing-sm)` (0.5rem = 8px) |
| **min-height** | 28px | 고정 권장 (input 40px 대비 약 0.7) |
| **max-height** | 30px | 시각적 상한, 필요 시만 지정 |
| **font-size** | 12px | `var(--cs-text-xs)` (0.75rem) 또는 `0.75rem` |
| **line-height** | 1.2 | 가독·클릭 영역과 충돌 방지 |
| **border-radius** | 8px | `var(--cs-radius-md)` 또는 B0KlA 사용 시 `var(--ad-b0kla-radius-sm)`의 절반 수준(8px) 권장 — 작은 버튼에 12px는 과함 |

**시각적 비율**

- 이메일 input 높이: **40px** (`--input-height-default`)
- 중복확인 버튼 높이: **28px** → **input 대비 약 0.7**
- (선택) 0.8로 두고 싶다면 min-height **32px**, padding 4px 8px 유지 가능.

**색·테두리**

- 기존과 동일: secondary 스타일 유지  
  - B0KlA: `var(--ad-b0kla-text-secondary)`, `var(--ad-b0kla-border)`  
  - 배경 transparent, border 2px (기존 `.mg-v2-button-secondary` 규칙 따름).

---

## 3. 다른 폼 버튼과의 구분

- **적용 범위**: **이메일 행의 중복확인 버튼만** 작게 적용.
- **유지**: 같은 모달 내 "주소 검색", "등록", "취소" 등은 **기존 크기 유지** (주요 액션이므로 40px 등 기존 스펙 유지).

**modifier 클래스 제안 (택 1)**

| 옵션 | 클래스명 | 용도 |
|------|----------|------|
| **A** | `mg-v2-button--compact` | 폼 인라인 보조 버튼 공통 (이메일 중복확인, 추후 다른 인라인 액션에 재사용). **권장.** |
| **B** | `mg-v2-form-email-row__btn` | 이메일 행 전용. BEM으로 행 소유 버튼임을 명시. |

**스코프 권장**

- **A** 사용 시: `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-button.mg-v2-button--compact` 에만 compact 스타일 적용하면, 같은 모달 내 다른 버튼에는 영향 없음.
- **B** 사용 시: `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-form-email-row__btn` 로 스타일 적용.

---

## 4. 구현 시 코더 전달용 요약

- **대상**: `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row` 안의 중복확인 버튼.
- **추가 클래스**: `mg-v2-button--compact` (권장) 또는 `mg-v2-form-email-row__btn`.
- **오버라이드 값**  
  - padding: `var(--cs-spacing-xs) var(--cs-spacing-sm)` (4px 8px)  
  - min-height: 28px  
  - font-size: `var(--cs-text-xs)` (0.75rem)  
  - line-height: 1.2  
  - border-radius: 8px (또는 `var(--cs-radius-md)`)
- **유지**: 색상·테두리는 기존 `mg-v2-button-secondary` / B0KlA secondary 규칙 유지.
- **다른 버튼**: 주소 검색·등록·취소 등은 기존 스타일·크기 유지.

---

## 5. 참조

- `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- `frontend/src/styles/unified-design-tokens.css` (토큰명 참고)
- `frontend/src/styles/dashboard-tokens-extension.css` (--ad-b0kla-*)
- `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.css` (현재 이메일 행 스타일)

---

## 6. 마크업 권장 (core-publisher)

**목적**: 아토믹 디자인·BEM 관점에서 버튼 클래스와 접근성만 제안. JS/React·CSS 직접 수정은 core-coder 담당.

### 6.1 버튼에 붙일 클래스

**채택 권장**: 디자이너 제안 **A** (`mg-v2-button--compact`) 단일 사용.

| 방식 | 버튼 클래스 조합 | 용도·비고 |
|------|------------------|-----------|
| **권장** | `mg-v2-button mg-v2-button-secondary mg-v2-button--compact` | 폼 인라인 보조 버튼 공통 modifier. 이메일 행뿐 아니라 추후 다른 인라인 액션에서 재사용 가능. 스타일 스코프는 `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-button.mg-v2-button--compact` 로 한정. |
| 대안 (BEM 요소 명시) | `mg-v2-form-email-row__btn mg-v2-button mg-v2-button-secondary` | 행 소유 버튼임을 BEM 요소로 명시. compact 스타일을 `.mg-v2-form-email-row__btn` 에만 정의하면 `--compact` 없이 동일 비주얼 가능. |
| 병행 (선택) | `mg-v2-form-email-row__btn mg-v2-button mg-v2-button-secondary mg-v2-button--compact` | 요소 역할(__btn) + 공통 modifier(--compact) 둘 다 사용. 셀렉터가 길어지므로 팀 정책에 따라 선택. |

**퍼블리셔 제안**: 재사용성·스펙 일치를 위해 **권장안(A만)** 적용. `mg-v2-form-email-row__btn` 은 “이 행 전용” 셀렉터를 짧게 쓰고 싶을 때만 추가.

### 6.2 현재 마크업 구조 (참고)

```html
<div class="mg-v2-form-group">
  <label for="email" class="mg-v2-form-label">이메일 *</label>
  <div class="mg-v2-form-email-row">
    <input type="email" id="email" name="email" class="mg-v2-form-input" ... />
    <button type="button" class="mg-v2-button mg-v2-button-secondary mg-v2-button--compact">
      중복확인
    </button>
  </div>
</div>
```

- 버튼은 **행 블록(`mg-v2-form-email-row`) 내부 요소**이므로, BEM상 `mg-v2-form-email-row__btn` 을 쓰면 요소 관계가 명확해지나, **공통 버튼 modifier만으로도 스타일·스코프는 충분**하다.

### 6.3 접근성

- **버튼 텍스트**: "중복확인", "확인 중..." 유지. 스크린리더가 버튼 내 텍스트를 읽으므로 `aria-label` 은 **필수는 아님**.
- **aria-label 추가 시 (선택)**  
  - 권장 문구: `aria-label="이메일 중복 확인"` (고정).  
  - 로딩 시: `aria-busy="true"` 추가 권장 (진행 중 상태 전달).  
- **정리**: 시각적 텍스트만으로도 의미 전달 가능하므로, 팀에서 접근성 강화 시에만 `aria-label` + 로딩 시 `aria-busy` 적용.
