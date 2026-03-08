# 상담사 내담자 목록 화면 재설계 — 화면설계서

**작성일**: 2026-03-09  
**대상 화면**: 상담사 내담자 목록 (`ConsultantClientList.js`)  
**담당**: core-designer  
**구현**: core-coder

**참조**:
- 펜슬 가이드: `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- 어드민 대시보드 샘플: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample
- 디자인 토큰: `frontend/src/styles/unified-design-tokens.css`
- Phase 1 디자인 스펙: `docs/design-system/v2/CONSULTANT_DASHBOARD_PHASE1_DESIGN_SPEC.md`
- 기존 컴포넌트: `frontend/src/components/consultant/ConsultantClientList.js`

---

## 0. 사용자 관점 우선 (스킬 §0.4)

### 0.1 사용성
- **빠른 필터링**: 상담사가 내담자 목록을 상태별·위험도별로 빠르게 필터링할 수 있어야 함
- **한눈에 파악**: 내담자 상태·위험도·회기 현황을 카드에서 즉시 확인
- **자주 쓰는 필터 상단 배치**: 전체·활성·비활성·대기중·완료·일시정지 필터를 상단 배지 형태로 배치

### 0.2 정보 노출 범위
- **노출 정보**: 내담자명, 연락처(마스킹 옵션), 상태, 담당 상담사, 최근 상담일, 총 상담 횟수, 위험도, 패키지명, 회기 현황(총/사용/남은)
- **민감 정보 처리**: 연락처는 기본적으로 노출하되, 향후 권한별 마스킹 옵션 고려 (예: `010-****-1234`)
- **역할별 노출**: 상담사는 자신의 내담자만 조회 (백엔드 TenantContextHolder + 상담사 ID 필터 적용)

### 0.3 레이아웃(배치)
1. **상단 영역**: 페이지 제목 + 설명 + 검색 입력
2. **필터 배지 영역**: 상태별 필터 배지 (전체·활성·비활성·대기중·완료·일시정지)
3. **본문 영역**: 그리드 형태 내담자 카드 목록 (데스크톱 3열, 태블릿 2열, 모바일 1열)
4. **각 카드**: 내담자 정보 블록 + 회기 현황 블록 + 액션 버튼

---

## 1. 전체 레이아웃 구조

### 1.1 화면 구성 기획서

```
┌─────────────────────────────────────────────────────────────┐
│ 페이지 헤더 (Page Header)                                    │
│ - 제목: "내담자 목록 (N명)"                                   │
│ - 설명: "나와 연계된 내담자들을 조회할 수 있습니다."           │
│ - 안내 배너: "내담자 생성, 수정, 삭제는 관리자와 스태프만..."  │
├─────────────────────────────────────────────────────────────┤
│ 검색 및 필터 영역 (Search & Filter Section)                  │
│ - 검색 입력: "이름, 이메일, 전화번호로 검색..."               │
│ - 필터 배지: [전체] [활성] [비활성] [대기중] [완료] [일시정지] │
├─────────────────────────────────────────────────────────────┤
│ 내담자 카드 그리드 (Client Card Grid)                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│ │ 카드 1   │ │ 카드 2   │ │ 카드 3   │                      │
│ └──────────┘ └──────────┘ └──────────┘                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│ │ 카드 4   │ │ 카드 5   │ │ 카드 6   │                      │
│ └──────────┘ └──────────┘ └──────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 영역별 배치

| 영역 | 클래스명 | 배경 | 패딩 | 비고 |
|------|---------|------|------|------|
| 전체 컨테이너 | `consultant-client-list-container` | `var(--mg-color-background-main)` | 24px | 최대 너비 1440px |
| 페이지 헤더 | `client-list-header` | transparent | 0 0 24px 0 | 제목·설명·안내 배너 |
| 검색·필터 영역 | `client-list-controls` | transparent | 0 0 24px 0 | 검색 + 필터 배지 |
| 카드 그리드 | `client-card-grid` | transparent | 0 | 반응형 그리드 |

---

## 2. 페이지 헤더 (Page Header)

### 2.1 제목 (Title)

**클래스**: `client-list-title`

```css
.client-list-title {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: var(--mg-color-text-main); /* #2C2C2C */
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.client-list-title svg {
  width: 24px;
  height: 24px;
  color: var(--mg-color-primary-main); /* #3D5246 */
}
```

**구조**:
- 아이콘: `Users` (lucide-react, 24px)
- 텍스트: "내담자 목록 (N명)"

### 2.2 설명 (Subtitle)

**클래스**: `client-list-subtitle`

```css
.client-list-subtitle {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--mg-color-text-secondary); /* #5C6B61 */
  margin-bottom: 16px;
}
```

**텍스트**: "나와 연계된 내담자들을 조회할 수 있습니다. (읽기 전용)"

### 2.3 안내 배너 (Info Banner)

**클래스**: `mg-v2-alert mg-v2-alert--info`

```css
.mg-v2-alert--info {
  background: var(--mg-v2-color-info-50, #f0f9ff);
  border: 1px solid var(--mg-v2-color-info-200, #bae6fd);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--mg-v2-color-info-700, #0369a1);
}

.mg-v2-alert--info svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
```

