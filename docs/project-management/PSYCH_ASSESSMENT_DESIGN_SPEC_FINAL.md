# 심리검사 페이지 최종 디자인 스펙

**작성일**: 2026-02-27  
**목적**: MappingManagementPage와 동일한 디자인·레이아웃으로 PsychAssessmentManagement 통일  
**기획 참조**: docs/project-management/PSYCH_ASSESSMENT_DESIGN_UNIFICATION_PLAN.md  
**참조 대상**: MappingManagementPage, MappingKpiSection, MappingListBlock, ContentSection, ContentCard

---

## 1. 최종 레이아웃 구조도

### 1.1 HTML 계층 구조

```
AdminCommonLayout
└── div.mg-v2-ad-b0kla.mg-v2-psych-assessment-management
    └── div.mg-v2-ad-b0kla__container
        └── ContentArea (.mg-v2-content-area)
            ├── ContentHeader (.mg-v2-content-header)
            │   ├── .mg-v2-content-header__left (title, subtitle)
            │   └── .mg-v2-content-header__right (actions)
            │       └── button.mg-v2-mapping-header-btn.mg-v2-mapping-header-btn--primary
            │
            ├── PsychKpiSection
            │   └── ContentSection(noCard).mg-v2-psych-kpi-section
            │       └── .mg-v2-psych-kpi-section__grid
            │           └── button.mg-v2-psych-kpi-section__card × 3
            │
            ├── PsychUploadSection
            │   └── ContentSection.mg-v2-psych-upload-section
            │       └── ContentCard.mg-v2-psych-upload-section__card
            │           └── (업로드 영역)
            │
            └── PsychDocumentListBlock
                └── ContentSection(noCard).mg-v2-psych-document-list-block
                    └── ContentCard.mg-v2-psych-document-list-block__card
                        ├── .mg-v2-psych-document-list-block__header
                        │   ├── .mg-v2-psych-document-list-block__title
                        │   └── .mg-v2-ad-b0kla__pill-toggle (테이블/카드 뷰)
                        └── (빈 상태 | 테이블 | 카드 그리드)
```

### 1.2 클래스 계층 표

| 계층 | 클래스 | 용도 |
|------|--------|------|
| 루트 | `mg-v2-ad-b0kla mg-v2-psych-assessment-management` | 페이지 스코프 |
| 컨테이너 | `mg-v2-ad-b0kla__container` | 메인 컨테이너 |
| 콘텐츠 | `mg-v2-content-area` | ContentArea |
| 헤더 | `mg-v2-content-header` | ContentHeader |
| KPI | `mg-v2-psych-kpi-section` | KPI 섹션 래퍼 |
| 업로드 | `mg-v2-psych-upload-section` | 업로드 섹션 래퍼 |
| 목록 | `mg-v2-psych-document-list-block` | 문서 목록 래퍼 |

---

## 2. Organism 스펙

### 2.1 PsychKpiSection

**역할**: 업로드/추출/리포트 KPI 카드 표시 (MappingKpiSection 패턴)

**패턴**: `ContentSection noCard` + 그리드 카드

**클래스**:
- 래퍼: `mg-v2-psych-kpi-section` (ContentSection className)
- 그리드: `mg-v2-psych-kpi-section__grid`
- 카드: `mg-v2-psych-kpi-section__card` (button)
- 아이콘: `mg-v2-psych-kpi-section__icon mg-v2-psych-kpi-section__icon--{variant}`
- 정보: `mg-v2-psych-kpi-section__info`
- 라벨: `mg-v2-psych-kpi-section__label`
- 값: `mg-v2-psych-kpi-section__value`

**props**:
| prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| stats | object | O | { documentsTotal, extractionsTotal, reportsTotal } |
| onStatCardClick | function | X | 클릭 핸들러 (필터 연동 시) |

**마크업 예시**:
```html
<ContentSection noCard className="mg-v2-psych-kpi-section">
  <div className="mg-v2-psych-kpi-section__grid">
    <button type="button" className="mg-v2-psych-kpi-section__card">
      <div className="mg-v2-psych-kpi-section__icon mg-v2-psych-kpi-section__icon--green">
        <Upload size={24} />
      </div>
      <div className="mg-v2-psych-kpi-section__info">
        <span className="mg-v2-psych-kpi-section__label">업로드</span>
        <span className="mg-v2-psych-kpi-section__value">42</span>
      </div>
    </button>
    <!-- 추출, 리포트 카드 동일 패턴 -->
  </div>
</ContentSection>
```

**시각 스펙**:
- MappingKpiSection.css와 동일한 값 사용
- 그리드: `grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))`, gap 1rem
- 카드: padding 1rem 1.25rem, border-radius var(--ad-b0kla-radius-sm)
- 아이콘 variant: green(업로드), orange(추출), blue(리포트)

