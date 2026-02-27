# 심리검사 리포트 UI/UX 아토믹 디자인 리뷰

**작성일**: 2026-02-27  
**대상**: PsychAssessmentAdminWidget, PsychAssessmentManagement 페이지, BaseWidget  
**참조**: 마인드가든 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample), docs/project-management/PSYCH_ASSESSMENT_ANALYSIS_REPORT.md, docs/design-system/ATOMIC_DESIGN_SYSTEM.md

---

## 1. 현재 UI 구성 요소 목록 및 아토믹 레벨 매핑

### 1.1 PsychAssessmentAdminWidget 구성 요소

| 요소 | 사용 클래스 | 아토믹 레벨 | 비고 |
|------|-------------|-------------|------|
| 위젯 래퍼 | BaseWidget, `psych-assessment-admin-widget` | Organism | |
| 통계 그리드 | `mg-stats-grid` | Organism | 3개 카드 그리드 |
| 통계 카드 | `mg-stats-card` + `mg-stats-card__content` | Molecule | |
| 통계 값 | `mg-stats-card__value` | Atom (Text) | 숫자 강조 |
| 통계 라벨 | `mg-stats-card__label` | Atom (Text) | 업로드/추출/리포트 |
| PDF 업로드 카드 | `mg-card` + `mg-card__header` + `mg-card__body` | Molecule | |
| 드래그앤드롭 영역 | `mg-card` + 인라인 `style` | Molecule | **인라인 스타일 사용** |
| 검사 유형 셀렉트 | `mg-select` | Atom | |
| 파일 입력 | `mg-input` type="file" | Atom | |
| 업로드 버튼 | `mg-button mg-button--primary` | Atom | |
| 최근 업로드 카드 | `mg-card` + `mg-card__header` + `mg-card__body` | Molecule | |
| 테이블 래퍼 | `mg-table-wrapper` | Molecule | |
| 테이블 | `mg-table` + thead/tbody | Organism | |
| 빈 상태 | `mg-empty-state` | Molecule | |
| 리포트 생성 버튼 | `mg-button mg-button--sm mg-button--outline` | Atom | |
| 새로고침 버튼 | `mg-button mg-button--sm mg-button--ghost` | Atom | |

### 1.2 PsychAssessmentManagement 페이지 구성 요소

| 요소 | 사용 클래스 | 아토믹 레벨 | 비고 |
|------|-------------|-------------|------|
| 페이지 래퍼 | AdminCommonLayout | Template | mg-v2-ad-b0kla, mg-v2-ad-dashboard-v2 |
| 콘텐츠 컨테이너 | `mg-container` | Layout | |
| 위젯 | PsychAssessmentAdminWidget | Organism | 위젯 재사용 |

### 1.3 BaseWidget 구성 요소

| 요소 | 사용 클래스 | 아토믹 레벨 |
|------|-------------|-------------|
| 위젯 컨테이너 | `mg-widget mg-widget--{type} mg-card mg-card--elevated` | Organism |
| 헤더 | `mg-widget__header mg-card__header` | Molecule |
| 바디 | `mg-widget__body mg-card__body` | Molecule |
| 로딩/에러/빈 상태 | `mg-loading-container`, `mg-alert`, `mg-empty-icon` | Molecule |
| 버튼 | `mg-button mg-button--sm mg-button--outline` | Atom |

---

## 2. 아토믹 디자인 불일치·누락 항목

### 2.1 심각도 높음

#### 2.1.1 인라인 스타일 사용 (드래그앤드롭 영역)

```jsx
style={{
  borderStyle: 'dashed',
  borderWidth: '2px',
  borderColor: isDragOver ? 'var(--cs-primary-400)' : 'var(--cs-gray-300)',
  background: isDragOver ? 'var(--cs-primary-50)' : 'var(--cs-slate-50)'
}}
```

