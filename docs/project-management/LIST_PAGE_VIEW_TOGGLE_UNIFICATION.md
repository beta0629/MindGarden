# 리스트 페이지 보기 전환(필 토글) 표기 통일

**목적**: 전체 리스트가 나오는 페이지에서 **헤더 + 보기 전환 토글**을 동일한 DOM/aria/클래스 패턴으로 통일.  
**기준**: `mg-v2-mapping-list-block__header` + `ViewModeToggle` + `mg-v2-mapping-list-block__toggle` (role="group", aria-label="목록 보기 전환").

---

## 1. 표준 패턴 (기준)

```html
<section class="mg-v2-content-section mg-v2-content-section--plain mg-v2-mapping-list-block">
  <div class="mg-v2-content-card mg-v2-mapping-list-block__card">
    <div class="mg-v2-mapping-list-block__header">
      <div class="mg-v2-mapping-list-block__title">[목록 제목]</div>
      <div class="mg-v2-ad-b0kla__pill-toggle mg-v2-mapping-list-block__toggle" role="group" aria-label="목록 보기 전환">
        <!-- ViewModeToggle 컴포넌트 -->
      </div>
    </div>
    <!-- 리스트 콘텐츠 -->
  </div>
</section>
```

- **컴포넌트**: `common/ViewModeToggle` 사용, `className="mg-v2-mapping-list-block__toggle"`, `ariaLabel="목록 보기 전환"`.
- **참조**: MappingListBlock.js, StaffManagement.js, ClientComprehensiveManagement.js, ConsultantComprehensiveManagement.js.

---

## 2. 탐색 결과 — 통일 대상 후보

| 페이지/블록 | 파일 | 현재 상태 | 조치 |
|-------------|------|-----------|------|
| **재무 거래 내역** | FinancialManagement.js | 거래 내역 섹션: `h2`+내보내기만 있음, pill-toggle 없음. 상단 탭은 별도(거래내역/달력/대시보드). | 거래 내역 블록에 `mg-v2-mapping-list-block__header` + 제목 + ViewModeToggle(테이블/카드 등) 적용. 섹션을 ContentSection+ContentCard 또는 동일 클래스 구조로 감싸기. |
| **심리 문서 목록** | PsychDocumentListBlock.js | `mg-v2-psych-document-list-block__header` + **커스텀** pill 버튼(테이블/카드). | ViewModeToggle로 교체, 토글에 `mg-v2-mapping-list-block__toggle` 추가. 헤더 클래스는 `mg-v2-mapping-list-block__header` 통일 또는 공통 클래스 추가. |
| **상담 로그 목록** | ConsultationLogListBlock.js | 헤더 없음, 카드 그리드만. | 상위(ConsultationLogViewPage) 또는 본 블록에 헤더+ViewModeToggle 추가 여부는 component-manager 검토. |
| **사용자 관리 상단 탭** | UserManagementPage.js | `mg-v2-ad-b0kla__pill-toggle` (상담사/내담자/스태프). | 탭 전환용이므로 목록 보기 전환과 다름. 필요 시 aria-label만 "탭 전환" 등으로 명확화. |

---

## 3. 코어 컴포넌트 매니저 검토 요청

- 위 표의 **통일 대상**을 검토하고, 누락된 리스트 페이지(예: 환불 이력, 급여 목록, 기타 테이블/카드 뷰)를 추가해 주세요.
- **표기 방법**: 헤더·토글에 사용할 클래스(`mg-v2-mapping-list-block__header`, `mg-v2-mapping-list-block__toggle`)와 ViewModeToggle options(예: table/card만 쓰는 블록) 제안.
- **산출**: 수정 대상 파일·JSX 변경 요약 표. 코어 코더가 그대로 구현할 수 있도록.

---

## 4. 코어 코더 위임

- **문서**: 본 문서 + component-manager 산출(또는 §2 표).
- **작업**: 재무 거래 내역(FinancialManagement) 블록, PsychDocumentListBlock 등에 표준 헤더+ViewModeToggle 적용. 기존 동작 유지.

---

## 5. 수정 목록(코어 코더용)

**검토 결과 요약**

- 문서 §2의 통일 대상(재무 거래 내역, PsychDocumentListBlock)은 유지.
- **상담 로그**: ConsultationLogViewPage는 상단 탭(캘린더/목록/테이블)으로 뷰 전환을 하므로, **리스트 블록 내부** 헤더/토글 통일 대상에서 **제외**. (탭에 `aria-label="뷰 전환"` 등 명확화만 권장.)
- **사용자 관리 상단 탭**: 탭 전환용이므로 계속 **제외**.
- **누락 대상 추가**: **환불 이력**(RefundManagement/RefundHistoryTableBlock), **급여 프로필 목록**(SalaryManagement — TAB_PROFILES).

