# Seq 28g Phase 0-B — G5-01 공통코드 폼·목록 밀도 화면설계서

**작성일**: 2026-07-07  
**담당**: core-designer (handoff) → core-coder (구현)  
**관련**: G5-01 밀도 개선 (Track B — g5-01-density Phase 0-B)  
**대상 화면**: `/admin/common-codes` (`frontend/src/components/admin/CommonCodeManagement.js`)

---

## 1. 배경 및 목표

- **목표**: G5-01 공통코드 관리 화면의 2단 마스터-디테일 레이아웃 밀도를 최적화하고, 폼과 목록의 시각적 일관성을 B0KlA 디자인 시스템에 맞게 개선.
- **해결 과제**:
  - page-specific compact CSS를 제거하고 Table Comfortable 밀도를 기본으로 유지.
  - 마스터(그룹 목록)와 디테일(코드 폼/목록)의 2단 레이아웃 밀도 개선.
  - StandardizedApi 및 safeDisplay 적용.
  - Saved View Controls와 조화로운 공존.

---

## 2. 레이아웃 및 밀도 스펙 (B0KlA)

### 2.1 마스터-디테일 2단 레이아웃 (Comfortable)

- **전체 구조**: 좌측 마스터(코드 그룹 목록) + 우측 디테일(코드 목록 및 폼).
- **밀도 (Density)**: Comfortable (기본값).
  - Table 행 높이: 48px ~ 56px.
  - 여백: 섹션 간 `gap: 24px`, 내부 패딩 `24px`.
- **Saved View Controls 공존**:
  - `ContentHeader`와 2단 분할 컨테이너(`mg-v2-ad-b0kla__common-code-container`) 사이에 `SavedViewControls` 배치.
  - 전역 필터로서 2단 레이아웃 상단을 가로지름.

### 2.2 폼 필드 간격 및 라벨 (2단 레이아웃)

- **폼 구조**:
  - 폼 컨테이너 패딩: `24px`.
  - 폼 행(`mg-v2-ad-b0kla__form-row`): `display: flex`, `gap: 16px`.
  - 폼 그룹(`mg-v2-ad-b0kla__form-group`): `display: flex`, `flex-direction: column`, `gap: 8px`.
- **라벨 (Label)**:
  - 폰트 크기: `12px` (라벨/캡션 토큰 사용).
  - 색상: `var(--mg-v2-color-text-secondary)` (#5C6B61).
  - 폰트 웨이트: `500`.
- **입력 필드 (Input)**:
  - 높이: `40px`.
  - 테두리: `1px solid var(--mg-v2-color-border)`.
  - 코너 라디우스: `8px`.

---

## 3. 와이어프레임 (1280px / 768px)

### 3.1 데스크탑 (1280px 이상)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ AdminCommonLayout — 공통코드 관리                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ [SavedViewControls] (Chip 1) (Chip 2) [+ 뷰 저장]                            │
├───────────────────┬──────────────────────────────────────────────────────────┤
│ 그룹 목록 (Master)│ 코드 디테일 (Detail)                                     │
│ ┌───────────────┐ │ ┌──────────────────────────────────────────────────────┐ │
│ │ [검색] [필터] │ │ │ [신규 추가] 버튼                                     │ │
│ │               │ │ ├──────────────────────────────────────────────────────┤ │
│ │ 그룹 A        │ │ │ 폼 영역 (추가/수정 시 노출)                          │ │
│ │ 그룹 B        │ │ │ [코드값 Input]    [코드명 Input]                     │ │
│ │ 그룹 C        │ │ │ [상위카테고리 Select (Subcategory 시)]               │ │
│ │               │ │ │ [설명 Textarea]                                      │ │
│ │               │ │ │ [순서 Input]      [사용여부 Checkbox]                │ │
│ │               │ │ │ [취소] [저장]                                        │ │
│ │               │ │ ├──────────────────────────────────────────────────────┤ │
│ │               │ │ │ 코드 목록 (Table Comfortable)                        │ │
│ │               │ │ │ 코드명 | 코드값 | 상태 | 순서 | 설명 | 관리(수정/삭제)│ │
│ │               │ │ │ ...                                                  │ │
│ └───────────────┘ │ └──────────────────────────────────────────────────────┘ │
└───────────────────┴──────────────────────────────────────────────────────────┘
```

### 3.2 태블릿/모바일 (768px 이하) - Must Not

- **Must Not**: 768px 이하에서 2단 레이아웃을 강제로 가로로 욱여넣지 말 것.
- **해결**: 마스터(그룹 목록)가 상단에, 디테일(코드 목록)이 하단에 배치되는 1단 스택(Stack) 구조로 전환.

---

## 4. 디자인 제약 및 원칙 (Must Not)

- **Must Not**: `page-specific compact CSS` (예: `CommonCodeManagement.css` 내 테이블 행 높이 강제 축소) 사용 금지. 반드시 글로벌 Table Comfortable 토큰 사용.
- **Must Not**: 1280px 이하 화면에서 폼 필드가 깨지거나 겹치지 않도록 `flex-wrap: wrap` 적용.
- **Must Not**: 하드코딩된 색상 HEX 값 사용 금지. 반드시 `var(--mg-v2-*)` 토큰 사용.
- **Must Not**: 폼 필드 라벨 없이 Placeholder만 사용하는 것 금지.

---

## 5. Core-Coder DoD (완료 조건) 체크리스트

- [ ] `page-specific compact CSS` 제거 및 글로벌 Table Comfortable 밀도 적용 확인.
- [ ] 2단 마스터-디테일 레이아웃의 간격(`gap`), 패딩이 B0KlA 디자인 토큰과 일치하는지 확인.
- [ ] 폼 필드 간격(`16px`) 및 라벨 스타일(`12px`, secondary color) 적용 확인.
- [ ] `StandardizedApi` 연동 및 에러 처리 정합성 확인.
- [ ] 모든 출력 데이터에 `safeDisplay` (또는 `toDisplayString`) 적용하여 React #130 에러 0건 확인.
- [ ] `SavedViewControls`가 2단 레이아웃 상단에 정상적으로 렌더링되고 레이아웃을 침범하지 않는지 확인.
- [ ] 1280px 및 768px 뷰포트에서 레이아웃 깨짐 현상 없는지 검증.
