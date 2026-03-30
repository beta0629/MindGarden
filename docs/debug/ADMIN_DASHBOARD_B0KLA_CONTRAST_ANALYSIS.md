# 어드민 대시보드(B0KlA) 텍스트 대비 부족 원인 분석

**작성일**: 2025-03-17  
**담당**: core-debugger (원인 분석·수정 제안만, 코드 수정 없음)

---

## 1. 증상 요약

- **현상**: 어드민 대시보드(B0KlA)에서 "공통 배지 부분" 및 라벨/부제 텍스트의 색상 대비가 거의 안 보임.
- **배경**: 밝은 크림색 계열 배경(`--ad-b0kla-bg` → `--mg-gray-50`).
- **영향 받는 요소**: "현재 매핑", "월별", "주별", "오늘", "사기 조치" 등 라벨, KPI 카드 라벨·부제, 차트 설명 등이 매우 옅은 회색으로 표시됨.
- **잘 보이는 요소**: "활성 매핑"처럼 진한 초록 배경 + 흰 글자 배지(`--ad-b0kla-green` + `#ffffff`)는 대비 양호.

---

## 2. 원인 분석

### 2.1 토큰·색상 체인

| 토큰 | 정의 (dashboard-tokens-extension.css) | 최종 hex (unified-design-tokens) |
|------|----------------------------------------|----------------------------------|
| `--ad-b0kla-bg` | `var(--mg-gray-50)` | `#f9fafb` (cs-secondary-50) |
| `--ad-b0kla-title-color` | `var(--mg-gray-800)` | `#1f2937` (cs-secondary-800) |
| `--ad-b0kla-subtitle-color` | `var(--mg-gray-500)` | `#6b7280` (cs-secondary-500) |
| `--ad-b0kla-text-secondary` | `var(--mg-gray-600)` | `#4b5563` (cs-secondary-600) |
| `--ad-b0kla-placeholder` | `var(--mg-gray-400)` | (더 옅음) |
| `--ad-b0kla-icon-color` | `var(--mg-gray-600)` | `#4b5563` |

일부 컴포넌트에서는 배경이 **fallback**으로 더 밝은 값이 쓰이기도 함:

- `MappingTableView.css`, `NavIcon.css`: `var(--ad-b0kla-bg, #fcfbfa)` → 실제 렌더가 `#fcfbfa`(크림에 가까운 밝은색)일 수 있음.
- 이 경우 배경이 `#f9fafb`보다 밝아져 대비가 추가로 떨어짐.

### 2.2 왜 대비가 부족한가

1. **WCAG 2.1 AA 기준(일반 텍스트 4.5:1)**  
   - 배경 `#f9fafb`(또는 `#fcfbfa`) 대비:
     - **gray-500 (`#6b7280`)**: 대비비 약 **4.0~4.2:1** → **4.5:1 미달** (AA 불충족).
     - **gray-600 (`#4b5563`)**: 대비비 약 **5.0~5.2:1** → 수치상 통과하나, 작은 글자(12px 부제, 13px 차트 설명)나 얇은 폰트에서는 **체감상 옅게** 보일 수 있음.
   - 따라서 **subtitle-color(gray-500)** 는 기준 미달, **text-secondary(gray-600)** 는 경계선·체감 불만.

2. **사용처 정리**  
   - **`--ad-b0kla-subtitle-color`** (gray-500):  
     - ERP `ApprovalDashboard.css` 등에서 부제/보조 텍스트에 사용.  
     - B0KlA 컴포넌트 내에서는 직접 쓰이지 않지만, 동일 테마 하에 다른 모듈에서 사용 시 동일 대비 문제 발생.
   - **`--ad-b0kla-text-secondary`** (gray-600):  
     - `.mg-v2-ad-b0kla__admin-desc`, `.mg-v2-ad-b0kla__chart-desc`, 비활성 `.mg-v2-ad-b0kla__pill`, `.mg-v2-content-kpi-card__label`, `.mg-v2-content-kpi-card__subtitle` 등 **라벨·부제·탭 텍스트 전반**에 사용.
   - **`--ad-b0kla-title-color`** (gray-800):  
     - 제목·라벨용으로 사용되며 `#1f2937`로 대비 충분. "라벨이 안 보인다"는 표현은 **부제/설명/비활성 탭**에 해당하는 **text-secondary·subtitle** 쪽 문제와 일치.

3. **오버라이드 여부**  
   - `ContentKpiRow.css`, `MappingKpiSection.css` 등에서 `var(--ad-b0kla-text-secondary, #64748b)` 형태로 fallback만 있고, **더 옅은 색으로 덮어쓰는 오버라이드는 없음**.  
   - 문제는 **토큰 자체가 밝은 배경 대비에 비해 옅은 회색**을 가리키고 있는 것.

### 2.3 결론(근본 원인)

- **subtitle-color(gray-500)** 는 밝은 배경 대비 **WCAG AA 4.5:1 미달**.
- **text-secondary(gray-600)** 는 수치상 통과하나, 작은/보조 텍스트에서 **체감 대비 부족**.
- 배경이 `#fcfbfa` 등으로 더 밝게 쓰이는 구간이 있으면 두 색 모두 대비가 더 떨어짐.
- **다른 오버라이드**보다는 **B0KlA 텍스트용 토큰이 너무 옅은 단계의 그레이**를 쓰는 것이 근본 원인.

---

## 3. 영향 범위 (해당 토큰/클래스를 쓰는 UI 요소)

### 3.1 `--ad-b0kla-text-secondary` 사용처

