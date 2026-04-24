# 예약 × 카카오 알림톡 — 오케스트레이션 체크리스트 (SSOT)

**목적**: 예약 **확정·변경·(선형) 취소**와 연동된 **카카오 알림톡(비즈메시지)** 구현을 **누락 없이** 진행하기 위한 단일 체크리스트.  
**주관**: `core-planner` — 구현·패치는 `core-coder`, 검증 게이트는 `core-tester` (`docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`).  
**최종 갱신**: 2026-04-23 — §2~§4 explore·designer·component-manager 병렬 산출 반영

**연계 문서**

| 문서 | 용도 |
|------|------|
| `docs/standards/NOTIFICATION_SYSTEM_STANDARD.md` | 알림 채널·우선순위·표준 |
| `docs/project-management/ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md` | 전체 진행도·병렬 블록 표 |
| 본 문서 §7 병렬 위임 결과 | explore / designer / component-manager 산출 요약(채움) |

**기존 구현(코드 기준)**

- `KakaoAlimTalkServiceImpl` — `kakao.alimtalk.*`, `simulation-mode`, bizmsg URL
- `NotificationServiceImpl` — HIGH 시 알림톡 → SMS 등 폴백
- 멀티테넌트·로그 마스킹·하드코딩 게이트는 배치 전 `docs/standards/`·운영 체크리스트 준수

---

## 1. 사전 결정 (회의/승인 — 미체크 시 구현 착수 지양)

- [ ] **P0 범위**: 예약 **확정만** vs **변경·취소** 포함
- [ ] **수신자 매트릭스**: 이벤트(확정/변경/취소) × 역할(내담자/상담사/지점관리자) on/off 표 확정
- [ ] **카카오 템플릿**: 이벤트별 **템플릿 코드**·검수 상태·치환 변수 목록(카카오 비즈센터 기준)
- [ ] **정보성 vs 광고성** 문구 분류(법무·정책 한 줄)
- [ ] **수신 동의**: 알림톡 발송에 필요한 동의·저장 위치(DB 필드 vs 공통코드)
- [ ] **야간 발송**: 즉시 vs 지연 큐·차단 시간대
- [ ] **환경**: `simulation-mode` 유지 환경 / 실발송 허용 환경 구분(GitHub Secrets·`application-*.yml`)
- [ ] **실패 폴백**: 알림톡 실패 시 SMS 등 기존 `NotificationServiceImpl` 경로와의 정합
- [ ] **멱등·중복 방지**: 동일 `reservationId`+이벤트+수신자 창 내 재발송 방지 키 설계 여부

---

## 2. 인벤토리 단계 (explore 산출 → 본 섹션에 경로 붙여 넣기)

- [x] 예약 **확정** 유스케이스 진입 **서비스/메서드** 목록 *(2026-04-23 explore)*
- [x] 예약 **변경** 유스케이스 진입 목록
- [x] 예약 **취소**(범위에 넣는 경우) 진입 목록
- [x] 기존 **SMS/이메일/시스템 알림** 호출과의 중복·순서
- [x] 프론트에서 예약 확정/변경을 트리거하는 **API** 목록
- [x] `tenantId` 전달·`TenantContextHolder` 보장 경로(스케줄러 아님 동기 요청 기준)

**인벤토리 결과 요약** *(explore, 2026-04-23)*

### A. 예약 확정 (Java)

| 구분 | 엔드포인트 / 서비스 | 알림톡·`NotificationService` |
|------|---------------------|------------------------------|
| 스케줄 관리자 확정 | `ScheduleController` `PUT .../schedules/{id}/confirm` → `ScheduleServiceImpl.confirmSchedule` | **없음** |
| 상담(Consultation) 확정 | `ConsultationController` `POST .../consultations/{id}/confirm` → `ConsultationServiceImpl.confirmConsultation` → `sendConsultationConfirmation` | **이메일 템플릿만** (`emailService`). 알림톡/SMS/`NotificationService` 없음 |
| 학원 상담 확정 | `AcademyConsultationController` `POST .../academy/consultations/{id}/confirm` → 동일 `confirmConsultation` | 동일 |
| 주의 | `ConsultantController` `POST .../consultants/{id}/consultations/{consultationId}/confirm` → `ConsultantServiceImpl.confirmConsultation` | **스tub** — `ConsultationService`·알림 미연동 |