---

### 2.2 PsychUploadSection

**역할**: PDF 드래그앤드롭 + 타입 선택(TCI/MMPI) + 업로드 버튼

**패턴**: `ContentSection` (기본 card) 또는 `ContentSection noCard` + `ContentCard`

**클래스**:
- 래퍼: `mg-v2-psych-upload-section`
- 카드: `mg-v2-psych-upload-section__card` (ContentCard className)
- 섹션 헤더: `mg-v2-content-section__header` (ContentSection 기본) 또는 `mg-v2-psych-upload-section__header`
- 업로드 영역: `mg-upload-area`, `mg-upload-area--drag-over`
- 폼 행: `mg-v2-psych-upload-section__form-row`

**props**:
| prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| uploadType | string | O | 'TCI' | 'MMPI' |
| onUploadTypeChange | function | O | 타입 변경 |
| uploadFile | File\|null | O | 선택된 파일 |
| onFilePick | function | O | 파일 선택 |
| onDrop | function | O | 드롭 핸들러 |
| onDragOver | function | O | 드래그오버 핸들러 |
| onDragLeave | function | O | 드래그리브 핸들러 |
| onUpload | function | O | 업로드 실행 |
| uploading | boolean | O | 업로드 중 여부 |
| isDragOver | boolean | O | 드래그오버 여부 |

**마크업 예시**:
```html
<ContentSection noCard className="mg-v2-psych-upload-section">
  <ContentCard className="mg-v2-psych-upload-section__card">
    <div className="mg-v2-psych-upload-section__header">
      <Upload size={16} />
      <h2 className="mg-v2-content-section__title">PDF 업로드</h2>
    </div>
    <div className="mg-v2-psych-upload-section__body">
      <div
        className="mg-upload-area mg-upload-area--drag-over"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
      >
        <p>파일을 여기로 드래그&드롭 하거나 아래에서 선택하세요.</p>
        <p>{uploadFile ? `선택됨: ${uploadFile.name}` : '선택된 파일 없음'}</p>
      </div>
      <div className="mg-v2-psych-upload-section__form-row">
        <select className="mg-select" value={uploadType} onChange={...}>
          <option value="TCI">TCI</option>
          <option value="MMPI">MMPI</option>
        </select>
        <input type="file" accept="application/pdf" onChange={...} className="mg-input" />
        <button type="button" className="mg-v2-button mg-v2-button-primary" onClick={onUpload} disabled={uploading}>
          업로드
        </button>
      </div>
      <p className="mg-v2-psych-upload-section__hint">스캔 PDF 업로드 후 자동으로 추출 작업이 진행됩니다.</p>
    </div>
  </ContentCard>
</ContentSection>
```

**시각 스펙**:
- 섹션 헤더: 좌측 악센트 바 4px `var(--ad-b0kla-green)`, padding-left 16px
- 업로드 영역: border 2px dashed var(--ad-b0kla-border), border-radius var(--ad-b0kla-radius-sm)
- 드래그오버: border-color var(--ad-b0kla-green), background var(--ad-b0kla-green-bg)

---

### 2.3 PsychDocumentListBlock

**역할**: 최근 업로드 목록 (테이블/카드 뷰, 빈 상태)

**패턴**: `ContentSection noCard` + `ContentCard` (MappingListBlock 동일)

**클래스**:
- 래퍼: `mg-v2-psych-document-list-block`
- 카드: `mg-v2-psych-document-list-block__card` (ContentCard className)
- 헤더: `mg-v2-psych-document-list-block__header`
- 제목: `mg-v2-psych-document-list-block__title`
- 뷰 토글: `mg-v2-ad-b0kla__pill-toggle`, `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active`
- 빈 상태: `mg-v2-psych-document-list-block__empty`
- 빈 아이콘: `mg-v2-psych-document-list-block__empty-icon`
- 빈 제목: `mg-v2-psych-document-list-block__empty-title`
- 빈 설명: `mg-v2-psych-document-list-block__empty-desc`
- 테이블: `mg-table-wrapper`, `mg-table`

**props**:
| prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| documents | array | O | 최근 문서 목록 |
| onGenerateReport | function | O | 리포트 생성 클릭 |
| viewMode | string | O | 'table' | 'card' |
| onViewModeChange | function | O | 뷰 모드 변경 |

