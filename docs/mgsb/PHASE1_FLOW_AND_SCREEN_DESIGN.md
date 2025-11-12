# MindGarden Phase 1 (Academy) Flow & Screen Design

## 1. 주요 사용자 플로우

### 1.1 소비자 플로우

1. 홈 → 학원 검색/카테고리 → 학원 상세 → 상담 예약
2. 예약 확인 → 상담 진행 → 수강 등록 → 결제
3. 결제 완료 → 마이 페이지(수강 내역, 결제 내역, 영수증 다운로드)
4. 일정/알림 확인 → 재등록 유도(추천 강좌/프로모션)

**시퀀스 다이어그램 요약:**

- 소비자 → `AcademyService` → `ReservationService` → `NotificationService`
- 결제 단계에서 `PaymentGateway`와 ERP `SettlementBatch` 대기열로 이벤트 전달

### 1.2 관리자/스태프 플로우

1. 로그인 → 대시보드(금일 일정/알림) → 예약 승인/조정
2. 상담 기록 입력 → 수강 등록 → 결제 처리(현장 결제 입력 또는 온라인 결제 승인)
3. 수강생 관리 → 출결 기록 → 학부모 알림 발송
4. 결제 내역 검토 → 정산 리포트 확인 → 회계 처리

**상태 전이:**

- 예약: `PENDING → APPROVED → COMPLETED`, 예외 `→ CANCELLED`
- 수강 등록: `DRAFT → ACTIVE → COMPLETED` (필요 시 `PAUSED`)
- 출결: `PRESENT|ABSENT|LATE`, 자동 알림 발송 트리거

### 1.3 HQ(본사) 모니터링 플로우

1. 본사 계정 로그인 → 전체 테넌트 KPI 대시보드 확인
2. 지점별 매출/가입자/이슈 추적 → 정책/지원 공지 발송
3. SLA/장애 모니터링 → 지원 티켓 관리

## 2. 화면 목록 및 컴포넌트 구조

### 2.1 소비자 포털 핵심 화면

- 홈/검색: 추천 학원, 카테고리, 검색 필터
- 학원 상세: 사진, 소개, 커리큘럼, 시간표, 리뷰, 상담 예약 CTA
- 상담 예약 폼: 일정 선택, 연락처 입력, 동의 체크, 예약 확정 알림
- 결제 플로우: 수강권 선택, 결제 수단, 영수증/세금계산서 옵션
- 마이 페이지: 수강 내역, 결제 영수증, 알림/쿠폰, 정보 수정

### 2.2 관리자 포털 핵심 화면

- 대시보드: 실적, 알림, 주요 지표
- 예약/수강 관리: 캘린더 뷰, 상태별 필터, 상세 패널
- 회원 CRM: 회원 목록, 상세 정보, 상담 이력, 메모
- 결제/정산: 결제 내역 테이블, 정산 리포트 다운로드
- 알림 센터: 발송 템플릿, 알림 스케줄, 발송 결과 로그

### 2.3 공통 컴포넌트/디자인 가이드

- MG Design System v2.0 버튼/폼/카드/테이블 컴포넌트 재사용
- 색상/폰트/간격: 기존 CSS 변수 활용 (`mindgarden-design-system.css`)
- 반응형 레이아웃: 1280px 이상 데스크탑, 768~1279px 태블릿, 767px 이하 모바일 가이드
- 접근성: WCAG 2.1 AA 기준, 키보드 네비게이션, ARIA 레이블 명시

## 3. 상태 정의 및 UX 고려사항

| 흐름 | 상태 | UI 반응 | 후속 액션 |
| --- | --- | --- | --- |
| 예약 | PENDING | 관리자 승인 대기 배지 | 24시간 내 리마인드 |
| 예약 | APPROVED | 알림 + 일정 확정 | 수강 등록 화면 이동 |
| 결제 | PROCESSING | Progress Bar/Spinner | 타임아웃 30초, 취소 버튼 |
| 결제 | FAILED | 에러 모달, 재시도 | 고객센터 안내 |
| 정산 | RUNNING | 관리자 화면에 진행률 표시 | 완료 시 보고서 링크 |
| 알림 | QUEUED | 발송 리스트에 보류 표시 | 스케줄링 시간 도달 대기 |

## 4. QA 테스트 케이스 매트릭스 (발췌)

| 케이스 ID | 시나리오 | 입력 | 기대 결과 |
| --- | --- | --- | --- |
| CON-001 | 신규 상담 예약 | 필수 필드 입력 | `201 Created`, 알림 발송 |
| CON-002 | 상담 예약 중복 | 동일 시간 예약 | `422 duplicate_reservation` |
| PAY-001 | 결제 승인 | 유효 카드 정보 | `200 OK`, 영수증 URL |
| PAY-004 | 결제 금액 불일치 | 클라이언트 조작 | `409 price_mismatch`, 로그 남김 |
| ADM-003 | 예약 승인 | 상태 변경 요청 | 캘린더 업데이트, 알림 발송 |
| ADM-007 | 정산 리포트 다운로드 | 완료된 배치 ID | CSV/PDF 파일 수신 |
| NOT-002 | 알림 발송 실패 | 잘못된 번호 포함 | 실패 대상만 재처리 큐 등록 |

(전체 케이스는 `/qa/testcases/phase1-academy.xlsx`에 정리 예정)

## 5. API 의존성 및 데이터 바인딩 포인트

- 소비자 포털
  - 학원 목록/상세 조회 (`GET /api/academy/{tenant}`)
  - 상담 예약 (`POST /api/academy/{tenant}/reservations`)
  - 결제 요청 (`POST /api/payments`) → 결제 게이트웨이 연동
  - 마이 페이지 데이터 (`GET /api/consumer/me`, `GET /api/consumer/orders`)
- 관리자 포털
  - 예약/수강 관리 (`GET/PUT /api/admin/reservations`, `POST /api/admin/enrollments`)
  - 회원 관리 (`GET /api/admin/members`, `POST /api/admin/members/{id}/notes`)
  - 결제/정산 리포트 (`GET /api/admin/settlements`)
  - 알림 발송 (`POST /api/admin/notifications`)
- 공통
  - 인증/세션 (`POST /api/auth/login`, `GET /api/auth/session`)
  - 코드 테이블 (`GET /api/common/codes?group=...`)
  - 파일 업로드(브랜딩 자산) (`POST /api/files/upload`)

## 6. 향후 설계 산출물

- 화면 와이어프레임 (Figma/Sketch): 핵심 화면별 레이아웃, UI 상태 정의
- 상태 다이어그램: 예약/수강/결제 상태 전이, 알림 상태 흐름
- 컴포넌트 카탈로그: 재사용 가능한 MG UI 컴포넌트 문서, Storybook 업데이트
- API 스펙 문서(OpenAPI): 엔드포인트, 요청/응답 모델, 에러 코드 정의
- 테스트 케이스 매트릭스: 각 화면/플로우별 테스트 시나리오 및 기대 결과
- 정산 배치 테스트 데이터셋: PL/SQL 배치 시뮬레이션용 샘플 CSV/SQL
