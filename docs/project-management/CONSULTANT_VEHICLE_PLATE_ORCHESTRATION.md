# 상담사 차량번호 + 통합스케줄 표시 — 오케스트레이션

**브랜치**: `cursor/consultant-vehicle-number-21cd` (base: `develop`)  
**주관**: core-planner  
**작성**: 2026-09-04

## 1. 목표

상담사에도 차량번호를 등록·수정하고, 통합스케줄에서 상담사 차량번호를 구분해 표시한다. 내담자 차량 SSOT를 재사용·확장한다.

## 2. 범위

### 포함
- DB: `consultants.vehicle_plate VARCHAR(32) NULL` (Flyway, clients와 동일 컬럼명)
- BE: Consultant 엔티티·등록/수정 DTO·Admin CRUD·(가능 시) 마이페이지 UserProfile 경로
- 스케줄 enrichment: consultantId→vehiclePlate **배치 맵**, `ScheduleResponse.consultantVehiclePlate`
- FE: 상담사 등록/수정 모달 입력, 통합스케줄 Side Peek·Detail Modal·카드/툴팁 표시
- i18n: ko admin/schedule 키 확장

### 제외
- 표시용 가짜 채우기, 주민번호·상세주소 노출, main 수정, N+1 건별 조회

## 3. 사용자 관점 (§0.4)

| 항목 | 내용 |
|------|------|
| 사용성 | 관리자/사무원이 상담사 모달에서 내담자와 동일 패턴으로 차량 등록. 통합스케줄에서 주차 등록 시 즉시 확인 |
| 정보 노출 | 운영자(관리자·사무원) 스케줄/사이드바에 상담사·내담자 차량 구분 표시. fail-closed 권한 |
| 레이아웃 | ClientModal 패턴·Clinic-OS. Side Peek에 상담사 차량 라벨 별도. 빈 값 숨김 또는 「미등록」 |

## 4. SSOT (코드 확인)

- `consultants` = JOINED 자식 (`Consultant extends User`) → **컬럼은 `consultants.vehicle_plate`**
- 내담자: `clients.vehicle_plate`, `VehiclePlateText`, `@VehiclePlateOptional`, `buildVehiclePlateByClientId`
- FE: `ClientModal`, `MappingScheduleSidePeekContent`, `ScheduleDetailModal`, `UnifiedScheduleComponent`
- 상담사 UI: `ConsultantComprehensiveManagement.js` (create/edit 모달, `/api/v1/admin/consultants`)

## 5. 분배실행

| Phase | 담당 | 의존 | 목표 |
|-------|------|------|------|
| 1 | **core-coder** | — | DB·BE·FE·i18n 구현, 커밋·푸시 |
| 2 | **core-tester** | Phase 1 | 단위/회귀·N+1·내담자 차량 회귀 |
| 3 | **core-planner** | Phase 2 | 취합 최종 보고 |

---

## Phase 1 — core-coder 전달 프롬프트 (전문)

