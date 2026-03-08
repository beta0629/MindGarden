# 내담자 목록 페이지 레이아웃 재설계 — 최종 리포트

**작성일**: 2026-03-09  
**담당**: core-designer  
**상태**: ✅ 설계 완료

---

## 요약

내담자 목록 페이지(`ConsultantClientList.js`)의 레이아웃 구조를 마인드가든 디자인 시스템 표준에 맞게 재설계했습니다.

### 핵심 변경사항

1. **비표준 래퍼 제거**: `consultant-client-list-container` 클래스 제거
2. **ContentArea 패턴 적용**: AdminDashboardV2와 동일한 레이아웃 구조
3. **표준 컴포넌트 사용**: ContentHeader, ContentSection 적용
4. **CSS 정리**: 비표준 스타일 제거, 디자인 토큰 유지

---

## 1. 문제 진단

### 1.1 발견된 문제

| 문제 | 설명 | 영향 |
|------|------|------|
| 비표준 래퍼 | `consultant-client-list-container` 클래스 사용 | 대시보드와 구조 불일치 |
| ContentArea 미사용 | AdminCommonLayout 내부에서 ContentArea 패턴 미적용 | 레이아웃 표준 위반 |
| 커스텀 헤더 | `.client-list-header`, `.client-list-title` 등 커스텀 클래스 | ContentHeader 컴포넌트 미사용 |
| 섹션 구분 없음 | ContentSection 미사용 | 영역 구분 불명확 |

### 1.2 영향 범위

- **사용자 경험**: 대시보드와 다른 레이아웃으로 일관성 저하
- **개발 표준**: 디자인 시스템 표준 미준수
- **유지보수**: 비표준 코드로 인한 유지보수 어려움

---

## 2. 해결 방안

### 2.1 AdminCommonLayout 구조 이해

```
AdminCommonLayout
└── DesktopLayout/MobileLayout
    └── mg-v2-desktop-layout
        ├── DesktopGnb (상단 네비게이션)
        └── mg-v2-desktop-layout__body
            ├── DesktopLnb (좌측 사이드바, 260px)
            └── mg-v2-desktop-layout__main (padding: 24px)
                └── {children} ← ContentArea 배치
```

**핵심**: 
- AdminCommonLayout은 이미 GNB + LNB + 메인 영역 제공
- 메인 영역은 이미 패딩(24px) 적용됨
- 따라서 children 내부에서 **추가 래퍼 불필요**

### 2.2 ContentArea 패턴

```
ContentArea (패딩 없음, 자식 세로 배치)
├── ContentHeader (페이지 제목·설명)
├── 추가 요소 (배너 등)
├── ContentSection (영역 1)
└── ContentSection (영역 2)
```

**장점**:
- ✅ 표준 레이아웃 구조
- ✅ 대시보드와 일관성
- ✅ 명확한 영역 구분
- ✅ 재사용 가능한 컴포넌트

---

## 3. 설계 산출물

### 3.1 핸드오프 문서

| 문서 | 용도 | 대상 |
|------|------|------|
| **CONSULTANT_CLIENT_LIST_LAYOUT_HANDOFF.md** | 단계별 구현 가이드 | core-coder (최우선) |
| CONSULTANT_CLIENT_LIST_LAYOUT_FIX.md | 상세 Before/After 비교 | core-coder |
| CONSULTANT_CLIENT_LIST_LAYOUT_SUMMARY.md | 핵심 요약 | 전체 팀 |
| CONSULTANT_CLIENT_LIST_REDESIGN_SPEC.md | 전체 설계 스펙 (업데이트) | core-coder |

### 3.2 수정된 레이아웃 구조

#### JSX 구조

