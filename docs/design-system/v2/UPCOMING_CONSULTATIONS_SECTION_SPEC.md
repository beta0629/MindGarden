# 다가오는 상담 섹션 — 화면설계서

**작성일**: 2026-03-09  
**대상 화면**: 상담사 대시보드 V2 (`ConsultantDashboardV2.js`)  
**담당**: core-designer  
**구현**: core-coder

---

## 1. 개요

### 1.1 목적
상담사가 오늘 이후 예정된 상담 일정을 빠르게 확인하고, 가까운 순서대로 준비할 수 있도록 지원합니다.

### 1.2 사용자 시나리오
- **누가**: 상담사(CONSULTANT 역할)
- **언제**: 대시보드 접속 시
- **무엇을**: 향후 7일 이내 예정된 상담 일정 확인
- **왜**: 다가오는 상담 준비, 일정 확인, 내담자 정보 사전 파악
- **어떻게**: 대시보드 메인 그리드 내 "다가오는 상담" 카드 확인 → 클릭 시 상세 정보 또는 상담일지 작성 화면 이동

### 1.3 정보 노출 범위
- **노출 정보**: 날짜/시간, 내담자명, 상담 유형, 회기 수, 상태(확정/대기)
- **역할별 노출**: 상담사는 자신의 상담만 조회 (백엔드 TenantContextHolder 적용)
- **비노출 항목**: 내담자 개인정보(주소, 연락처 등), 상담 내용, 결제 정보
- **표시 기간**: 오늘 이후 ~ 향후 7일
- **최대 표시 개수**: 5개 (전체보기 링크 제공)

---

## 2. 레이아웃 구조

### 2.1 배치 위치
- **위치**: 대시보드 메인 그리드(`consultant-main-grid`) 내
- **순서**: 웰컴 섹션 → Hero Area(통계 카드 4개) → Main Content Grid
  - Main Content Grid 내 배치: **"최근 일정(오늘·어제)"** 카드 옆 또는 아래
  - 3열 그리드 구조에서 두 번째 또는 네 번째 위치 권장