```
역할: core-coder. 아래 기능만 구현·커밋·푸시. 범위 외 리팩터 금지.

브랜치: cursor/consultant-vehicle-number-21cd (이미 체크아웃, base develop)
repo: beta0629/MindGarden
작업 후: git add → commit(명확한 메시지) → git push -u origin cursor/consultant-vehicle-number-21cd
(Cloud Agent 요구. force push/amend 금지)

## 목표
상담사 차량번호 저장·조회 + 통합스케줄에 상담사 차량번호 표시.
내담자 차량 SSOT 재사용. 하드코딩·N+1·main 수정 금지.

## DB 결정 (확정)
- Consultant extends User, InheritanceType.JOINED → 컬럼은 consultants 테이블.
- Flyway: consultants.vehicle_plate VARCHAR(32) NULL
- 패턴: src/main/resources/db/migration/V20260328_001__add_vehicle_plate_to_clients.sql
  (INFORMATION_SCHEMA 가드, 이미 있으면 스킵)
- MySQL UPDATE…JOIN…SET 가드 준수. 파일명: VYYYYMMDD_NNN__add_vehicle_plate_to_consultants.sql

## BE
1. Consultant 엔티티에 vehiclePlate (@Column vehicle_plate length 32) — Client.java 대칭
2. ConsultantRegistrationRequest / 수정 DTO / Admin 상담사 CRUD에 vehiclePlate
   - VehiclePlateText.normalizeOrNull, @VehiclePlateOptional 재사용
3. (확장) UserProfileUpdateRequest + UserProfileResponse + UserProfileServiceImpl
   applyConsultantProfileToEntity / 조회 응답에 vehiclePlate — 기존 권한 fail-closed 유지
4. Schedule enrichment (N+1 금지):
   - buildVehiclePlateByClientId 대칭: buildVehiclePlateByConsultantId(tenantId, schedules)
   - ScheduleResponse에 consultantVehiclePlate (기존 vehiclePlate=내담자 유지, 충돌 금지)
   - ScheduleServiceImpl / ScheduleController / AdminServiceImpl 스케줄·매핑 Map 경로
     (getAllMappings 배치, scheduleMap에 consultantVehiclePlate)
5. 테넌트 경계 유지. 화면 용어는 「센터」

## FE
1. ConsultantComprehensiveManagement.js create/edit 모달: ClientModal 차량번호 입력 패턴
   - validationUtils normalize/isValid, i18n 키, Clinic-OS (MGButton·토큰), 커스텀 hex/이모지/SVG 금지
2. 통합스케줄 표시 (운영자 뷰):
   - MappingScheduleSidePeekContent, ScheduleDetailModal, UnifiedScheduleComponent extendedProps
   - 라벨로 상담사/내담자 구분. 빈 값 숨김 또는 「미등록」(i18n)
   - 내담자 vehiclePlate 회귀 금지. SafeText/toDisplayString (safeDisplay)
3. i18n: frontend/src/locales/ko/admin.json (및 schedule 관련) 키 확장. 하드코딩 라벨 금지
4. 매핑/스케줄 상태 갱신 시 consultantVehiclePlate 필드 반영

## 참조 (필수)
- docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md
- docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md
- docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md §17
- docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md §1.3
- docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md
- docs/standards/*.md (backend/frontend/api 해당분)
- 스킬: /core-solution-backend, /core-solution-frontend, /core-solution-api,
  /core-solution-multi-tenant, /core-solution-database-first, /core-solution-code-style,
  /core-solution-encapsulation-modularization, /core-solution-standardization

## 주요 경로
- Entity: src/main/java/.../entity/Consultant.java, Client.java
- Util: VehiclePlateText, @VehiclePlateOptional
- Schedule: ScheduleServiceImpl (buildVehiclePlateByClientId ~3070), ScheduleResponse, ScheduleController
- Admin: AdminServiceImpl (buildVehiclePlateByClientIdForSchedules ~6905, getAllMappings)
- DTO: ConsultantRegistrationRequest, UserProfileUpdateRequest
- FE: ConsultantComprehensiveManagement.js, ClientModal.js,
  MappingScheduleSidePeekContent.js, ScheduleDetailModal, UnifiedScheduleComponent,
  VehiclePlateQuickRegisterModal (내담자용 — 상담사 퀵등록은 범위 외, 표시만)
- i18n: frontend/src/locales/ko/admin.json (vehiclePlate* 키)

## 완료 조건
- [ ] consultants.vehicle_plate Flyway 추가
- [ ] 상담사 등록/수정 API로 vehiclePlate 저장·조회
- [ ] ScheduleResponse.consultantVehiclePlate 배치 enrichment (N+1 없음)
- [ ] Admin mappings/schedules Map에 consultantVehiclePlate
- [ ] 상담사 모달 입력란 + i18n
- [ ] 통합스케줄 Side Peek/Detail 등에 상담사 차량 표시 (라벨 구분)
- [ ] 내담자 vehiclePlate 기존 동작 유지
- [ ] 하드코딩 게이트(§17/§1.3) 준수
- [ ] 커밋·푸시 완료
- [ ] 변경 파일 목록·저장 필드·표시 위치를 기획(부모)에 보고

## 하지 말 것
가짜 채우기, 주민번호·상세주소 노출, 상담사별 round-trip, main 수정, 범위 외 대규모 리팩터
```

---

## Phase 2 — core-tester 전달 프롬프트 (전문)

```
역할: core-tester. Phase 1(상담사 차량번호) 구현 검증. 코드 수정 금지(실패 시 재현·로그만 보고 → 기획이 coder 재위임).

브랜치: cursor/consultant-vehicle-number-21cd

## 검증 항목
1. 단위/관련 테스트 실행 (기존 Client vehiclePlate 테스트 + 신규 Consultant/Schedule 테스트)
2. 회귀: 내담자 vehiclePlate 저장·표시·Side Peek 퀵등록 경로 깨지지 않음
3. 통합스케줄: consultantVehiclePlate가 Side Peek / Detail Modal / extendedProps에 노출
   - 라벨 상담사/내담자 구분, 빈 값 처리
4. N+1: 스케줄 목록 enrichment가 배치 맵인지 코드/테스트로 확인 (consultantId별 개별 조회 없음)
5. 권한 fail-closed: 기존 상담사 편집 권한과 동일
6. 콘솔 React #130 / Objects as child 0건 (safeDisplay)
7. 하드코딩 리터럴 상태·요율·페이지 hex 없음

스킬: /core-solution-testing
통과/실패·실행 명령·로그 요약을 기획에 보고.
```

## 6. 완료 기준 (제품)

- 상담사 차량번호 저장·조회 가능
- 통합스케줄에 상담사 차량번호 표시
- 내담자 차량 회귀 없음
- 테스트 통과

## 7. 최종 보고 시 포함할 항목

- 저장 필드(테이블.컬럼 / DTO)
- 표시 위치(Side Peek / Detail Modal / 등)
- 테스트 결과
- 변경 파일 목록
- PR 본문용 초안
