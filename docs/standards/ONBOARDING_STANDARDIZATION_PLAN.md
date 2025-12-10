# 온보딩 표준화 계획

**작성일**: 2025-12-09  
**상태**: 진행 중  
**우선순위**: 높음

---

## 📋 개요

온보딩 프로세스의 표준화를 진행하여 일관된 디자인, 코드 품질, 사용자 경험을 제공합니다.

### 참조 문서
- [프론트엔드 개발 표준](../../standards/FRONTEND_DEVELOPMENT_STANDARD.md)
- [API 설계 표준](../../standards/API_DESIGN_STANDARD.md)
- [공통 처리 표준](../../standards/COMMON_PROCESSING_STANDARD.md)
- [버튼 디자인 표준](../../standards/BUTTON_DESIGN_STANDARD.md)
- [컴포넌트 구조 표준](../../standards/COMPONENT_STRUCTURE_STANDARD.md)

---

## 🎯 표준화 목표

### 1. 프론트엔드 표준화
- ✅ 표준 컴포넌트 사용 (MGButton, UnifiedLoading, SimpleLayout)
- ✅ CSS 클래스 표준화 (`mg-v2-*` 접두사)
- ✅ 인라인 스타일 제거
- ✅ 필터/검색 컴포넌트 표준화
- ✅ 상수 사용 (하드코딩 금지)

### 2. 백엔드 표준화
- ✅ 표준 유틸리티 사용 (SessionUtils)
- ✅ 공통코드 기반 조회 (하드코딩 제거)
- ✅ 표준 에러 처리 (GlobalExceptionHandler)
- ✅ API 경로 표준화 (`/api/v1/`)

---

## 📊 현재 상태 분석

### 프론트엔드 파일
1. `OnboardingRequest.js`
   - ✅ UnifiedLoading 사용 중
   - ✅ SimpleLayout 사용 중
   - ✅ 상수 사용 (constants/onboarding.js)
   - ❌ 네이티브 `<button>` 사용 → MGButton 전환 필요
   - ❌ CSS 클래스 `onboarding-request__*` → `mg-v2-*` 전환 필요

2. `OnboardingStatus.js`
   - ❌ SimpleLayout 누락
   - ❌ UnifiedLoading 사용 안 함 (하드코딩된 로딩 텍스트)
   - ❌ 인라인 스타일 사용 (`style={{ backgroundColor: ... }}`)
   - ❌ 네이티브 `<button>` 사용 → MGButton 전환 필요
   - ❌ 커스텀 모달 → UnifiedModal 전환 필요
   - ❌ 필터 드롭다운 → UnifiedFilterSearch 전환 필요

### 백엔드 파일
1. `OnboardingController.java`
   - ✅ `/api/v1/onboarding` 경로 사용
   - ✅ BaseApiController 상속
   - ✅ ApiResponse 사용
   - ⚠️ 직접 세션 접근 (`session.getAttribute("userEmail")`) → SessionUtils 사용 필요
   - ⚠️ 하드코딩된 상태값 (주석으로 표준화 요구됨)

2. `OnboardingConstants.java`
   - ✅ 상수 클래스 정의
   - ⚠️ 기본값만 정의 (공통코드 동적 조회 필요)

---

## 🔧 표준화 작업 계획

### Phase 1: 프론트엔드 컴포넌트 표준화 (1일)

#### 1.1 OnboardingRequest.js 표준화
**우선순위**: 높음

**작업 내용**:
- [ ] 네이티브 `<button>` → `<MGButton>` 전환
  - 취소 버튼: `variant="outline"`, `size="medium"`
  - 제출 버튼: `variant="primary"`, `size="medium"`, `loading={loading}`, `preventDoubleClick={true}`
  - 카테고리 버튼: `variant="outline"` 또는 `variant="ghost"`
- [ ] CSS 클래스 `onboarding-request__*` → `mg-v2-*` 전환
  - `onboarding-request__container` → `mg-container`
  - `onboarding-request__form` → `mg-v2-form`
  - `onboarding-request__field` → `mg-v2-form-group`
  - `onboarding-request__input` → `mg-v2-form-input`
  - `onboarding-request__category-grid` → `mg-v2-grid`
  - `onboarding-request__actions` → `mg-v2-form-actions`
- [ ] 인라인 스타일 제거 확인
- [ ] 상수 사용 확인 (이미 완료)

