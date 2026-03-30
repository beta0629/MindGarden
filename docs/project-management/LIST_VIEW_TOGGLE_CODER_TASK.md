# 리스트 페이지 보기 전환(필 토글) 통일 — 코어 코더 작업 체크리스트

**기준 문서**: `LIST_PAGE_VIEW_TOGGLE_UNIFICATION.md`  
**표준 패턴**: 헤더 `mg-v2-mapping-list-block__header`, 제목 `mg-v2-mapping-list-block__title`, 토글 `common/ViewModeToggle` + `className="mg-v2-mapping-list-block__toggle"`, `aria-label="목록 보기 전환"`.

---

## 체크리스트 (순서대로 진행)

### 1. 재무 거래 내역 — FinancialManagement.js

- [x] 거래 내역 섹션(`activeTab === 'transactions'` 블록)을 표준 구조로 변경
  - [x] 최상단에 `ContentSection` + `ContentCard`(또는 동일 클래스) 사용, 섹션에 `mg-v2-mapping-list-block` 클래스 적용
  - [x] 기존 `<div className="d-flex justify-content-between align-items-center mb-3">` + `<h2>재무 거래 내역</h2>` 제거
  - [x] 헤더: `<div class="mg-v2-mapping-list-block__header">` 내부에 `<div class="mg-v2-mapping-list-block__title">재무 거래 내역</div>` 배치
  - [x] 내보내기 버튼은 헤더 우측(제목과 같은 행)에 유지
- [x] `ViewModeToggle` import (`../common` 또는 `common/ViewModeToggle`)
- [x] state 추가: `const [transactionViewMode, setTransactionViewMode] = useState('card');` (또는 기존 변수명 정책 따름)
- [x] ViewModeToggle 렌더: `options={[{ value: 'card', icon: LayoutGrid, label: '카드' }, { value: 'table', icon: List, label: '테이블' }]}`, `className="mg-v2-mapping-list-block__toggle"`, `ariaLabel="목록 보기 전환"`
- [x] (선택) 테이블 뷰 미구현 시: 1차는 카드만 노출하고 테이블 옵션은 비활성화 또는 추후 작업으로 남김
- [x] `MappingListBlock.css` import 필요 시 추가 (헤더/토글 스타일)

---

### 2. 심리 문서 목록 — PsychDocumentListBlock.js

- [x] `ViewModeToggle` import (`../../../common`)
- [x] 기존 커스텀 pill 버튼 2개(테이블/카드) 제거
- [x] 헤더에 `mg-v2-mapping-list-block__header` 클래스 추가(기존 `mg-v2-psych-document-list-block__header`와 함께 적용하거나, 제목만 `mg-v2-mapping-list-block__title`로 통일)
- [x] `<ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} options={[...]} className="mg-v2-mapping-list-block__toggle" ariaLabel="목록 보기 전환" />` 추가
  - [x] options: `[{ value: 'table', icon: List, label: '테이블' }, { value: 'card', icon: LayoutGrid, label: '카드' }]`
- [x] 기존 table/card 렌더 로직은 유지

---

### 3. 환불 이력 — RefundManagement.js + RefundHistoryTableBlock.js

- [x] **RefundManagement.js**: RefundHistoryTableBlock을 감싸는 영역에 표준 블록 구조 적용
  - [x] RefundHistoryTableBlock 위(또는 래핑)에 `ContentSection` + `ContentCard` 사용, 클래스 `mg-v2-mapping-list-block`
  - [x] 헤더 행 추가: `mg-v2-mapping-list-block__header` 내부에 `mg-v2-mapping-list-block__title`("환불 이력") + ViewModeToggle
- [x] ViewModeToggle: 현재 테이블만 지원 시 options는 `[{ value: 'table', icon: List, label: '테이블' }]` 또는 카드 뷰 추후 구현 시 table+card
- [x] **RefundHistoryTableBlock.js**: (선택) `refund-management__table-block`을 ContentCard 내부로 이동하거나, RefundManagement에서 래퍼만 추가하고 블록 내부는 유지
- [x] state: `refundViewMode` 등 필요 시 RefundManagement에 추가 후 RefundHistoryTableBlock에 전달

---

### 4. 급여 프로필 목록 — SalaryManagement.js

- [x] `ViewModeToggle` import
- [x] 급여 프로필 탭 패널(`activeTab === TAB_PROFILES`) 내 헤더 수정
  - [x] `salary-profile-block__header` → `mg-v2-mapping-list-block__header` 추가(기존 클래스와 병렬 또는 교체)
  - [x] 제목을 `mg-v2-mapping-list-block__title`로 감싸기(예: "상담사 급여 프로필")
  - [x] "새 프로필 생성" 버튼은 헤더 우측 유지
- [x] state: `const [profileViewMode, setProfileViewMode] = useState('largeCard');` (또는 'smallCard')
- [x] `<ViewModeToggle viewMode={profileViewMode} onViewModeChange={setProfileViewMode} className="mg-v2-mapping-list-block__toggle" ariaLabel="목록 보기 전환" />` 추가 (options는 기본값: 큰 카드/작은 카드/리스트)
- [x] 카드 그리드를 `profileViewMode`에 따라 largeCard / smallCard / list 로 전환 (StaffManagement.js, ClientComprehensiveManagement.js 참고)
- [x] `MappingListBlock.css` import 필요 시 추가

---

## 완료 후 확인

- [x] 모든 대상 페이지에서 헤더 클래스 `mg-v2-mapping-list-block__header`, 제목 `mg-v2-mapping-list-block__title` 사용 여부 확인
- [x] ViewModeToggle에 `className="mg-v2-mapping-list-block__toggle"`, `ariaLabel="목록 보기 전환"` 적용 여부 확인
- [x] 기존 동작(필터, 페이지네이션, 모달 등) 유지 확인
- [x] `LIST_PAGE_VIEW_TOGGLE_UNIFICATION.md` §5 표와 일치 여부 검토

---

**참조**: 이미 표준 준수 — `MappingListBlock.js`, `StaffManagement.js`, `ClientComprehensiveManagement.js`, `ConsultantComprehensiveManagement.js` (수정 불필요).