- **문제**: DESIGN_CENTRALIZATION_STANDARD 및 core-solution 표준상 모든 스타일은 CSS 변수/클래스로 중앙화. 인라인 `style` 사용 금지.
- **권장**: `mg-dropzone` 또는 `mg-upload-area` 클래스로 추출, `mg-upload-area--drag-over` 같은 상태 클래스 적용.

#### 2.1.2 mg-container vs mg-v2-ad-b0kla__container 불일치

- PsychAssessmentManagement는 `mg-container`만 사용.
- AdminDashboard, UserManagementPage 등은 `mg-v2-ad-b0kla` 루트 + `mg-v2-ad-b0kla__container` 패턴 사용.
- **문제**: 어드민 샘플과 동일한 톤·구조 유지 지침에 반함. 페이지가 AdminCommonLayout 내부에 있지만 콘텐츠 영역이 `mg-v2-ad-b0kla__container` 패턴과 일치하지 않음.

#### 2.1.3 통계 카드: mg-stats-card vs mg-v2-ad-b0kla__kpi-card 혼재

- PsychAssessmentAdminWidget: `mg-stats-card` (Widget.css 스타일)
- AdminDashboard B0KlA: `mg-v2-ad-b0kla__kpi-card` (아이콘 + 라벨 + 값 + 배지)
- AdminDashboardB0KlA.css의 `.mg-v2-ad-b0kla .mg-stats-grid .mg-dashboard-stat-card` 스타일은 다른 위젯(SecurityAuditWidget 등)용.
- **문제**: 어드민 대시보드 샘플의 KPI 카드 비주얼(좌측 아이콘, 라벨, 값, hover 효과)과 현재 통계 카드(상단 그라디언트 바)가 상이함.

### 2.2 심각도 중간

#### 2.2.1 cs-* vs mg-* vs ad-b0kla 토큰 혼재

- 드래그앤드롭: `var(--cs-primary-400)`, `var(--cs-gray-300)`, `var(--cs-slate-50)`
- 일부 위젯: `var(--cs-primary-500)`, `var(--cs-secondary-500)`
- unified-design-tokens.css: `--mg-*`, `--cs-*` 혼재
- 어드민 샘플 B0KlA: `--ad-b0kla-*` 토큰
- **문제**: 마인드가든 어드민 샘플 기준은 `#3D5246`(주조), `#FAF9F7`(배경), `#D4CFC8`(테두리) 등. PsychAssessment 위젯은 cs-* 블루 계열 사용 → 시각적 불일치.

#### 2.2.2 섹션 블록 좌측 악센트 바 누락