### B. 예약 변경

| 구분 | 엔드포인트 / 서비스 | 비고 |
|------|---------------------|------|
| 상담 리스케줄 | `ConsultationController` `PUT .../consultations/{id}/reschedule` → `ConsultationServiceImpl.rescheduleConsultation` | 변경 알림은 **이메일** 경로 |
| 스케줄 수정 | `ScheduleController` `PUT .../schedules/{id}` 또는 `.../consultant/{consultantId}/{scheduleId}` → `ScheduleServiceImpl.updateSchedule` | 일반 경로에 **Notification/Kakao/SMS 없음** |

### C. 예약 취소

| 구분 | 엔드포인트 / 서비스 | 비고 |
|------|---------------------|------|
| 상담 취소 | `ConsultationController` `POST .../cancel` → `cancelConsultation` | 이메일 `sendConsultationChangeNotification` |
| 학원 | `AcademyConsultationController` `POST .../cancel` | 동일 |
| `ScheduleServiceImpl.cancelSchedule` | 서비스에만 존재, 일반 REST에서 컨트롤러 호출 **미검출** | 테스트 등에서만 호출 가능성 |
| 주의 | `ConsultantController` 상담 취소 | `ConsultantServiceImpl` **스tub** |

### D. Notification / Kakao / SMS 와 예약

- 예약 확정·변경·취소 **직접 경로에서는 `NotificationServiceImpl` 미사용**. `sendConsultationConfirmed` / `sendScheduleChanged` 등은 **타 호출처 없음**(인터페이스·구현만 존재).
- 인접: `ScheduleServiceImpl.createSchedule`의 `consultationMessageService.sendMessage`(인앱), `WorkflowAutomationServiceImpl` 리마인더(홀더에 `tenantId` 설정 후 메시지), `completeSchedule` 내 메시지.

### E. 프론트 예약 REST (주요)

`frontend/src/constants/api.js`, `apiEndpoints.js`, `frontend/src/components/schedule/*` (`ScheduleDetailModal.js`, `ScheduleModal.js`, `RescheduleScheduleModal.js`, `UnifiedScheduleComponent.js` 등), `frontend/src/utils/scheduleRescheduleUtils.js`.

### F. `TenantContextHolder` (동기 요청)

- 스케줄: `findById` 등 `getRequiredTenantId()` 사용. `ScheduleController` 일부는 `ensureTenantContextFromSession`.
- 상담: `findActiveById`는 tenantId null이면 예외. `ConsultationController`의 confirm/cancel/reschedule에는 메서드 내 `bindTenantContext` 없음 → **전역 필터·세션 전제**.
- `createSchedule`은 tenantId 없을 때 비테넌트 `save` 분기 가능.

---

## 3. 설계·문구 (core-designer 산출)

- [x] 역할별 **알림톡 문안**(변수 자리 표시자 포함) 초안 *(2026-04-23 core-designer)*
- [x] 앱 내 **사전 안내·동의** 노출이 필요한지 여부 및 화면(또는 설정) 와이어 수준
- [x] 실패 시 사용자에게 보여줄 **앱 내 메시지**(알림톡 실패는 비가시일 수 있음) 정책
- [x] B0KlA / AdminCommonLayout 등 **레이아웃 표준** 준수 여부(설정 화면을 만드는 경우)

**디자인 산출 링크·요약** *(core-designer, 2026-04-23)*

### 3.1 이벤트별 알림톡 변수(제안)

카카오 템플릿 치환은 보통 `#{변수명}` — 백엔드 매핑용 **스네이크 케이스** 제안.

**공통:** `brand_name`, `tenant_name`, `client_display_name`, `consultant_display_name`, `reservation_datetime`, `reservation_id_short`(선택), `service_label`, `location_summary`, `manage_url_hint`, `tenant_cs_phone`(선택).

