# 상담사 대시보드 Phase 1 컨텐츠 상세 디자인 설계

**작성일**: 2026-03-09  
**작성자**: Core Designer  
**목적**: Phase 1 컨텐츠 4개(미작성 상담일지 알림, 다음 상담 준비 카드, 긴급 확인 필요 내담자, 빠른 액션 바)의 상세 디자인 설계 및 코더 전달용 handoff 문서

**참조**:
- 기획 분석: `docs/analysis/CONSULTANT_DASHBOARD_CONTENT_ENHANCEMENT_ANALYSIS.md`
- 펜슬 가이드: `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- 어드민 대시보드 샘플: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample
- 기존 대시보드: `frontend/src/components/dashboard-v2/consultant/ConsultantDashboardV2.js`

---

## 0. 전체 레이아웃 구성

### 0.1 배치 우선순위 (사용자 관점)

**상단 (최우선)**:
1. 웰컴 메시지 (기존 유지)
2. **빠른 액션 바** (신규) — 자주 쓰는 동작 1클릭 접근
3. **미작성 상담일지 알림** (신규) — 긴급 액션 필요
4. **다음 상담 준비 카드** (신규) — 오늘/내일 상담 준비

**중단 (주요 통계)**:
5. 주요 통계 카드 4개 (기존 유지)

**하단 (상세 정보)**:
6. **긴급 확인 필요 내담자** (신규) — 위험도·진행도 저하
7. 최근 일정 (기존 유지)
8. 다가오는 상담 (기존 유지)
9. 최근 알림 (기존 유지)
10. 주간 상담 현황 (기존 유지)

### 0.2 그리드 구조

```
┌─────────────────────────────────────────────────────────────┐
│ 웰컴 메시지 (기존)                                            │
├─────────────────────────────────────────────────────────────┤
│ 빠른 액션 바 (신규, 전체 너비)                                 │
├─────────────────────────────────────────────────────────────┤
│ 미작성 상담일지 알림 (신규, 조건부 렌더링)                      │
├─────────────────────────────────────────────────────────────┤
│ 다음 상담 준비 카드 (신규, 조건부 렌더링)                       │
├─────────────────────────────────────────────────────────────┤
│ 주요 통계 카드 4개 (기존)                                      │
├─────────────────────────────────────────────────────────────┤
│ 긴급 확인 필요 내담자 (신규, 조건부 렌더링)                     │
├─────────────────────────────────────────────────────────────┤
│ 최근 일정 | 다가오는 상담 | 최근 알림 (기존)                    │
├─────────────────────────────────────────────────────────────┤
│ 주간 상담 현황 (기존, 전체 너비)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. 빠른 액션 바 (Quick Action Bar)

### 1.1 개요

**목적**: 상담사가 자주 사용하는 동작을 1클릭으로 접근할 수 있도록 상단에 고정 배치  
**위치**: 웰컴 메시지 바로 아래, 전체 너비  
**조건부 렌더링**: 항상 표시 (조건 없음)

### 1.2 레이아웃 구조 (Organism)

