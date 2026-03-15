# 이메일 폼 레이아웃 깨짐 (스태프/내담자/상담사 모달) — 코어 디버거 분석

## 현상
- 모달 내 "이메일 *" 행에서 **입력란이 보이지 않고** "이메일 * 중복확인"만 한 줄로 보임.
- DOM: `div.mg-v2-form-group` 안에 label "이메일 *"과 버튼 "중복확인"만 인지되고, input이 시각적으로 없음.

## 재현 절차
1. 사용자 관리 → 스태프 → "새 스태프 등록" (또는 내담자/상담사 등록 모달)
2. 폼에서 이메일 행 확인
3. **결과: 이메일 입력란만 안 보이고, 중복확인 버튼만 보임**

## 원인 (근본 원인)
- **flex 레이아웃**: `.mg-v2-form-email-row` 는 `display: flex`, `.mg-v2-form-email-row__input-wrap` 는 `flex: 1 1 0%`, `min-width: 0`.
- **전역 스타일**: `unified-design-tokens.css` 등에서 `.mg-v2-form-input { width: 100% }` 가 적용됨.
- flex 자식에 `min-width: 0` 만 있으면, 일부 환경/캐스케이드에서 **계산된 너비가 0**이 되어 input이 접히는 현상이 발생함.

## 수정 내용
- **AdminDashboardB0KlA.css**  
  `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row__input-wrap` 에  
  **`min-width: 12rem`** 추가 → 래퍼가 최소 12rem 을 유지해 입력란이 항상 보이도록 함.
- (이미 적용된 구조) 이메일 input 은 `.mg-v2-form-email-row__input-wrap` 안에 두어, 래퍼가 flex 공간을 차지하고 그 안에서 input 이 100% 로 채우는 형태 유지.

## 기획 관점 (공통)
- **내담자/상담사/스태프** 등록·수정 모달의 이메일 행은 동일한 구조와 스타일을 사용함.
- **레이아웃 규칙**: 이메일 행 = label + (input 래퍼 + 중복확인 버튼), 래퍼는 `min-width: 12rem` 이상 보장.
