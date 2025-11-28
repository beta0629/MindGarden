# MindGarden Phase 1 (Academy) UI Wireframe Guide

> 본 문서는 Phase 1 학원용 MVP의 핵심 화면 와이어프레임 구조와 상태를
> 텍스트로 정리한 것이며, 시각 자료는 Figma 링크를 통해 공유합니다.

- **Figma Link (v0.2):**
  `https://www.figma.com/file/placeholder/mindgarden-academy-mvp?node-id=1001%3A200`
- **Export Assets:** `/design/exports/academy-v0.2/` (PNG, PDF)
- **디자인 시스템 준거:** MG Design System v2.0 컴포넌트, 색상/타이포 가이드
  (`frontend/src/styles/mindgarden-design-system.css`)

## 1. 화면 목록 및 해상도 기준

- **소비자 홈/검색**
  - 목적: 학원 탐색, 필터
  - 해상도: Desktop 1440×900 / Mobile 360×720(카드형)
  - 스크린샷: `figma://frame/home-desktop`, `.../home-mobile`
- **학원 상세**
  - 목적: 소개, 시간표, CTA
  - 해상도: 1280×900 / Mobile 360×1200
  - 스크린샷: `figma://frame/detail-desktop`, `.../detail-mobile`
- **상담 예약**
  - 목적: 폼 입력, 일정 선택
  - 해상도: 960×720 / Mobile 360×960
  - 스크린샷: `figma://frame/reservation-desktop`
- **결제 플로우**
  - 목적: 수강권 선택, 결제
  - 해상도: 1280×900 / Mobile 360×780
  - 스크린샷: `figma://frame/payment-step1` ~ `step3`
- **마이 페이지**
  - 목적: 수강내역, 영수증 조회
  - 해상도: 1280×900 / Mobile 360×1200
  - 스크린샷: `figma://frame/mypage-desktop`
- **관리자 대시보드**
  - 목적: 일정/매출 개요
  - 해상도: 1440×900 / Tablet 1024×768
  - 스크린샷: `figma://frame/admin-dashboard`
- **예약/수강 관리**
  - 목적: 캘린더, 테이블 관리
  - 해상도: 1440×900 / Tablet 1024×768
  - 스크린샷: `figma://frame/admin-reservations`
- **회원 CRM**
  - 목적: 상세 뷰, 메모 관리
  - 해상도: 1280×900 / Tablet 1024×768
  - 스크린샷: `figma://frame/admin-crm`
- **결제/정산**
  - 목적: 테이블, 리포트 다운로드
  - 해상도: 1280×900 / Tablet 1024×768
  - 스크린샷: `figma://frame/admin-settlement`

## 2. 화면별 레이아웃 개요

### 2.1 소비자 홈/검색

- **구성:**
  - 헤더: 로고, 검색 바, 로그인/마이페이지 버튼
  - Hero: 추천 학원 슬라이더(자동/수동 전환), CTA 버튼
  - 카테고리 필터: Scrollable Chips, 선택 시 active 스타일
  - 학원 리스트: Desktop 3열 카드(Grid gap 24px), Mobile 1열 카드(LG=360px)
  - 푸터: FAQ, 고객센터, SNS 링크, 개인정보 처리방침
- **상태:**
  - Loading: Skeleton 카드 6개, 3초 이상 시 progress bar 표시
  - Empty: 일러스트 + “조건에 맞는 학원이 없습니다.” CTA(필터 초기화)
  - Error: 알림 배너 + 재시도 버튼, 오류 코드 표기(네트워크/서버)

### 2.2 학원 상세

- **핵심 섹션:**
  - 상단 Info: 학원명, 평점, 리뷰 수, 연락처, CTA(상담 예약)
  - 배너 이미지 Carousel: 16:9 비율, 썸네일 선택 지원
  - 탭: 소개, 커리큘럼(Accordion), 시간표(주간 캘린더), 리뷰, FAQ, 오시는 길
  - CTA Bar: Sticky 하단(모바일) 또는 우측 Aside(Desktop)
- **상태:**
  - 로그인 전: CTA 클릭 시 로그인 모달 → 상담 예약 페이지로 이동
  - 모바일: 하단 Sticky CTA 3종(상담/전화/공유), 탭은 swipe 가능

