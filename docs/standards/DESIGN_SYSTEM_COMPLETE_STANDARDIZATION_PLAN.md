# 디자인 시스템 완전 표준화 계획 (재구성)

**작성일**: 2025-12-09  
**상태**: 긴급 재구성  
**우선순위**: 최우선

---

## 🚨 현재 문제점 분석

### 1. 카드 스타일 중구난방
- **상담사 카드**: `mg-consultant-card`, `mg-v2-consultant-card`, `consultant-client-card` 등 혼재
- **내담자 카드**: `mg-v2-client-card`, `client-card`, `consultant-client-card` 등 혼재
- **카드 크기**: 큰 카드(detailed), 작은 카드(compact) 등 제각각
- **결과**: 일관성 없는 디자인, 유지보수 어려움

### 2. 레이아웃 불일치
- 그리드 시스템이 각 컴포넌트마다 다름
- 반응형 브레이크포인트가 일관되지 않음
- 카드 간격과 패딩이 제각각

### 3. 큰 카드 불필요
- 상담사/내담자 상세 정보는 모달로 처리
- 리스트에서는 컴팩트한 카드만 필요
- 큰 카드는 공간 낭비

---

## 🎯 표준화 목표

### 핵심 원칙
1. **컴팩트 우선**: 리스트는 작은 카드만 사용
2. **일관성**: 모든 카드가 동일한 스타일 시스템 사용
3. **반응형**: 화면 크기에 따라 자동 조정
4. **표준화**: 하나의 표준 클래스만 사용
5. **인디케이터 표준화**: 로딩, 진행률 등 모든 인디케이터 일관성
6. **데이터 기반 입력**: 입력은 최소화, 드롭다운 우선 사용

---

## 📐 표준 카드 시스템 설계

### 카드 크기 표준

#### 1. 컴팩트 카드 (Compact Card) - 기본
**용도**: 리스트, 그리드 뷰
**크기**: 
- 높이: 80-100px (고정)
- 최소 너비: 280px
- 패딩: 12px (small)

**구조**:
```
┌─────────────────────────┐
│ [아바타] 이름    [상태] │  ← 헤더 (40px)
│ 이메일                  │  ← 본문 (40px)
└─────────────────────────┘
```

**클래스**: `.mg-card-compact`

#### 2. 미디엄 카드 (Medium Card) - 선택적
**용도**: 대시보드 위젯, 요약 정보
**크기**:
- 높이: 120-140px
- 최소 너비: 300px
- 패딩: 16px (medium)

**구조**:
```
┌─────────────────────────┐
│ [아바타] 이름    [상태] │  ← 헤더
│ 이메일                  │  ← 본문
│ [통계 정보]             │  ← 푸터
└─────────────────────────┘
```

**클래스**: `.mg-card-medium`

#### 3. 큰 카드 (Large Card) - 제한적 사용
**용도**: 상세 정보 표시 (모달 내부)
**크기**:
- 높이: 자동
- 너비: 모달 내부에서 결정
- 패딩: 24px (large)

**클래스**: `.mg-card-large`

---

## 🎨 표준 카드 컴포넌트 구조

### 상담사/내담자 컴팩트 카드 표준

```jsx
<div className="mg-card-compact mg-card-compact--person">
  {/* 헤더 */}
  <div className="mg-card-compact__header">
    <div className="mg-card-compact__avatar">
      {initial}
    </div>
    <div className="mg-card-compact__info">
      <h4 className="mg-card-compact__name">{name}</h4>
      <p className="mg-card-compact__subtitle">{email}</p>
    </div>
    <span className="mg-card-compact__badge">{status}</span>
  </div>
  
  {/* 본문 (선택적) */}
  <div className="mg-card-compact__body">
    {/* 간단한 통계나 메타 정보 */}
  </div>
</div>
```

### 표준 CSS 클래스

```css
/* 기본 컴팩트 카드 */
.mg-card-compact {
  /* 높이 고정, 패딩 작게 */
}

/* 상담사/내담자 전용 */
.mg-card-compact--person {
  /* 특별한 스타일 */
}

/* 아바타 */
.mg-card-compact__avatar {
  /* 작은 아바타 (32-40px) */
}

/* 이름 */
.mg-card-compact__name {
  /* 작은 폰트, 한 줄 */
}

/* 상태 배지 */
.mg-card-compact__badge {
  /* 작은 배지 */
}
```

