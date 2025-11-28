# MGButton 마이그레이션 가이드

## 📋 개요

MGButton은 MindGarden의 통합 버튼 컴포넌트로, 중복 클릭 방지, 로딩 상태, 다양한 스타일을 지원합니다.

## 🎯 마이그레이션 목표

- 모든 `<button>` 태그를 MGButton으로 교체
- 모든 커스텀 버튼 컴포넌트를 MGButton으로 통일
- 예상 교체 대상: 200+ 버튼

## 🔧 MGButton 특징

### 주요 기능
- ✅ 중복 클릭 방지
- ✅ 로딩 상태 표시
- ✅ 다양한 스타일 지원
- ✅ 접근성 (ARIA 속성)
- ✅ 터치 최적화

### Props
```jsx
<MGButton
  variant="primary|secondary|success|danger|warning|info|outline"
  size="small|medium|large"
  disabled={false}
  loading={false}
  loadingText="처리 중..."
  preventDoubleClick={true}
  clickDelay={1000}
  onClick={handleClick}
  fullWidth={false}
  className=""
  type="button|submit|reset"
>
  버튼 텍스트
</MGButton>
```

## 📝 마이그레이션 예시

### 1. 기본 버튼 교체

#### Before (기존)
```jsx
<button 
  className="btn btn-primary" 
  onClick={handleClick}
  disabled={loading}
>
  저장
</button>
```

#### After (MGButton)
```jsx
<MGButton
  variant="primary"
  size="medium"
  onClick={handleClick}
  loading={loading}
  preventDoubleClick={true}
>
  저장
</MGButton>
```

### 2. 로딩 버튼 교체

#### Before (기존)
```jsx
<button 
  className="btn btn-primary" 
  onClick={handleSubmit}
  disabled={isSubmitting}
>
  {isSubmitting ? (
    <>
      <Spinner size="small" />
      처리 중...
    </>
  ) : (
    '제출'
  )}
</button>
```

#### After (MGButton)
```jsx
<MGButton
  variant="primary"
  onClick={handleSubmit}
  loading={isSubmitting}
  loadingText="처리 중..."
>
  제출
</MGButton>
```

### 3. 아이콘 버튼 교체

#### Before (기존)
```jsx
<button 
  className="btn btn-outline-secondary" 
  onClick={handleEdit}
  title="편집"
>
  <i className="bi bi-pencil"></i>
  편집
</button>
```

#### After (MGButton)
```jsx
<MGButton
  variant="outline"
  size="small"
  onClick={handleEdit}
  title="편집"
>
  <ICONS.EDIT size={16} />
  편집
</MGButton>
```

### 4. 전체 너비 버튼

#### Before (기존)
```jsx
<button 
  className="btn btn-primary w-100" 
  onClick={handleSave}
>
  저장하기
</button>
```

#### After (MGButton)
```jsx
<MGButton
  variant="primary"
  fullWidth={true}
  onClick={handleSave}
>
  저장하기
</MGButton>
```

### 5. 폼 제출 버튼

#### Before (기존)
```jsx
<button 
  type="submit"
  className="btn btn-success" 
  disabled={!isValid}
>
  제출
</button>
```

#### After (MGButton)
```jsx
<MGButton
  type="submit"
  variant="success"
  disabled={!isValid}
  preventDoubleClick={true}
>
  제출
</MGButton>
```

## 🎨 스타일 매핑

### Bootstrap → MGButton
```jsx
// Bootstrap
className="btn btn-primary" → variant="primary"
className="btn btn-secondary" → variant="secondary"
className="btn btn-success" → variant="success"
className="btn btn-danger" → variant="danger"
className="btn btn-warning" → variant="warning"
className="btn btn-info" → variant="info"
className="btn btn-outline-primary" → variant="outline"

// 크기
className="btn btn-sm" → size="small"
className="btn btn-lg" → size="large"
// 기본값 → size="medium"

// 상태
disabled={true} → disabled={true}
className="w-100" → fullWidth={true}
```

### 커스텀 버튼 → MGButton
```jsx
// 커스텀 버튼
<button className="custom-button custom-primary">
  버튼
</button>

// MGButton으로 교체
<MGButton variant="primary">
  버튼
</MGButton>
```