- **확정** `reservation_confirmed`: + `confirmed_at`(선택).
- **변경** `reservation_changed`: + `previous_datetime`, `new_datetime`, `changed_field_summary`, `changed_at`(선택).
- **취소** `reservation_cancelled`(선택): + `cancelled_datetime`, `cancelled_at`, `cancel_actor_label`(정책 허용 시), `cancel_reason_public`(정보성만; 민감 시 변수 생략·고정문구).

### 3.2 역할별 문안 초안(정보성, 약 80자 내외)

| 역할 | 확정 | 변경 | 취소 |
|------|------|------|------|
| 내담자 | `[#{brand_name}] #{tenant_name} #{reservation_datetime} 상담이 확정됐어요. 담당 #{consultant_display_name}님. #{manage_url_hint}` | `[#{brand_name}] 예약이 변경됐어요. #{previous_datetime}→#{new_datetime} (#{tenant_name}). #{manage_url_hint}` | `[#{brand_name}] #{reservation_datetime} 상담 예약이 취소 처리됐어요. (#{tenant_name}) #{manage_url_hint}` |
| 상담사 | `[#{brand_name}] #{client_display_name}님 #{reservation_datetime} 예약이 확정됐어요. (#{tenant_name}) #{manage_url_hint}` | `[#{brand_name}] #{client_display_name}님 일정 변경: #{previous_datetime}→#{new_datetime}. (#{tenant_name})` | `[#{brand_name}] #{client_display_name}님 #{reservation_datetime} 예약이 취소됐어요. (#{tenant_name})` |
| 지점 관리자 | `[#{brand_name}] #{client_display_name}-#{consultant_display_name} #{reservation_datetime} 예약 확정. (#{tenant_name})` | `[#{brand_name}] #{client_display_name} 예약 변경: #{previous_datetime}→#{new_datetime}. (#{tenant_name})` | `[#{brand_name}] #{client_display_name} #{reservation_datetime} 예약 취소. (#{tenant_name})` |

### 3.3 동의·안내 화면(와이어)

| 대상 | 위치 | 레이아웃 |
|------|------|----------|
| 내담자 | 가입/최초 예약 + **마이페이지 알림·연락처** | B0KlA 톤(섹션 블록·라벨). 모바일 단일 컬럼·`ContentHeader` 정렬 |
| 상담사·관리자 | **어드민** 최초 안내 또는 프로필/알림 설정 | **AdminCommonLayout** + B0KlA 섹션 블록 |

문구 예: `예약 확정·변경·취소 안내는 카카오 알림톡으로 발송될 수 있어요. 수신 거부 시에도 앱에서 예약 내역은 확인할 수 있어요.` (법무 확정 문구로 치환)

### 3.4 실패 시 앱 내 피드백(권장)

알림톡 단독 실패는 **별도 토스트 없이**, 예약 작업 **성공 후** “처리 완료” + **「내 예약에서 최종 일정 확인」** 한 줄 안내 수준.

---

## 4. 컴포넌트·중복 (core-component-manager — 제안만)

- [x] 기존 알림·마이페이지·설정에 **중복 UI** 없이 흡수 가능한지 *(2026-04-23 core-component-manager)*
- [x] 신규 화면이 필요하면 **어느 레이어**(atom/molecule) 후보인지 제안 목록

**제안 요약** *(core-component-manager, 2026-04-23)*

#### 관련 경로(grep 수준)

| 구분 | 경로 |
|------|------|
| 마이페이지 셸 | `frontend/src/components/mypage/MyPage.js` |
| 마이페이지 알림(로컬 토글) | `mypage/components/SettingsSection.js` |
| 동의(API+모달) | `mypage/components/PrivacyConsentSection.js` — `UnifiedModal` |
| 내담자 설정(API) | `client/ClientSettings.js` — `/client/settings`, `AdminCommonLayout` |
| 리다이렉트 | `common/MypageSettingsRedirects.jsx`, `utils/roleMypageSettingsPaths.js` |
| 레거시 | `settings/UserSettings.js` — `SimpleLayout`, 라우트 연결 약함 |
| 예약 UI | `schedule/ScheduleDetailModal.js` 등 — `UnifiedModal`, 알림톡 동의 UI 없음 |