```jsx
<AdminCommonLayout title="내담자 목록">
  <ContentArea>
    <ContentHeader
      title="내담자 목록"
      subtitle="나와 연계된 내담자들을 조회할 수 있습니다."
    />
    
    <div className="mg-v2-alert mg-v2-alert--info">
      <Info size={20} />
      내담자 생성, 수정, 삭제는 관리자와 스태프만 가능합니다.
    </div>

    <ContentSection noCard={true}>
      <div className="client-list-controls">
        {/* 검색·필터 */}
      </div>
    </ContentSection>

    <ContentSection noCard={true}>
      {/* 로딩·에러·빈 상태·카드 그리드 */}
    </ContentSection>
  </ContentArea>
</AdminCommonLayout>
```

#### CSS 클래스 매핑

| 영역 | 클래스 | 제공자 |
|------|--------|--------|
| 전체 래퍼 | `mg-v2-content-area` | ContentArea 컴포넌트 |
| 페이지 헤더 | `mg-v2-content-header` | ContentHeader 컴포넌트 |
| 안내 배너 | `mg-v2-alert mg-v2-alert--info` | 직접 작성 (유지) |
| 섹션 래퍼 | `mg-v2-content-section--plain` | ContentSection(noCard) |
| 검색·필터 | `client-list-controls` | 직접 작성 (유지) |
| 카드 그리드 | `client-card-grid` | 직접 작성 (유지) |

---

## 4. 레이아웃 비교

### 4.1 Before (현재 - 비표준)

```
┌─────────────────────────────────────────────────────────────┐
│ [GNB]                                                        │
├──────────┬──────────────────────────────────────────────────┤
│          │ ┌────────────────────────────────────────────┐   │
│          │ │ consultant-client-list-container (비표준)   │   │
│  [LNB]   │ │   ├─ client-list-header (커스텀)           │   │
│          │ │   ├─ client-list-controls                  │   │
│  260px   │ │   └─ client-card-grid                      │   │
│          │ └────────────────────────────────────────────┘   │
└──────────┴──────────────────────────────────────────────────┘
```

**문제**:
- ❌ 비표준 래퍼로 인한 이중 패딩
- ❌ 커스텀 헤더 클래스
- ❌ 영역 구분 불명확

### 4.2 After (수정 후 - 표준)

```
┌─────────────────────────────────────────────────────────────┐
│ [GNB] (DesktopGnb)                                           │
├──────────┬──────────────────────────────────────────────────┤
│          │ mg-v2-desktop-layout__main (padding: 24px)       │
│          │ ┌────────────────────────────────────────────┐   │
│  [LNB]   │ │ ContentArea (표준)                         │   │
│          │ │   ├─ ContentHeader (표준)                  │   │
│  260px   │ │   ├─ mg-v2-alert                           │   │
│          │ │   ├─ ContentSection (검색·필터)            │   │
│          │ │   └─ ContentSection (카드 그리드)          │   │
│          │ └────────────────────────────────────────────┘   │
└──────────┴──────────────────────────────────────────────────┘
```

**개선**:
- ✅ 표준 패턴 적용
- ✅ 명확한 영역 구분
- ✅ AdminDashboardV2와 일치

---

## 5. 디자인 시스템 준수 확인

### 5.1 펜슬 가이드 체크리스트