### 2.3 상담 예약 폼

- **레이아웃:** 2단(Desktop) / 단일 컬럼(Mobile)
- **필드:** 이름, 연락처, 이메일, 희망 일시(데이트피커 + 타임피커), 상담 목적(선택식), 메모, 개인정보 수집 동의(Switch)
- **검증:** 실시간 Validation, Error Summary(상단에 Anchor)
- **완료 후:** 확인 화면 → “마이 페이지로 이동” 버튼 → 이메일/SMS 알림 발송

### 2.4 결제 플로우

- **Step:** Step Indicator(1. 수강권 선택 → 2. 결제 정보 → 3. 확인)
- **컴포넌트:** 상품 카드, Payment Method 라디오, 카드 정보 입력, 약관 체크박스
- **보안:** SSL 배지, PG 로고, “안전한 결제를 위해 …” 안내 문구
- **완료:** 영수증 다운로드 버튼, 일정 등록(캘린더 연동), 추천 강좌 배너

### 2.5 관리자 화면 요약

- **대시보드:** 상단 카드(오늘의 예약/수강/결제/정산), 그래프 영역(Line/Bar), 할 일 리스트
- **예약 관리:** 캘린더(Week/Day 전환), 오른쪽 패널에서 상태 변경/메모, 필터(상태/직원)
- **수강 관리:** 테이블 + 상세 Drawer(출결, 결제 이력), Bulk Action(문자 발송)
- **정산:** 테이블(기간/금액/수단), 다운로드 버튼, 상태 배지(PROCESSING/COMPLETED)

## 3. 상태 정의 테이블

| 화면 | 상태 | UI 표현 | 후속 액션 |
| --- | --- | --- | --- |
| 홈 | Loading | Skeleton 카드 6개 | N/A |
| 홈 | Empty | 일러스트 + CTA | 필터 초기화 |
| 예약 폼 | Validation Error | 인라인 에러 + Summary | 포커스 이동 |
| 결제 | 승인 실패 | 모달 + 재시도 버튼 | 지원 문의 |
| 관리자/캘린더 | API 오류 | 토스트 + 재시도 링크 | 로그 수집 |

## 4. 접근성 체크리스트

- 포커스 링 스타일 MG 표준 적용 (두께 2px, 컬러 `--mint-green`)
- 모든 버튼/링크에 `aria-label` 또는 텍스트 라벨 제공
- 폼 필드: `label`과 `aria-describedby`로 도움말 연결
- 색 대비: 텍스트 대비 4.5:1 이상, CTA 대비 3:1 이상 (Figma Contrast 플러그인 체크)
- 키보드 탭 순서 검증 (Home → Hero CTA → 필터 → 리스트 순)
- 동적 콘텐츠(모달/토스트)는 `role=dialog`/`role=status` 설정 및 포커스 트랩

## 5. 반응형/브레이크포인트 세부 사항

| Breakpoint | 레이아웃 변경 |
| --- | --- |
| ≥1440px | 12-column Grid, 카드 최대 4열 |
| 1280–1439px | 12-column Grid, 카드 3열, 사이드 패널 고정 |
| 1024–1279px | 8-column Grid, 관리자 화면 사이드 패널 접힘 |
| 768–1023px | 4-column Grid, 주요 컴포넌트 2열 → 1열 |
| ≤767px | 1-column Stack, CTA Sticky, 메뉴 Drawer |

## 6. TODO 및 책임자

| 항목 | 설명 | 담당 | 상태 |
| --- | --- | --- | --- |
| Figma 와이어프레임 v0.3 | 상태별 시안, 반응형 상세 | 디자인팀 JH | 진행 중 |
| 스크린샷 Export | Desktop/Mobile PNG | 디자인팀 SY | 예정 |
| Storybook 업데이트 | 새 컴포넌트 문서화 | FE 팀 | 예정 |
| 접근성 검증 | Axe DevTools, Lighthouse | QA 팀 | 예정 |
| UI QA 체크리스트 | 시각·인터랙션 케이스 | QA 팀 | 예정 |

---

> 최신 버전 확인: `docs/mgsb/CHANGELOG.md`에 UI 문서 변경 이력 추가 예정
