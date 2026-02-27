# 심리검사 리포트 페이지 디자인 통일 기획

**작성일**: 2026-02-27  
**목표**: PsychAssessmentManagement를 MappingManagementPage와 동일한 B0KlA 디자인·레이아웃으로 통일  
**참조**: docs/design-system/MAPPING_MANAGEMENT_DESIGN_SPEC_V2.md, docs/project-management/PSYCH_ASSESSMENT_UI_ATOMIC_DESIGN_REVIEW.md

---

## 1. 매칭 페이지 vs 심리검사 페이지 현재 차이점

### 1.1 전체 구조 비교

| 영역 | MappingManagementPage | PsychAssessmentManagement |
|------|------------------------|---------------------------|
| **루트 래퍼** | `mg-v2-ad-b0kla mg-v2-mapping-management` | 없음 (AdminCommonLayout children 직접) |
| **컨테이너** | `mg-v2-ad-b0kla__container` | `mg-v2-ad-b0kla__container` ✓ |
| **콘텐츠 영역** | ContentArea | ContentArea ✓ |
| **헤더** | ContentHeader (title, subtitle, actions) | ContentHeader ✓ |
| **본문 구성** | SearchSection → KpiSection → ListBlock | PsychAssessmentAdminWidget (위젯 몸체) |

### 1.2 레이아웃·블록 패턴 차이

| 구성 요소 | 매칭 페이지 | 심리검사 페이지 |
|-----------|-------------|-----------------|
| **헤더 액션** | `mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary` (Plus + "새 매칭 생성") | `mg-v2-ad-b0kla__icon-btn` (RefreshCw 아이콘만) |
| **검색·필터** | MappingSearchSection (SearchInput + 상태 칩) | 없음 |
| **KPI** | MappingKpiSection (ContentSection noCard + `mg-v2-mapping-kpi-section__card`) | `mg-v2-ad-b0kla__kpi-row` + `mg-v2-ad-b0kla__kpi-card` (BaseWidget 내부) |
| **목록 래퍼** | ContentSection noCard + ContentCard + MappingListBlock | BaseWidget + `mg-card` + `mg-table` |
| **카드 스타일** | mg-v2-mapping-list-row, mg-v2-content-card | mg-card, mg-card__header--accent |
| **테이블** | MappingTableView (ContentSection 기반) | mg-table-wrapper + mg-table (인라인) |
| **버튼** | `mg-v2-button mg-v2-button-primary`, `mg-v2-mapping-header-btn` | `mg-v2-button mg-v2-button-primary`, `mg-v2-button-outline` |
| **입력 폼** | SearchInput, 상태 칩 | mg-select, mg-input (file), mg-upload-area |

### 1.3 BaseWidget vs 페이지 전용 구조

| 항목 | 매칭 페이지 | 심리검사 페이지 |
|------|-------------|-----------------|
| **BaseWidget 사용** | 사용하지 않음 | 사용함 |
| **로딩/에러 처리** | MappingManagementPage 내부 (UnifiedLoading) | BaseWidget 내부 |
| **헤더 중복** | ContentHeader만 사용 | ContentHeader + BaseWidget 헤더(숨김) |
| **바디 래퍼** | ContentArea 직계 children | BaseWidget > mg-widget__body > children |
| **데이터 fetching** | 페이지 단위 (loadMappings) | useWidget (위젯 dataSource) |

### 1.4 B0KlA 클래스·토큰 적용 여부

| 클래스/토큰 | 매칭 | 심리검사 |
|-------------|------|----------|
| `mg-v2-ad-b0kla` 루트 | ✓ | △ (AdminCommonLayout 내부) |
| `mg-v2-ad-b0kla__container` | ✓ | ✓ |
| `mg-v2-content-area` | ✓ | ✓ |
| `mg-v2-content-header` | ✓ | ✓ |
| `mg-v2-mapping-*` 페이지 전용 | ✓ | 해당 없음 |
| `mg-v2-ad-b0kla__kpi-card` | × (MappingKpiSection 자체 스타일) | ✓ |
| ContentSection / ContentCard | ✓ | × |
| `--ad-b0kla-*` 토큰 | ✓ | △ (일부 적용) |

---

## 2. 통일 대상 (레이아웃, 헤더, KPI, 카드, 테이블, 버튼, 입력 폼)

### 2.1 레이아웃

- **통일 내용**:
  - 심리검사 페이지에 `mg-v2-ad-b0kla mg-v2-psych-assessment-management` 루트 래퍼 추가 (매칭과 동일 패턴)
  - AdminCommonLayout children 내부에 동일한 래퍼·컨테이너 구조 적용
- **참조**: MappingManagementPage 405~409행

