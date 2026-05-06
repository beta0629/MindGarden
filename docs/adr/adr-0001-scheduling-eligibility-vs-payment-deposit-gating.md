# ADR-0001: 예약 가능·자격 판단과 결제·입금 게이팅의 경계

**Status:** Proposed

## Context

통합 일정·선예약·후결제 흐름에서 **“누가 일정을 만들 수 있는가(역할·UI 권한)”** 와 **“회기·매핑이 실제로 스케줄 확정을 받아들일 수 있는가(도메인·결제·입금 전제)”** 는 서로 다른 축이다. 오케스트레이션 SSOT와 구현 스냅샷에 따르면 다음이 성립한다.

- **스케줄 신규 생성 자격(백엔드·UI 정합)**: **ADMIN·STAFF**만 신규 일정 등록이 가능하고, **CONSULTANT**는 기존 일정 이동·편집만 가능하다. 백엔드는 `canRegisterScheduler`로 판정하고, 캘린더는 `editable`·`droppable` 구성이 이와 맞춰진다.
- **일정 슬롯 확정 API의 도메인 게이팅**: `createConsultantSchedule`(10인자 경로)는 저장 전 **`validateMappingForSchedule`**·**`validateRemainingSessions`** 를 호출한다. 실패 시 예외로 처리되며, 해당 경로는 **`@Transactional`** 범위에서 롤백된다.
- **표시 vs 전제의 괴리 위험**: UI·필터에서 슬롯이 예약 가능해 보여도, 매핑 훅·회기 전제(예: ACTIVE, 잔여 회기)와 어긋나면 서버에서 거절되거나, SSOT에서 경고하는 **“2xx와 회기 불일치”** 류의 운영 리스크가 남을 수 있다. 이는 **자격(역할)** 과 **입금·결제로 확정되는 회기/매핑 게이팅** 을 한 규칙으로 보지 말아야 함을 뜻한다.

입금·결제·ERP 쪽 **코드상 훅과 갭**은 [입금·ERP·환불 흐름 분석](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md)에 정리되어 있다(예: `confirm-payment`·`confirm-deposit`·매핑 상태 `PAYMENT_CONFIRMED` 등). 본 ADR은 그 문서의 **사실·갭 목록을 인용 수준**으로만 연결하며, 새로운 법적·회계 주장은 하지 않는다.

## Decision

- **레이어 분리(엔지니어링 기준)**: **(A) 역할·스케줄러 등록 자격**은 `DynamicPermissionService`/`canRegisterScheduler` 및 대응 UI로만 판정한다. **(B) 매핑·잔여 회기 등 스케줄 확정 불변 조건**은 `createConsultantSchedule` 경로의 사전 검증과 예외·트랜잭션 롤백으로 강제한다. **(C) 결제·입금·ERP 확정**은 별도 API·서비스 흐름에 두고, 통합 일정 일정 생성 단일 메서드가 “결제 완료”를 대체 증명하지 않는다.
- **ADMIN/STAFF vs CONSULTANT**: 신규 생성은 ADMIN/STAFF만; CONSULTANT의 변경은 기존 레코드 편집 범위로 한정한다(오케스트레이션 SSOT **구현 스냅샷**의 "역할·스케줄 생성·캘린더 상호작용" 소절과 동일).
- **사전 검증 실패**: `validateMappingForSchedule` 또는 `validateRemainingSessions` 실패 시 **해당 트랜잭션 롤백**으로 일관성을 유지한다(동일 SSOT **구현 스냅샷**의 "`createConsultantSchedule`·트랜잭션" 소절과 동일).

## Consequences

- 클라이언트의 “예약 가능” 표시와 서버 불변 조건을 **동일 SSOT**로 묶는 추가 배치(필터·훅·API 계약)가 없으면, 역할은 통과해도 도메인에서 거절되는 UX가 남을 수 있다. 완화는 SSOT의 컴포넌트·테스터 게이트와 함께 추적한다.
- 결제·입금·ERP는 [입금·ERP·환불 흐름 분석](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md)에 기술된 경로·갭과 교차 검토가 필요하며, “예약만 성공하고 회기·정산이 뒤늦게 어긋남”을 막으려면 이벤트 순서·상태 모델 합의가 PO·운영 측과 맞물린다.

### 가정(PO 검토)

- 제품 카피·화면 라벨에서 **“예약 자격”** 과 **“입금/결제 후 확정”** 을 사용자에게 어떻게 나눠 설명할지.
- `PAYMENT_CONFIRMED`·`DEPOSIT_PENDING` 등 매핑 상태와 통합 일정 **SCHEDULABLE** 표시의 **최종 상품 규칙**(표시는 하되 막을지, 아예 숨길지).
- confirm-payment 4인자 vs confirm-deposit의 ERP·프로시저 차이 등 **운영·회계가 요구하는 단일 진실** 보완 여부(기존 갭 문서 참고).

## References

- [통합 일정: 선예약·후결제 오케스트레이션](../project-management/INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md)
- [입금·ERP·환불 흐름 분석](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md)