**마크업 예시 (빈 상태)**:
```html
<ContentSection noCard className="mg-v2-psych-document-list-block">
  <ContentCard className="mg-v2-psych-document-list-block__card">
    <div className="mg-v2-psych-document-list-block__header">
      <div className="mg-v2-psych-document-list-block__title">최근 업로드(최대 20개)</div>
      <div className="mg-v2-ad-b0kla__pill-toggle">
        <button className="mg-v2-ad-b0kla__pill mg-v2-ad-b0kla__pill--active">테이블</button>
        <button className="mg-v2-ad-b0kla__pill">카드</button>
      </div>
    </div>
    <div className="mg-v2-psych-document-list-block__empty">
      <div className="mg-v2-psych-document-list-block__empty-icon"><FileText size={48} /></div>
      <h3 className="mg-v2-psych-document-list-block__empty-title">최근 업로드된 문서가 없습니다</h3>
      <p className="mg-v2-psych-document-list-block__empty-desc">PDF를 업로드하면 여기에 표시됩니다.</p>
    </div>
  </ContentCard>
</ContentSection>
```

**마크업 예시 (테이블 뷰)**:
```html
<div className="mg-table-wrapper">
  <table className="mg-table">
    <thead>
      <tr>
        <th>검사</th><th>상태</th><th>파일</th><th>생성</th><th>액션</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td data-label="검사">{assessmentType}</td>
        <td data-label="상태"><span className="mg-v2-badge mg-v2-badge--{variant}">{status}</span></td>
        <td data-label="파일">{filename}</td>
        <td data-label="생성">{createdAt}</td>
        <td data-label="액션">
          <button className="mg-v2-button mg-v2-button-outline mg-v2-button-sm">리포트 생성</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 3. 헤더 액션 버튼 스타일

### 3.1 클래스

**주 액션 (예: 새로고침·주요 CTA)**:
```html
<button
  type="button"
  className="mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary"
>
  <RefreshCw size={20} />
  새로고침
</button>
```

**동등 클래스**:
- `mg-v2-mapping-header-btn`: display inline-flex, align-items center, gap 8px, padding 0.75rem 1.25rem, font-size 14px, font-weight 600, border none, border-radius var(--ad-b0kla-radius-sm)
- `mg-v2-mapping-header-btn--primary`: background var(--ad-b0kla-green), color #fff

**CSS (MappingManagementPage.css 참조)**:
```css
.mg-v2-mapping-header-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.75rem 1.25rem;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: var(--ad-b0kla-radius-sm, 12px);
  cursor: pointer;
  transition: all 0.2s;
}