### 2.2 헤더 (ContentHeader)

- **통일 내용**:
  - 액션 버튼: 아이콘 버튼 → 매칭과 동일한 스타일의 주 액션 버튼 (예: 새로고침 또는 주요 CTA)
  - `mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary` 또는 공통 `mg-v2-ad-b0kla__header-btn--primary` 클래스 사용
- **참조**: MappingManagementPage 411~422행

### 2.3 검색·필터 (선택)

- **통일 내용**:
  - 검색이 필요하면 MappingSearchSection 패턴을 따르는 PsychSearchSection 도입
  - placeholder: "검사 유형, 파일명, 상태로 검색..."
  - 필터 칩: 전체 | TCI | MMPI | 처리 중 | 완료 등
- **범위**: 기획 Phase 2 또는 별도 요구 시 적용

### 2.4 KPI 섹션

- **통일 내용**:
  - MappingKpiSection과 동일한 레이아웃 패턴: ContentSection noCard + 그리드 카드
  - 클릭 가능한 KPI 카드 (필터 연동)
  - 클래스: `mg-v2-mapping-kpi-section__card` 또는 공통 `mg-v2-ad-b0kla__kpi-card` 재사용
- **현재**: mg-v2-ad-b0kla__kpi-card 사용 중 → ContentSection + 매칭 KPI 시각 패턴으로 정렬

### 2.5 카드·섹션

- **통일 내용**:
  - PDF 업로드, 최근 업로드 블록: `mg-card` → ContentSection + ContentCard 패턴
  - 섹션 헤더: `mg-card__header--accent` → ContentSection title 또는 `mg-v2-content-section__header` + 악센트 바
- **참조**: MappingListBlock 119~120행 (ContentSection noCard + ContentCard)

### 2.6 테이블

- **통일 내용**:
  - `mg-table` → MappingTableView와 유사한 테이블 래퍼 구조
  - ContentSection + ContentCard 내부에 테이블 배치
  - 클래스: `mg-v2-ad-b0kla` 스코프 내 `mg-v2-badge`, `mg-v2-button-outline` 등 B0KlA 버튼 스타일 적용
- **참조**: AdminDashboardB0KlA.css, MappingTableView

### 2.7 버튼

- **통일 내용**:
  - 주 액션: `mg-v2-mapping-header-btn--primary` 또는 `mg-v2-button-primary`
  - 보조 액션: `mg-v2-button-outline`, `mg-v2-button-sm`
  - 헤더 액션: 매칭 페이지와 동일한 스타일
- **참조**: MappingManagementPage.css 8~28행

### 2.8 입력 폼 (업로드 영역)

- **통일 내용**:
  - mg-upload-area: 이미 PsychAssessmentAdminWidget.css에 정의됨 ✓
  - mg-select, mg-input: B0KlA 토큰 (`--ad-b0kla-border`, `--ad-b0kla-placeholder`) 적용 확인
  - 업로드 버튼: `mg-v2-button mg-v2-button-primary`

---

## 3. BaseWidget 제거 여부 및 페이지 전용 구조 제안

### 3.1 BaseWidget 제거 권장 (옵션 A — 권장)

| 항목 | 내용 |
|------|------|
| **판단** | 페이지 전용 화면이므로 BaseWidget 제거, 페이지 단위 구조로 전환 |
| **근거** | 매칭 페이지는 BaseWidget 없이 ContentArea 직계로 SearchSection → KpiSection → ListBlock 구성. 심리검사도 동일 패턴 적용 시 일관성 확보 |
| **변경 사항** | PsychAssessmentAdminWidget을 Organism들로 분해: PsychKpiSection, PsychUploadSection, PsychDocumentListBlock |
| **데이터 fetching** | useWidget → 페이지 단위 useState + useEffect 또는 useWidget 유지하되 BaseWidget 래퍼만 제거 |

### 3.2 BaseWidget 유지 (옵션 B — 점진적)

| 항목 | 내용 |
|------|------|
| **판단** | BaseWidget은 유지하되, 내부 블록만 매칭 페이지 스타일로 정렬 |
| **근거** | 위젯이 대시보드 위젯으로도 재사용될 가능성이 있으면 BaseWidget 유지 |
| **변경 사항** | BaseWidget children 구조를 ContentSection + ContentCard 패턴으로 교체. hideHeader 시 BaseWidget 헤더 미노출 유지 |
| **단점** | BaseWidget의 mg-widget, mg-card__body 등이 매칭 페이지와 시각적 차이 유발 가능 |

### 3.3 제안: 옵션 A (BaseWidget 제거)

