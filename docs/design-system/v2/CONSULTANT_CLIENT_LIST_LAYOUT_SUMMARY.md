# 내담자 목록 페이지 레이아웃 재설계 — 요약

**작성일**: 2026-03-09  
**담당**: core-designer  
**상태**: ✅ 설계 완료, core-coder 전달 대기

---

## 핵심 문제

현재 `ConsultantClientList.js`는 **비표준 레이아웃 구조**를 사용하여 AdminDashboardV2와 일관성이 없습니다.

### 문제점

1. ❌ `consultant-client-list-container` 클래스 사용 (비표준 래퍼)
2. ❌ ContentArea, ContentHeader, ContentSection 패턴 미적용
3. ❌ 커스텀 헤더 클래스 (`.client-list-header`, `.client-list-title`, `.client-list-subtitle`)
4. ❌ 대시보드와 레이아웃 구조 불일치

---

## 해결 방안

### AdminCommonLayout 기반 표준 구조 적용

```
AdminCommonLayout (DesktopLayout/MobileLayout 래핑)
└── ContentArea
    ├── ContentHeader (페이지 제목·설명)
    ├── mg-v2-alert (안내 배너)
    ├── ContentSection (검색·필터)
    └── ContentSection (카드 그리드)
```

**참조 패턴**: `AdminDashboardV2.js` (712-726행)

---

## 수정 작업 요약

### 1. Import 추가

```javascript
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
```

### 2. JSX 구조 변경

#### Before (잘못됨)

```jsx
<AdminCommonLayout title="내담자 목록">
  <div className="consultant-client-list-container">
    <div className="client-list-header">
      <h1 className="client-list-title">...</h1>
      <p className="client-list-subtitle">...</p>
      <div className="mg-v2-alert">...</div>
    </div>
    <div className="client-list-controls">...</div>
    <div className="client-card-grid">...</div>
  </div>
</AdminCommonLayout>
```

#### After (올바름)

```jsx
<AdminCommonLayout title="내담자 목록">
  <ContentArea>
    <ContentHeader title="내담자 목록" subtitle="..." />
    <div className="mg-v2-alert mg-v2-alert--info">...</div>
    <ContentSection noCard={true}>
      <div className="client-list-controls">...</div>
    </ContentSection>
    <ContentSection noCard={true}>
      <div className="client-card-grid">...</div>
    </ContentSection>
  </ContentArea>
</AdminCommonLayout>
```

### 3. CSS 정리

**제거**:
- `.consultant-client-list-container`
- `.client-list-header`
- `.client-list-title`
- `.client-list-subtitle`
- `.client-list-controls` margin-bottom

**유지**:
- 검색·필터 스타일
- 카드 그리드 스타일
- 내담자 카드 스타일
- 회기 현황 스타일
- 빈 상태·에러 상태 스타일
- 반응형 스타일

---

## 기대 효과

### 레이아웃 일관성

✅ **Before**: 
- 비표준 래퍼, 커스텀 클래스
- 대시보드와 다른 구조

✅ **After**:
- ContentArea 패턴, mg-v2-* 표준
- 대시보드와 동일한 구조

### 사용자 경험

✅ **Before**:
- 대시보드와 다른 레이아웃
- 일관성 없는 네비게이션

✅ **After**:
- 대시보드와 동일한 레이아웃
- 일관된 네비게이션 경험
- 명확한 시각적 계층

---

## 산출물

1. ✅ **레이아웃 수정 핸드오프**: `CONSULTANT_CLIENT_LIST_LAYOUT_FIX.md`
   - Before/After 비교
   - 상세 구현 가이드
   - CSS 제거·유지·수정 목록

2. ✅ **설계 스펙 업데이트**: `CONSULTANT_CLIENT_LIST_REDESIGN_SPEC.md`
   - 레이아웃 구조 섹션 수정
   - ContentArea 패턴 적용
   - 컴포넌트 계층 업데이트

3. ✅ **요약 문서**: `CONSULTANT_CLIENT_LIST_LAYOUT_SUMMARY.md` (본 문서)

---

## 다음 단계

### core-coder 작업

1. **레이아웃 구조 수정** (최우선)
   - Import 추가
   - JSX 구조 변경
   - CSS 정리

2. **검증**
   - AdminDashboardV2와 구조 일치 확인
   - 반응형 레이아웃 정상 작동 확인
   - 대시보드와 네비게이션 경험 일관성 확인

3. **테스트**
   - 브라우저에서 시각적 확인
   - 모바일~데스크톱 반응형 확인

---

## 참조 문서

| 문서 | 용도 |
|------|------|
| **CONSULTANT_CLIENT_LIST_LAYOUT_FIX.md** | 레이아웃 수정 핸드오프 (최우선) |
| CONSULTANT_CLIENT_LIST_REDESIGN_SPEC.md | 전체 설계 스펙 |
| PENCIL_DESIGN_GUIDE.md | 펜슬 디자인 가이드 |
| AdminDashboardV2.js | 참조 패턴 |
| dashboard-v2/content/ | ContentArea, ContentHeader, ContentSection |

---

**설계 완료일**: 2026-03-09  
**설계자**: core-designer  
**다음 단계**: core-coder 레이아웃 구조 수정
