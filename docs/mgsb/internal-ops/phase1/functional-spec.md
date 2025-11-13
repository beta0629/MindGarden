# Phase 1 Functional Specification – Internal Operator Portal

작성일: 2025-11-13

## 1. 범위
- 대시보드(지표, 알림, 온콜 위젯)
- 테넌트 온보딩 승인 워크플로우
- 요금제/애드온 관리
- 기초 감사 로그 기록 및 Feature Flag 조회

## 2. 사용자 시나리오 요약
| 시나리오 | 배우 | 목표 |
| --- | --- | --- |
| 신규 온보딩 승인 | HQ_ADMIN | 요청 검토 후 승인/보류/거절 결정 |
| 요금제 생성 | HQ_MASTER | 신규 요금제 등록 및 활성화 |
| 애드온 조회 | CS | 사용 중인 애드온 확인, 티켓 답변 참고 |
| KPI 모니터링 | SRE | SLA/에러율 모니터링, Incident 사전 대응 |

## 3. 기능 상세
### 3.1 대시보드
- KPI 카드: 온보딩 대기 건수, 활성 요금제/애드온 수, 활성 Feature Flag 수, 감사 로그 누적 건수
- 알림 피드: 승인/배포/보안 이벤트
- 온콜 위젯: 현재 담당자, 연락처, 교대 정보
- API: `GET /api/v1/dashboard/metrics`, `GET /api/v1/alerts/feed`

### 3.1.1 인증/세션
- 로그인: `POST /api/v1/auth/login` (JWT 발급) → 프런트엔드 `/api/auth/login` 라우트에서 쿠키 저장
- 로그아웃: `/api/auth/logout` → 클라이언트 쿠키 삭제
- 보호 경로: `/auth/login`, `/api/auth/*` 제외 모든 페이지는 `middleware.ts`에서 토큰 검사 후 미보유 시 `/auth/login`으로 리다이렉트
- 토큰 저장 방식: `ops_token`, `ops_actor_id`, `ops_actor_role` (SameSite=Lax, 개발 단계에서는 HttpOnly=false)  
  - 운영 전환 시 HttpOnly/HTTPS 적용 및 SSO 연동 예정
- 토큰 만료 시 UI에서 401 감지 → 로그인 페이지로 이동

### 3.2 온보딩 승인
- 목록 보기: `GET /api/v1/onboarding/requests/pending`
- 상세 보기: `GET /api/v1/onboarding/requests/{id}`
- 승인/거절: `POST /api/v1/onboarding/requests/{id}/decision`
- 감사 로그 자동 기록

### 3.3 요금제/애드온
- 요금제 조회/등록: `GET /api/v1/plans`, `POST /api/v1/plans`
  - 등록 시 영문/한글 명칭(`displayName`, `displayNameKo`)과 설명(`description`, `descriptionKo`)을 모두 입력
- 애드온 조회/등록: `GET /api/v1/plans/addons`, `POST /api/v1/plans/addons`
  - 등록 시 영문/한글 명칭(`displayName`, `displayNameKo`)과 카테고리(`category`, `categoryKo`) 병행 입력
- 플랜-애드온 매핑: `POST /api/v1/plans/{planId}/addons`
- 요금제/애드온 수정: `PATCH /api/v1/plans/{id}`, `PATCH /api/v1/plans/addons/{id}` (한글 컬럼 포함)
- 요금제/애드온 비활성화(소프트 삭제): `DELETE /api/v1/plans/{id}`, `DELETE /api/v1/plans/addons/{id}`
- 감사 로그 자동 기록
- `X-Actor-Id`, `X-Actor-Role` 헤더 기반 감사 기록 (Actor Role 기본값 HQ_ADMIN)

### 3.6 다국어 확장 정책
- 모든 코드/마스터 데이터는 영문 값과 한글 값(기본) 컬럼을 함께 저장
- 제3의 외국어 지원 시 컬럼을 추가하거나 `ops_localized_value`(추가 예정) 등 확장 구조를 사용할 수 있도록 설계
- 프런트엔드는 locale 기준으로 표시 → `ko` 우선, 없으면 `en` fallback
- 외부(대외) 시스템 고도화 시에도 동일한 다국어 정책을 준수하도록 표준 문서 공유

### 3.4 감사 로그 & Feature Flag
- 감사 로그 조회: `GET /api/v1/audit?eventType=&actor=`
- Feature Flag 조회/생성/토글: `GET /api/v1/feature-flags`, `POST /api/v1/feature-flags`, `POST /api/v1/feature-flags/{id}/toggle`
- 감사 로그 자동 기록

## 4. 권한 매핑 (요약)
| 기능 | HQ_MASTER | HQ_ADMIN | SRE | SECURITY | CS |
| --- | --- | --- | --- | --- | --- |
| 대시보드 전체 | O | O | O | O | △ |
| 온보딩 승인 | O | O | △(추천) | △ | X |
| 요금제 생성 | O | △ | X | X | X |
| 애드온 조회 | O | O | △ | △ | O |
| 감사 로그 | O | △ | △ | O | X |

## 5. 성공 지표
- 온보딩 승인 처리 평균 시간 ≤ 4시간
- 요금제/애드온 승인 정확도(재승인율) ≥ 95%
- 대시보드 SLA 데이터 지연 ≤ 1분

## 6. 외부 연동
- MindGarden Core API: 테넌트, 결제, AI 사용량
- Notification Service: Slack/PagerDuty Webhook
- Authentication: MindGarden Identity Hub (OIDC)