- [x] **단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen` 컴포넌트·토큰 사용
- [x] **색상**: `var(--mg-color-*)` 토큰 명시, 하드코딩 없음
- [x] **레이아웃**: AdminCommonLayout + ContentArea 패턴 적용
- [x] **타이포**: Noto Sans KR, 제목/본문/라벨 일관성
- [x] **반응형**: 모바일~데스크톱 브레이크포인트 고려
- [x] **토큰 명시**: `var(--mg-*)`, `mg-v2-*` 클래스명 명시
- [x] **재사용**: ContentArea, ContentHeader, ContentSection 재사용

### 5.2 레이아웃 표준 준수

- [x] **AdminCommonLayout 패턴**: ContentArea → ContentHeader → ContentSection 계층
- [x] **비표준 래퍼 제거**: `consultant-client-list-container` 제거
- [x] **표준 컴포넌트 사용**: ContentArea, ContentHeader, ContentSection
- [x] **대시보드 일관성**: AdminDashboardV2와 동일한 구조
- [x] **mg-v2-* 클래스**: 표준 클래스명 사용

### 5.3 아토믹 디자인 준수

- [x] **Templates**: AdminCommonLayout, ContentArea
- [x] **Organisms**: ContentHeader, ContentSection, ClientCard
- [x] **Molecules**: FilterBadge, ClientSessionInfo
- [x] **Atoms**: Avatar, StatusBadge, Button, Input, Icon

---

## 6. 기대 효과

### 6.1 레이아웃 표준화

**Before**:
- 비표준 래퍼 사용
- 커스텀 클래스 남발
- 대시보드와 구조 불일치

**After**:
- ContentArea 패턴 적용
- 표준 컴포넌트 사용
- 대시보드와 구조 일치

### 6.2 사용자 경험 개선

**Before**:
- 대시보드와 다른 레이아웃
- 일관성 없는 네비게이션
- 비표준 시각적 계층

**After**:
- 대시보드와 동일한 레이아웃
- 일관된 네비게이션 경험
- 명확한 시각적 계층

### 6.3 유지보수성 향상

**Before**:
- 비표준 코드로 인한 유지보수 어려움
- 커스텀 스타일 관리 부담
- 디자인 시스템과 괴리

**After**:
- 표준 패턴으로 유지보수 용이
- 재사용 가능한 컴포넌트
- 디자인 시스템 준수

---

## 7. 다음 단계

### 7.1 core-coder 작업

**우선순위**: 🔴 HIGH

**작업 내용**:
1. Import 추가
2. JSX 구조 수정
3. CSS 정리

**참조 문서**: `CONSULTANT_CLIENT_LIST_LAYOUT_HANDOFF.md` (단계별 가이드)

**예상 시간**: 약 30분

### 7.2 검증

**담당**: core-coder

**체크리스트**:
- [ ] AdminDashboardV2와 레이아웃 일치
- [ ] 반응형 레이아웃 정상 작동
- [ ] 기능 정상 작동 (검색·필터·카드 클릭)
- [ ] 시각적 일관성 확인

### 7.3 추가 작업 (선택)

**우선순위**: 🟡 MEDIUM

- [ ] 다른 페이지도 동일한 패턴으로 수정 (ConsultantRecords 등)
- [ ] 레이아웃 표준 문서화 강화
- [ ] 디자인 시스템 가이드 업데이트

---

## 8. 산출물 목록

### 8.1 핸드오프 문서

1. **CONSULTANT_CLIENT_LIST_LAYOUT_HANDOFF.md** ⭐ 최우선
   - 단계별 구현 가이드
   - Before/After 코드 비교
   - 체크리스트

2. **CONSULTANT_CLIENT_LIST_LAYOUT_FIX.md**
   - 상세 구현 가이드
   - AdminCommonLayout 구조 설명
   - ContentArea 패턴 설명

3. **CONSULTANT_CLIENT_LIST_LAYOUT_SUMMARY.md**
   - 핵심 문제·해결 방안 요약
   - 수정 작업 요약
   - 기대 효과

4. **CONSULTANT_CLIENT_LIST_LAYOUT_REDESIGN_REPORT.md** (본 문서)
   - 최종 리포트
   - 전체 작업 요약
   - 다음 단계

### 8.2 업데이트된 설계 문서

1. **CONSULTANT_CLIENT_LIST_REDESIGN_SPEC.md** (업데이트)
   - 레이아웃 구조 섹션 수정
   - ContentArea 패턴 적용
   - 컴포넌트 계층 업데이트
   - CSS 스펙 추가 (제거·유지·수정)

---

## 9. 참조 자료

### 9.1 디자인 시스템

- `docs/design-system/PENCIL_DESIGN_GUIDE.md` — 펜슬 디자인 가이드 (필수 숙지)
- `docs/standards/RESPONSIVE_LAYOUT_SPEC.md` — 반응형 레이아웃 상세
- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md` — 아토믹 디자인 패턴
- `frontend/src/styles/unified-design-tokens.css` — 디자인 토큰 정의