**구조**:
- 아이콘: `Info` (lucide-react, 20px)
- 텍스트: "내담자 생성, 수정, 삭제는 관리자와 스태프만 가능합니다."

---

## 3. 검색 및 필터 영역 (Search & Filter Section)

### 3.1 컨테이너

**클래스**: `client-list-controls`

```css
.client-list-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}
```

### 3.2 검색 입력 (Search Input)

**클래스**: `client-search-input-wrapper`

```css
.client-search-input-wrapper {
  position: relative;
  width: 100%;
  max-width: 480px;
}

.client-search-input-wrapper svg {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--mg-color-text-secondary); /* #5C6B61 */
  pointer-events: none;
}

.client-search-input {
  width: 100%;
  height: 44px;
  padding: 10px 16px 10px 48px;
  background: var(--mg-color-surface-main); /* #F5F3EF */
  border: 1px solid var(--mg-color-border-main); /* #D4CFC8 */
  border-radius: 10px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  color: var(--mg-color-text-main); /* #2C2C2C */
  transition: all 0.2s ease;
}

.client-search-input::placeholder {
  color: var(--mg-color-text-secondary); /* #5C6B61 */
}

.client-search-input:focus {
  outline: none;
  border-color: var(--mg-color-primary-main); /* #3D5246 */
  box-shadow: 0 0 0 3px rgba(61, 82, 70, 0.1);
}
```

**구조**:
- 아이콘: `Search` (lucide-react, 18px, 좌측 고정)
- placeholder: "이름, 이메일, 전화번호로 검색..."

### 3.3 필터 배지 영역 (Filter Badge Section)

**클래스**: `client-filter-badges`

```css
.client-filter-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.client-filter-badges__label {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--mg-color-text-secondary); /* #5C6B61 */
  margin-right: 8px;
}
```

**구조**:
- 라벨: "상태 필터:" (선택 사항)
- 배지 목록: 전체·활성·비활성·대기중·완료·일시정지

### 3.4 필터 배지 (Filter Badge) — Molecule

**클래스**: `mg-v2-filter-badge`

```css
.mg-v2-filter-badge {
  height: 36px;
  padding: 8px 16px;
  border-radius: 10px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--mg-color-border-main); /* #D4CFC8 */
  background: var(--mg-color-surface-main); /* #F5F3EF */
  color: var(--mg-color-text-main); /* #2C2C2C */
}

/* 활성 상태 */
.mg-v2-filter-badge--active {
  background: var(--mg-color-primary-main); /* #3D5246 */
  color: var(--mg-color-background-main); /* #FAF9F7 */
  border-color: var(--mg-color-primary-main);
}

/* 호버 효과 */
.mg-v2-filter-badge:hover:not(.mg-v2-filter-badge--active) {
  background: var(--mg-color-background-main); /* #FAF9F7 */
  border-color: var(--mg-color-primary-main); /* #3D5246 */
}

/* 배지 내 카운트 */
.mg-v2-filter-badge__count {
  font-weight: 600;
  opacity: 0.8;
}
```

**필터 배지 목록**:

| 배지 텍스트 | 필터 값 | 아이콘 (lucide-react) | 활성 색상 |
|-----------|--------|----------------------|----------|
| 전체 (N명) | ALL | List | `var(--mg-color-primary-main)` |
| 활성 (N명) | ACTIVE | CheckCircle | `var(--mg-v2-color-success-600, #16a34a)` |
| 비활성 (N명) | INACTIVE | XCircle | `var(--mg-v2-color-secondary-500, #6b7280)` |
| 대기중 (N명) | PENDING | Clock | `var(--mg-v2-color-warning-600, #d97706)` |
| 완료 (N명) | COMPLETED | CheckCircle2 | `var(--mg-v2-color-success-700, #15803d)` |
| 일시정지 (N명) | SUSPENDED | PauseCircle | `var(--mg-v2-color-error-600, #dc2626)` |

**인터랙션**:
- 클릭 시: 해당 상태로 필터링
- 활성 배지: 배경·텍스트 색상 변경
- 카운트: 각 상태별 내담자 수 표시 (예: "활성 (12명)")

---

## 4. 내담자 카드 그리드 (Client Card Grid)

### 4.1 그리드 컨테이너

**클래스**: `client-card-grid`

```css
.client-card-grid {
  display: grid;
  gap: 20px;
}

/* 데스크톱: 3열 */
@media (min-width: 1280px) {
  .client-card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 태블릿: 2열 */
@media (min-width: 768px) and (max-width: 1279px) {
  .client-card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 모바일: 1열 */
@media (max-width: 767px) {
  .client-card-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 5. 내담자 카드 디자인 (Client Card) — Organism

### 5.1 카드 컨테이너

**클래스**: `mg-v2-client-card`

```css
.mg-v2-client-card {
  background: var(--mg-color-surface-main); /* #F5F3EF */
  border: 1px solid var(--mg-color-border-main); /* #D4CFC8 */
  border-radius: 16px;
  padding: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  overflow: hidden;
  position: relative;
}

/* 좌측 악센트 바 */
.mg-v2-client-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--mg-color-primary-main); /* #3D5246 */
  border-radius: 2px 0 0 2px;
}