## 📱 모바일 최적화

### 터치 영역
- MGButton은 자동으로 최소 44x44px 터치 영역 보장
- 모바일에서 터치하기 쉬운 크기

### 로딩 상태
- 터치 중복 방지로 실수 클릭 방지
- 로딩 중 시각적 피드백 제공

## 🔍 마이그레이션 체크리스트

### Phase 1: Admin Dashboard (우선순위 1)
- [ ] SessionManagement.js
- [ ] AdminDashboard.js
- [ ] MappingManagement.js
- [ ] UserManagement.js
- [ ] SystemNotificationManagement.js

### Phase 2: Consultant Dashboard
- [ ] ConsultantDashboard.js
- [ ] ConsultantMessages.js
- [ ] ConsultantClientList.js

### Phase 3: Client Dashboard
- [ ] ClientDashboard.js
- [ ] ClientSchedule.js
- [ ] ClientSettings.js

### Phase 4: 공통 컴포넌트
- [ ] Modal 컴포넌트들
- [ ] Form 컴포넌트들
- [ ] Table 컴포넌트들

### Phase 5: 기타 페이지
- [ ] MyPage.js
- [ ] Landing 페이지들
- [ ] 기타 유틸리티 페이지들

## 🚨 주의사항

### 1. 이벤트 핸들러
```jsx
// ❌ 잘못된 방법
<MGButton onClick={() => handleClick()}>
  버튼
</MGButton>

// ✅ 올바른 방법
<MGButton onClick={handleClick}>
  버튼
</MGButton>
```

### 2. 비동기 처리
```jsx
// ✅ 비동기 함수도 자동 처리
const handleAsyncClick = async () => {
  await apiCall();
  // MGButton이 자동으로 로딩 상태 관리
};

<MGButton onClick={handleAsyncClick}>
  비동기 버튼
</MGButton>
```

### 3. 폼 제출
```jsx
// ✅ preventDoubleClick으로 중복 제출 방지
<MGButton
  type="submit"
  preventDoubleClick={true}
  clickDelay={2000} // 2초 대기
>
  제출
</MGButton>
```

## 📊 마이그레이션 통계

### 현재 상태
- MGButton 사용: 5개 파일
- 일반 button 사용: 200+ 개 파일
- 커스텀 버튼: 50+ 개 파일

### 목표 상태
- MGButton 사용: 100% (모든 버튼)
- 일반 button 사용: 0개
- 커스텀 버튼: 0개

## 🔧 개발 도구

### 버튼 검색 스크립트
```bash
# 일반 button 태그 검색
grep -r "<button" frontend/src/components --include="*.js"

# 커스텀 버튼 컴포넌트 검색
grep -r "className.*btn" frontend/src/components --include="*.js"
```

### 자동 교체 스크립트 (예시)
```javascript
// 간단한 교체 예시 (실제로는 더 복잡한 로직 필요)
const replaceButton = (fileContent) => {
  return fileContent
    .replace(/<button\s+className="btn btn-primary"/g, '<MGButton variant="primary"')
    .replace(/<button\s+className="btn btn-secondary"/g, '<MGButton variant="secondary"')
    .replace(/<\/button>/g, '</MGButton>');
};
```

## 📚 참고 문서

- [MASTER_GUIDE.md](./MASTER_GUIDE.md) - 전체 디자인 시스템
- [CARD_SYSTEM_GUIDE.md](./CARD_SYSTEM_GUIDE.md) - 카드 시스템
- [ICON_LAYOUT_CENTRALIZATION_GUIDE.md](./ICON_LAYOUT_CENTRALIZATION_GUIDE.md) - 아이콘 중앙화

## 🚀 다음 단계

1. **Phase 1 시작**: Admin Dashboard 버튼 교체
2. **테스트**: 각 Phase 완료 후 기능 테스트
3. **문서화**: 교체 완료된 컴포넌트 문서 업데이트
4. **최적화**: 성능 및 사용성 개선

---

**마지막 업데이트**: 2025-01-23