아래 표는 파일별 적용할 구조와 변경 요약이다. 구현 순서는 `LIST_VIEW_TOGGLE_CODER_TASK.md` 체크리스트를 따른다.

| # | 파일 | 적용할 구조 | ViewModeToggle | options 값 | 변경 요약 |
|---|------|-------------|----------------|------------|-----------|
| 1 | `frontend/src/components/erp/FinancialManagement.js` | 거래 내역 섹션을 `ContentSection` + `ContentCard`(또는 동일 클래스)로 감싼 뒤, 헤더: `mg-v2-mapping-list-block__header`, 제목: `mg-v2-mapping-list-block__title`(예: "재무 거래 내역"). 내보내기 버튼은 헤더 우측 유지. | 사용 | `[{ value: 'card', ... }, { value: 'table', ... }]` (List, LayoutGrid 아이콘). 현재 카드만 구현돼 있으면 테이블 뷰 추가 또는 1차는 카드만 노출 후 테이블 추후 구현. | `<h2>`+내보내기만 있던 영역을 표준 헤더 구조로 교체하고, ViewModeToggle(테이블/카드) 추가. MappingListBlock.css import 또는 공통 클래스 사용. |
| 2 | `frontend/src/components/admin/psych-assessment/organisms/PsychDocumentListBlock.js` | 헤더: `mg-v2-mapping-list-block__header`, 제목: `mg-v2-psych-document-list-block__title` 또는 `mg-v2-mapping-list-block__title`("최근 업로드(최대 20개)"). | 사용(커스텀 pill 제거) | `[{ value: 'table', icon: List, label: '테이블' }, { value: 'card', icon: LayoutGrid, label: '카드' }]` | 기존 커스텀 pill 버튼 2개 제거 후 `ViewModeToggle`로 교체, `className="mg-v2-mapping-list-block__toggle"`, `ariaLabel="목록 보기 전환"`. 헤더에 `mg-v2-mapping-list-block__header` 추가(기존 `mg-v2-psych-document-list-block__header`와 병렬 또는 교체). |
| 3 | `frontend/src/components/erp/refund-management/RefundHistoryTableBlock.js` 및 `RefundManagement.js` | RefundHistoryTableBlock을 표준 블록으로 래핑: `ContentSection` + `ContentCard`, 헤더: `mg-v2-mapping-list-block__header`, 제목: `mg-v2-mapping-list-block__title`("환불 이력"). | 사용(현재 테이블만 있으면 options는 table만 또는 table+card) | `[{ value: 'table', icon: List, label: '테이블' }]` 또는 카드 뷰 구현 시 `{ value: 'card', ... }` 추가 | RefundManagement에서 RefundHistoryTableBlock 상단에 표준 헤더+ViewModeToggle 배치. 블록 래퍼 클래스 `mg-v2-mapping-list-block` 적용. 카드 뷰 없으면 1차는 테이블만 토글 옵션으로 두거나, 토글 비노출 후 추후 확장. |
| 4 | `frontend/src/components/erp/SalaryManagement.js` | 급여 프로필 탭 패널 내: 헤더를 `mg-v2-mapping-list-block__header`로, 제목을 `mg-v2-mapping-list-block__title`로 통일. 기존 "새 프로필 생성" 버튼은 헤더 우측 유지. | 사용 | 기본값 `DEFAULT_OPTIONS`(큰 카드/작은 카드/리스트) 또는 `largeCard`/`smallCard`/`list` | `salary-profile-block__header` → `mg-v2-mapping-list-block__header`, 제목 → `mg-v2-mapping-list-block__title`. ViewModeToggle 추가, `className="mg-v2-mapping-list-block__toggle"`, `ariaLabel="목록 보기 전환"`. 카드 그리드를 largeCard/smallCard/list에 따라 전환(기존 StaffManagement/ClientComprehensiveManagement 패턴 참고). |

**참조(이미 표준 준수, 수정 불필요)**

- `MappingListBlock.js`, `StaffManagement.js`, `ClientComprehensiveManagement.js`, `ConsultantComprehensiveManagement.js`: 헤더 `mg-v2-mapping-list-block__header`, 제목 `mg-v2-mapping-list-block__title`, ViewModeToggle + `mg-v2-mapping-list-block__toggle`, `aria-label="목록 보기 전환"` 이미 적용됨.