**컨테이너**:
- 클래스: `mg-v2-quick-action-bar`
- 배경: `var(--mg-color-surface-main)` (#F5F3EF)
- 테두리: 1px solid `var(--mg-color-border-main)` (#D4CFC8)
- border-radius: 16px
- 패딩: 20px 24px
- margin-bottom: 24px
- display: flex
- justify-content: space-between
- align-items: center
- gap: 16px

**좌측 영역 (제목)**:
- 클래스: `mg-v2-quick-action-bar__title`
- 폰트: Noto Sans KR, 16px, fontWeight 600
- 색상: `var(--mg-color-text-main)` (#2C2C2C)
- 아이콘: Zap (lucide-react), 18px, 색상 `var(--mg-color-accent-main)` (#8B7355)
- display: flex, align-items: center, gap: 8px

**우측 영역 (버튼 그룹)**:
- 클래스: `mg-v2-quick-action-bar__actions`
- display: flex
- gap: 12px
- flex-wrap: wrap (모바일 대응)

### 1.3 버튼 디자인 (Molecule)

**버튼 공통 스타일**:
- 클래스: `mg-v2-btn mg-v2-btn-md`
- height: 40px
- padding: 10px 20px
- border-radius: 10px
- 폰트: Noto Sans KR, 14px, fontWeight 500
- display: flex, align-items: center, gap: 8px
- 아이콘: 16px (lucide-react)
- transition: all 0.2s ease

**주조 버튼 (Primary)** — "상담일지 작성":
- 클래스: `mg-v2-btn-primary`
- 배경: `var(--mg-color-primary-main)` (#3D5246)
- 텍스트: `var(--mg-color-background-main)` (#FAF9F7)
- 아이콘: FileText
- hover: 배경 `var(--mg-color-primary-light)` (#4A6354)

**아웃라인 버튼 (Outline)** — "일정 조회", "내담자 관리", "메시지 확인":
- 클래스: `mg-v2-btn-outline`
- 배경: transparent
- 테두리: 1px solid `var(--mg-color-border-main)` (#D4CFC8)
- 텍스트: `var(--mg-color-text-main)` (#2C2C2C)
- 아이콘: Calendar, Users, MessageSquare
- hover: 배경 `var(--mg-color-surface-main)` (#F5F3EF), 테두리 `var(--mg-color-primary-main)` (#3D5246)

### 1.4 인터랙션

**클릭 동작**:
- "상담일지 작성": `navigate('/consultant/consultation-records?action=create')`
- "일정 조회": `navigate('/consultant/schedule')`
- "내담자 관리": `navigate('/consultant/clients')`
- "메시지 확인": `navigate('/consultant/messages')`

**호버 효과**:
- 배경·테두리 색상 변경 (transition 0.2s)
- 커서: pointer

### 1.5 반응형 브레이크포인트

| 브레이크포인트 | 레이아웃 변경 |
|--------------|-------------|
| 모바일 (375px~) | 버튼 그룹 flex-wrap: wrap, 제목 아래로 이동 (flex-direction: column) |
| 태블릿 (768px~) | 제목·버튼 그룹 좌우 배치 유지, 버튼 2줄로 배치 가능 |
| 데스크톱 (1280px~) | 제목·버튼 그룹 좌우 배치, 버튼 1줄 배치 |

**모바일 스타일**:
```css
@media (max-width: 767px) {
  .mg-v2-quick-action-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .mg-v2-quick-action-bar__actions {
    width: 100%;
    justify-content: flex-start;
  }
  .mg-v2-btn {
    flex: 1 1 auto;
    min-width: 120px;
  }
}
```

### 1.6 시각적 강조 규칙

- **주조 버튼**: 가장 자주 쓰는 동작("상담일지 작성")만 주조 색상 적용
- **아이콘**: 각 버튼의 기능을 직관적으로 표현 (FileText, Calendar, Users, MessageSquare)
- **간격**: 버튼 간 12px gap으로 시각적 분리

---

## 2. 미작성 상담일지 알림 (Incomplete Records Alert)

### 2.1 개요

**목적**: 완료된 상담 중 일지를 작성하지 않은 건수를 알림하고, 바로 작성할 수 있도록 유도  
**위치**: 빠른 액션 바 아래, 전체 너비  
**조건부 렌더링**: 미작성 일지가 1건 이상일 때만 표시

### 2.2 레이아웃 구조 (Organism)

**컨테이너**:
- 클래스: `mg-v2-alert mg-v2-alert--warning`
- 배경: `var(--mg-color-warning-light)` (#FEF3C7) 또는 연한 노란색 계열
- 테두리: 1px solid `var(--mg-color-warning-main)` (#F59E0B)
- 좌측 악센트 바: 4px, `var(--mg-color-warning-main)` (#F59E0B), border-radius 2px
- border-radius: 16px
- 패딩: 20px 24px
- margin-bottom: 24px
- display: flex
- justify-content: space-between
- align-items: center
- gap: 16px

**좌측 영역 (아이콘 + 텍스트)**:
- 클래스: `mg-v2-alert__content`
- display: flex, align-items: center, gap: 12px

**아이콘**:
- 클래스: `mg-v2-alert__icon`
- 아이콘: AlertTriangle (lucide-react), 24px
- 색상: `var(--mg-color-warning-main)` (#F59E0B)

**텍스트**:
- 클래스: `mg-v2-alert__text`
- 제목: "미작성 상담일지 {count}건"
  - 폰트: Noto Sans KR, 16px, fontWeight 600
  - 색상: `var(--mg-color-text-main)` (#2C2C2C)
- 부제: "완료된 상담의 일지를 작성해 주세요."
  - 폰트: Noto Sans KR, 14px, fontWeight 400
  - 색상: `var(--mg-color-text-secondary)` (#5C6B61)
  - margin-top: 4px

**우측 영역 (버튼)**:
- 클래스: `mg-v2-alert__action`
- 버튼: "바로 작성하기"
  - 클래스: `mg-v2-btn mg-v2-btn-primary mg-v2-btn-md`
  - 배경: `var(--mg-color-primary-main)` (#3D5246)
  - 텍스트: `var(--mg-color-background-main)` (#FAF9F7)
  - 아이콘: FileText, 16px
  - height: 40px, padding: 10px 20px, border-radius: 10px

### 2.3 인터랙션

**클릭 동작**:
- "바로 작성하기" 버튼: `navigate('/consultant/consultation-records?filter=incomplete')`
- 또는 미작성 일지 목록 모달 열기 (UnifiedModal 사용)

**호버 효과**:
- 버튼 hover: 배경 `var(--mg-color-primary-light)` (#4A6354)

### 2.4 반응형 브레이크포인트

| 브레이크포인트 | 레이아웃 변경 |
|--------------|-------------|
| 모바일 (375px~) | flex-direction: column, align-items: flex-start, 버튼 전체 너비 |
| 태블릿 (768px~) | 좌우 배치 유지 |
| 데스크톱 (1280px~) | 좌우 배치 유지 |

**모바일 스타일**:
```css
@media (max-width: 767px) {
  .mg-v2-alert {
    flex-direction: column;
    align-items: flex-start;
  }
  .mg-v2-alert__action {
    width: 100%;
  }
  .mg-v2-btn {
    width: 100%;
  }
}
```

### 2.5 시각적 강조 규칙

- **경고 색상**: 노란색 계열 배경 + 좌측 악센트 바로 긴급성 표현
- **아이콘**: AlertTriangle으로 주의 필요 시각화
- **버튼**: 주조 색상으로 즉시 액션 유도

---

## 3. 다음 상담 준비 카드 (Next Consultation Prep Card)

### 3.1 개요

**목적**: 오늘 또는 내일 예정된 다음 상담의 정보를 한눈에 보여주고, 준비 상태를 확인  
**위치**: 미작성 상담일지 알림 아래 (또는 알림 없으면 빠른 액션 바 아래), 전체 너비  
**조건부 렌더링**: 오늘 또는 내일 예정된 상담이 1건 이상일 때만 표시

### 3.2 레이아웃 구조 (Organism)

**컨테이너**:
- 클래스: `mg-v2-next-consultation-card`
- 배경: `var(--mg-color-surface-main)` (#F5F3EF)
- 테두리: 1px solid `var(--mg-color-border-main)` (#D4CFC8)
- 좌측 악센트 바: 4px, `var(--mg-color-primary-main)` (#3D5246), border-radius 2px
- border-radius: 16px
- 패딩: 24px
- margin-bottom: 24px

**헤더 (제목)**:
- 클래스: `mg-v2-next-consultation-card__header`
- display: flex, justify-content: space-between, align-items: center
- margin-bottom: 16px

**제목**:
- 클래스: `mg-v2-next-consultation-card__title`
- 폰트: Noto Sans KR, 16px, fontWeight 600
- 색상: `var(--mg-color-text-main)` (#2C2C2C)
- 아이콘: Calendar (lucide-react), 18px, 색상 `var(--mg-color-primary-main)` (#3D5246)
- display: flex, align-items: center, gap: 8px

**배지 (오늘/내일)**:
- 클래스: `mg-v2-badge mg-v2-badge--primary`
- 배경: `var(--mg-color-primary-main)` (#3D5246)
- 텍스트: `var(--mg-color-background-main)` (#FAF9F7)
- 폰트: Noto Sans KR, 12px, fontWeight 600
- padding: 4px 12px, border-radius: 8px

**본문 (상담 정보)**:
- 클래스: `mg-v2-next-consultation-card__body`
- display: grid
- grid-template-columns: 1fr 1fr 1fr
- gap: 16px

**정보 블록 (Molecule)**:
- 클래스: `mg-v2-info-block`
- display: flex, flex-direction: column, gap: 4px

**라벨**:
- 클래스: `mg-v2-info-block__label`
- 폰트: Noto Sans KR, 12px, fontWeight 400
- 색상: `var(--mg-color-text-secondary)` (#5C6B61)

**값**:
- 클래스: `mg-v2-info-block__value`
- 폰트: Noto Sans KR, 16px, fontWeight 600
- 색상: `var(--mg-color-text-main)` (#2C2C2C)

**정보 항목**:
1. **내담자 이름**: 라벨 "내담자", 값 "{clientName}"
2. **상담 시간**: 라벨 "시간", 값 "{startTime} - {endTime}" (예: "10:00 - 11:00")
3. **회기**: 라벨 "회기", 값 "{sessionNumber}회기" (예: "3회기")

**푸터 (액션 버튼)**:
- 클래스: `mg-v2-next-consultation-card__footer`
- display: flex, justify-content: flex-end, gap: 12px
- margin-top: 16px

**버튼**:
- "이전 일지 보기": 클래스 `mg-v2-btn mg-v2-btn-outline mg-v2-btn-sm`, 아이콘 FileText
- "상세보기": 클래스 `mg-v2-btn mg-v2-btn-primary mg-v2-btn-sm`, 아이콘 ChevronRight

### 3.3 인터랙션

**클릭 동작**:
- "이전 일지 보기": `navigate('/consultant/consultation-records?clientId={clientId}')`
- "상세보기": `navigate('/consultant/consultation-records?scheduleId={scheduleId}')`

**호버 효과**:
- 카드 전체 hover: 테두리 색상 `var(--mg-color-primary-main)` (#3D5246), transition 0.2s
- 버튼 hover: 배경·테두리 색상 변경

### 3.4 반응형 브레이크포인트

| 브레이크포인트 | 레이아웃 변경 |
|--------------|-------------|
| 모바일 (375px~) | 본문 grid-template-columns: 1fr (세로 배치), 버튼 전체 너비 |
| 태블릿 (768px~) | 본문 grid-template-columns: 1fr 1fr (2열) |
| 데스크톱 (1280px~) | 본문 grid-template-columns: 1fr 1fr 1fr (3열) |

**모바일 스타일**:
```css
@media (max-width: 767px) {
  .mg-v2-next-consultation-card__body {
    grid-template-columns: 1fr;
  }
  .mg-v2-next-consultation-card__footer {
    flex-direction: column;
  }
  .mg-v2-btn {
    width: 100%;
  }
}
```

### 3.5 시각적 강조 규칙

- **좌측 악센트 바**: 주조 색상으로 중요 정보 강조
- **배지**: "오늘" 또는 "내일" 표시로 긴급성 시각화
- **정보 블록**: 그리드 레이아웃으로 정보 구조화
- **버튼**: 주조 버튼("상세보기")으로 주요 액션 유도

---

## 4. 긴급 확인 필요 내담자 (Urgent Clients Alert)

### 4.1 개요

**목적**: 위험도가 높거나 진행도가 저하된 내담자를 알림하고, 즉시 확인할 수 있도록 유도  
**위치**: 주요 통계 카드 아래, 전체 너비  
**조건부 렌더링**: 위험도 HIGH/CRITICAL 또는 진행도 저하 내담자가 1명 이상일 때만 표시

### 4.2 레이아웃 구조 (Organism)

**컨테이너**:
- 클래스: `mg-v2-urgent-clients-section`
- 배경: `var(--mg-color-surface-main)` (#F5F3EF)
- 테두리: 1px solid `var(--mg-color-border-main)` (#D4CFC8)
- 좌측 악센트 바: 4px, `var(--mg-color-error-main)` (#EF4444), border-radius 2px
- border-radius: 16px
- 패딩: 24px
- margin-bottom: 24px

**헤더 (제목)**:
- 클래스: `mg-v2-urgent-clients-section__header`
- display: flex, justify-content: space-between, align-items: center
- margin-bottom: 16px

**제목**:
- 클래스: `mg-v2-urgent-clients-section__title`
- 폰트: Noto Sans KR, 16px, fontWeight 600
- 색상: `var(--mg-color-text-main)` (#2C2C2C)
- 아이콘: AlertCircle (lucide-react), 18px, 색상 `var(--mg-color-error-main)` (#EF4444)
- display: flex, align-items: center, gap: 8px

**전체보기 버튼**:
- 클래스: `mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm`
- 텍스트: "전체보기"
- 아이콘: ChevronRight, 16px
- 색상: `var(--mg-color-text-secondary)` (#5C6B61)

**본문 (내담자 목록)**:
- 클래스: `mg-v2-urgent-clients-section__body`
- display: flex, flex-direction: column, gap: 12px

### 4.3 내담자 카드 디자인 (Molecule)

**카드 컨테이너**:
- 클래스: `mg-v2-urgent-client-card`
- 배경: `var(--mg-color-background-main)` (#FAF9F7)
- 테두리: 1px solid `var(--mg-color-border-main)` (#D4CFC8)
- border-radius: 12px
- 패딩: 16px
- display: flex, justify-content: space-between, align-items: center
- gap: 16px
- cursor: pointer
- transition: all 0.2s ease

**좌측 영역 (내담자 정보)**:
- 클래스: `mg-v2-urgent-client-card__info`
- display: flex, flex-direction: column, gap: 8px, flex: 1

**내담자 이름**:
- 클래스: `mg-v2-urgent-client-card__name`
- 폰트: Noto Sans KR, 16px, fontWeight 600
- 색상: `var(--mg-color-text-main)` (#2C2C2C)

**메타 정보**:
- 클래스: `mg-v2-urgent-client-card__meta`
- display: flex, align-items: center, gap: 8px
- 폰트: Noto Sans KR, 14px, fontWeight 400
- 색상: `var(--mg-color-text-secondary)` (#5C6B61)

**메타 항목**:
1. **회기**: "{sessionNumber}회기" (아이콘: Users, 12px)
2. **마지막 상담일**: "{lastConsultationDate}" (아이콘: Calendar, 12px)

**주요 이슈**:
- 클래스: `mg-v2-urgent-client-card__issue`
- 폰트: Noto Sans KR, 14px, fontWeight 400
- 색상: `var(--mg-color-text-secondary)` (#5C6B61)
- 최대 1줄, 말줄임표 (text-overflow: ellipsis)

**우측 영역 (위험도 배지 + 액션 버튼)**:
- 클래스: `mg-v2-urgent-client-card__actions`
- display: flex, align-items: center, gap: 12px

**위험도 배지**:
- 클래스: `mg-v2-badge mg-v2-badge--{level}`
- 배경·색상:
  - CRITICAL: 배경 `var(--mg-color-error-main)` (#EF4444), 텍스트 white
  - HIGH: 배경 `var(--mg-color-warning-main)` (#F59E0B), 텍스트 white
  - MEDIUM: 배경 `var(--mg-color-secondary-main)` (#6B7F72), 텍스트 white
- 폰트: Noto Sans KR, 12px, fontWeight 600
- padding: 4px 12px, border-radius: 8px

**액션 버튼**:
- 클래스: `mg-v2-btn mg-v2-btn-outline mg-v2-btn-sm`
- 텍스트: "상세보기"
- 아이콘: ChevronRight, 16px

### 4.4 인터랙션

**클릭 동작**:
- 카드 전체 클릭: `navigate('/consultant/clients/{clientId}')`
- "상세보기" 버튼: `navigate('/consultant/consultation-records?clientId={clientId}')`
- "전체보기" 버튼: `navigate('/consultant/clients?filter=urgent')`

**호버 효과**:
- 카드 hover: 테두리 색상 `var(--mg-color-error-main)` (#EF4444), 배경 약간 밝게, transition 0.2s
- 버튼 hover: 배경·테두리 색상 변경

### 4.5 반응형 브레이크포인트

| 브레이크포인트 | 레이아웃 변경 |
|--------------|-------------|
| 모바일 (375px~) | 카드 flex-direction: column, align-items: flex-start, 배지·버튼 전체 너비 |
| 태블릿 (768px~) | 좌우 배치 유지 |
| 데스크톱 (1280px~) | 좌우 배치 유지 |

**모바일 스타일**:
```css
@media (max-width: 767px) {
  .mg-v2-urgent-client-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .mg-v2-urgent-client-card__actions {
    width: 100%;
    justify-content: space-between;
  }
}
```

### 4.6 시각적 강조 규칙

- **좌측 악센트 바**: 에러 색상(빨간색)으로 긴급성 강조
- **위험도 배지**: CRITICAL(빨간색), HIGH(노란색), MEDIUM(회색)으로 위험도 시각화
- **아이콘**: AlertCircle으로 주의 필요 시각화
- **민감 정보 최소화**: 이름·회기·주요 이슈 1줄만 노출

---

## 5. 공통 디자인 토큰 정리

### 5.1 색상 토큰

| 용도 | 토큰명 | 색상 (참고) |
|------|--------|------------|
| 메인 배경 | `var(--mg-color-background-main)` | #FAF9F7 |
| 서페이스/카드 | `var(--mg-color-surface-main)` | #F5F3EF |
| 주조 (Primary) | `var(--mg-color-primary-main)` | #3D5246 |
| 주조 밝음 | `var(--mg-color-primary-light)` | #4A6354 |
| 보조 (Secondary) | `var(--mg-color-secondary-main)` | #6B7F72 |
| 포인트 (Accent) | `var(--mg-color-accent-main)` | #8B7355 |
| 본문 텍스트 | `var(--mg-color-text-main)` | #2C2C2C |
| 보조 텍스트 | `var(--mg-color-text-secondary)` | #5C6B61 |
| 테두리 | `var(--mg-color-border-main)` | #D4CFC8 |
| 경고 (Warning) | `var(--mg-color-warning-main)` | #F59E0B |
| 경고 밝음 | `var(--mg-color-warning-light)` | #FEF3C7 |
| 에러 (Error) | `var(--mg-color-error-main)` | #EF4444 |

### 5.2 간격 토큰

| 용도 | 토큰명 | 값 |
|------|--------|-----|
| 섹션 간격 | `var(--mg-spacing-section)` | 24px |
| 카드 패딩 | `var(--mg-spacing-card-padding)` | 24px |
| 요소 간 간격 | `var(--mg-spacing-element-gap)` | 16px |
| 버튼 간격 | `var(--mg-spacing-button-gap)` | 12px |

### 5.3 타이포그래피 토큰

| 용도 | 폰트 | 크기 | 굵기 | 색상 토큰 |
|------|------|------|------|----------|
| 섹션 제목 | Noto Sans KR | 16px | 600 | `var(--mg-color-text-main)` |
| 본문 텍스트 | Noto Sans KR | 14px | 400 | `var(--mg-color-text-main)` |
| 라벨/캡션 | Noto Sans KR | 12px | 400 | `var(--mg-color-text-secondary)` |
| 강조 숫자 | Noto Sans KR | 24px | 600 | `var(--mg-color-text-main)` |
| 버튼 텍스트 | Noto Sans KR | 14px | 500 | 버튼 타입별 |

### 5.4 radius 토큰

| 용도 | 토큰명 | 값 |
|------|--------|-----|
| 카드/섹션 | `var(--mg-radius-card)` | 16px |
| 버튼 | `var(--mg-radius-button)` | 10px |
| 배지 | `var(--mg-radius-badge)` | 8px |
| 악센트 바 | `var(--mg-radius-accent)` | 2px |

---

## 6. 코더 전달용 Handoff 체크리스트

### 6.1 빠른 액션 바

- [ ] 컨테이너 클래스 `mg-v2-quick-action-bar` 생성 (배경·테두리·패딩·radius)
- [ ] 좌측 제목 영역 `mg-v2-quick-action-bar__title` (아이콘 Zap + 텍스트)
- [ ] 우측 버튼 그룹 `mg-v2-quick-action-bar__actions` (flex, gap 12px)
- [ ] 주조 버튼 "상담일지 작성" (클래스 `mg-v2-btn-primary`, 아이콘 FileText)
- [ ] 아웃라인 버튼 3개 (일정·내담자·메시지) (클래스 `mg-v2-btn-outline`)
- [ ] 모바일 반응형 (flex-direction: column, 버튼 flex-wrap)
- [ ] 클릭 이벤트: navigate 연결
- [ ] 호버 효과: transition 0.2s

### 6.2 미작성 상담일지 알림

- [ ] 컨테이너 클래스 `mg-v2-alert mg-v2-alert--warning` (배경·테두리·좌측 악센트 바)
- [ ] 조건부 렌더링: 미작성 일지 count > 0
- [ ] 좌측 아이콘 AlertTriangle + 텍스트 (제목·부제)
- [ ] 우측 버튼 "바로 작성하기" (클래스 `mg-v2-btn-primary`)
- [ ] 모바일 반응형 (flex-direction: column)
- [ ] 클릭 이벤트: navigate 또는 모달 열기
- [ ] API 연동: `GET /api/v1/consultants/{id}/incomplete-records`

### 6.3 다음 상담 준비 카드

- [ ] 컨테이너 클래스 `mg-v2-next-consultation-card` (배경·테두리·좌측 악센트 바)
- [ ] 조건부 렌더링: 오늘/내일 상담 존재 여부
- [ ] 헤더: 제목 (아이콘 Calendar) + 배지 ("오늘" 또는 "내일")
- [ ] 본문: 정보 블록 3개 (내담자·시간·회기) (grid 3열)
- [ ] 푸터: 버튼 2개 ("이전 일지 보기", "상세보기")
- [ ] 모바일 반응형 (본문 grid 1열, 버튼 전체 너비)
- [ ] 클릭 이벤트: navigate 연결
- [ ] 호버 효과: 카드 테두리 색상 변경
- [ ] API 연동: 기존 `DASHBOARD_API.CONSULTANT_UPCOMING_SCHEDULES` 활용

### 6.4 긴급 확인 필요 내담자

- [ ] 컨테이너 클래스 `mg-v2-urgent-clients-section` (배경·테두리·좌측 악센트 바)
- [ ] 조건부 렌더링: 위험도 HIGH/CRITICAL 또는 진행도 저하 내담자 존재
- [ ] 헤더: 제목 (아이콘 AlertCircle) + 전체보기 버튼
- [ ] 본문: 내담자 카드 목록 (flex-direction: column, gap 12px)
- [ ] 내담자 카드: 이름·메타·이슈·위험도 배지·상세보기 버튼
- [ ] 위험도 배지: CRITICAL(빨간색), HIGH(노란색), MEDIUM(회색)
- [ ] 모바일 반응형 (카드 flex-direction: column)
- [ ] 클릭 이벤트: 카드 전체·버튼 navigate 연결
- [ ] 호버 효과: 카드 테두리 색상 변경
- [ ] API 연동: `GET /api/v1/consultants/{id}/urgent-clients` (신규 API 필요)

### 6.5 공통 작업

- [ ] 디자인 토큰 사용: `var(--mg-*)` 형식으로 색상·간격·radius 적용
- [ ] 하드코딩 색상·간격 금지
- [ ] 아토믹 디자인 계층 준수 (Atoms → Molecules → Organisms)
- [ ] UnifiedModal 사용 (모달 필요 시)
- [ ] StandardizedApi 사용 (API 호출 시)
- [ ] 로딩 상태 처리 (Skeleton UI 또는 Spinner)
- [ ] 에러 처리 (빈 데이터, API 실패)
- [ ] 접근성: aria-label, role, keyboard navigation
- [ ] 테스트: 단위 테스트, 통합 테스트

---

## 7. API 연동 명세

### 7.1 기존 API 활용

| API | 엔드포인트 | 용도 |
|-----|-----------|------|
| 오늘/내일 상담 | `GET /api/v1/schedules/upcoming` | 다음 상담 준비 카드 |
| 상담사 통계 | `GET /api/v1/schedules/today/statistics` | 주요 통계 카드 (기존) |

### 7.2 신규 API 필요

| API | 엔드포인트 | 요청 파라미터 | 응답 데이터 | 용도 |
|-----|-----------|--------------|-----------|------|
| 미작성 일지 조회 | `GET /api/v1/consultants/{consultantId}/incomplete-records` | consultantId (path) | `{ count: number, schedules: [{ scheduleId, clientName, consultationDate }] }` | 미작성 상담일지 알림 |
| 긴급 내담자 조회 | `GET /api/v1/consultants/{consultantId}/urgent-clients` | consultantId (path) | `{ clients: [{ clientId, clientName, sessionNumber, lastConsultationDate, riskLevel, mainIssue }] }` | 긴급 확인 필요 내담자 |

### 7.3 API 호출 예시

**미작성 일지 조회**:
```javascript
const incompleteRecords = await StandardizedApi.get(
  `/api/v1/consultants/${user.id}/incomplete-records`
);
// 응답: { count: 3, schedules: [...] }
```

**긴급 내담자 조회**:
```javascript
const urgentClients = await StandardizedApi.get(
  `/api/v1/consultants/${user.id}/urgent-clients`
);
// 응답: { clients: [{ clientId, clientName, riskLevel, ... }] }
```

---

## 8. 구현 우선순위

### 8.1 Phase 1-A (1주차)

1. **빠른 액션 바** (난이도: 하)
   - 기존 네비게이션 연결만 필요, API 개발 불필요
   - 예상 공수: 0.5일 (프론트엔드)

2. **다음 상담 준비 카드** (난이도: 하)
   - 기존 API (`upcoming-schedules`) 활용
   - 예상 공수: 1일 (프론트엔드)

### 8.2 Phase 1-B (2주차)

3. **미작성 상담일지 알림** (난이도: 중)
   - 신규 API 개발 필요
   - 예상 공수: 1일 (백엔드) + 0.5일 (프론트엔드)

4. **긴급 확인 필요 내담자** (난이도: 중)
   - 신규 API 개발 필요 (위험도·진행도 조회)
   - 예상 공수: 1.5일 (백엔드) + 1일 (프론트엔드)

### 8.3 총 예상 공수

| 작업 | 백엔드 | 프론트엔드 | 총 공수 |
|------|--------|-----------|---------|
| Phase 1-A | - | 1.5일 | 1.5일 |
| Phase 1-B | 2.5일 | 1.5일 | 4일 |
| **합계** | **2.5일** | **3일** | **5.5일** |

---

## 9. 디자인 검증 체크리스트

### 9.1 펜슬 가이드 준수

- [x] 색상: 펜슬 팔레트 또는 `var(--mg-*)` 토큰만 사용
- [x] 레이아웃: 섹션 블록 구조 (배경·테두리·radius·좌측 악센트 바)
- [x] 타이포: Noto Sans KR, 제목/본문/라벨 크기·색상 일관성
- [x] 반응형: 모바일~데스크톱 브레이크포인트 검토
- [x] 토큰 명시: 스펙에 `var(--mg-*)` 클래스명 명시
- [x] 재사용: 기존 컴포넌트·토큰 재사용

### 9.2 사용자 관점 (§0.4)

- [x] 사용성: 5분 이내 핵심 정보 확인 가능
- [x] 1클릭 액션: "바로 작성하기", "상세보기" 버튼 배치
- [x] 정보 노출 범위: 민감 정보 최소화 (이름·회기·이슈 1줄)
- [x] 위험도·긴급 여부: 색상·아이콘으로 명확히 표시
- [x] 우선순위 배치: 준비·알림 상단, 통계 중단, 성과 하단
- [x] 조건부 렌더링: 데이터 없으면 공간 효율화

### 9.3 기술 표준 준수

- [x] 디자인 토큰 사용 (`unified-design-tokens.css`)
- [x] 아토믹 디자인 계층 (Atoms → Organisms)
- [x] AdminCommonLayout 기준 (GNB·LNB 공통)
- [x] 하드코딩 금지 (색상·간격·폰트)
- [x] 반응형 브레이크포인트 (모바일·태블릿·데스크톱)
- [x] 접근성 (aria-label, role, keyboard navigation)

---

## 10. 다음 단계

1. **core-coder에게 전달**: 본 문서를 handoff하여 구현 착수
2. **API 개발 우선**: 미작성 일지·긴급 내담자 API 개발 (백엔드)
3. **프론트엔드 구현**: 빠른 액션 바 → 다음 상담 준비 카드 → 알림·긴급 내담자 순서
4. **디자인 검증**: 구현 후 어드민 대시보드 샘플과 비주얼 일관성 확인
5. **사용자 테스트**: 상담사 피드백 수집 후 개선

---

**문서 종료**