**수정 예시**:
```javascript
// Before
<button
  type="submit"
  className="onboarding-request__button onboarding-request__button--primary"
  disabled={loading || !formData.tenantName || !formData.businessType}
>
  {loading ? MESSAGES.SUBMITTING : MESSAGES.SUBMIT}
</button>

// After
<MGButton
  type="submit"
  variant="primary"
  size="medium"
  loading={loading}
  loadingText={MESSAGES.SUBMITTING}
  disabled={!formData.tenantName || !formData.businessType}
  preventDoubleClick={true}
  onClick={handleSubmit}
>
  {MESSAGES.SUBMIT}
</MGButton>
```

#### 1.2 OnboardingStatus.js 표준화
**우선순위**: 높음

**작업 내용**:
- [ ] SimpleLayout 추가
- [ ] UnifiedLoading 사용 (하드코딩된 로딩 텍스트 제거)
- [ ] 네이티브 `<button>` → `<MGButton>` 전환
  - "새 요청하기" 버튼
  - "상세보기" 버튼
- [ ] 인라인 스타일 제거
  - `style={{ backgroundColor: getStatusColor(...) }}` → CSS 클래스 사용
- [ ] 커스텀 모달 → UnifiedModal 전환
- [ ] 필터 드롭다운 → UnifiedFilterSearch 전환
- [ ] CSS 클래스 `onboarding-status__*` → `mg-v2-*` 전환

**수정 예시**:
```javascript
// Before
{loading ? (
  <div className="onboarding-status__loading">
    {MESSAGES.LOADING}
  </div>
) : ...}

// After
{loading ? (
  <UnifiedLoading type="page" text={MESSAGES.LOADING} />
) : ...}
```

```javascript
// Before
<span
  className="onboarding-status__status-badge"
  style={{ backgroundColor: getStatusColor(request.status) }}
>
  {getStatusLabel(request.status)}
</span>

// After
<span
  className={`mg-v2-badge mg-v2-badge--${request.status.toLowerCase()}`}
>
  {getStatusLabel(request.status)}
</span>
```

```javascript
// Before
<div className="onboarding-status__filters">
  <label htmlFor="statusFilter" className="onboarding-status__filter-label">
    {MESSAGES.STATUS_FILTER}
  </label>
  <select
    id="statusFilter"
    value={selectedStatus}
    onChange={(e) => setSelectedStatus(e.target.value)}
    className="onboarding-status__filter-select"
  >
    {statusOptions.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
</div>

// After
<UnifiedFilterSearch
  onSearch={() => {}} // 검색 기능이 필요하면 추가
  onFilterChange={(filters) => {
    if (filters.status) {
      setSelectedStatus(filters.status);
    } else {
      setSelectedStatus('');
    }
  }}
  quickFilterOptions={statusOptions}
  compact={true}
  enableHashtag={false}
/>
```

#### 1.3 CSS 파일 표준화
**우선순위**: 중간

**작업 내용**:
- [ ] `OnboardingRequest.css` → `mg-v2-*` 클래스로 전환
- [ ] `OnboardingStatus.css` → `mg-v2-*` 클래스로 전환
- [ ] 인라인 스타일 → CSS 변수 사용
- [ ] 하드코딩된 색상 값 → CSS 변수 사용

---

### Phase 2: 백엔드 표준화 (0.5일)

#### 2.1 OnboardingController.java 표준화
**우선순위**: 높음

**작업 내용**:
- [ ] 직접 세션 접근 → SessionUtils 사용
  ```java
  // Before
  String userEmail = (String) session.getAttribute("userEmail");
  
  // After
  String userEmail = SessionUtils.getUserEmail(session); // 또는 적절한 메서드
  ```
- [ ] 하드코딩된 상태값 제거 (공통코드 기반 조회)
  - `OnboardingStatus.APPROVED` → 공통코드에서 동적 조회
  - `OnboardingStatus.PENDING` → 공통코드에서 동적 조회
- [ ] 에러 처리 확인 (GlobalExceptionHandler에 위임)

#### 2.2 OnboardingServiceImpl.java 표준화
**우선순위**: 중간

**작업 내용**:
- [ ] 하드코딩된 값 제거 확인
- [ ] 공통코드 기반 조회 확인
- [ ] SessionUtils 사용 확인

---

### Phase 3: 필터/검색 표준화 (0.5일)

#### 3.1 UnifiedFilterSearch 적용
**우선순위**: 높음