.mg-v2-mapping-header-btn--primary {
  background: var(--ad-b0kla-green, #4b745c);
  color: #fff;
}

.mg-v2-mapping-header-btn--primary:hover {
  background: #3d5f4c;
  transform: translateY(-1px);
}
```

### 3.2 적용

- PsychAssessmentManagement의 ContentHeader actions에 `mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary` 적용
- 아이콘: RefreshCw (새로고침), 텍스트: "새로고침"

---

## 4. 테이블·빈 상태·업로드 영역 시각 스펙

### 4.1 테이블

| 항목 | 스펙 |
|------|------|
| 래퍼 | `mg-table-wrapper` |
| 테이블 | `mg-table` |
| B0KlA 스코프 | `.mg-v2-psych-assessment-management` 내부 |
| 테두리 | var(--ad-b0kla-border) |
| 배지 | `mg-v2-badge`, variant: success | warning | info | secondary |
| 액션 버튼 | `mg-v2-button mg-v2-button-outline mg-v2-button-sm` |

### 4.2 빈 상태 (Empty State)

| 항목 | 스펙 |
|------|------|
| 래퍼 | `mg-v2-psych-document-list-block__empty` |
| 레이아웃 | flex column, center, padding 3rem 2rem |
| 아이콘 영역 | `mg-v2-psych-document-list-block__empty-icon` |
| 아이콘 크기 | 80×80px, border-radius 20px |
| 아이콘 배경 | var(--ad-b0kla-green-bg) |
| 아이콘 색상 | var(--ad-b0kla-green) |
| 제목 | font-size 1.125rem, font-weight 700, color var(--ad-b0kla-title-color) |
| 설명 | font-size 14px, color var(--ad-b0kla-text-secondary) |

*MappingListBlock.css `mg-v2-mapping-list-block__empty*` 동일*

### 4.3 업로드 영역

| 항목 | 스펙 |
|------|------|
| 기본 | `mg-upload-area` |
| 드래그오버 | `mg-upload-area--drag-over` |
| border | 2px dashed var(--ad-b0kla-border) |
| background | var(--ad-b0kla-card-bg) |
| border-radius | var(--ad-b0kla-radius-sm) |
| 드래그오버 border | var(--ad-b0kla-green) |
| 드래그오버 background | var(--ad-b0kla-green-bg) |

*PsychAssessmentAdminWidget.css 참조*

---

## 5. core-coder 실행용 구현 가이드

### 5.1 파일별 수정 포인트

| 파일 | 작업 | 상세 |
|------|------|------|
| `frontend/src/components/admin/PsychAssessmentManagement.js` | 수정 | 1) 루트 래퍼 `mg-v2-ad-b0kla mg-v2-psych-assessment-management` 추가<br>2) BaseWidget 제거, PsychKpiSection·PsychUploadSection·PsychDocumentListBlock 직접 배치<br>3) ContentHeader actions를 `mg-v2-mapping-header-btn--primary` 스타일로 변경<br>4) loading 시 UnifiedLoading 사용 |
| `frontend/src/components/dashboard/widgets/admin/PsychAssessmentAdminWidget.js` | 리팩터 | BaseWidget·mg-widget__body 제거. 로직을 PsychKpiSection, PsychUploadSection, PsychDocumentListBlock로 분리. 또는 페이지 전용 컨테이너로 교체 |
| `frontend/src/components/admin/psych-assessment/organisms/PsychKpiSection.js` | 신규 | ContentSection noCard + MappingKpiSection 패턴. stats props, Upload/FileSearch/FileCheck2 아이콘 |
| `frontend/src/components/admin/psych-assessment/organisms/PsychKpiSection.css` | 신규 | MappingKpiSection.css를 `mg-v2-psych-kpi-section__*`로 복제·수정 |
| `frontend/src/components/admin/psych-assessment/organisms/PsychUploadSection.js` | 신규 | ContentSection noCard + ContentCard. mg-upload-area, select, input file, button |
| `frontend/src/components/admin/psych-assessment/organisms/PsychUploadSection.css` | 신규 | mg-v2-psych-upload-section__*, 헤더 악센트 바 |
| `frontend/src/components/admin/psych-assessment/organisms/PsychDocumentListBlock.js` | 신규 | ContentSection noCard + ContentCard. MappingListBlock과 동일 구조. 빈 상태, 테이블, 카드 뷰 토글 |
| `frontend/src/components/admin/psych-assessment/organisms/PsychDocumentListBlock.css` | 신규 | MappingListBlock.css를 `mg-v2-psych-document-list-block__*`로 복제·수정 |
| `frontend/src/components/admin/PsychAssessmentManagementPage.css` | 신규 | MappingManagementPage.css의 `.mg-v2-mapping-management` → `.mg-v2-psych-assessment-management` 적용, `.mg-v2-mapping-header-btn*` 포함 |

### 5.2 데이터 흐름

- **기존**: useWidget + BaseWidget (stats, recent)
- **변경**: useWidget의 dataSource/transform 유지, BaseWidget 제거
- PsychAssessmentManagement에서 useWidget 호출 또는 자체 fetch
- stats → PsychKpiSection
- recent → PsychDocumentListBlock
- 업로드/리포트 생성 → PsychUploadSection, PsychDocumentListBlock 내부 핸들러

### 5.3 import 체크리스트

```
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import ContentCard from '../dashboard-v2/content/ContentCard';
import UnifiedLoading from '../common/UnifiedLoading';
import PsychKpiSection from '../psych-assessment/organisms/PsychKpiSection';
import PsychUploadSection from '../psych-assessment/organisms/PsychUploadSection';
import PsychDocumentListBlock from '../psych-assessment/organisms/PsychDocumentListBlock';
import '../../AdminDashboard/AdminDashboardB0KlA.css';
import '../PsychAssessmentManagementPage.css';
```

### 5.4 완료 기준

- [ ] PsychAssessmentManagement에 `mg-v2-ad-b0kla mg-v2-psych-assessment-management` 루트 적용
- [ ] BaseWidget 미사용, ContentArea 직계에 PsychKpiSection | PsychUploadSection | PsychDocumentListBlock 배치
- [ ] ContentHeader actions에 `mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary` 적용
- [ ] PsychKpiSection: ContentSection noCard + `mg-v2-psych-kpi-section__card` 그리드
- [ ] PsychUploadSection: ContentSection noCard + ContentCard + mg-upload-area
- [ ] PsychDocumentListBlock: ContentSection noCard + ContentCard, 빈 상태·테이블·카드 뷰
- [ ] B0KlA 토큰(--ad-b0kla-*)만 사용, 하드코딩 색상 없음

---

## 6. 참조 문서

- `docs/project-management/PSYCH_ASSESSMENT_DESIGN_UNIFICATION_PLAN.md`
- `docs/design-system/MAPPING_MANAGEMENT_DESIGN_SPEC_V2.md`
- `frontend/src/components/admin/mapping-management/pages/MappingManagementPage.js`
- `frontend/src/components/admin/mapping-management/organisms/MappingKpiSection.js`
- `frontend/src/components/admin/mapping-management/organisms/MappingListBlock.js`
- `frontend/src/components/admin/mapping-management/MappingManagementPage.css`