- **페이지 전용 구조**:
  ```
  PsychAssessmentManagement
  └── AdminCommonLayout
      └── div.mg-v2-ad-b0kla.mg-v2-psych-assessment-management
          └── div.mg-v2-ad-b0kla__container
              └── ContentArea
                  ├── ContentHeader (title, subtitle, actions)
                  ├── PsychSearchSection (선택, Phase 2)
                  ├── PsychKpiSection (ContentSection noCard, KPI 카드)
                  ├── PsychUploadSection (ContentSection + ContentCard, PDF 업로드)
                  └── PsychDocumentListBlock (ContentSection + ContentCard, 테이블/카드)
  ```
- **Organism 구성**:
  - PsychKpiSection: 업로드/추출/리포트 KPI 카드 (MappingKpiSection 패턴)
  - PsychUploadSection: PDF 드래그앤드롭 + 타입 선택 + 업로드 버튼
  - PsychDocumentListBlock: 최근 업로드 목록 (테이블 또는 카드 뷰)

---

## 4. core-designer 검토용 체크리스트

### 4.1 레이아웃

- [ ] `mg-v2-ad-b0kla mg-v2-psych-assessment-management` 루트 적용
- [ ] `mg-v2-ad-b0kla__container` 내부 ContentArea 구조
- [ ] AdminCommonLayout + 페이지 래퍼 조합이 매칭 페이지와 동일한 시각 구조인지 확인

### 4.2 헤더

- [ ] ContentHeader title, subtitle, actions 배치
- [ ] 헤더 액션 버튼 스타일 (mg-v2-mapping-header-btn 또는 동등 클래스)
- [ ] 새로고침·주요 CTA 버튼 시각적 일치

### 4.3 KPI

- [ ] KPI 카드 그리드 레이아웃 (MappingKpiSection과 동일 또는 유사)
- [ ] 아이콘 + 라벨 + 값 배치
- [ ] hover, 클릭 시 피드백 (필터 연동 시)

### 4.4 카드·섹션

- [ ] ContentSection + ContentCard 패턴 적용
- [ ] 섹션 제목 좌측 악센트 바 (mg-card__header--accent 또는 동등)
- [ ] PDF 업로드, 최근 업로드 블록 시각적 일치

### 4.5 테이블·목록

- [ ] mg-v2-ad-b0kla 스코프 내 테이블 스타일
- [ ] 상태 배지(mg-v2-badge), 액션 버튼 스타일
- [ ] 빈 상태(empty state) 레이아웃

### 4.6 버튼·입력

- [ ] 주/보조 버튼 B0KlA 토큰 적용
- [ ] mg-upload-area, mg-select, mg-input B0KlA 스타일
- [ ] 인라인 style 제거 여부 확인

### 4.7 토큰·색상