### 9.2 참조 코드

- `frontend/src/components/dashboard-v2/AdminDashboardV2.js` — 참조 패턴 (712-726행)
- `frontend/src/components/dashboard-v2/content/ContentArea.js` — ContentArea 컴포넌트
- `frontend/src/components/dashboard-v2/content/ContentHeader.js` — ContentHeader 컴포넌트
- `frontend/src/components/dashboard-v2/content/ContentSection.js` — ContentSection 컴포넌트
- `frontend/src/components/dashboard-v2/templates/DesktopLayout.js` — DesktopLayout 구조
- `frontend/src/components/layout/AdminCommonLayout.js` — AdminCommonLayout 래퍼

### 9.3 현재 파일

- `frontend/src/components/consultant/ConsultantClientList.js` — 수정 대상 파일
- `frontend/src/components/consultant/ConsultantClientList.css` — CSS 정리 대상
- `frontend/src/components/consultant/molecules/FilterBadge.js` — 재사용 (이미 존재)
- `frontend/src/components/consultant/molecules/ClientCard.js` — 재사용 (이미 존재)
- `frontend/src/components/consultant/molecules/ClientSessionInfo.js` — 재사용 (이미 존재)

---

## 10. 검증 기준

### 10.1 레이아웃 구조

- [ ] `ContentArea` 컴포넌트 사용
- [ ] `ContentHeader` 컴포넌트 사용
- [ ] `ContentSection` 컴포넌트로 영역 구분
- [ ] `consultant-client-list-container` 제거
- [ ] AdminDashboardV2와 동일한 계층 구조

### 10.2 CSS 표준

- [ ] `.consultant-client-list-container` 스타일 제거
- [ ] `.client-list-header`, `.client-list-title`, `.client-list-subtitle` 제거
- [ ] `var(--mg-*)` 토큰 사용 유지
- [ ] `mg-v2-*` 클래스명 유지
- [ ] 반응형 스타일 유지

### 10.3 시각적 일관성

- [ ] 대시보드와 동일한 헤더 스타일
- [ ] 대시보드와 동일한 섹션 간격
- [ ] 대시보드와 동일한 카드 스타일
- [ ] 어드민 대시보드 샘플과 비주얼 일치

### 10.4 기능 정상 작동

- [ ] 검색 기능
- [ ] 필터 배지 클릭
- [ ] 카드 클릭 → 상세보기 모달
- [ ] 빈 상태·에러 상태 표시
- [ ] 반응형 레이아웃 (모바일~데스크톱)

---

## 11. 결론

### 11.1 설계 완료 사항

✅ **레이아웃 구조 재설계**:
- AdminCommonLayout + ContentArea 패턴 적용
- 비표준 래퍼 제거
- 표준 컴포넌트 사용

✅ **CSS 스펙 정리**:
- 제거·유지·수정 목록 작성
- 디자인 토큰 유지
- 반응형 스타일 유지

✅ **핸드오프 문서 작성**:
- 단계별 구현 가이드
- Before/After 비교
- 체크리스트

### 11.2 core-coder 전달 사항

**최우선 문서**: `CONSULTANT_CLIENT_LIST_LAYOUT_HANDOFF.md`

**작업 순서**:
1. Import 추가
2. JSX 구조 수정
3. CSS 정리
4. 검증

**예상 시간**: 약 30분

### 11.3 기대 효과

- ✅ 디자인 시스템 표준 준수
- ✅ AdminDashboardV2와 레이아웃 일관성
- ✅ 명확한 시각적 계층
- ✅ 일관된 사용자 경험
- ✅ 유지보수성 향상

---

**설계 완료일**: 2026-03-09  
**설계자**: core-designer  
**다음 단계**: core-coder에게 핸드오프 문서 전달 → 구현 착수
