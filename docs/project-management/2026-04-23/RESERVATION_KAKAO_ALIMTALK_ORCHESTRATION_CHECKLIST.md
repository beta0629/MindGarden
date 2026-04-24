# 예약 × 카카오 알림톡 — 오케스트레이션 체크리스트 (SSOT)

**목적**: 예약 **확정·변경·(선형) 취소**와 연동된 **카카오 알림톡(비즈메시지)** 구현을 **누락 없이** 진행하기 위한 단일 체크리스트.  
**주관**: `core-planner` — 구현·패치는 `core-coder`, 검증 게이트는 `core-tester` (`docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`).  
**최종 갱신**: 2026-04-23 — §11 테넌트 DB·온보딩 기획(core-planner) 반영

**연계 문서**

| 문서 | 용도 |
|------|------|
| `docs/standards/NOTIFICATION_SYSTEM_STANDARD.md` | 알림 채널·우선순위·표준 |
| [`docs/tenant-guides/kakao-alimtalk-tenant-onboarding.md`](../../tenant-guides/kakao-alimtalk-tenant-onboarding.md) | **타 테넌트·운영자** 카카오 알림톡 등록·설정 절차(온보딩) |
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
- [ ] **테넌트별 DB 설정**: 테이블(또는 기존 테넌트 설정 확장)명·`tenant_id` 유니크·1테넌트당 행 수(단일 vs 이벤트별)
- [ ] **DB vs 전역 우선순위**: 비시크릿 필드(템플릿 코드·on/off 등)는 **DB 우선·미설정 시 `application.yml`/공통코드 폴백** 규칙 확정
- [ ] **시크릿 저장**: `api_key`/`sender_key` **DB 평문 금지** — KMS·Secrets Manager·**참조 ID(`secret_ref`)만 DB** 등 팀 표준 확정
- [ ] **설정 UI·권한**: 누가 입력하는지(OPS vs 테넌트 슈퍼관리자)·화면 위치(`SystemConfigManagement` 확장 vs 신규 페이지)
- [ ] **캐시·무효화**: 테넌트 설정 조회 캐시 TTL 또는 저장 API 시 무효화
- [ ] **문서 SSOT**: 온보딩은 [tenant-guides/kakao-alimtalk-tenant-onboarding.md](../../tenant-guides/kakao-alimtalk-tenant-onboarding.md), 표준은 `NOTIFICATION_SYSTEM_STANDARD.md`에 링크 절만 보강할지

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

- [x] 서비스 레이어 **후킹** — `ConsultationServiceImpl`·`ScheduleServiceImpl.confirmSchedule`에서 `NotificationService` 비차단 호출(2차 병렬 코더)
- [ ] **트랜잭션 커밋 후** 발송(비동기/outbox) — 코드 주석 TODO, §1 확정 후
- [x] `NotificationServiceImpl` / `KakaoAlimTalkServiceImpl` 연계·`buildAlimTalkParams` 확장·`CONSULTATION_CANCELLED` 등
- [x] 비즈 템플릿 코드: 공통코드 그룹 **`ALIMTALK_BIZ_TEMPLATE_CODE`** 매핑(없으면 `NotificationType.name()` 폴백) — 하드코딩 URL·시크릿 없음
- [x] 로그 **전화번호 마스킹**·발송 실패가 본 트랜잭션 롤백 유발하지 않도록 try/catch
- [ ] 멱등/중복 방지(§1 결정 반영) — P1
- [ ] `NOTIFICATION_SYSTEM_STANDARD.md`와 **전수** 정합 리뷰 — 코더·리뷰어 확인

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
| D | **core-planner** | §1 권장 기본안·`core-coder` 위임 프롬프트·테스터·배포 bullet | ☑ §10.1 |
| E | **core-deployer** | `kakao.alimtalk.*` Secrets·환경별 simulation·journalctl·롤백 | ☑ §10.2 |
| F | **core-tester** | 검증 매트릭스·시나리오 12·게이트 문구·회귀 이메일 | ☑ §10.3 |
| G | **core-coder** | P0 연동·`ALIMTALK_BIZ_TEMPLATE_CODE`·스케줄/상담 확정·취소 알림·단위 테스트 | ☑ 워킹트리(커밋 전) |

