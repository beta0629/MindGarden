# Phase 1 Test Plan – Internal Operator Portal

작성일: 2025-11-13

## 1. 테스트 목표
- 핵심 기능(대시보드, 온보딩 승인, 요금제 관리)이 요구사항과 보안 정책을 충족하는지 검증
- 역할별 접근 제어(RBAC/ABAC)가 올바르게 동작하는지 확인
- 회귀 및 자동화 기반 품질 게이트 마련

## 2. 테스트 범위
| 영역 | 테스트 유형 |
| --- | --- |
| 대시보드 | API 통합 테스트, E2E UI 테스트, 지표 데이터 모의 |
| 온보딩 승인 | 단위 테스트(서비스), 통합 테스트(JPA/Flyway), 보안 테스트 |
| 요금제/애드온 | 단위/통합 테스트, 데이터 검증, Edge 케이스(중복 코드) |
| 감사 로그 | 통합 테스트(자동 기록), 로그 구조 검증 |
| Feature Flag | 단위 테스트, Shadow Mode 시뮬레이션 |

## 3. 테스트 종류 및 도구
- 단위 테스트: JUnit5, Mockito
- 통합 테스트: Spring Boot Test + Testcontainers(H2/추후 Postgres)
- 계약 테스트: Postman/Newman 또는 Spring Cloud Contract (추후)
- E2E 테스트: Playwright (역할별 시나리오)
- 보안 테스트: OWASP ZAP 스캔, 권한 상승/세션 하이재킹 시나리오 수동 테스트
- **문법/스타일 검사:** `config/shell-scripts/check-syntax.sh` (backend `./gradlew check`, frontend `npm run lint`)
- **하드코딩/상수화 검사:** `config/shell-scripts/check-hardcode.sh` (frontend-ops/src, backend-ops ops 모듈 대상)

## 4. 테스트 케이스 예시
| ID | 시나리오 | 유형 | 결과 |
| --- | --- | --- | --- |
| TC-ONB-001 | 신규 온보딩 요청 승인 성공 | 통합 | 승인 후 상태 APPROVED, 감사 로그 존재 |
| TC-ONB-002 | 권한 없는 사용자의 승인 시도 | 보안 | 403 Forbidden |
| TC-PLAN-001 | 중복 planCode 등록 | 단위 | 예외 발생, 저장 안됨 |
| TC-PLAN-002 | 애드온 리스트 조회 | 통합 | 200, 빈 배열 허용 |
| TC-PLAN-003 | 요금제 생성 시 감사 로그 기록 | 통합 | 200, Audit 로그 생성 확인 |
| TC-PLAN-004 | Actor 헤더 누락 처리 | 보안 | 400 Bad Request |
| TC-PLAN-005 | 요금제 수정 API | 통합 | 200, 변경 필드 반영 및 감사 로그 기록 |
| TC-PLAN-006 | 애드온 비활성화 | 통합 | 204, active=false로 변경 |
| TC-AUTH-001 | 로그인 성공/실패 시나리오 | 통합 | 200, JWT 발급 및 쿠키 저장 / 401 |
| TC-AUTH-002 | 토큰 만료 후 재로그인 | E2E | 만료 시 로그인 페이지로 리다이렉트 |
| TC-FLAG-001 | Feature Flag 생성/토글 | 통합 | 상태 DISABLED→ENABLED |
| TC-DASH-001 | KPI API 응답 구조 | 계약 | 스키마 일치 |
| TC-AUD-001 | 감사 로그 필터 | 통합 | eventType 필터 적용 |

## 5. 환경
- Local: H2 in-memory, Mock Identity Provider
- Staging: Managed Postgres, 실제 OAuth Issuer, 샌드박스 결제/알림 연동

## 6. 일정 (예상)
| 단계 | 기간 | 비고 |
| --- | --- | --- |
| 테스트 설계 | Phase 0 Week 2 | 케이스 정의, 자동화 시나리오 작성 |
| 테스트 구현 | Phase 1 Week 1~3 | 단위/통합/Playwright 작성 |
| 테스트 수행 | Phase 1 Week 4 | 회귀, 보안 점검, 결함 수정 |

## 7. 품질 게이트
- 단위 테스트 커버리지 ≥ 80%
- 빌드 파이프라인에서 lint/test 실패 시 배포 차단
- 주요 시나리오(E2E) 실패 시 자동 알림 및 배포 보류
- 하드코딩/상수화 검사 실패 시 코드 수정 후 재검사 (스크립트: `check-hardcode.sh`)
- 다국어 컬럼 관련 변경 시 DB/엔티티/프런트 모두 일관성 있는지 추가 점검

## 8. 리스크 및 대응
| 리스크 | 영향 | 대응 |
| --- | --- | --- |
| 실제 데이터 미연동 | 테스트 정확도 감소 | Mock + 샘플 데이터, Staging 연동 계획 |
| 보안 시나리오 누락 | 취약점 존재 | 보안 담당자 리뷰, Checklists |
| 자동화 유지보수 부담 | 배포 지연 | 테스트 우선순위 설정, 단계별 자동화 |
