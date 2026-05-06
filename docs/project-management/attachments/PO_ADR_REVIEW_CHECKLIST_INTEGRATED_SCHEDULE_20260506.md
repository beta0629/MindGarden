# PO 검토 체크리스트 — 통합 스케줄 ADR 0001~0003

## 목적

통합 스케줄 **선예약·후결제·회기** 흐름과 **통합 일정 SSOT**([통합 일정 오케스트레이션](../INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md)) 및 ADR **0001~0003**의 **정합**을 PO가 한 번에 확인할 때 사용한다. 각 ADR은 현재 **Proposed(엔지니어링 초안)** 이므로, 아래 질문에 답한 뒤 **결정** 칸에 채택·보류·수정 요청을 기입한다.

## 참고 링크 (문서 루트 기준)

| 문서 | 경로 |
|------|------|
| ADR 인덱스 | [`docs/adr/README.md`](../../adr/README.md) |
| ADR-0001 | [`docs/adr/adr-0001-scheduling-eligibility-vs-payment-deposit-gating.md`](../../adr/adr-0001-scheduling-eligibility-vs-payment-deposit-gating.md) |
| ADR-0002 | [`docs/adr/adr-0002-session-remaining-and-mapping-status-transitions.md`](../../adr/adr-0002-session-remaining-and-mapping-status-transitions.md) |
| ADR-0003 | [`docs/adr/adr-0003-integrated-schedule-multissot-orchestration-boundaries.md`](../../adr/adr-0003-integrated-schedule-multissot-orchestration-boundaries.md) |
| 오케스트레이션 SSOT | [`docs/project-management/INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md`](../INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md) |

## 검토 표

| ADR ID | 검토 질문 (3~5) | 결정 (채택 / 보류 / 수정 요청) |
|--------|-----------------|----------------------------------|
| **ADR-0001** (예약·자격 vs 결제·입금 게이팅) | 1) **역할**(ADMIN/STAFF 신규 vs CONSULTANT 편집)과 **입금·결제 후 확정**을 제품 카피·화면에서 어떻게 나눠 설명할지 동의하는가?<br>2) `createConsultantSchedule` 경로의 **매핑·잔여 사전 검증 실패 시 트랜잭션 롤백**이 운영·CS 기대와 맞는가?<br>3) `PAYMENT_CONFIRMED`·`DEPOSIT_PENDING` 등과 통합 일정 **예약 가능(SCHEDULABLE) 표시**의 **최종 상품 규칙**(표시만 / 차단 / 숨김)을 확정할 수 있는가?<br>4) **confirm-payment** vs **confirm-deposit** 등 ERP·프로시저 차이와 “단일 진실” 요구가 이 ADR의 **레이어 분리**와 충돌하지 않는가?<br>5) [입금·ERP·환불 흐름 분석](../../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md)에 적힌 **갭**을 본 ADR 범위에서 어떻게 후속 추적할지 합의되는가? | |
| **ADR-0002** (잔여 회기·매핑·상태 전이) | 1) “잔여”의 **제품 정의**(시간·횟수·혼합)와 **산출 주기**를 PO·운영이 확정할 수 있는가?<br>2) 프론트 **ACTIVE + `remainingSessions > 0`** = 스케줄 가능, 백엔드 동일 축 검증이라는 전제에 **예외**(임시 슬롯 등) 없이 동의하는가?<br>3) 통합 일정에 **노출할 매핑·내부 상태**와 **비노출** 목록이 이 ADR 범위에서 충분히 합의되는가, 아니면 **전역 상태 전이표**가 별도 과제로 필요한가?<br>4) 환불·입금 확인·강제 종료 등이 `remainingSessions`·ACTIVE와 동시에 움직일 때 **조정 원칙**을 누가 제품 규칙으로 밀어붙일지 명확한가?<br>5) 동시성(중복 예약·중복 결제) 시 **우선순위**와 사용자 메시지 기준이 이 ADR만으로 충분한가? | |
| **ADR-0003** (멀티 소스 오케스트레이션 책임 경계) | 1) 통합 일정 모듈이 **권한 + 매핑·잔여 + 일정 영속화**까지 담고, **결제·입금·ERP 확정**은 일정 생성이 대체하지 않는다는 **책임 경계**에 제품·운영 관점에서 동의하는가?<br>2) **앱 DB 일정 롤백**(스케줄 트랜잭션)과 **ERP·INCOME 등 외부 보상·재시도**의 소유 분리가 수용 가능한가?<br>3) “멀티슬롯” **제품 범위**(동일 자원·복수 자원·연속 블록 등) 명칭·포함 범위가 ADR·SSOT와 맞는가?<br>4) 선예약과 결제·ERP 확정의 **최종 일관성 모델**(사가·아웃박스·수동 정정 등)을 **제품이 채택**할지, 본 ADR은 **경계만** 두고 후속인지 구분되는가?<br>5) 실패·부분 성공 시 **보상 트랜잭션의 단일 오너**(운영·CS·배치) 지정이 되었는가? | |

---

## 엔지니어링 초안(Proposed)과 코드 스냅샷 불일치 발견 시

**에스컬레이션:** 불일치 항목·재현 경로·관련 PR/커밋을 한 줄로 정리해 아키텍트·기술 리드에게 전달하고, SSOT([`INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md`](../INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md)) 또는 ADR 중 어느 쪽을 먼저 갱신할지 결정권자에게 올린다.

## 법·회계·ERP 최종 판단

본 체크리스트와 인용 ADR은 **엔지니어링·제품 경계 정리**용이며, **법적 해석·회계 처리·ERP/세무 최종 확정**은 외부 정책·전문가·운영 규정에 따른다(저장소 문서는 사실·갭 정리 수준).