#### 중복 요약

- **채널 UI 이중·삼중:** `ClientSettings`(API) vs `SettingsSection`(로컬) vs `UserSettings`(레거시). **신규 알림톡만 각각에 붙이면 중복 가중.**
- **카카오 알림톡 전용 UI:** 현재 **없음**.

#### 최소 중복 부착안

| 안 | 내용 |
|----|------|
| **A** | `ClientSettings` + 마이페이지 `SettingsSection`을 **동일 API·동일 molecule**로 수렴 후, 「정보성 카카오 알림톡(예약)」행 추가 |
| **B** | `PrivacyConsentSection` 인접 카드에 수신 동의(정보성 vs 광고 분리, 백엔드 동의 모델과 정합) |
| **C** | `ScheduleDetailModal` 확정 본문에 1회 안내(설정 화면과 이중 노출 시 정책으로 한쪽만) |

**레이어:** 신규 Page보다 **`common/molecules` 수준 재사용 행**(채널 스위치 패턴)을 A안 두 셸에 주입.

**정합 한 줄:** 마이페이지·내담자는 `AdminCommonLayout`+B0KlA; 동의는 `UnifiedModal` 정착. `UserSettings`(`SimpleLayout`)는 **레거시 후보**.

---

## 5. 구현 게이트 (core-coder — 체크리스트만; 완료 시 ☑)

- [ ] 서비스 레이어 **후킹**(컨트롤러 직접 발송 지양), **트랜잭션 커밋 후** 발송 여부 반영
- [ ] `NotificationServiceImpl` / `KakaoAlimTalkServiceImpl` 연계·**템플릿 파라미터** 매핑
- [ ] **테넌트별** 템플릿/채널 매핑 저장소(설정·DB)와 하드코딩 **금지**
- [ ] 로그 **전화번호 마스킹**·에러 시 민감정보 미출력
- [ ] 멱등/중복 방지(§1 결정 반영)
- [ ] `NOTIFICATION_SYSTEM_STANDARD.md`와 충돌 없음

---

## 6. 검증·배포 (core-tester / core-deployer)

- [ ] **core-tester**: 단위·통합·(가능 시) E2E — 시뮬레이션 모드에서 발송 경로 스모크
- [ ] **core-tester 게이트**: 코드 변경 배치는 테스트 통과 전 완료 보고 금지
- [ ] **core-deployer**: Secrets(`kakao.alimtalk.*`)·프로파일별 `simulation-mode`·릴리즈 노트
- [ ] 운영 반영 시 `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` 해당 항목 점검

---

## 7. 병렬 위임 배치 (2026-04-23)

| 트랙 | 서브에이전트 | 산출물 | 반영 |
|------|----------------|--------|------|
| A | **explore** | 예약 확정·변경·취소·Notification 관계·프론트 API·TenantContext | ☑ §2 |
| B | **core-designer** | 변수표·역할별 문안·동의 화면·실패 시 UX | ☑ §3 |
| C | **core-component-manager** | 설정 UI 경로·중복 분석·부착안 A/B/C | ☑ §4 |

**다음 순서(병렬 종료 후 직렬)**

1. `core-planner` 취합 → P0 범위·템플릿 코드 확정  
2. `core-coder` 구현 위임(§5)  
3. `core-tester` → `core-deployer`

---

## 8. 완료 정의 (P0 / P1)

| 단계 | 완료 정의 |
|------|-----------|
| **P0** | 예약 **확정** 1경로에서 알림톡(또는 시뮬) 호출 + 폴백 + 마스킹 + **테스터 게이트** |
| **P1** | 변경·취소·수신자 매트릭스·멱등·회귀 테스트 |

---

## 9. 갱신 규칙

- 배치·회의가 있을 때마다 **본 문서**의 해당 ☑·요약을 갱신한다.
- `ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md`의 **병렬 블록 표**에 `RESV-ALIM-*` 행을 두고, 상태·커밋·잔여 링크를 그쪽에도 한 줄 동기화한다.