### 2.2 블록 구조
```
┌─────────────────────────────────────────────────────────────┐
│ 웰컴 섹션 (dashboard-welcome-section)                       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Hero Area: 통계 카드 4개 (consultant-hero-grid)             │
└─────────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────┬──────────────────────┐
│ 최근 일정        │ 다가오는 상담    │ 최근 알림            │
│ (오늘·어제)      │ (신규)           │                      │
└──────────────────┴──────────────────┴──────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 주간 상담 현황 (전체 너비)                                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 반응형 레이아웃
| 브레이크포인트 | 그리드 열 | 비고 |
|----------------|-----------|------|
| 데스크톱 (1280px~) | 3열 | 기본 레이아웃 |
| 태블릿 (768px~1024px) | 2열 | "다가오는 상담"이 두 번째 행 첫 번째 열 |
| 모바일 (~768px) | 1열 | 세로 스택, 터치 영역 44px 이상 |

---

## 3. 컴포넌트 설계

### 3.1 카드 컨테이너
- **클래스명**: `dashboard-card` (기존 스타일 재사용)
- **배경**: `var(--mg-v2-color-surface, #ffffff)`
- **테두리**: `1px solid var(--mg-v2-color-border, #e5e7eb)`
- **모서리**: `var(--mg-v2-radius-lg, 12px)`
- **그림자**: `var(--mg-v2-shadow-sm, 0 1px 2px rgba(0,0,0,0.05))`

### 3.2 카드 헤더
- **클래스명**: `card-header`
- **구조**: 좌측 제목 + 우측 "전체보기" 버튼
- **제목**: 
  - 아이콘: `Calendar` (lucide-react, 18px)
  - 텍스트: "다가오는 상담"
  - 폰트: `var(--mg-v2-font-size-lg, 16px)`, `var(--mg-v2-font-weight-semibold, 600)`
  - 색상: `var(--mg-v2-color-text-primary, #111827)`
- **전체보기 버튼**:
  - 클래스: `mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm`
  - 텍스트: "전체보기" + `ChevronRight` 아이콘 (16px)
  - 클릭 시: `/consultant/schedule` 페이지로 이동

### 3.3 카드 바디
- **클래스명**: `card-body`
- **패딩**: `var(--mg-v2-spacing-lg, 16px)`
- **내용**: 상담 일정 목록 또는 빈 상태

---

## 4. 상담 일정 목록 (Upcoming Schedule List)

### 4.1 리스트 컨테이너
- **클래스명**: `upcoming-schedule-list` (신규 정의 필요)
- **구조**: 세로 스택, `gap: var(--mg-v2-spacing-md, 12px)`
- **최대 표시**: 5개 항목

### 4.2 일정 항목 (Upcoming Schedule Item)
기존 `schedule-item` 스타일을 재사용하되, 추가 정보(회기 수, 날짜 강조) 표시

#### 구조
```
┌─────────────────────────────────────────────────────────────┐
│ [날짜/시간]  [내담자명]              [상태 배지]            │
│              [상담 유형 · 회기 수]                          │
└─────────────────────────────────────────────────────────────┘
```

#### 레이아웃
- **Flexbox**: `display: flex`, `align-items: flex-start`, `gap: var(--mg-v2-spacing-md, 12px)`
- **배경**: `var(--mg-v2-color-background, #f9fafb)`
- **테두리**: `1px solid var(--mg-v2-color-border-light, #f3f4f6)`
- **모서리**: `var(--mg-v2-radius-md, 8px)`
- **패딩**: `var(--mg-v2-spacing-md, 12px)`

#### 날짜/시간 영역
- **클래스명**: `upcoming-schedule-date`
- **구조**: 세로 스택
  - 첫 줄: 날짜 (예: "03/12")
  - 둘째 줄: 요일 (예: "수")
  - 셋째 줄: 시간 (예: "14:00")
- **스타일**:
  - 날짜: `font-size: var(--mg-v2-font-size-md, 15px)`, `font-weight: var(--mg-v2-font-weight-semibold, 600)`, `color: var(--mg-v2-color-primary-600, #2563eb)`
  - 요일: `font-size: var(--mg-v2-font-size-xs, 12px)`, `color: var(--mg-v2-color-text-tertiary, #9ca3af)`
  - 시간: `font-size: var(--mg-v2-font-size-sm, 14px)`, `color: var(--mg-v2-color-text-secondary, #6b7280)`
- **최소 너비**: `70px`

#### 상세 정보 영역
- **클래스명**: `upcoming-schedule-details`
- **Flex**: `flex: 1`
- **구조**:
  - 첫 줄: 내담자명
    - 폰트: `var(--mg-v2-font-size-md, 15px)`, `var(--mg-v2-font-weight-medium, 500)`
    - 색상: `var(--mg-v2-color-text-primary, #111827)`
  - 둘째 줄: 상담 유형 + 회기 수
    - 폰트: `var(--mg-v2-font-size-xs, 12px)`
    - 색상: `var(--mg-v2-color-text-secondary, #6b7280)`
    - 아이콘: `Users` (12px) + 텍스트 (예: "개인상담 · 3회기")

#### 상태 배지
- **클래스명**: `schedule-status` (기존 재사용)
- **스타일**:
  - 확정: `status-confirmed` (배경: `var(--mg-v2-color-success-50)`, 텍스트: `var(--mg-v2-color-success-700)`)
  - 대기: `status-pending` (배경: `var(--mg-v2-color-warning-50)`, 텍스트: `var(--mg-v2-color-warning-700)`)
- **패딩**: `2px 8px`
- **모서리**: `border-radius: 9999px` (pill 형태)

#### 강조 영역 (첫 번째 항목)
가장 가까운 상담(첫 번째 항목)을 시각적으로 강조합니다.

- **클래스명**: `upcoming-schedule-item--highlighted`
- **배경**: `var(--mg-v2-color-primary-50, #eff6ff)`
- **테두리**: `2px solid var(--mg-v2-color-primary-200, #bfdbfe)`
- **좌측 악센트 바**:
  - 폭: `4px`
  - 색상: `var(--mg-v2-color-primary-600, #2563eb)` 또는 `var(--mg-color-primary-main, #3D5246)` (B0KlA 스타일 적용 시)
  - 위치: 카드 왼쪽 끝, `border-radius: 2px`

---

## 5. 빈 상태 (Empty State)

### 5.1 조건
- 향후 7일 이내 예정된 상담이 없을 때

### 5.2 스타일
- **클래스명**: `empty-state` (기존 재사용)
- **구조**: 세로 중앙 정렬
  - 아이콘: `Calendar` (32px, `color: var(--mg-v2-color-text-tertiary, #9ca3af)`)
  - 텍스트: "다가오는 상담이 없습니다."
  - 폰트: `var(--mg-v2-font-size-sm, 14px)`, `color: var(--mg-v2-color-text-secondary, #6b7280)`

---

## 6. 인터랙션

### 6.1 호버 효과
- **항목 호버**: `background-color: var(--mg-v2-color-background-hover, rgba(0,0,0,0.02))`
- **커서**: `cursor: pointer`

### 6.2 클릭 동작
- **항목 클릭**: 상담 상세 정보 모달 또는 상담일지 작성 화면으로 이동
  - 라우팅: `/consultant/consultation-records?scheduleId={scheduleId}`
- **전체보기 버튼**: `/consultant/schedule` 페이지로 이동

---

## 7. 디자인 토큰 요약

| 요소 | 토큰/값 |
|------|---------|
| 카드 배경 | `var(--mg-v2-color-surface, #ffffff)` |
| 카드 테두리 | `var(--mg-v2-color-border, #e5e7eb)` |
| 카드 모서리 | `var(--mg-v2-radius-lg, 12px)` |
| 카드 그림자 | `var(--mg-v2-shadow-sm)` |
| 항목 배경 | `var(--mg-v2-color-background, #f9fafb)` |
| 항목 테두리 | `var(--mg-v2-color-border-light, #f3f4f6)` |
| 항목 모서리 | `var(--mg-v2-radius-md, 8px)` |
| 강조 배경 | `var(--mg-v2-color-primary-50, #eff6ff)` |
| 강조 테두리 | `var(--mg-v2-color-primary-200, #bfdbfe)` |
| 악센트 바 | `var(--mg-v2-color-primary-600, #2563eb)` 또는 `var(--mg-color-primary-main, #3D5246)` |
| 날짜 색상 | `var(--mg-v2-color-primary-600, #2563eb)` |
| 제목 색상 | `var(--mg-v2-color-text-primary, #111827)` |
| 본문 색상 | `var(--mg-v2-color-text-secondary, #6b7280)` |
| 보조 색상 | `var(--mg-v2-color-text-tertiary, #9ca3af)` |
| 확정 배지 배경 | `var(--mg-v2-color-success-50, #f0fdf4)` |
| 확정 배지 텍스트 | `var(--mg-v2-color-success-700, #15803d)` |
| 대기 배지 배경 | `var(--mg-v2-color-warning-50, #fffbeb)` |
| 대기 배지 텍스트 | `var(--mg-v2-color-warning-700, #b45309)` |

---

## 8. 아이콘

| 위치 | 아이콘 | 크기 | 색상 |
|------|--------|------|------|
| 카드 제목 | `Calendar` (lucide-react) | 18px | `var(--mg-v2-color-text-secondary)` |
| 전체보기 버튼 | `ChevronRight` | 16px | 상속 |
| 상담 유형 | `Users` | 12px | 상속 |
| 빈 상태 | `Calendar` | 32px | `var(--mg-v2-color-text-tertiary)` |

---

## 9. 반응형 고려사항

### 9.1 모바일 (375px~768px)
- **그리드**: 1열 세로 스택
- **날짜/시간 영역**: 최소 너비 유지 (70px)
- **터치 영역**: 항목 높이 최소 44px 이상
- **패딩**: 카드 바디 `var(--mg-v2-spacing-md, 12px)`

### 9.2 태블릿 (768px~1024px)
- **그리드**: 2열
- **항목 간격**: `var(--mg-v2-spacing-md, 12px)`

### 9.3 데스크톱 (1280px~)
- **그리드**: 3열
- **최대 너비**: 컨테이너 `max-width: 1440px`

---

## 10. 데이터 연동 (참고)

### 10.1 API 엔드포인트 (예상)
- **엔드포인트**: `/api/v1/consultant/schedules/upcoming`
- **메서드**: `GET`
- **파라미터**:
  - `userId`: 상담사 ID
  - `startDate`: 오늘 날짜 (ISO 8601)
  - `endDate`: 오늘 + 7일 (ISO 8601)
  - `limit`: 5

### 10.2 응답 예시
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "date": "2026-03-12",
      "startTime": "14:00:00",
      "endTime": "15:00:00",
      "clientName": "김OO",
      "consultationType": "개인상담",
      "sessionNumber": 3,
      "status": "CONFIRMED"
    },
    ...
  ]
}
```

### 10.3 데이터 가공
- **날짜 포맷**: `MM/dd` (예: "03/12")
- **요일**: `getDay()` → 한글 요일 매핑 (월, 화, 수, 목, 금, 토, 일)
- **시간 포맷**: `HH:mm` (예: "14:00")
- **정렬**: `startTime` 오름차순 (가까운 순)

---

## 11. 접근성 (Accessibility)

### 11.1 ARIA 속성
- **카드**: `role="region"`, `aria-label="다가오는 상담"`
- **항목**: `role="button"`, `aria-label="[날짜] [시간] [내담자명] [상담 유형] [상태]"`
- **빈 상태**: `role="status"`, `aria-live="polite"`

### 11.2 키보드 내비게이션
- **Tab**: 항목 간 이동
- **Enter/Space**: 항목 클릭 (상세 정보 이동)

---

## 12. 완료 체크리스트

- [ ] **단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen`의 컴포넌트·토큰만 사용
- [ ] **색상**: `var(--mg-v2-*)` 토큰 명시, 하드코딩 없음
- [ ] **레이아웃**: 기존 `dashboard-card`, `card-header`, `card-body` 스타일 재사용
- [ ] **타이포**: Noto Sans KR, 제목/본문/라벨 크기·색상 일관성
- [ ] **반응형**: 모바일~데스크톱 브레이크포인트 고려
- [ ] **아이콘**: lucide-react 사용, 크기·색상 명시
- [ ] **강조 영역**: 첫 번째 항목 좌측 악센트 바 적용
- [ ] **빈 상태**: 아이콘 + 텍스트 중앙 정렬
- [ ] **접근성**: ARIA 속성, 키보드 내비게이션 고려
- [ ] **인터랙션**: 호버·클릭 동작 정의

---

## 13. 참조 문서

- `docs/design-system/PENCIL_DESIGN_GUIDE.md` — 펜슬 디자인 가이드 (필수 숙지)
- `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` — 반응형 레이아웃 상세
- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md` — 아토믹 디자인 패턴
- `frontend/src/components/dashboard-v2/consultant/ConsultantDashboardV2.js` — 기존 대시보드 컴포넌트
- `frontend/src/components/dashboard-v2/consultant/ConsultantDashboard.css` — 기존 스타일
- `frontend/src/styles/unified-design-tokens.css` — 디자인 토큰 정의

---

**설계 완료일**: 2026-03-09  
**설계자**: core-designer  
**다음 단계**: core-coder에게 전달 → 구현
