# 회기 승계·사이드바 상담사 변경 — 오케스트레이션 (2026-09-03)

**역할**: core-planner  
**브랜치**: `cursor/session-succession-counselor-edit-8e9c` (base: develop)  
**상태**: explore 완료 · debugger 원인 정리 · coder/tester 실행

---

## 1. 목표

1. 회기 승계 마법사에서 타깃 상담사를 소스와 다르게 선택·실행하면 타깃 매핑 상담사가 저장된다.
2. 이미 승계된 매칭을 통합스케줄 Side Peek(사이드바 상세)에서 열어 상담사를 수정·저장한다 (CONSULTANT fail-closed).
3. 저장 후 새로고침해도 유지 (write SSOT). 점유 스케줄 일괄 이전·결제 이전·`/mappings/transfer` 사용 금지.

## 2. 범위

| 포함 | 제외 |
|------|------|
| Wizard `targetConsultantId` 영속 검증·보완 | Flyway V003, Login #798, Production/main |
| Side Peek 상담사 수정 UI + write | `/mappings/transfer` 매핑 이관 |
| 점유 스케줄 비이전 유지 | CONSULTANT 일정 신규 등록 |
| Jest + Java unit 테스트 | 스케줄 bulk-move |

## 3. Write SSOT 인벤토리 (explore)

| 흐름 | Endpoint | Service | FE call site |
|------|----------|---------|--------------|
| 회기 승계 실행 | `POST /api/v1/admin/mappings/{id}/session-succession` | `SessionSuccessionServiceImpl.execute` → `findOrCreateTargetMapping` (`setConsultant(targetConsultant)`) | `SessionSuccessionWizardModal.handleExecute` (`targetConsultantId`) |
| 승계 미리보기 | `GET .../session-succession/preview` | `SessionSuccessionServiceImpl.preview` | Wizard `loadPreview` |
| 매칭 패키지 수정 | `PUT /api/v1/admin/mappings/{id}` | `AdminServiceImpl.updateMapping` — **consultantId 미반영** | `MappingEditModal` (패키지만) |
| 상담사 매핑 이관 (비범위) | `POST .../mappings/transfer` | `transferConsultant` (신규 매핑 생성) | ConsultantTransferModal |
| Side Peek 상담사 | **없음** | — | `MappingScheduleSidePeekContent` — **표시 전용** |

## 4. Before / 원인 (debugger)

| 증상 | 원인 유형 | 근거 |
|------|-----------|------|
| 승계 후 타깃 상담사 | BE+FE 경로 **이미 존재**. 실행 단위테스트 **부재** → 회귀 미고정. UI 라벨/헬퍼는 있으나 영속 단언 없음. | `SessionSuccessionRequest.targetConsultantId`, Wizard body, `findOrCreateTargetMapping` |
| 이미 승계 건 상담사 변경 | **UI read-only** + **backend ignore** | Side Peek `SafeText` only; `updateMapping`이 `dto.getConsultantId()` 미사용 |
| `/transfer` 재사용 불가 | out of scope + 스케줄/매핑 분기 모델 다름 | 신규 매핑 생성·기존 TERMINATED |

## 5. 분배실행 표

| Phase | Agent | 의존 | 전달 요지 |
|-------|-------|------|-----------|
| 0 | explore | — | Write SSOT 인벤토리 (완료) |
| 1 | core-debugger | 0 | UI-only vs payload drop vs BE ignore (완료) |
| 2 | core-coder | 1 | 아래 완료조건으로 패치 |
| 3 | core-tester | 2 | succession target consultant + sidebar consultant update 테스트 통과 |

### Phase 2 coder 완료 조건

1. `SessionSuccessionServiceImpl.execute` — 소스와 다른 `targetConsultantId`로 타깃 매핑 상담사 저장 단언 테스트.
2. `AdminServiceImpl.updateMapping`(또는 전용 메서드) — `consultantId` 제공 시 in-place `setConsultant`, 스케줄 일괄 이전 없음, 동일 (consultant,client) ACTIVE 충돌 시 거절, ERP 패키지 동기는 consultant-only 변경에 미호출.
3. `MappingScheduleSidePeekContent` — ADMIN/STAFF 상담사 선택·저장; CONSULTANT disabled/fail-closed; StandardizedApi; 저장 후 목록/peek 갱신.
4. 점유 배너·결제 비이전 카피 유지. 하드코딩 색상 금지(토큰/`#0E5F5A` dusty teal은 MGButton/Clinic-OS 기존 패턴 준수).
5. 표준: `docs/standards/FRONTEND_DEVELOPMENT_STANDARD.md`, `BACKEND_CODING_STANDARD.md`, `API_CALL_STANDARD.md`, hardcode gate §17 / §1.3.

## 6. 리스크

- (consultant, client) UNIQUE/ACTIVE 충돌 시 UX 메시지 필요.
- mapping.consultant만 바꾸면 기존 스케줄 `consultantId`와 불일치 — **의도**(점유분 원당사자 유지).
- `updateMapping` 확장 시 패키지 수정 경로 회귀.