/* 호버 효과 */
.mg-v2-client-card:hover {
  border-color: var(--mg-color-primary-main); /* #3D5246 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

### 5.2 카드 헤더 (Card Header)

**클래스**: `mg-v2-client-card__header`

```css
.mg-v2-client-card__header {
  padding: 20px 24px 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  border-bottom: 1px solid var(--mg-color-border-main); /* #D4CFC8 */
}
```

**구조**:
1. **좌측**: 아바타 + 내담자명
2. **우측**: 상태 배지

#### 아바타 + 이름 영역

**클래스**: `mg-v2-client-card__profile`

```css
.mg-v2-client-card__profile {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.mg-v2-client-card__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--mg-color-primary-main); /* #3D5246 */
  color: var(--mg-color-background-main); /* #FAF9F7 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
}

.mg-v2-client-card__name {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--mg-color-text-main); /* #2C2C2C */
  margin: 0;
}
```

#### 상태 배지

**클래스**: `mg-v2-status-badge`

```css
.mg-v2-status-badge {
  height: 28px;
  padding: 4px 12px;
  border-radius: 8px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

/* 상태별 색상 */
.mg-v2-status-badge--active {
  background: var(--mg-v2-color-success-50, #f0fdf4);
  color: var(--mg-v2-color-success-700, #15803d);
}

.mg-v2-status-badge--inactive {
  background: var(--mg-v2-color-secondary-100, #f3f4f6);
  color: var(--mg-v2-color-secondary-700, #374151);
}

.mg-v2-status-badge--pending {
  background: var(--mg-v2-color-warning-50, #fffbeb);
  color: var(--mg-v2-color-warning-700, #b45309);
}

.mg-v2-status-badge--completed {
  background: var(--mg-v2-color-success-100, #d1fae5);
  color: var(--mg-v2-color-success-800, #065f46);
}

.mg-v2-status-badge--suspended {
  background: var(--mg-v2-color-error-50, #fef2f2);
  color: var(--mg-v2-color-error-700, #b91c1c);
}

.mg-v2-status-badge svg {
  width: 14px;
  height: 14px;
}
```

**배지 구조**:
- 아이콘 (lucide-react, 14px) + 상태 텍스트
- 이모지 사용 금지 → lucide-react 아이콘으로 대체

| 상태 | 아이콘 | 텍스트 | 배경 색상 | 텍스트 색상 |
|------|--------|--------|----------|-----------|
| ACTIVE | CheckCircle | 활성 | `--mg-v2-color-success-50` | `--mg-v2-color-success-700` |
| INACTIVE | XCircle | 비활성 | `--mg-v2-color-secondary-100` | `--mg-v2-color-secondary-700` |
| PENDING | Clock | 대기중 | `--mg-v2-color-warning-50` | `--mg-v2-color-warning-700` |
| COMPLETED | CheckCircle2 | 완료 | `--mg-v2-color-success-100` | `--mg-v2-color-success-800` |
| SUSPENDED | PauseCircle | 일시정지 | `--mg-v2-color-error-50` | `--mg-v2-color-error-700` |

### 5.3 카드 본문 (Card Body)

**클래스**: `mg-v2-client-card__body`

```css
.mg-v2-client-card__body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

#### 연락처 정보 블록

**클래스**: `mg-v2-client-info-list`

```css
.mg-v2-client-info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mg-v2-client-info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--mg-color-text-main); /* #2C2C2C */
}

.mg-v2-client-info-item svg {
  width: 16px;
  height: 16px;
  color: var(--mg-color-text-secondary); /* #5C6B61 */
  flex-shrink: 0;
}
```

**정보 항목**:
1. **이메일**: 아이콘 `Mail` + 텍스트
2. **전화번호**: 아이콘 `Phone` + 텍스트
3. **가입일**: 아이콘 `Calendar` + 텍스트 "가입일: YYYY-MM-DD"
4. **패키지**: 아이콘 `Package` + 텍스트 "패키지: {packageName}"
5. **최근 상담일**: 아이콘 `Clock` + 텍스트 "최근 상담: YYYY-MM-DD" (있을 경우만)

#### 회기 현황 블록

**클래스**: `mg-v2-client-session-info`

```css
.mg-v2-client-session-info {
  background: var(--mg-color-background-main); /* #FAF9F7 */
  border: 1px solid var(--mg-color-border-main); /* #D4CFC8 */
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px;
}

.mg-v2-client-session-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--mg-color-text-main); /* #2C2C2C */
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mg-v2-client-session-title svg {
  width: 16px;
  height: 16px;
  color: var(--mg-color-primary-main); /* #3D5246 */
}

.mg-v2-client-session-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.mg-v2-client-session-item {
  text-align: center;
}

.mg-v2-client-session-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--mg-color-text-main); /* #2C2C2C */
  margin-bottom: 4px;
}

.mg-v2-client-session-label {
  font-size: 12px;
  font-weight: 400;
  color: var(--mg-color-text-secondary); /* #5C6B61 */
}

/* 회기별 색상 강조 */
.mg-v2-client-session-value--total {
  color: var(--mg-color-primary-main); /* #3D5246 */
}

.mg-v2-client-session-value--used {
  color: var(--mg-v2-color-success-600, #16a34a);
}

.mg-v2-client-session-value--remaining {
  color: var(--mg-v2-color-warning-600, #d97706);
}
```

**구조**:
- 제목: "회기 현황" + 아이콘 `TrendingUp`
- 3열 그리드:
  1. **총 회기**: 숫자 + "총 회기" 라벨 (색상: 주조)
  2. **사용**: 숫자 + "사용" 라벨 (색상: 성공)
  3. **남은 회기**: 숫자 + "남은 회기" 라벨 (색상: 경고)

#### 위험도 표시 (선택 사항)

향후 위험도 데이터가 추가될 경우를 대비한 설계:

**클래스**: `mg-v2-client-risk-indicator`

```css
.mg-v2-client-risk-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--mg-color-background-main); /* #FAF9F7 */
  border-radius: 8px;
  margin-top: 8px;
}

.mg-v2-client-risk-indicator__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--mg-color-text-secondary); /* #5C6B61 */
}

.mg-v2-client-risk-indicator__badge {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

/* 위험도별 색상 */
.mg-v2-client-risk-indicator__badge--critical {
  background: var(--mg-v2-color-error-600, #dc2626);
  color: white;
}

.mg-v2-client-risk-indicator__badge--high {
  background: var(--mg-v2-color-warning-600, #d97706);
  color: white;
}

.mg-v2-client-risk-indicator__badge--medium {
  background: var(--mg-v2-color-secondary-500, #6b7280);
  color: white;
}

.mg-v2-client-risk-indicator__badge--low {
  background: var(--mg-v2-color-success-600, #16a34a);
  color: white;
}
```

### 5.4 카드 푸터 (Card Footer)

**클래스**: `mg-v2-client-card__footer`

```css
.mg-v2-client-card__footer {
  padding: 16px 24px;
  border-top: 1px solid var(--mg-color-border-main); /* #D4CFC8 */
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: var(--mg-color-background-main); /* #FAF9F7 */
}

.mg-v2-client-view-btn {
  height: 36px;
  padding: 8px 16px;
  background: var(--mg-color-primary-main); /* #3D5246 */
  color: var(--mg-color-background-main); /* #FAF9F7 */
  border: none;
  border-radius: 10px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mg-v2-client-view-btn:hover {
  background: var(--mg-color-primary-light); /* #4A6354 */
}

.mg-v2-client-view-btn:disabled {
  background: var(--mg-v2-color-secondary-300, #d1d5db);
  color: var(--mg-v2-color-secondary-500, #6b7280);
  cursor: not-allowed;
}

.mg-v2-client-view-btn svg {
  width: 16px;
  height: 16px;
}
```

**버튼**:
- "상세보기" 버튼: 아이콘 `Eye` + 텍스트
- 클릭 시: 내담자 상세 정보 모달 열기

---

## 6. 빈 상태 (Empty State)

### 6.1 조건
- 내담자가 없을 때 (전체 목록 비어있음)
- 필터링 결과가 없을 때

### 6.2 스타일

**클래스**: `client-list-empty-state`

```css
.client-list-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.client-list-empty-state svg {
  width: 64px;
  height: 64px;
  color: var(--mg-v2-color-text-tertiary, #9ca3af);
  margin-bottom: 16px;
}

.client-list-empty-state__title {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--mg-color-text-main); /* #2C2C2C */
  margin-bottom: 8px;
}

.client-list-empty-state__description {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--mg-color-text-secondary); /* #5C6B61 */
  margin-bottom: 24px;
}

.client-list-empty-state__action {
  /* 버튼 스타일 재사용 */
}
```

**구조**:
- 아이콘: `Users` (lucide-react, 64px)
- 제목: "연계된 내담자가 없습니다" 또는 "{상태} 상태의 내담자가 없습니다"
- 설명: "아직 나와 연계된 내담자가 없습니다." 또는 "다른 상태를 선택하거나 검색어를 변경해보세요."
- 버튼: "전체 상태 보기" (필터링 결과 없을 때만)

---

## 7. 인터랙션

### 7.1 필터 배지 클릭
- **동작**: 해당 상태로 필터링
- **시각적 피드백**: 활성 배지 배경·텍스트 색상 변경
- **URL 업데이트**: `/consultant/clients?status={status}` (선택 사항)

### 7.2 검색 입력
- **동작**: 입력 시 실시간 필터링 (디바운스 300ms 권장)
- **시각적 피드백**: focus 시 테두리 색상 변경 + 그림자

### 7.3 카드 호버
- **동작**: 카드 전체 호버 시 테두리·그림자 강조
- **커서**: pointer

### 7.4 상세보기 버튼 클릭
- **동작**: 내담자 상세 정보 모달 열기 + URL 업데이트 `/consultant/clients/{clientId}`
- **모달**: `ClientDetailModal` 컴포넌트 사용 (기존 유지)

---

## 8. 반응형 레이아웃

### 8.1 브레이크포인트 요약

| 브레이크포인트 | 그리드 열 | 검색·필터 | 카드 패딩 | 비고 |
|--------------|----------|----------|----------|------|
| 모바일 (375px~767px) | 1열 | 세로 스택 | 16px | 터치 영역 44px 이상 |
| 태블릿 (768px~1279px) | 2열 | 세로 스택 | 20px | 필터 배지 2줄 가능 |
| 데스크톱 (1280px~) | 3열 | 좌우 배치 | 24px | 기본 레이아웃 |

### 8.2 모바일 스타일

```css
@media (max-width: 767px) {
  .consultant-client-list-container {
    padding: 16px;
  }
  
  .client-list-controls {
    flex-direction: column;
    gap: 12px;
  }
  
  .client-search-input-wrapper {
    max-width: 100%;
  }
  
  .client-filter-badges {
    gap: 6px;
  }
  
  .mg-v2-filter-badge {
    height: 32px;
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .mg-v2-client-card__header {
    padding: 16px;
  }
  
  .mg-v2-client-card__body {
    padding: 16px;
  }
  
  .mg-v2-client-card__footer {
    padding: 12px 16px;
  }
  
  .mg-v2-client-session-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .mg-v2-client-session-value {
    font-size: 18px;
  }
}
```

---

## 9. 디자인 토큰 매핑

### 9.1 색상 토큰

| 용도 | 토큰명 | 색상 (참고) |
|------|--------|-----------|
| 메인 배경 | `var(--mg-color-background-main)` | #FAF9F7 |
| 카드 배경 | `var(--mg-color-surface-main)` | #F5F3EF |
| 주조 (Primary) | `var(--mg-color-primary-main)` | #3D5246 |
| 주조 밝음 | `var(--mg-color-primary-light)` | #4A6354 |
| 보조 (Secondary) | `var(--mg-color-secondary-main)` | #6B7F72 |
| 포인트 (Accent) | `var(--mg-color-accent-main)` | #8B7355 |
| 본문 텍스트 | `var(--mg-color-text-main)` | #2C2C2C |
| 보조 텍스트 | `var(--mg-color-text-secondary)` | #5C6B61 |
| 테두리 | `var(--mg-color-border-main)` | #D4CFC8 |
| 성공 (Success) | `var(--mg-v2-color-success-600)` | #16a34a |
| 경고 (Warning) | `var(--mg-v2-color-warning-600)` | #d97706 |
| 에러 (Error) | `var(--mg-v2-color-error-600)` | #dc2626 |

### 9.2 간격 토큰

| 용도 | 토큰명 | 값 |
|------|--------|-----|
| 컨테이너 패딩 | `var(--mg-v2-spacing-xl)` | 24px |
| 섹션 간격 | `var(--mg-v2-spacing-xl)` | 24px |
| 카드 패딩 | `var(--mg-v2-spacing-lg)` | 20px (데스크톱), 16px (모바일) |
| 요소 간 간격 | `var(--mg-v2-spacing-md)` | 16px |
| 그리드 gap | - | 20px |
| 버튼 간격 | - | 12px |

### 9.3 타이포그래피 토큰

| 용도 | 폰트 | 크기 | 굵기 | 색상 토큰 |
|------|------|------|------|----------|
| 페이지 제목 | Noto Sans KR | 24px | 600 | `var(--mg-color-text-main)` |
| 카드 제목(이름) | Noto Sans KR | 18px | 600 | `var(--mg-color-text-main)` |
| 섹션 제목 | Noto Sans KR | 14px | 600 | `var(--mg-color-text-main)` |
| 본문 텍스트 | Noto Sans KR | 14px | 400 | `var(--mg-color-text-main)` |
| 라벨/캡션 | Noto Sans KR | 12px | 400 | `var(--mg-color-text-secondary)` |
| 회기 숫자 | Noto Sans KR | 20px | 600 | 상태별 색상 |
| 배지 텍스트 | Noto Sans KR | 12px | 600 | 배지별 색상 |

### 9.4 radius 토큰

| 용도 | 값 |
|------|-----|
| 카드 | 16px |
| 버튼 | 10px |
| 배지 | 8px |
| 악센트 바 | 2px |
| 입력 필드 | 10px |
| 회기 블록 | 12px |

---

## 10. 컴포넌트 구조 설계

### 10.1 컴포넌트 계층 (아토믹 디자인)

```
Pages (페이지)
└── ConsultantClientList (상담사 내담자 목록 페이지)

Templates (템플릿)
└── AdminCommonLayout (기존 레이아웃 재사용)

Organisms (유기체)
├── ClientListHeader (페이지 헤더: 제목·설명·안내 배너)
├── ClientListControls (검색·필터 영역)
└── ClientCardGrid (내담자 카드 그리드)

Molecules (분자)
├── FilterBadge (필터 배지: 클릭 가능한 상태 필터)
├── ClientCard (내담자 카드: 정보 블록 + 액션 버튼)
├── ClientSessionInfo (회기 현황 블록)
└── ClientInfoItem (연락처 정보 항목)

Atoms (원자)
├── Avatar (아바타)
├── StatusBadge (상태 배지)
├── Button (버튼)
├── Input (검색 입력)
└── Icon (아이콘)
```

### 10.2 컴포넌트 파일 구조

```
frontend/src/components/consultant/
├── ConsultantClientList.js (기존 파일 수정)
├── ClientDetailModal.js (기존 유지)
└── molecules/
    ├── FilterBadge.js (신규)
    ├── ClientCard.js (신규)
    ├── ClientSessionInfo.js (신규)
    └── ClientInfoItem.js (신규, 선택 사항)
```

### 10.3 Props 인터페이스

#### FilterBadge

```typescript
interface FilterBadgeProps {
  label: string; // 배지 텍스트 (예: "활성")
  value: string; // 필터 값 (예: "ACTIVE")
  count: number; // 해당 상태 내담자 수
  icon: React.ComponentType; // lucide-react 아이콘
  isActive: boolean; // 활성 상태 여부
  onClick: (value: string) => void; // 클릭 핸들러
  activeColor?: string; // 활성 시 배경 색상 (선택)
}
```

#### ClientCard

```typescript
interface ClientCardProps {
  client: {
    id: number;
    clientId: number;
    name: string;
    email: string;
    phone: string;
    status: string;
    createdAt: string;
    profileImage?: string;
    remainingSessions: number;
    totalSessions: number;
    usedSessions: number;
    packageName: string;
    packagePrice?: number;
    lastConsultationDate?: string; // 최근 상담일 (선택)
    riskLevel?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; // 위험도 (선택)
  };
  onViewDetails: (clientId: number) => void; // 상세보기 클릭
}
```

#### ClientSessionInfo

```typescript
interface ClientSessionInfoProps {
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
}
```

---

## 11. 인터랙션 상세

### 11.1 필터링 로직

```javascript
// 상태 필터
const [activeFilter, setActiveFilter] = useState('ALL');

// 필터 배지 클릭
const handleFilterClick = (filterValue) => {
  setActiveFilter(filterValue);
};

// 필터링된 내담자 목록
const filteredClients = useMemo(() => {
  let result = clients;
  
  // 검색어 필터
  if (searchTerm) {
    result = result.filter(client => 
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm)
    );
  }
  
  // 상태 필터
  if (activeFilter !== 'ALL') {
    result = result.filter(client => client.status === activeFilter);
  }
  
  return result;
}, [clients, searchTerm, activeFilter]);
```

### 11.2 카운트 계산

```javascript
// 상태별 카운트
const statusCounts = useMemo(() => {
  return {
    ALL: clients.length,
    ACTIVE: clients.filter(c => c.status === 'ACTIVE').length,
    INACTIVE: clients.filter(c => c.status === 'INACTIVE').length,
    PENDING: clients.filter(c => c.status === 'PENDING').length,
    COMPLETED: clients.filter(c => c.status === 'COMPLETED').length,
    SUSPENDED: clients.filter(c => c.status === 'SUSPENDED').length
  };
}, [clients]);
```

---

## 12. 접근성 (Accessibility)

### 12.1 ARIA 속성

```jsx
{/* 필터 배지 */}
<button
  role="button"
  aria-label={`${label} 상태 필터 (${count}명)`}
  aria-pressed={isActive}
  className={`mg-v2-filter-badge ${isActive ? 'mg-v2-filter-badge--active' : ''}`}
>
  {/* 내용 */}
</button>

{/* 카드 */}
<div
  role="article"
  aria-label={`${client.name} 내담자 정보`}
  className="mg-v2-client-card"
>
  {/* 내용 */}
</div>

{/* 빈 상태 */}
<div role="status" aria-live="polite" className="client-list-empty-state">
  {/* 내용 */}
</div>
```

### 12.2 키보드 내비게이션

- **Tab**: 필터 배지 → 검색 입력 → 카드 → 상세보기 버튼 순서로 이동
- **Enter/Space**: 필터 배지·버튼 클릭
- **Escape**: 검색 입력 초기화 (선택 사항)

---

## 13. 로딩 및 에러 상태

### 13.1 로딩 상태

**Skeleton UI** (선택 사항):

```css
.client-card-skeleton {
  background: var(--mg-color-surface-main); /* #F5F3EF */
  border: 1px solid var(--mg-color-border-main); /* #D4CFC8 */
  border-radius: 16px;
  padding: 24px;
  height: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-line {
  background: linear-gradient(
    90deg,
    var(--mg-color-border-main) 25%,
    var(--mg-color-background-main) 50%,
    var(--mg-color-border-main) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-line--header {
  height: 48px;
  width: 100%;
}

.skeleton-line--text {
  height: 16px;
  width: 80%;
}

.skeleton-line--button {
  height: 36px;
  width: 120px;
  margin-top: auto;
}
```

**또는 UnifiedLoading 사용**:

```jsx
{loading && (
  <UnifiedLoading type="inline" text="내담자 목록을 불러오는 중..." />
)}
```

### 13.2 에러 상태

**클래스**: `client-list-error-state`

```css
.client-list-error-state {
  background: var(--mg-v2-color-error-50, #fef2f2);
  border: 1px solid var(--mg-v2-color-error-200, #fecaca);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.client-list-error-state svg {
  width: 48px;
  height: 48px;
  color: var(--mg-v2-color-error-600, #dc2626);
  margin-bottom: 16px;
}

.client-list-error-state__message {
  font-size: 16px;
  font-weight: 500;
  color: var(--mg-v2-color-error-700, #b91c1c);
  margin-bottom: 16px;
}

.client-list-error-state__action {
  /* 버튼 스타일 재사용 */
}
```

**구조**:
- 아이콘: `AlertTriangle` (lucide-react, 48px)
- 메시지: "내담자 목록을 불러오는 중 오류가 발생했습니다."
- 버튼: "다시 시도" (클래스 `mg-v2-btn-outline`)

---

## 14. 완료 체크리스트

### 14.1 펜슬 가이드 준수

- [x] **단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen`의 컴포넌트·토큰만 사용
- [x] **색상**: `var(--mg-color-*)`, `var(--mg-v2-color-*)` 토큰 명시, 하드코딩 없음
- [x] **레이아웃**: 섹션 블록 구조 (배경·테두리·radius·좌측 악센트 바)
- [x] **타이포**: Noto Sans KR, 제목/본문/라벨 크기·색상 일관성
- [x] **반응형**: 모바일~데스크톱 브레이크포인트 고려 (375px~1280px)
- [x] **토큰 명시**: 스펙에 `var(--mg-*)` 클래스명 명시
- [x] **재사용**: 기존 `mg-v2-btn`, `mg-v2-badge`, `mg-v2-alert` 스타일 재사용

### 14.2 사용자 관점 (§0.4)

- [x] **사용성**: 필터 배지 상단 배치, 검색 입력 즉시 접근 가능
- [x] **정보 노출**: 내담자명·연락처·상태·회기 현황·패키지 정보 카드에 표시
- [x] **레이아웃**: 상단 검색·필터 → 본문 그리드 카드 → 각 카드 정보 블록·액션 버튼
- [x] **민감 정보**: 연락처 기본 노출, 향후 마스킹 옵션 고려
- [x] **1클릭 액션**: 상세보기 버튼으로 모달 열기

### 14.3 기술 표준 준수

- [x] **디자인 토큰**: `unified-design-tokens.css` 사용
- [x] **아토믹 디자인**: Atoms → Molecules → Organisms 계층
- [x] **mg-v2-* 클래스**: 일관된 클래스명 규칙
- [x] **lucide-react 아이콘**: 이모지 사용 금지
- [x] **셀렉트 박스 금지**: 배지 형태 필터링 UI
- [x] **반응형 그리드**: 데스크톱 3열, 태블릿 2열, 모바일 1열
- [x] **접근성**: ARIA 속성, 키보드 내비게이션

---

## 15. 구현 가이드 (core-coder 전달용)

### 15.1 구현 순서

1. **FilterBadge 컴포넌트 생성** (`frontend/src/components/consultant/molecules/FilterBadge.js`)
   - Props: label, value, count, icon, isActive, onClick, activeColor
   - 클래스: `mg-v2-filter-badge`, `mg-v2-filter-badge--active`
   - lucide-react 아이콘 사용

2. **ClientCard 컴포넌트 생성** (`frontend/src/components/consultant/molecules/ClientCard.js`)
   - Props: client, onViewDetails
   - 클래스: `mg-v2-client-card`, `mg-v2-client-card__header`, `mg-v2-client-card__body`, `mg-v2-client-card__footer`
   - Avatar 컴포넌트 재사용
   - StatusBadge 컴포넌트 재사용 또는 신규 생성

3. **ClientSessionInfo 컴포넌트 생성** (`frontend/src/components/consultant/molecules/ClientSessionInfo.js`)
   - Props: totalSessions, usedSessions, remainingSessions
   - 클래스: `mg-v2-client-session-info`, `mg-v2-client-session-grid`, `mg-v2-client-session-item`

4. **ConsultantClientList.js 수정**
   - 기존 셀렉트 박스 제거 → FilterBadge 배열로 교체
   - 기존 카드 구조 → ClientCard 컴포넌트로 교체
   - 검색 입력 스타일 업데이트 (lucide-react Search 아이콘 추가)
   - 필터링 로직 업데이트 (activeFilter 상태 추가)
   - 상태별 카운트 계산 로직 추가

5. **CSS 작성** (`frontend/src/components/consultant/ConsultantClientList.css` 신규 또는 기존 수정)
   - 위 CSS 스펙 그대로 적용
   - `var(--mg-*)` 토큰 사용
   - 반응형 미디어 쿼리 추가

### 15.2 주의사항

- **이모지 제거**: 기존 코드의 모든 이모지(`🟢`, `🔴`, `⏳`, `✅`, `⏸️` 등)를 lucide-react 아이콘으로 교체
- **셀렉트 박스 제거**: `<select>` 태그를 FilterBadge 배열로 교체
- **하드코딩 색상 제거**: 모든 색상을 `var(--mg-*)` 토큰으로 교체
- **디자인 토큰 사용**: `unified-design-tokens.css`에 정의된 토큰만 사용
- **아토믹 디자인 준수**: 컴포넌트를 Atoms → Molecules → Organisms 계층으로 분리
- **UnifiedModal 사용**: 기존 `ClientDetailModal`이 UnifiedModal을 사용하는지 확인, 아니면 수정

### 15.3 API 연동 (기존 유지)

- **엔드포인트**: `GET /api/v1/admin/mappings/consultant/{consultantId}/clients`
- **응답 구조**: `{ mappings: [...], count: N }`
- **필터링**: 프론트엔드에서 처리 (상태·검색어)
- **정렬**: 최신순 (assignedAt 또는 createdAt 기준)

---

## 16. 시각적 예시 (Wireframe)

### 16.1 필터 배지 영역

```
┌─────────────────────────────────────────────────────────────┐
│ 상태 필터:                                                   │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ 전체(15)│ │ 활성(8) │ │비활성(3)│ │대기중(2)│ │ 완료(1) ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
│ ┌─────────┐                                                 │
│ │일시정지 │                                                 │
│ │  (1)    │                                                 │
│ └─────────┘                                                 │
└─────────────────────────────────────────────────────────────┘
```

- 활성 배지: 주조 색상 배경 (#3D5246) + 흰색 텍스트
- 비활성 배지: 밝은 배경 (#F5F3EF) + 어두운 텍스트 (#2C2C2C)

### 16.2 내담자 카드

```
┌─────────────────────────────────────────────────────────────┐
│ ┃ [아바타]  김OO                            [활성 배지]     │
├─────────────────────────────────────────────────────────────┤
│   📧 kim@example.com                                        │
│   📞 010-1234-5678                                          │
│   📅 가입일: 2025-12-01                                     │
│   📦 패키지: 기본 상담 패키지 (10회)                         │
│   🕒 최근 상담: 2026-03-05                                  │
│                                                             │
│   ┌───────────────────────────────────────────────────────┐ │
│   │ 회기 현황                                             │ │
│   │ ┌─────────┐ ┌─────────┐ ┌─────────┐                 │ │
│   │ │   10회  │ │   5회   │ │   5회   │                 │ │
│   │ │ 총 회기 │ │  사용   │ │  남은   │                 │ │
│   │ └─────────┘ └─────────┘ └─────────┘                 │ │
│   └───────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                                        [👁️ 상세보기 버튼]   │
└─────────────────────────────────────────────────────────────┘
```

- 좌측 악센트 바: 주조 색상 (#3D5246), 4px 폭
- 아이콘: lucide-react로 교체 (Mail, Phone, Calendar, Package, Clock, TrendingUp, Eye)
- 회기 현황: 3열 그리드, 숫자 강조 (20px, 600), 라벨 보조 텍스트 (12px, 400)

---

## 17. 디자인 검증 체크리스트

### 17.1 펜슬 가이드 (PENCIL_DESIGN_GUIDE.md)

- [x] 색상: 펜슬 팔레트 또는 `var(--mg-*)` 토큰만 사용
- [x] 레이아웃: 섹션 블록 구조 (배경·테두리·radius·좌측 악센트 바)
- [x] 타이포: Noto Sans KR, 제목/본문/라벨 크기·색상 일관성
- [x] 반응형: 모바일~데스크톱 브레이크포인트 검토 (375px~1280px)
- [x] 토큰 명시: 스펙에 `var(--mg-*)` 클래스명 명시
- [x] 재사용: 기존 `mg-v2-btn`, `mg-v2-badge` 컴포넌트 재사용

### 17.2 사용자 관점 (§0.4)

- [x] 사용성: 필터 배지 상단 배치, 자주 쓰는 필터 우선 노출
- [x] 정보 노출: 내담자명·연락처·상태·회기 현황·패키지 정보 카드에 표시
- [x] 레이아웃: 상단 검색·필터 → 본문 그리드 카드
- [x] 민감 정보: 연락처 기본 노출, 향후 마스킹 옵션 고려
- [x] 1클릭 액션: 상세보기 버튼으로 모달 열기

### 17.3 기술 표준 준수

- [x] 디자인 토큰: `unified-design-tokens.css` 사용
- [x] 아토믹 디자인: Atoms → Molecules → Organisms 계층
- [x] mg-v2-* 클래스: 일관된 클래스명 규칙
- [x] lucide-react 아이콘: 이모지 사용 금지
- [x] 셀렉트 박스 금지: 배지 형태 필터링 UI
- [x] 반응형 그리드: 데스크톱 3열, 태블릿 2열, 모바일 1열
- [x] 접근성: ARIA 속성, 키보드 내비게이션

---

## 18. 참조 문서

- `docs/design-system/PENCIL_DESIGN_GUIDE.md` — 펜슬 디자인 가이드 (필수 숙지)
- `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` — 반응형 레이아웃 상세
- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md` — 아토믹 디자인 패턴
- `docs/design-system/v2/CONSULTANT_DASHBOARD_PHASE1_DESIGN_SPEC.md` — Phase 1 디자인 스펙 (배지·버튼·카드 패턴 참조)
- `docs/design-system/v2/CONSULTANT_DASHBOARD_PHASE1_CSS_SPEC.md` — Phase 1 CSS 스펙 (버튼·배지 스타일 참조)
- `frontend/src/components/consultant/ConsultantClientList.js` — 기존 컴포넌트
- `frontend/src/styles/unified-design-tokens.css` — 디자인 토큰 정의

---

## 19. 다음 단계

1. **core-coder에게 전달**: 본 문서를 handoff하여 구현 착수
2. **컴포넌트 분리**: FilterBadge, ClientCard, ClientSessionInfo 컴포넌트 생성
3. **기존 코드 수정**: ConsultantClientList.js에서 셀렉트 박스·이모지 제거
4. **CSS 작성**: 위 CSS 스펙 그대로 적용
5. **디자인 검증**: 구현 후 어드민 대시보드 샘플과 비주얼 일관성 확인
6. **사용자 테스트**: 상담사 피드백 수집 후 개선

---

**설계 완료일**: 2026-03-09  
**설계자**: core-designer  
**다음 단계**: core-coder에게 전달 → 구현