| 파일/위치 | 클래스/용도 |
|-----------|-------------|
| AdminDashboardB0KlA.css | `.mg-v2-ad-b0kla__chart-desc`, `.mg-v2-ad-b0kla__pill`(비활성), `.mg-v2-ad-b0kla__chart-placeholder`, `.mg-v2-ad-b0kla__chart-empty`, `.mg-v2-ad-b0kla__admin-desc` |
| ContentKpiRow.css | `.mg-v2-content-kpi-card__label`, `.mg-v2-content-kpi-card__subtitle` |
| MappingKpiSection.css | 라벨·보조 텍스트 |
| MappingFilterSection.css | placeholder/보조 텍스트 |
| ConsultationLogCalendarBlock.css | 보조 텍스트, 비활성 상태 |
| PsychUploadSection.css | 설명/보조 텍스트 |
| SystemConfigManagement.css | 보조 텍스트 |
| ListBlockView.css | 제목 외 텍스트 |
| 기타 | B0KlA 테마를 쓰는 카드/리스트의 라벨·부제·필터 텍스트 |

### 3.2 `--ad-b0kla-subtitle-color` 사용처

| 파일/위치 | 용도 |
|-----------|------|
| ApprovalDashboard.css | 부제목/보조 텍스트 (다수) |

### 3.3 `--ad-b0kla-title-color` 사용처

- `.mg-v2-ad-b0kla__admin-label`, `.mg-v2-ad-b0kla__chart-title`, MappingKpiSection 제목, ListBlockView 제목, DesktopGnb, NavIcon 등.  
- **현재 값(gray-800)은 대비 양호.** 수정 대상이 아니라, “라벨은 괜찮고 부제/탭이 안 보인다”는 증상과 일치.

### 3.4 배지(공통 배지 부분)

- **비활성 pill**: `color: var(--ad-b0kla-text-secondary)` → gray-600 → 옅게 보임.
- **활성 pill**: `background: var(--ad-b0kla-green); color: #ffffff` → 대비 양호(사용자 관찰과 일치).

---

## 4. 수정 제안 (WCAG 2.1 AA 4.5:1 충족)

### 4.1 권장 토큰 변경

**파일**: `frontend/src/styles/dashboard-tokens-extension.css`

| 토큰 | 현재 | 권장 | 비고 |
|------|------|------|------|
| `--ad-b0kla-subtitle-color` | `var(--mg-gray-500)` | `var(--mg-gray-700)` | AA 미달(gray-500) 해소. 부제/보조 문구에 사용. |
| `--ad-b0kla-text-secondary` | `var(--mg-gray-600)` | `var(--mg-gray-700)` | 4.5:1 이상 확보 및 체감 가독성 개선. 라벨·부제·비활성 pill·차트 설명 등. |

**참고**:  
- `--mg-gray-700` = `#374151` (cs-secondary-700).  
- `#374151` 대 `#f9fafb`: 대비비 약 **8.5:1** 수준으로 AA(4.5:1) 충분히 만족.

### 4.2 선택적 추가 조정

- **계층 유지가 중요할 때**:  
  - `--ad-b0kla-text-secondary`만 `var(--mg-gray-700)`으로 올리고,  
  - `--ad-b0kla-subtitle-color`는 `var(--mg-gray-600)`으로 유지(약 5:1로 AA 통과)해도 됨.  
  - 다만 12px 등 작은 글자에서는 **gray-700 권장**.
- **placeholder**  
  - `--ad-b0kla-placeholder`(gray-400)는 입력 힌트용이므로 AA가 의무는 아니나, 필요 시 `var(--mg-gray-500)` 정도로만 올려도 됨. 본 이슈의 핵심은 라벨/부제/탭이므로 우선순위는 낮음.

### 4.3 수정 시 주의사항

- **토큰만 변경**하면 `--ad-b0kla-text-secondary`, `--ad-b0kla-subtitle-color`를 참조하는 **모든 B0KlA 관련 UI에 일괄 반영**됨.
- `ContentKpiRow.css` 등에서 `var(--ad-b0kla-text-secondary, #64748b)` 형태 fallback을 쓰고 있으므로, 토큰 변경 후 fallback은 그대로 두어도 됨(토큰이 우선).

---

## 5. core-coder 전달용 체크리스트

- [ ] `frontend/src/styles/dashboard-tokens-extension.css`에서  
  - `--ad-b0kla-subtitle-color`를 `var(--mg-gray-700)`으로 변경  
  - `--ad-b0kla-text-secondary`를 `var(--mg-gray-700)`으로 변경  
- [ ] 저장 후 어드민 대시보드(B0KlA)에서 확인:  
  - "월별/주별/오늘" 등 비활성 pill, "현재 매핑" 등 라벨, KPI 카드 라벨·부제, 차트 설명 텍스트 가독성  
- [ ] (선택) 브라우저 개발자 도구 또는 접근성 검사기로 대비비 4.5:1 이상 확인  
- [ ] ERP ApprovalDashboard 등 `--ad-b0kla-subtitle-color` 사용처에서 부제목 가독성 확인  

---

## 6. 요약

| 항목 | 내용 |
|------|------|
| **원인** | B0KlA 텍스트용 토큰이 밝은 배경(gray-50/크림 계열) 대비에 비해 옅음. subtitle(gray-500)는 WCAG AA 미달, text-secondary(gray-600)는 경계·체감 부족. |
| **영향** | 라벨·부제·비활성 탭(pill)·차트 설명·KPI 카드 라벨/부제 등 `--ad-b0kla-text-secondary` / `--ad-b0kla-subtitle-color` 사용처 전반. |
| **수정** | `dashboard-tokens-extension.css`에서 두 토큰을 `var(--mg-gray-700)`으로 변경해 4.5:1 이상 확보. 코드 수정은 core-coder에게 위임. |