**작업 내용**:
- [ ] OnboardingStatus.js에 UnifiedFilterSearch 적용
  - 상태 필터: 드롭다운 → 빠른 필터 버튼
  - 검색 기능 추가 (회사명, 업종, 요청자 검색)
  - 필터 칩 시스템 추가

**구현 예시**:
```javascript
const quickFilterOptions = useMemo(() => {
  return statusOptions.map(option => ({
    value: option.value,
    label: option.label
  }));
}, [statusOptions]);

<UnifiedFilterSearch
  onSearch={(searchTerm) => {
    // 검색 로직 추가 (필요한 경우)
    console.log('검색:', searchTerm);
  }}
  onFilterChange={(filters) => {
    if (filters.status) {
      setSelectedStatus(filters.status);
    } else {
      setSelectedStatus('');
    }
  }}
  quickFilterOptions={quickFilterOptions}
  compact={true}
  enableHashtag={false}
/>
```

---

### Phase 4: 모달 표준화 (0.5일)

#### 4.1 UnifiedModal 적용
**우선순위**: 중간

**작업 내용**:
- [ ] OnboardingStatus.js의 커스텀 모달 → UnifiedModal 전환
- [ ] 모달 사이즈 표준화 (상세 정보: medium)

**구현 예시**:
```javascript
// Before
{showDetail && selectedRequest && (
  <div className="onboarding-status__modal-overlay" onClick={() => setShowDetail(false)}>
    <div className="onboarding-status__modal" onClick={(e) => e.stopPropagation()}>
      ...
    </div>
  </div>
)}

// After
<UnifiedModal
  isOpen={showDetail}
  onClose={() => setShowDetail(false)}
  title="온보딩 요청 상세"
  size="medium"
>
  <div className="mg-v2-modal-body">
    {/* 상세 정보 */}
  </div>
</UnifiedModal>
```

---

## ✅ 체크리스트

### 프론트엔드
- [ ] OnboardingRequest.js
  - [ ] MGButton 사용
  - [ ] CSS 클래스 `mg-v2-*` 전환
  - [ ] 인라인 스타일 제거
  - [ ] 상수 사용 확인
  
- [ ] OnboardingStatus.js
  - [ ] SimpleLayout 추가
  - [ ] UnifiedLoading 사용
  - [ ] MGButton 사용
  - [ ] 인라인 스타일 제거
  - [ ] UnifiedModal 사용
  - [ ] UnifiedFilterSearch 사용
  - [ ] CSS 클래스 `mg-v2-*` 전환

- [ ] CSS 파일
  - [ ] CSS 변수 사용
  - [ ] 하드코딩된 값 제거
  - [ ] `mg-v2-*` 클래스 정의

### 백엔드
- [ ] OnboardingController.java
  - [ ] SessionUtils 사용
  - [ ] 하드코딩된 상태값 제거
  - [ ] 공통코드 기반 조회

- [ ] OnboardingServiceImpl.java
  - [ ] 하드코딩 제거 확인
  - [ ] 공통코드 기반 조회 확인

---

## 📊 표준화 진행 상황

| 단계 | 파일 | 상태 | 진행률 |
|------|------|------|--------|
| Phase 1.1 | OnboardingRequest.js | 대기 | 0% |
| Phase 1.2 | OnboardingStatus.js | 대기 | 0% |
| Phase 1.3 | CSS 파일 | 대기 | 0% |
| Phase 2.1 | OnboardingController.java | 대기 | 0% |
| Phase 2.2 | OnboardingServiceImpl.java | 대기 | 0% |
| Phase 3.1 | UnifiedFilterSearch | 대기 | 0% |
| Phase 4.1 | UnifiedModal | 대기 | 0% |

---

## 🎯 성공 지표

1. ✅ 모든 버튼이 MGButton 사용
2. ✅ 모든 로딩이 UnifiedLoading 사용
3. ✅ 모든 모달이 UnifiedModal 사용
4. ✅ 인라인 스타일 0개
5. ✅ 하드코딩된 값 0개 (상수/공통코드 사용)
6. ✅ CSS 클래스 `mg-v2-*` 100% 사용
7. ✅ SimpleLayout 사용 100%
8. ✅ 필터/검색 UnifiedFilterSearch 사용

---

## 📝 다음 단계

1. Phase 1부터 순차적으로 진행
2. 각 Phase 완료 후 테스트 및 검증
3. 표준화 문서 업데이트

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-09