- [ ] --ad-b0kla-* 토큰만 사용 (cs-*, 하드코딩 색상 없음)
- [ ] 어드민 대시보드 샘플 팔레트(#3D5246, #FAF9F7, #D4CFC8 등) 준수

### 4.8 반응형

- [ ] 모바일·태블릿에서 카드/테이블 레이아웃 대응
- [ ] 검색·필터 툴바 반응형

---

## 5. core-coder 실행용 태스크 (우선순위·의존 관계)

### Phase 1: 구조 정렬 (BaseWidget 제거, 페이지 패턴 적용)

| # | 태스크 | 우선순위 | 의존 | 담당 |
|---|--------|----------|------|------|
| 1 | PsychAssessmentManagement에 `mg-v2-ad-b0kla mg-v2-psych-assessment-management` 루트 추가, 로딩 시 UnifiedLoading 사용 | P0 | - | core-coder |
| 2 | BaseWidget 제거, PsychKpiSection Organism 추출 (ContentSection noCard + MappingKpiSection 스타일 카드) | P0 | 1 | core-coder |
| 3 | PsychUploadSection Organism 추출 (ContentSection + ContentCard, mg-upload-area) | P0 | 1 | core-coder |
| 4 | PsychDocumentListBlock Organism 추출 (ContentSection + ContentCard, mg-table 또는 테이블 래퍼) | P0 | 1 | core-coder |
| 5 | ContentHeader 액션 버튼을 매칭 페이지 스타일(mg-v2-mapping-header-btn--primary)로 변경 | P1 | 1 | core-coder |

### Phase 2: 시각·스타일 통일

| # | 태스크 | 우선순위 | 의존 | 담당 |
|---|--------|----------|------|------|
| 6 | PsychAssessmentManagementPage.css 생성 (매칭 페이지와 동일한 헤더 버튼, 컨테이너 스타일) | P1 | 1, 5 | core-coder |
| 7 | KPI 카드: MappingKpiSection.css 또는 매칭 KPI 카드 클래스 재사용/통일 | P1 | 2 | core-coder |
| 8 | 테이블: mg-v2-ad-b0kla 스코프 내 B0KlA 배지·버튼 스타일 적용 | P1 | 4 | core-coder |
| 9 | 섹션 헤더 악센트 바 일관 적용 (mg-card__header--accent 또는 ContentSection 패턴) | P1 | 3, 4 | core-coder |

### Phase 3: 검색·필터 (선택)

| # | 태스크 | 우선순위 | 의존 | 담당 |
|---|--------|----------|------|------|
| 10 | PsychSearchSection Organism 추가 (SearchInput + TCI/MMPI/전체 필터 칩) | P2 | 4 | core-coder |
| 11 | 검색·필터와 목록 연동 | P2 | 10 | core-coder |

### 의존 관계 다이어그램

```
[1. 루트·로딩]
    ├── [2. PsychKpiSection]
    ├── [3. PsychUploadSection]
    ├── [4. PsychDocumentListBlock]
    ├── [5. ContentHeader 액션]
    └── [6. CSS]
            └── [7. KPI 스타일], [8. 테이블 스타일], [9. 악센트 바]
```

---

## 6. 실행 위임문

### 6.1 core-designer 호출 (선택, 시안 보강 시)

**전달 태스크**:
- 화면설계서: 본 문서(PSYCH_ASSESSMENT_DESIGN_UNIFICATION_PLAN.md) §2, §4
- 사용성: 관리자가 TCI/MMPI 업로드, 처리 상태 확인, 리포트 생성 시 최소 클릭으로 작업
- 정보 노출: 업로드/추출/리포트 KPI, 최근 업로드 목록(검사, 상태, 파일, 생성일, 액션)
- 레이아웃: ContentHeader → KPI → 업로드 섹션 → 목록 섹션. 매칭 페이지와 동일 블록 순서·시각
- 산출: PsychAssessment 페이지용 레이아웃·블록 스펙(코더 구현용). 코드 작성 없음.

### 6.2 core-coder 호출 (Phase 1 → 2 순차)

**Phase 1 전달 태스크**:
- 대상: PsychAssessmentManagement.js, PsychAssessmentAdminWidget.js
- 목표: BaseWidget 제거, PsychKpiSection, PsychUploadSection, PsychDocumentListBlock Organism 추출, 매칭 페이지와 동일한 ContentArea 직계 구조 적용
- 참조: MappingManagementPage.js, MappingKpiSection.js, MappingSearchSection.js, MappingListBlock.js, docs/design-system/MAPPING_MANAGEMENT_DESIGN_SPEC_V2.md
- 데이터: useWidget 또는 페이지 단위 fetch 유지. StandardizedApi 사용.
- 완료 기준: AdminCommonLayout + mg-v2-ad-b0kla + ContentArea + ContentHeader | PsychKpiSection | PsychUploadSection | PsychDocumentListBlock 구조, BaseWidget 미사용

**Phase 2 전달 태스크**:
- 대상: PsychAssessmentManagementPage.css, PsychKpiSection.css 등 신규/수정 CSS
- 목표: 매칭 페이지 헤더 버튼, KPI 카드, 테이블, 섹션 악센트 바 B0KlA 스타일 통일
- 참조: MappingManagementPage.css, AdminDashboardB0KlA.css, unified-design-tokens.css
- 완료 기준: §4 체크리스트 충족, 인라인 style 제거, B0KlA 토큰 적용

---

## 7. 리스크·제약

| 리스크 | 내용 | 대응 |
|--------|------|------|
| 대시보드 위젯 재사용 | BaseWidget 제거 시 대시보드용 위젯이 별도 필요 | 대시보드에서 PsychDocumentListBlock 등 Organism 조합 사용 |
| useWidget 의존 | useWidget이 BaseWidget 전제일 수 있음 | useWidget은 dataSource만 사용, 래퍼 없이 페이지에서 직접 호출 |
| API 변경 없음 | 백엔드 API 변경 없음 | 기존 /api/v1/assessments/psych/* 유지 |

---

## 8. 참조 문서

- `docs/design-system/MAPPING_MANAGEMENT_DESIGN_SPEC_V2.md`
- `docs/project-management/PSYCH_ASSESSMENT_UI_ATOMIC_DESIGN_REVIEW.md`
- `docs/project-management/PSYCH_ASSESSMENT_ANALYSIS_REPORT.md`
- `frontend/src/components/admin/mapping-management/pages/MappingManagementPage.js`
- `frontend/src/components/admin/mapping-management/organisms/MappingKpiSection.js`
- `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css`
- `docs/layout/ADMIN_COMMON_LAYOUT.md`