- 어드민 대시보드 샘플: 섹션 제목에 좌측 세로 악센트 바(4px, #3D5246, radius 2px) 필수.
- 현재 PsychAssessment 위젯: `mg-card__header`에 아이콘 + h4만 사용. 악센트 바 없음.

#### 2.2.3 Atom/Molecule 분리 미흡

- **StatsCard**: `mg-stats-card` + `__content`, `__value`, `__label` 조합은 Molecule로 사용 가능하나, `atoms/`·`molecules/` 디렉터리에 StatsCard 컴포넌트로 분리되어 있지 않음. 인라인 마크업만 존재.
- **UploadDropzone**: 드래그앤드롭 영역이 분자 단위로 분리되지 않음.
- **DocumentTable**: `mg-table` + tbody 렌더링이 Organism 수준이지만, 테이블 컴포넌트 재사용 없이 인라인 구현.

#### 2.2.4 validate-css-classes.js 규칙과 충돌 가능성

- 스크립트: `mg-` 접두사는 레거시로 간주, 새 컴포넌트는 `mg-v2-` 권장.
- PsychAssessment 위젯: `mg-stats-card`, `mg-card`, `mg-button` 등 `mg-` 사용.
- **문제**: 레거시 클래스와의 충돌 검사 시 경고/에러 발생 가능. 프로젝트 전반의 mg- vs mg-v2- 정책과 정합성 필요.

### 2.3 심각도 낮음

#### 2.3.1 타이포그래피

- 어드민 샘플: Noto Sans KR, 제목 20–24px/600, 본문 14–16px, 라벨 12px/#5C6B61.
- 현재: `mg-h5`, `mg-text-muted` 사용. unified-design-tokens의 `--font-size-*`와 일치 여부는 CSS 의존.

#### 2.3.2 접근성

- 드래그앤드롭: `role="button"`, `tabIndex={0}` 있으나 `onKeyDown` 빈 함수 → Enter/Space로 활성화 불가.
- 테이블: `data-label` 사용으로 모바일 대응 가능. `scope` 속성은 없음.

#### 2.3.3 반응형

- `mg-stats-grid`: `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))` → 기본 반응형 지원.
- `mg-table`: unified-design-tokens.css에 모바일용 `display: block`, `data-label` 기반 레이아웃 정의됨.
- mg-container: max-width 등 반응형 정의 확인 필요.

---

## 3. 개선 권장사항 (우선순위별)

### P0 (필수)

| # | 항목 | 내용 | 산출물 |
|---|------|------|--------|
| 1 | 인라인 스타일 제거 | 드래그앤드롭 영역의 `style` 제거, CSS 클래스로 대체 | `mg-upload-area`, `mg-upload-area--drag-over` 클래스 및 CSS 정의 |
| 2 | B0KlA 색상 팔레트 적용 | 어드민 샘플 팔레트(#3D5246, #FAF9F7, #D4CFC8 등) 적용 | cs-* → ad-b0kla-* 또는 mg-* 마인드가든 토큰 사용 |

### P1 (권장)

| # | 항목 | 내용 | 산출물 |
|---|------|------|--------|
| 3 | PsychAssessmentManagement 레이아웃 정합화 | AdminCommonLayout 내 콘텐츠에 `mg-v2-ad-b0kla__container` 패턴 적용 | `mg-v2-ad-b0kla__container` 래퍼 추가 |
| 4 | 섹션 악센트 바 추가 | PDF 업로드, 최근 업로드 카드 제목에 좌측 4px 악센트 바 | `mg-v2-ad-b0kla__section-title` 또는 `mg-card__header--accent` 클래스 |
| 5 | 통계 카드 비주얼 통일 | mg-v2-ad-b0kla__kpi-card 스타일과 유사하게 조정 또는 B0KlA 내 mg-stats-card 오버라이드 | AdminDashboardB0KlA.css 확장 또는 위젯 전용 스타일 |

### P2 (선택)

| # | 항목 | 내용 | 산출물 |
|---|------|------|--------|
| 6 | Atom/Molecule 컴포넌트 분리 | StatsCard, UploadDropzone, DocumentTable 컴포넌트화 | `molecules/StatsCard`, `molecules/UploadDropzone`, `organisms/DocumentTable` |
| 7 | 드래그앤드롭 키보드 접근성 | `onKeyDown`에서 Enter/Space 시 클릭 동작 트리거 | `handleKeyDown` 구현 |
| 8 | 테이블 scope 속성 | thead th에 `scope="col"` 추가 | HTML 수정 |

---

## 4. core-coder 실행용 구체적 수정 태스크

### Task 1: 드래그앤드롭 인라인 스타일 제거 (P0)

**파일**: `frontend/src/components/dashboard/widgets/admin/PsychAssessmentAdminWidget.js`

1. 인라인 `style` prop 제거.
2. 클래스 적용:
   - 기본: `mg-upload-area`
   - 드래그 오버: `mg-upload-area mg-upload-area--drag-over` (isDragOver일 때)

**CSS 추가** (Widget.css 또는 PsychAssessment 전용 CSS):

```css
.mg-upload-area {
  border: 2px dashed var(--ad-b0kla-border, var(--mg-gray-300));
  background: var(--ad-b0kla-card-bg, var(--mg-gray-50));
  border-radius: var(--mg-border-radius-lg);
}
.mg-upload-area--drag-over {
  border-color: var(--ad-b0kla-green, var(--mg-primary-500));
  background: var(--ad-b0kla-green-bg, var(--cs-primary-50));
}
```

### Task 2: PsychAssessmentManagement 페이지 레이아웃 정합화 (P1)

**파일**: `frontend/src/components/admin/PsychAssessmentManagement.js`

- `mg-container`를 `mg-v2-ad-b0kla__container`로 변경하거나, `mg-v2-ad-b0kla__container` 내부에 `mg-container` 유지.
- AdminCommonLayout이 이미 `mg-v2-ad-b0kla`를 적용하므로, children 영역에 `mg-v2-ad-b0kla__container` 래퍼 추가 권장.

```jsx
return (
  <AdminCommonLayout>
    <div className="mg-v2-ad-b0kla__container">
      <PsychAssessmentAdminWidget widget={widget} user={user} />
    </div>
  </AdminCommonLayout>
);
```

### Task 3: 섹션 제목 악센트 바 추가 (P1)

**대상**: PDF 업로드, 최근 업로드 카드의 `mg-card__header`

- `mg-card__header`에 `mg-v2-ad-b0kla__section-header` 또는 유사 클래스 추가.
- CSS: `::before`로 좌측 4px 세로 바 (배경 #3D5246, border-radius 2px).

**참조**: AdminDashboardB0KlA.css의 섹션 스타일 패턴.

### Task 4: 통계 카드 B0KlA 스타일 적용 (P1)

- PsychAssessment 위젯이 AdminCommonLayout 내에서 렌더되므로, `.mg-v2-ad-b0kla .psych-assessment-admin-widget .mg-stats-grid` 스코프로 B0KlA KPI 카드 스타일 오버라이드.
- 또는 `mg-v2-ad-b0kla__kpi-card` 구조로 마크업 변경 (아이콘 추가 등).

### Task 5: StatsCard Molecule 분리 (P2)

**새 파일**: `frontend/src/components/molecules/StatsCard/StatsCard.js`

- props: `value`, `label`, `icon?`, `variant?`
- 클래스: `mg-stats-card`, `mg-stats-card__content`, `mg-stats-card__value`, `mg-stats-card__label`
- PsychAssessmentAdminWidget에서 `<StatsCard value={...} label="업로드" />` 형태로 사용.

### Task 6: UploadDropzone Molecule 분리 (P2)

**새 파일**: `frontend/src/components/molecules/UploadDropzone/UploadDropzone.js`

- props: `onDrop`, `onFileSelect`, `selectedFile`, `accept`, `disabled`
- 내부 상태: `isDragOver`
- 클래스: `mg-upload-area`, `mg-upload-area--drag-over`
- PsychAssessmentAdminWidget에서 `<UploadDropzone onDrop={handleDrop} ... />` 형태로 사용.

### Task 7: 키보드 접근성 (P2)

**파일**: PsychAssessmentAdminWidget.js

```jsx
const handleKeyDown = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    document.getElementById('file-input')?.click();
  }
};
```

- 드래그 영역에 `onKeyDown={handleKeyDown}` 적용.
- `id="file-input"`을 file input에 부여.

---

## 5. 체크리스트 (core-designer 검증용)

- [ ] 사이드바 + 메인 구조 유지 (AdminCommonLayout)
- [ ] 섹션 블록에 좌측 악센트 바 적용
- [ ] 색상이 어드민 샘플 팔레트(주조 #3D5246, 배경 #FAF9F7, 테두리 #D4CFC8) 범위 내
- [ ] 타이포: Noto Sans KR, 제목 20–24px/600, 본문 14–16px, 라벨 12px
- [ ] 인라인 style 제거
- [ ] mg-* 또는 mg-v2-* 클래스만 사용 (프로젝트 정책 확인)
- [ ] 카드/메트릭에 좌측 악센트 또는 B0KlA KPI 패턴 적용

---

## 6. 참조 문서

- `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`
- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`
- `docs/project-management/PSYCH_ASSESSMENT_ANALYSIS_REPORT.md`
- `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css`
- `frontend/src/styles/unified-design-tokens.css`