---

## 📱 반응형 그리드 시스템

### 표준 그리드 클래스

```css
/* 자동 반응형 그리드 */
.mg-grid-compact {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--mg-spacing-sm, 0.5rem);
}

/* 모바일: 1열 */
@media (min-width: 640px) {
  .mg-grid-compact {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--mg-spacing-md, 1rem);
  }
}

/* 태블릿: 2-3열 */
@media (min-width: 768px) {
  .mg-grid-compact {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 데스크탑: 3-4열 */
@media (min-width: 1024px) {
  .mg-grid-compact {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 큰 데스크탑: 4-5열 */
@media (min-width: 1280px) {
  .mg-grid-compact {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 🔧 실행 계획

### Phase 1: 표준 카드 시스템 정의 (1일)

#### 1.1 표준 카드 CSS 작성
- `mindgarden-design-system.css`에 표준 카드 스타일 추가
- 컴팩트 카드 우선 정의
- 상담사/내담자 전용 스타일 정의

#### 1.2 표준 카드 컴포넌트 생성
- `PersonCard` 컴포넌트 생성 (상담사/내담자 공통)
- `variant` prop으로 상담사/내담자 구분
- `size` prop으로 compact/medium/large 구분

### Phase 2: 기존 카드 마이그레이션 (2-3일)

#### 2.1 상담사 카드 마이그레이션
- `ConsultantCard` → `PersonCard` (variant="consultant")
- 큰 카드 제거, 컴팩트 카드만 사용
- 상세 정보는 모달로 이동

#### 2.2 내담자 카드 마이그레이션
- `ClientCard` → `PersonCard` (variant="client")
- 모든 내담자 리스트를 컴팩트 카드로 통일

#### 2.3 레이아웃 그리드 마이그레이션
- 모든 그리드를 `.mg-grid-compact` 사용
- 반응형 자동 조정

### Phase 3: 레이아웃 표준화 (1-2일)

#### 3.1 페이지 레이아웃 표준화
- 모든 페이지가 동일한 레이아웃 구조 사용
- 컨테이너, 그리드, 간격 통일

#### 3.2 반응형 검증
- 모바일, 태블릿, 데스크탑에서 일관된 디자인 확인

---

## 📋 표준 카드 스펙

### 컴팩트 카드 (기본)

**크기**:
- 높이: 80px (고정)
- 패딩: 12px
- 간격: 8px

**구성 요소**:
- 아바타: 32px (원형)
- 이름: 14px, semibold
- 이메일: 12px, regular
- 상태 배지: 10px, 4px padding

**그리드**:
- 모바일: 1열
- 태블릿: 2열
- 데스크탑: 3-4열

### 미디엄 카드 (선택적)

**크기**:
- 높이: 120px (고정)
- 패딩: 16px
- 간격: 12px

**추가 요소**:
- 통계 정보 (회기 수, 상태 등)

---

## 🎨 표준 색상 및 스타일

### 카드 배경
- 기본: `var(--color-white, #ffffff)`
- 호버: `var(--cs-secondary-50, #f9fafb)`
- 테두리: `var(--cs-secondary-200, #e5e7eb)`

### 아바타
- 크기: 32px (컴팩트), 40px (미디엄)
- 배경: 그라데이션 또는 단색
- 텍스트: 흰색, 14px, bold

### 상태 배지
- 활성: 녹색 배경
- 비활성: 회색 배경
- 대기: 주황색 배경

---

## ✅ 체크리스트

### Phase 1: 표준 정의
- [ ] 표준 카드 CSS 작성
- [ ] PersonCard 컴포넌트 생성
- [ ] 반응형 그리드 시스템 정의

### Phase 2: 마이그레이션
- [ ] ConsultantCard → PersonCard
- [ ] ClientCard → PersonCard
- [ ] 모든 그리드를 표준 그리드로 전환
- [ ] 큰 카드 제거 (상세 정보는 모달)

### Phase 3: 검증
- [ ] 시각적 일관성 확인
- [ ] 반응형 동작 확인
- [ ] 성능 확인

---

## 📊 성공 지표

1. ✅ 모든 카드가 동일한 스타일
2. ✅ 컴팩트 카드만 사용 (큰 카드 제거)
3. ✅ 반응형 그리드 자동 조정
4. ✅ 일관된 레이아웃
5. ✅ 디자인 퀄리티 향상

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-09

