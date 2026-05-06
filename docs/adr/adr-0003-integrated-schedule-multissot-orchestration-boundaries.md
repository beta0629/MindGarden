# ADR-0003: 통합 일정 멀티슬롯 오케스트레이션의 책임 경계

**Status:** Proposed

## Context

“멀티 SSOT(또는 멀티 소스)”에 가깝게, 통합 일정은 **캘린더·권한·매핑·잔여·결제·ERP** 등 여러 축의 진실을 동시에 다룬다. 오케스트레이션 SSOT는 **통합 스케줄 모듈**이 담당하는 범위와, **외부·인접 도메인**이 담당하는 범위를 분리해 추적한다.

- **통합 일정(앱 내 스케줄 생성·검증)**: 역할별 신규/편집 권한, 슬롯 확정 API의 **사전 검증**(`validateMappingForSchedule`, `validateRemainingSessions`), 실패 시 **동일 트랜잭션 롤백**(`createConsultantSchedule` 10인자 경로, 오케스트레이션 SSOT **구현 스냅샷**의 "`createConsultantSchedule`·트랜잭션" 소절과 동일).
- **결제·입금·ERP**: 별도 관리자 API·서비스(`confirm-payment`, `confirm-deposit`, 환불·종료 등)와 연동되며, [입금·ERP·환불 흐름 분석](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md)에 경로·갭이 정리되어 있다. 본 ADR은 그 문서를 **인용**만 하고, 법·회계 최종 판단을 추가하지 않는다.
- **알림**: 오케스트레이션 SSOT에서 별도 서브에이전트·게이트로 다루는 항목으로, **슬롯 확정 트랜잭션의 ACID 소유**와 혼동하지 않는다.

실패 시 **앱 DB 일정 행의 롤백**은 위 스케줄 생성 트랜잭션 경계 안에 있다. 반면 **이미 발생한 INCOME/EXPENSE·외부 ERP 전송**의 보상·재시도는 해당 결제·ERP 서비스 소유로 두는 것이 현 구현과 모순 없이 읽힌다(외부 전송 모의·갭은 위 디버그 문서 참고).

## Decision

- **책임 경계**: 통합 일정 모듈은 **권한 + 매핑·잔여 불변 조건 + 일정 영속화**까지를 한 트랜잭션(또는 동일 서비스 경계)에서 다루고, **결제 확정·입금 확인·ERP 거래 생성**은 일정 생성 메서드가 대체하지 않는다.
- **롤백 소유(현 구현 기준)**: `createConsultantSchedule` 사전 검증 실패에 따른 **DB 롤백**은 스케줄 서비스 트랜잭션에 속한다. 결제·ERP 쪽 **부분 성공 뒤의 보상**은 별도 플로우·운영 절차와 [입금·ERP·환불 흐름 분석](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md)의 갭 목록과 함께 검토한다.

## Consequences

- 선예약·후결제 시나리오에서 “일정은 생겼는데 회기·ERP는 다른 상태”류의 불일치는, **경계 밖 시스템**과의 이벤트 순서 문제로 남을 수 있다. SSOT의 P0 시나리오·테스터 게이트로 완화 범위를 정한다.
- API·배치·메시지 설계 시 **통합 일정이 외부 확정을 동기 호출로 끌어올지** 여부는 본 ADR 범위를 넘는 구현 선택이며, PO·아키텍처 합의가 필요하다.

### 가정(PO 검토)

- “멀티슬롯”의 **제품 범위**(동일 자원·복수 자원·연속 블록 등) 명칭과 포함 범위.
- 선예약 레코드와 결제·ERP 확정의 **최종 일관성 모델**(사가, 아웃박스, 수동 정정 등)을 제품이 채택할지.
- 실패·부분 성공 시 **보상 트랜잭션의 단일 오너**(운영·CS·배치) 지정.

## References

- [통합 일정: 선예약·후결제 오케스트레이션](../project-management/INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md)
- [입금·ERP·환불 흐름 분석](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md)