**다음 순서(병렬 종료 후 직렬)**

1. §1 회의 확정(또는 권장안 채택) → 공통코드·비즈 템플릿 실값 반영  
2. **`core-tester`** 전 매트릭스·(가능 시) 통합/E2E — `CORE_PLANNER_DELEGATION_ORDER` 게이트  
3. **`core-deployer`** Secrets·프로파일·운영 점검  
4. 잔여: `ConsultantServiceImpl` 스tub 경로·멱등·야간 큐(P1)

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

---

## 10. 병렬 위임 2차 산출 (core-planner · core-deployer · core-tester · core-coder)

### 10.1 core-planner — §1 권장 기본안(요약)

- **P0**: 상담 **확정** 우선; 스케줄 관리자 확정 연동 포함 가능. 변경·취소 알림톡 확장은 **P1** 권장.  
- **수신자**: P0는 **내담자·상담사** on; 관리자는 P1.  
- **템플릿 코드**: 운영 진실은 비즈센터 코드 → `resolveTemplateCode(tenantId, event)` 계층 권장; 개발은 enum 폴백 허용.  
- **야간**: 즉시 커밋 + 발송은 시간대 가드 또는 지연 큐; MVP는 skip+로그.  
- **멱등**: P1에서 DB 유니크; P0는 최소 가드.  
- **위임 프롬프트**: 플래너 산출에 `core-coder`용 복붙 블록 포함(저장소 외부 채팅에 보관 가능).  
- **게이트**: `CORE_PLANNER_DELEGATION_ORDER.md` — **테스터 통과 전 배치 완료 금지**.

### 10.2 core-deployer — 배포·Secrets(요약)

- YAML: `kakao.alimtalk.enabled`, `simulation-mode`, `api-key`, `sender-key`, `api-url`.  
- Secrets 제안: `DEV_KAKAO_ALIMTALK_API_KEY`, `DEV_KAKAO_ALIMTALK_SENDER_KEY`, `PRODUCTION_*` 동형.  
- 실발송 게이트: 템플릿 검수·QA 번호 스모크·롤백(`simulation-mode=true` 또는 `enabled=false`).  
- 점검: `journalctl -u <unit> --no-pager | grep -E '알림톡|시뮬레이션|KakaoAlimTalk|bizmsg'` (Bearer·원번호 grep 금지).  
- `DEPLOYMENT_STANDARD.md`: 환경 분리·Actions·헬스·롤백 원칙 준수.

### 10.3 core-tester — 검증 매트릭스(요약)

- 레벨: 단위(`NotificationServiceImpl`, `KakaoAlimTalkServiceImpl`, 연동 후 `ConsultationServiceImpl`) / 통합(MockMvc) / (선택) E2E.  
- 시나리오: 확정·스케줄 변경·tenant 누락·폴백·옵트아웃·전화 없음·`ScheduleServiceImpl` 갭 회귀·취소·멱등(구현 시) 등 12건(플래너 산출본 참고).  
- **회귀**: 기존 **이메일** 발송 경로 유지.  
- 게이트 문구: 코더 배치 완료 보고 = **본 매트릭스 + 회귀 통과 후**만.

### 10.4 core-coder — 구현 착수 결과(로컬)

- **변경**: `KakaoAlimTalkService` 오버로드, `KakaoAlimTalkServiceImpl`, `NotificationService`/`Impl`, `ConsultationServiceImpl`, `ScheduleServiceImpl`, 테스트 3종 + `ScheduleServiceImplConfirmScheduleAlimTalkTest` 신규.  
- **검증**: `mvn -Dtest=ScheduleServiceImplConfirmScheduleAlimTalkTest,ScheduleServiceImplCancelRestoreSessionTest,ScheduleServiceImplUpcomingTest test` 통과.  
- **잔여 TODO**: §1 미결(실 템플릿 코드·야간·멱등·커밋 후 비동기), `ConsultantServiceImpl` 스tub 제외.

