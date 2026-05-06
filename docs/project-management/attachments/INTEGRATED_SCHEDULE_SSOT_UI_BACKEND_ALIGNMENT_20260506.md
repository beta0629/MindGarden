# 통합 일정: SSOT(UI·API·역할) 정합 메모

**작성일**: 2026-05-06  
**역할**: core-component-manager (제안·문서화 전용; 본 문서 외 소스 미변경)

---

## 1. SSOT 원칙(단일 데이터·권한 소스)

통합 일정(Integrated Schedule)에서 다음은 **하나의 권한·비즈니스 규칙 소스**에서 파생되어야 한다. UI만 완화하거나, 클라이언트만 엄격하게 만들어 **서버와 다른 “예약 가능” 체험**이 나오면 안 된다.

| 관심사 | SSOT 요지 |
|--------|-----------|
| **예약 가능(매핑 단위)** | 매핑 상태·잔여 회기 등 **동일 전제**를 API 사전 검증과 카드/캘린더 표현이 공유해야 한다. |
| **드래그·드롭** | 외부에서 캘린더로의 **신규 생성** vs **기존 일정 이동**은 역할·권한 판정과 일치해야 한다. |
| **역할(ADMIN/STAFF vs CONSULTANT)** | 신규 스케줄 등록 가능 여부는 백엔드 권한과 캘린더 `editable` / `droppable` 구성이 **같은 규칙**을 반영해야 한다. |

구체적 엔지니어링 분해(결제·입금 vs 스케줄 자격 등)는 ADR·오케스트레이션 문서의 SSOT와 맞춘다.

---

## 2. 이미 구현된 정합 — 참조 링크(상대경로)

아래는 **당시점 코드·문서와의 정합**을 확인할 때의 앵커다. (경로는 본 첨부 파일 기준 상대경로)

| 주제 | 참조 |
|------|------|
| `canRegisterScheduler` (인터페이스) | [`../../../src/main/java/com/coresolution/consultation/service/DynamicPermissionService.java`](../../../src/main/java/com/coresolution/consultation/service/DynamicPermissionService.java) |
| `canRegisterScheduler` (구현) | [`../../../src/main/java/com/coresolution/consultation/service/impl/DynamicPermissionServiceImpl.java`](../../../src/main/java/com/coresolution/consultation/service/impl/DynamicPermissionServiceImpl.java) |
| 캘린더 `editable` / `droppable` (역할 헬퍼와 연동) | [`../../../frontend/src/components/ui/Schedule/ScheduleCalendarView.js`](../../../frontend/src/components/ui/Schedule/ScheduleCalendarView.js) |
| 통합 스케줄 페이지(문서·구현 스냅샷과의 짝) | [`../../../frontend/src/components/schedule/SchedulePage.js`](../../../frontend/src/components/schedule/SchedulePage.js) |
| `canScheduleForMapping` (상수·주석·백엔드 정합 언급) | [`../../../frontend/src/components/admin/mapping-management/constants/integratedScheduleSidebarFilterConstants.js`](../../../frontend/src/components/admin/mapping-management/constants/integratedScheduleSidebarFilterConstants.js) |
| 사이드바 카드·드래그 가능 플래그 사용처 | [`../../../frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js`](../../../frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js) |
| 오케스트레이션 **§11 구현 스냅샷**(역할·캘린더·`canScheduleForMapping`·소스 목록) | [`../INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md`](../INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md) (문서 내 "11. 구현 스냅샷") |
| ADR: 스케줄 자격 vs 결제·입금 게이팅 | [`../../adr/adr-0001-scheduling-eligibility-vs-payment-deposit-gating.md`](../../adr/adr-0001-scheduling-eligibility-vs-payment-deposit-gating.md) |
| ADR: 잔여 회기·매핑 상태와 프론트 `canScheduleForMapping` | [`../../adr/adr-0002-session-remaining-and-mapping-status-transitions.md`](../../adr/adr-0002-session-remaining-and-mapping-status-transitions.md) |

---

## 3. 모달·필터 이중화 위험(서버 재필터 vs 클라이언트)

목록·필터·모달이 **서버에서 한 번 걸러진 결과**와 **클라이언트에서 다시 같은 조건으로 걸러진 결과**를 동시에 쓰면, 빈 화면·역전된 “예약 가능” 표시·모달 스냅샷 불일치가 생기기 쉽다. **core-coder** 위임 시 아래를 체크리스트로 통과시킬 것.

1. **소유층 명시**: 해당 필터/자격 조건의 **주 진실(source of truth)** 이 서버인지 클라이언트인지 한 줄로 문서·코멘트에 고정한다.  
2. **조건 단일화**: 동일한 상태값·임계값(예: 잔여 회기, 매핑 상태 열거)이 양측에 흩어져 있으면, 공유 상수·생성된 타입·서버 스키마와의 diff를 점검한다.  
3. **이중 필터 회피**: API가 이미 제한된 집합을 반환하는 경우, 클라이언트에서 동일 제한을 **중복 적용**하지 않도록 호출 경로·상태 흐름을 추적한다.  
4. **모달 스냅샷 vs 목록 갱신**: 모달 오픈 시점의 엔티티와, 저장/웹소켓/폴링 후 목록의 엔티티가 SSOT와 충돌하지 않는지(낙관적 UI 포함) 시나리오를 적어둔다.  
5. **회귀 검증**: `core-tester` 게이트에 “API 응답 한 건 + 동일 조건 UI 표시” 쌍을 최소 1세트 포함한다.

---

## 4. UnifiedModal·표시 경계

모달 패턴 및 `safeDisplay` 등 **표시 경계**는 아래 회의 문서만 참조한다. (본 메모에서 세부 규칙을 복사하지 않음.)

- [`../COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`](../COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md)

---

## 5. 축별 정합 상태(현재 문서·코드 기준으로 알려진 범위)

| 축 | 현재 알려진 정합 상태 |
|----|------------------------|
| **역할** | ADMIN·STAFF vs CONSULTANT의 **신규 등록 vs 이동·편집**은 `canRegisterScheduler` 및 ADR-0001·오케스트레이션 §11.1과 같은 전제로 정리됨. |
| **UI** | `ScheduleCalendarView`에서 `editable` / `droppable`이 역할 헬퍼(`isScheduleCalendarEditableRole`, `isScheduleDropAdminRole`)에 연결되어 §11.1 서술과 대응됨. |
| **API** | 일정 생성 경로의 사전 검증(`validateMappingForSchedule`, `validateRemainingSessions` 등)과 트랜잭션 경계가 §11.2·관련 ADR과 함께 “서버 측 강제”로 기술됨. `canScheduleForMapping`은 프론트 상수·주석에서 백엔드 `createConsultantSchedule` 전제와 정합을 지향한다고 명시됨(실제 런타임 일치는 변경 시마다 테스트로 재확인). |

---

**다음 액션(역할 분담)**: 배치·통합 실행은 **core-coder**, 검증은 **core-tester**, 본 메모·인벤토리 갱신은 **core-component-manager**와 협업.
