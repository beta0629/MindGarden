# Internal Operator Portal – Approval & Change Management Workflow (Draft)

작성일: 2025-11-13

## 1. 온보딩/요금제 승인 프로세스
1. **요청 수신**
   - 트리거: 테넌트 가입/결제 완료, 요금제/애드온 변경 요청
   - 자동 분류: 업종, 규모, 위험도(수수료, AI 사용량 등)
2. **검토 단계**
   - HQ_ADMIN가 체크리스트 확인 (계약, 결제, 권한, 데이터 이관)
   - 필요 시 SECURITY/SRE에게 추가 검토 요청
3. **승인/거절**
   - 승인 시: 자동으로 Feature Flag/AI 설정 활성화, 감사 로그 기록
   - 거절/보류 시: 사유 입력, 테넌트 알림, 재요청 경로 제공
4. **결과 통보**
   - 이메일/알림/웹훅 발송, 운영 포털 히스토리 갱신
   - 보고서 생성 (일/주간 승인 통계)

## 2. 배포/배치 변경 관리
1. **릴리스 준비**
   - 개발팀이 Release Note 제출 → SRE/HQ_ADMIN이 검토
   - 자동 테스트 결과/리스크 평가 첨부
2. **승인 게이트**
   - Staging 배포 → QA 승인 → 운영 배포 요청
   - Blue/Green 또는 Canary 전략 선택, 롤백 플랜 확인
3. **배포 실행 & 검증**
   - SRE가 배포 버튼 실행, 모니터링 체크리스트 진행
   - 실패 시 즉시 롤백 및 Incident 보고서 작성
4. **사후 리뷰**
   - 결과 요약, 메트릭 기록, 개선 사항 백로그로 이관

## 3. 변경 관리 정책 (Change Management)
- 모든 운영 영향 변경은 Jira/Linear 티켓 및 승인 로그 필수
- 긴급 변경(Hotfix) 시 Post-Review, 24시간 내 회고 기록
- 변경 카테고리: Standard (자동 승인), Normal (2단계 승인), Emergency (사후 승인)

## 4. 승인 권한 매트릭스
| 변경 유형 | 기본 승인자 | 보조 승인자 | 비고 |
| --- | --- | --- | --- |
| 테넌트 온보딩 | HQ_ADMIN | HQ_MASTER (고위험) | 고위험 기준: AI 고급 플랜, 대규모 결제 |
| 요금제/애드온 | HQ_ADMIN | HQ_MASTER (수수료 변경) | 프로모션 코드 등은 CS 참조 |
| 배포/릴리스 | SRE | HQ_ADMIN | 롤백 시 HQ_MASTER 보고 |
| 보안 정책 | SECURITY | HQ_MASTER | MFA/ABAC 변경 시 이용자 공지 |
| 운영 Runbook | HQ_ADMIN | SRE/CS | 변경 후 교육 필요 여부 표시 |

## 5. 로그 & 감사 요구
- 모든 승인/거절/변경은 `operator_audit_log`와 `feature_flag_audit`에 기록
- 로그 항목: ID, 대상, 변경 내용, 이전 값, 승인자, 사유, 타임스탬프
- 감사 보고서는 월간으로 SECURITY 팀이 취합해 경영진 공유

## 6. 향후 과제
- BPMN/Workflow Engine 연동 설계 (Phase 4)
- SLA 준수 대시보드 구현 (승인 처리 시간, 배포 성공률 등)
- 승인 프로세스별 알림 템플릿/Slack 채널 표준화