---

## 11. 테넌트별 카카오 알림톡 DB 설정·등록 기획 (core-planner, 2026-04-23)

### 11.1 목표

- 알림톡 관련 **비즈니스 설정**(템플릿 코드·테넌트 on/off 등)을 **`tenant_id` 단위로 DB에 저장**한다.  
- **전역 `kakao.alimtalk.*`**(및 Secrets)와의 **우선순위**를 문서·코드에서 동일하게 해석한다.  
- **다른 테넌트·운영자**가 따라 할 수 있도록 등록 절차는 **[온보딩 가이드](../../tenant-guides/kakao-alimtalk-tenant-onboarding.md)**에 둔다.

### 11.2 P0 / P1 (요구 범위)

| 구분 | 내용 |
|------|------|
| **P0** | 테넌트별 알림톡 **사용 여부**; 이벤트별 **비즈 템플릿 코드** 매핑(검수 완료 코드); DB·전역 **우선순위**; **시크릿 비평문**(ref만); 감사 컬럼 |
| **P1** | 발신 프로필 메타·폴백/야간 정책 **오버라이드**·시뮬레이션 권한·템플릿 버전 메타·캐시 정책 |

### 11.3 데이터 모델(초안)

- **테이블 후보**: `tenant_kakao_alimtalk_settings` 또는 기존 테넌트 설정 테이블에 `channel_type = KAKAO_ALIMTALK` 행.  
- **제약**: `tenant_id` **NOT NULL**; **UNIQUE**(`tenant_id`) 또는 UNIQUE(`tenant_id`, `event_type`).  
- **컬럼 예**: `alimtalk_enabled`, `simulation_mode_override`(nullable), `template_code_*`(varchar nullable), `kakao_api_key_ref` / `kakao_sender_key_ref`(varchar — **Secrets alias만**).  
- **민감정보**: API 키·sender 키 **평문 DB 저장 금지** — 팀 표준(KMS·Secrets Manager·환경 주입)과 **DB ref** 조합.

### 11.4 전역 vs DB 우선순위(제안)

- **시크릿**: 항상 Secrets/KMS; DB에는 **참조 ID**만.  
- **템플릿 코드·on/off·(P1)야간/폴백**: **유효한 DB 값 우선**, 없으면 전역 YAML·공통코드(`ALIMTALK_BIZ_TEMPLATE_CODE` 등)·enum 폴백.  
- **“빈 값” 의미**: 필드별로 **전역 상속** vs **발송 중단** 중 하나로 표준화(회의에서 확정).

### 11.5 UI·권한(제안)

- **옵션 A**: 기존 `SystemConfigManagement` 등에 **“카카오 알림톡(테넌트)”** 섹션.  
- **옵션 B**: 신규 `TenantNotificationSettings` — **`AdminCommonLayout`**·B0KlA.  
- **권한**: 기본은 **OPS/플랫폼 관리자**가 시크릿·ref 관리, 테넌트 관리자는 **비시크릿**만(정책은 §1에서 확정).

### 11.6 서브에이전트 위임(다음 배치)

| 담당 | 내용 |
|------|------|
| **explore** | 기존 `system_config` / 테넌트 설정 테이블·엔티티 유무 인벤토리 |
| **core-designer** | 설정 화면 IA·문구·에러·B0KlA |
| **core-coder** | Flyway·Entity·Repository·`resolveTemplateCode` DB 조회·Admin API·캐시 |
| **core-tester** | 테넌트 A/B 격리·DB 미존재 폴백·로그 시크릿 노출 없음 |
| **core-deployer** | 마이그레이션 순서·Secrets ref·롤백·전역-only 복귀 |

### 11.7 표준 문서 연계

- `docs/standards/NOTIFICATION_SYSTEM_STANDARD.md`에 **“테넌트 DB 설정·우선순위”** 절을 추가하고, 상세 절차는 **tenant-guides** 링크로 연결하는 것을 권장한다.
