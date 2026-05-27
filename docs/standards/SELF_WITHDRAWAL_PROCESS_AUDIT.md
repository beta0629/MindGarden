# 회원탈퇴(Self-Withdrawal) 프로세스 전수 점검 보고서

> **읽기 전용 산출**. `explore` Agent `cda90711` (2026-05-27) 산출물을 정착. 이후 후속 합의서(`docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md`)에서 본 보고서를 참조한다.

---

## TL;DR (executive summary)

- **MindGarden 시스템에는 사용자 본인 의지로 동작하는 자발 회원탈퇴 경로가 존재하지 않습니다.** UI 1곳·API 3곳·서비스 2곳에 흔적이 있지만 **모두 스텁이거나 서로 연결되어 있지 않습니다.**
- 마이페이지 "회원 탈퇴" 버튼은 **"고객센터 또는 별도 절차로 진행됩니다."** 안내 토스트만 띄우고 API 호출이 없습니다 (`frontend/src/components/mypage/components/PrivacyConsentSection.js:346-358`).
- 백엔드에는 `DELETE /api/v1/users/{id}/account` 가 존재하지만 **본인 확인·권한 가드·역할 처리가 전혀 없고**, 처리도 단순 `softDeleteById` (테넌트 격리된 `users.is_deleted = TRUE, deleted_at = now()`) 뿐입니다. 매핑·스케줄·푸시 토큰·재무 cascade **0건**.
- 별도 경로 `POST /api/v1/personal-data-request/deletion` 는 비밀번호 재확인을 하지만 **실제 데이터 삭제 코드는 주석 처리** 되어 있고, "관리자 승인 대기"(`PENDING`) 로그만 남깁니다 (`PersonalDataRequestServiceImpl.java:144-148`).
- 1년 후 자동 파기를 담당해야 할 `PersonalDataDestructionService` 도 **모든 실제 삭제·익명화 코드가 주석 처리**되어 있어 로그만 남기는 동작(`PersonalDataDestructionService.java:128-129, 174-175, 220-221, 267-268, 355-363`).
- 결과: 사용자가 자기 의지로 계정·개인정보를 닫을 수 있는 경로가 **0건**, 동시에 운영 데이터에는 "묻혀 있는 소프트 삭제 행" 이 누적될 가능성이 매우 높습니다.

---

## §1. 현행 동작 매트릭스

| 영역 | 존재 여부 | 위치 | 동작 요약 |
|---|---|---|---|
| 내담자 마이페이지 UI | ◯ (스텁) | `frontend/src/components/mypage/components/PrivacyConsentSection.js:269-295, 346-358` | "데이터 및 계정" 카드에 `회원 탈퇴` 버튼. 클릭→ConfirmModal→**API 호출 없이** `notificationManager.show('회원 탈퇴는 고객센터 또는 별도 절차로 진행됩니다.','info')` 만 실행. |
| 상담사 마이페이지 UI | ✕ (별도 화면 없음) | `frontend/src/components/mypage/MyPage.js` (`activeTab` 분기) | 동일 컴포넌트(`MyPage`) 가 내담자·상담사·관리자 공용. Privacy 탭에 같은 스텁 노출. **role 별 회원탈퇴 분기 0건.** |
| 어드민(HQ_ADMIN, SUPER_HQ_ADMIN) UI | ✕ | — | 자기 자신 탈퇴 별도 UI 없음. 같은 Privacy 탭 스텁만 노출(권한과 무관). |
| Expo 앱 UI | ✕ | `expo-app/app/(client)/(more)/settings.tsx`, `expo-app/src/components/organisms/MoreAccountSettings.tsx`, `MoreAccountProfile.tsx` | 알림 설정·프로필·로그아웃만 있음. **`탈퇴`·`withdraw`·`deleteAccount` 검색 결과 0건.** 상담사 (`(consultant)/(more)/settings.tsx`) 도 동일. |
| 오피셜 REST API | △ (3개, 모두 결함) | 아래 §1.1 | 컨트롤러 3개가 산발적으로 존재. 셋 다 본인 의지의 자발 탈퇴를 안전하게 수행하지 못함. |
| 서비스 진입점 (자발) | △ | `MyPageService.deleteAccount(String userId)`, `PersonalDataRequestService.requestPersonalDataDeletion()` | (a) 마이페이지 진입점은 `user.setIsActive(false)` 만 수행, 어디서도 호출되지 않음. (b) 개인정보 삭제 요청은 비밀번호 검증 후 **실제 삭제 주석 처리** 상태로 PENDING 로그만 남김. |
| 서비스 진입점 (관리자 호출 시) | ◯ (결함) | `UserService.deleteUserAccount(Long id)` → `softDeleteById(id)` (`UserServiceImpl.java:1071-1073, 220-225`) | 단순 `users.is_deleted=TRUE`, `deleted_at=now()`. 매핑·일정·결제 cascade·익명화 0건. |
| 데이터 cascade | ✕ | `BaseRepository.softDeleteByIdAndTenantId` (`BaseRepository.java:405-407`) | 사용자만 soft delete. `consultant_client_mappings`, `schedules`, `financial_transactions`, `consultation_records`, `notifications`, `mobile_push_tokens` 어디에도 자동 종료 코드 없음. |
| 본인 확인 (자발 경로) | △ | `PersonalDataRequestServiceImpl.java:117-124` | 개인정보 삭제 요청 경로에서만 비밀번호 재확인. `UserController.deleteAccount` 경로는 **본인 확인 0건, `@PreAuthorize` 미부착, IDOR 위험.** |
| 2FA/OTP | ✕ | `SecuritySection.js:81-86` | "2단계 인증은 준비 중입니다." 안내만 노출. |
| 알림 발송 (탈퇴 신청·완료) | ✕ | — | 탈퇴 확인 메일/SMS/카톡 발송 코드 없음. 어드민 통지 없음. |
| 미발송 알림 큐 정리 | ✕ | `BatchNotificationDispatchServiceImpl`, `NotificationServiceImpl` | 탈퇴 시 사용자에 대한 미발송 큐 정지 로직 없음. |
| Push 토큰 비활성 | ✕ | `MobilePushDispatchService`, `PushNotificationService.js` | 토큰 삭제·비활성 호출 없음. 탈퇴 후에도 토큰 살아 있음. |
| 결제·환불 충돌 차단 | ✕ | — | 매핑 PENDING_PAYMENT, 환불 진행 중 등 어떤 가드도 없음. |
| 재가입 정책 | △ (결함) | `UserRepository.existsByTenantIdAndEmail` (Spring Data 파생 쿼리, `UserRepository.java:88`) + AuthController `checkEmailDuplicateForSignup` | 파생 쿼리에 `isDeleted=false` 필터가 **없어** 소프트 삭제 행에도 매칭. 결과: **동일 이메일 재가입이 사실상 차단**. 한편 destruction 잡은 실제로 행을 지우지 않아 `(tenant_id, email)` 고유키가 영구히 점유됨. |
| Grace period (탈퇴 취소) | ✕ | — | `softDeleteById` 즉시 처리. 유예기간·취소 토큰 등 없음. |
| 다중 역할 처리 | ✕ | `UserRole` enum + `MyPage` 공용 컴포넌트 | role 별 탈퇴 처리 분기 없음. CLIENT+STAFF 가 동일 user 인 케이스(테넌트 동일 user 단일 행) 자동 처리 불가. |
| 1년 후 자동 파기 | △ (NO-OP) | `PersonalDataDestructionService.destroyExpiredUserData()` | "탈퇴 후 1년 경과" 조회는 정상이나 **실제 `deleteById` 호출이 주석**. 매일 03:00 cron 이 무한히 "성공"만 남김 (`destroyExpiredPersonalData` cron, 라인 49). |
| 개인정보 접근/삭제 로그 | ◯ | `PersonalDataAccessLog`, `PersonalDataRequestServiceImpl.java:127-142` | 삭제 요청 시 로그 1행은 정상 기록. |

### §1.1 산발 REST API 인벤토리

| 메서드·경로 | 핸들러 | 사용 여부 | 결함 |
|---|---|---|---|
| `DELETE /api/v1/users/{id}/account` | `UserController.deleteAccount` (`UserController.java:565-569`) → `userService.deleteUserAccount(id)` → `softDeleteById(id)` | 프론트엔드에서 사용 **0건** (아래 §1.2). 어드민 화면도 본 API 미호출. | (1) `@PreAuthorize` 없음·session 검사 없음. (2) 본인 vs 타인 검사 없음(IDOR). (3) cascade·익명화·환불·매핑 종료 0건. (4) 비밀번호 재확인 없음. |
| `POST /api/v1/personal-data-request/deletion` | `PersonalDataRequestController.requestPersonalDataDeletion` (`PersonalDataRequestController.java:83-108`) → `PersonalDataRequestServiceImpl.requestPersonalDataDeletion` | 프론트엔드 검색 결과 **0건**(`/api/v1/personal-data-request` 호출 없음). | (1) 본인 확인은 ◯ (비밀번호 검증). (2) **실제 user 행 변경 주석 처리** — PENDING 로그만 기록(`PersonalDataRequestServiceImpl.java:144-148`). (3) 관리자 승인 후 처리 흐름·UI 부재. |
| `POST /api/v1/admin/personal-data-destruction/execute` (+ `/execute/user-data`, `/execute/all`) | `PersonalDataDestructionController` | 운영 호출 추적 흔적 없음. | (1) 관리자 권한 가드 명시 없음 (이름은 `/admin/` 이지만 `@PreAuthorize` 등 미부착). (2) 서비스 본문이 모두 NO-OP(주석 처리). |
| `String MyPageService.deleteAccount(String userId)` | 인터페이스만 존재 — **컨트롤러 노출 없음** (`/api/v1/mypage` 경로는 어디에도 없음) | 미사용 dead code. | 단순 `user.setIsActive(false)`. |

### §1.2 프론트엔드 endpoint 매핑 끊김(orphan)

```750:751:frontend/src/utils/ajax.js
 updateProfile: (formData) => apiPostFormData(USER_API.UPDATE_PROFILE, formData),
 deleteAccount: () => apiPost(USER_API.DELETE_ACCOUNT),
```

```78:82:frontend/src/constants/api.js
 // 프로필 관련
 GET_PROFILE: '/api/v1/users/profile',
 UPDATE_PROFILE: '/api/v1/users/profile',
 DELETE_ACCOUNT: '/api/v1/users/account',
 UPLOAD_PROFILE_IMAGE: '/api/v1/users/profile/image',
```

- 프론트 상수는 `POST /api/v1/users/account` 를 가리키지만, 실제 백엔드 라우트는 `DELETE /api/v1/users/{id}/account` 입니다. **메서드·경로 모두 불일치 → 호출돼도 404.**
- `ajax.deleteAccount()` 함수는 **호출자 0건** (`rg ajax\.deleteAccount` 검색 결과 0건). 완전 dead code.

### §1.3 마이페이지 "회원 탈퇴" 스텁(증거 인용)

```346:358:frontend/src/components/mypage/components/PrivacyConsentSection.js
 <ConfirmModal
 isOpen={withdrawOpen}
 onClose={() => setWithdrawOpen(false)}
 onConfirm={() => {
 setWithdrawOpen(false);
 notificationManager.show('회원 탈퇴는 고객센터 또는 별도 절차로 진행됩니다.', 'info');
 }}
 title="회원 탈퇴"
 message="탈퇴 시 계정과 데이터가 삭제되거나 분리될 수 있습니다. 계속하시겠습니까?"
 confirmText="확인"
 cancelText="취소"
 type="danger"
 />
```

### §1.4 백엔드 자발 삭제 진입점(증거 인용)

```380:397:src/main/java/com/coresolution/consultation/service/impl/MyPageServiceImpl.java
 @Override
 public String deleteAccount(String userId) {
 log.info("🔧 계정 삭제: {}", userId);

 String tenantId = TenantContextHolder.getTenantId();
 if (tenantId == null) {
 log.error("❌ tenantId가 설정되지 않았습니다");
 throw new IllegalStateException("tenantId가 설정되지 않았습니다");
 }

 User user = userRepository.findByTenantIdAndUserId(tenantId, userId)
 .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));

 user.setIsActive(false);
 userRepository.save(user);

 return "계정이 성공적으로 삭제되었습니다.";
 }
```

```140:167:src/main/java/com/coresolution/consultation/service/impl/PersonalDataRequestServiceImpl.java
 // 실제 삭제는 관리자 승인 후 처리되도록 플래그 설정
 // 또는 즉시 처리할 수도 있음 (정책에 따라)
 // user.setIsDeleted(true);
 // user.setDeletedAt(LocalDateTime.now());
 // userRepository.save(user);

 log.info("✅ 개인정보 삭제 요청 접수 완료: userId={}, reason={}", userId, reason);
```

```106:146:src/main/java/com/coresolution/consultation/service/PersonalDataDestructionService.java
 int destroyedCount = 0;
 for (Object[] user : expiredUsers) {
 Long userId = (Long) user[0];
 String userName = (String) user[1];

 try {
 // 개인정보 파기 로그 기록
 logPersonalDataDestruction("SYSTEM", "USER_DATA", userId.toString(),
 "회원 탈퇴 후 1년 경과로 인한 자동 파기");

 // 사용자 데이터 파기 (실제 구현 필요)
 // userRepository.deleteById(userId);
```

---

## §2. 결함·갭 분석

### §2.1 누락된 UI/API (P0)

1. **자발 탈퇴 UI 전무 (웹+Expo)**. 웹 마이페이지에 텍스트 버튼은 있으나 "고객센터로" 안내만. Expo 앱은 검색어 0건.
2. **다중 role 별 안내 부재**: 상담사·HQ_ADMIN 등이 자기 자신 탈퇴를 시도할 때의 흐름 정의 없음.
3. **공식 자발 탈퇴 API 부재**: 위 3개 endpoint 중 어느 것도 "본인 인증 + cascade + 알림 + 응답" 을 완비하지 않음.

### §2.2 법규 충돌 항목

| 법규 | 요구 | 현행 충돌 |
|---|---|---|
| **개인정보보호법 §36** (정정·삭제·처리정지권, 지체없는 조치) | 사용자 요구 시 즉시·합리적 기한 내 조치, 거절 사유 통지 | 자발 경로 자체가 없고, 가능 경로(`PersonalDataRequestService`)도 PENDING 로그만 남기고 결정 흐름 없음. |
| **개인정보보호법 §39의6** (1년 미접속 휴면/파기) | 1년 미접속자 데이터 분리·파기 | `destroyExpiredUserData` 실 삭제 미구현. 휴면 전환 UI/배치 없음. |
| **개인정보보호법 §39의7** (손해배상 청구권, 분쟁 대비 보존) | 분쟁 가능성 있는 일부 데이터 보존 정책 필요 | 보존 정책 정형화 X — 그러나 사실상 모든 게 보존되어 있어 "최소수집·최단보관" 원칙과 반대로 충돌. |
| **의료법 §22** (진료기록 10년, 상담일지 준용) | `consultation_records` 10년 보존 | `PersonalDataDestructionService.destroyExpiredConsultationData` 가 5년으로 설정(`cutoffDate = now().minusYears(5)`). **의료법 10년 기준과 충돌 가능성**. (운영팀 분류 확인 필요) |
| **세법/전자금융거래법** (5년 보존) | `financial_transactions` 등 5년 | 코드 상 5년 cutoff 일치하나 실제 삭제는 NO-OP. |
| **GDPR 17조 (잊혀질 권리)** | 본인 요청 시 합리적 기한 내 삭제 + 보존 사유 통지 | 자발 경로·통지 절차 없음 → 해외 사용자 대응 불가. |
| **개인정보 처리방침** (`frontend/src/locales/ko/common.json` `t_59c2d7cd`) | "회원 탈퇴 시까지 (단, 관계법령에 의해 보존이 필요한 경우 해당 기간까지)" | 처리방침과 구현이 정면 불일치 — 사용자가 탈퇴를 "할 수 없으므로" 처리방침 약속 미이행. |

### §2.3 UX 결함

- 안내 메시지 모호: "고객센터 또는 별도 절차" 라고만 표기 — 어디로 어떻게 가야 하는지 링크·전화번호 없음.
- 약관 본문 placeholder (`PrivacyConsentSection.js:17-18`): "약관 전문은 관리자 설정에 따라 제공됩니다." 실제 약관 미연결.
- "내 데이터 요청" 도 같은 패턴 스텁(`PrivacyConsentSection.js:332-344`) — 함께 표시되어 사용자 혼란 가중.

### §2.4 데이터 정합성 risk

- soft-deleted `users` 행 잔존 → `(tenant_id, email)` 고유 인덱스가 영구 점유되어 **동일 이메일 재가입 불가** (운영 사고 위험 P0).
- 외래키 관점: `mobile_push_tokens`, `notifications`, `consultant_client_mappings`, `schedules`, `payments`, `shop_orders`, `shop_carts`, `client_point_wallet` 등은 모두 `users.id` 를 FK 로 들고 있음 (예: `V20260514_003__client_shop_cart_order_points_mvp.sql:37, 77, 115, 134`). 사용자가 soft delete 되어도 이 행들은 **그대로 살아 있어 활성처럼 동작**.
- `BatchNotificationDispatchServiceImpl` 등 알림 발송기가 soft-deleted user 에게 푸시·SMS·카톡 발송 가능 (조회 시 `isDeleted=false` 필터 누락 가능성 추가 점검 필요).
- 어드민이 동일 행을 보고 "정상 active" 인 줄 알고 매핑·예약을 잡으려 할 때 충돌.

### §2.5 회기·결제·환불 충돌 시나리오

- PENDING_PAYMENT 매핑 보유 상태에서 탈퇴 → 매핑·결제 행 잔존 + 사용자 isDeleted=true → ERP·재무 정산 모순.
- 환불 처리 중 탈퇴 → ERP `financial_transactions` 의 buyer/refund 대상이 soft-deleted user 가 됨. ERP 연동 캐싱·KPI 통계 잘못 표시 가능.
- 미사용 회기(`remaining_sessions`) 보유한 사용자의 탈퇴 시 환불 자동 처리·포기 처리 정책 없음.

---

## §3. 권고 시나리오 3종

### Scenario A — 최소 MVP (1주 내, 위험 회피용 임시안)

**스코프**:
- 마이페이지 "회원 탈퇴" 스텁 → 실제 API 연결 (단, **결제·매핑 active 가 있으면 차단** 후 어드민 절차 안내).
- 백엔드: `POST /api/v1/users/me/withdrawal` 신설. `@PreAuthorize("isAuthenticated()")` + 비밀번호 재확인 + 동시 진행 중 매핑·결제 가드.
- 처리: `user.is_deleted=true, deleted_at=now()` + `email/phone/name` 즉시 익명화(예: `email=anon-<uuid>@deleted.local`) + 푸시 토큰 비활성.
- 미진행 알림 큐 (status=PENDING) → status=CANCELLED.
- 어드민 어떤 통지·승인 흐름 없음 (단순 cascade).
- 재가입: 동일 이메일 즉시 가능 (익명화로 unique 충돌 회피).

**구현 LOC 추정**: 백엔드 ~250 LOC (서비스 1·컨트롤러 1·DTO 2·테스트 5), 프론트 ~120 LOC (모달·핸들러·errorMap).
**소요 시간**: 코더 1.5d + 테스터 0.5d.
**리스크 매트릭스**: 법규 미이행 잔존 (GDPR·§36 부분 충족). 그러나 즉시 "처리방침과 구현 불일치" 해소.
**권장 사용 케이스**: 운영 반영 직전에 책임 면피 + 표면 일관성 확보를 우선해야 할 때.

### Scenario B — 표준 (3~4주, 정공법)

A + 다음:
- **유예기간 30일**: 신청 시 `withdrawal_pending` 상태로 전이, 30일 동안 사용자 본인 로그인 시 "탈퇴 취소" 가능. 30일 경과 시 익명화·cascade 자동 실행 (cron).
- **ERP 환불 자동 처리**: 미사용 회기·미완 결제는 환불 자동 산정 후 어드민 승인 큐에 전달. (`AdminController.partialRefund` 흐름과 연결)
- **다중 역할 분기**:
 - CLIENT only → 위 표준 경로.
 - CONSULTANT (active 매핑 보유) → 차단 후 "담당 내담자 이관 후 탈퇴" 어드민 안내.
 - HQ_ADMIN/SUPER_HQ_ADMIN → 자기 자신 탈퇴 불가, 후임자 위임 후 가능.
- **어드민 알림**: 탈퇴 신청·완료 시 `personal-data-access-log` 외에 어드민 dashboard 알림 + `system_notifications` 큐.
- **사용자 알림**: 신청 시 확인 메일/카톡 + 7일 전 만료 리마인더 + 완료 통지.
- **재가입**: 즉시 가능 (익명화로 unique 충돌 회피). 단, 이전 데이터 자동 복원 X.
- **유예기간 내 취소 토큰**: signed URL 또는 마이페이지 "탈퇴 취소" 버튼.

**구현 LOC 추정**: 백엔드 ~900 LOC (스케줄러 1·서비스 3·컨트롤러 2·이벤트 핸들러 5·DTO 8·migration 2·테스트 20), 프론트 ~450 LOC.
**소요 시간**: 코더 6d + 테스터 1.5d + 디자이너 0.5d (안내 메시지·이메일 템플릿).
**리스크 매트릭스**:
- ERP 정합성 회귀 가능 (환불 자동 산정) → 통합 회귀 테스트 필요.
- 유예기간 토큰 노출/세션 탈취 시 우회 위험 → 비밀번호 재확인 + 2FA 권장.

**권장 사용 케이스**: 운영 정착 + 법적 책임 정상화 + UX 정상화를 동시에 목표할 때(권장 기본안).

### Scenario C — 완전 컴플라이언스 (8~12주, 컴플라이언스 인증 목표)

B + 다음:
- **anonymize 정책 정형화**: PII 컬럼별 매트릭스(이름·이메일·전화·주소·생년월일·성별·닉네임·프로필 이미지 → tombstone/anonymize/keep). 의료법 보존 대상(`consultation_records`)은 anonymize 후 보존, 진료·세무·전금 5~10년 stamp.
- **휴면 자동 전환** (§39의6): 1년 미접속자 별도 status (`DORMANT`), 5년 후 자동 파기.
- **GDPR 호환**: lawful basis 매핑, 잊혀질 권리 RTBF API, 데이터 사본 export(`/api/v1/personal-data-request/export` 실제 구현).
- **재가입 N일 제한**: 악용 방지 (예: 30일 cooldown + 횟수 제한).
- **감사 추적 강화**: `withdrawal_audit_log` 신설 (신청·취소·완료·환불·이관 트레이스). 외부 감사 export.
- **법적 보존 정책 분리**: PII 익명화 + 거래·세무 stamp 별도 테이블(`financial_retention_stamps`) 로 이관.
- **CONSULTANT 자동 이관**: 담당 내담자 이관 워크플로 신설(`MappingTransferService`).
- **휴면·탈퇴 통합 어드민 대시보드**.

**구현 LOC 추정**: 백엔드 ~2,500 LOC, 프론트 ~1,200 LOC, migration ~10건.
**소요 시간**: 코더 4w + 디자이너 1w + 테스터 1.5w + 법무 검토 1w.
**리스크 매트릭스**: 의료법·세법 보존 매트릭스 확정 전 마이그레이션 시 회귀. 인증·법무 자문 동반 필수.

**권장 사용 케이스**: 외부 컴플라이언스 인증(ISMS-P 등) 또는 해외 진출 필수.

---

## §4. 사용자 결정 받을 질문 초안

1. **Q1 — 시나리오**: A/B/C 중 어느 시나리오로 진행할까요? (권고: **B**. A 는 잠정안, C 는 컴플라이언스 인증 트랙)
2. **Q2 — 유예기간**: 채택 여부와 기간? (권고 옵션: 없음·14일·30일·60일. 한국 e-커머스 관행 30일)
3. **Q3 — anonymize 정책 범위**: 어떤 PII 컬럼까지 즉시 익명화 vs 일부 보존? (예: 이름·전화 → 익명화 / 이메일 → tombstone(`anon-<uuid>@deleted.local`) / `consultation_records.note` → 의료법 준용 보존)
4. **Q4 — 다중 역할 사용자 처리**: 한 user 가 CLIENT+STAFF 인 경우 (a) 전체 탈퇴만 허용, (b) role 별 분리, (c) 어드민 수동 처리? (권고: a)
5. **Q5 — 진행 중 결제·환불 처리**: (a) PENDING_PAYMENT/refund 있으면 차단, (b) 자동 환불 후 진행, (c) 사용자 선택? (권고: B 시나리오에서는 b, A 에서는 a)
6. **Q6 — 재가입 정책**: (a) 즉시 가능, (b) 동일 이메일 7/30/90일 cooldown, (c) 영구 차단? (권고: a 또는 30일)
7. **Q7 — hard delete 인벤토리와 통합**: 직전 hard delete 분석(Agent `f3975fe5`)과의 **통합 정책 합의서** 작성이 필요한가요? (권고: **필요**. §5 참고)

---

## §5. 직전 hard delete 인벤토리와의 관계

> **참고**: 본 점검 시점에 `docs/standards/CLIENT_HARD_DELETE_IMPACT_ANALYSIS.md` 파일은 아직 워크스페이스에 존재하지 않습니다(검색 결과 0건). 아래는 일반적인 추정과 본 분석의 차이를 정리한 것이며, 합의서 작성 시 직전 분석의 결과로 한 번 더 정렬해야 합니다.

| 구분 | 자발 탈퇴(self) | 어드민 hard delete (forced) |
|---|---|---|
| **주체** | 본인 의지 (CLIENT/CONSULTANT/HQ_ADMIN) | 어드민 권한자(HQ_ADMIN, SUPER_HQ_ADMIN) |
| **본인 확인** | 비밀번호 재확인 + (옵션) 2FA | 어드민 권한 검사 + 사유 입력 |
| **유예기간** | 30일 권장 (B 시나리오) | 즉시 (운영 사고 대응) |
| **알림** | 사용자 + 어드민 통지 | 어드민 로그·감사 추적 |
| **공통 영역** | (a) `users` 외래키 cascade 정책, (b) PII 익명화 매트릭스, (c) 의료법·세법 보존 stamp, (d) `mobile_push_tokens` 비활성, (e) ERP 정합성 |
| **차이 영역** | 본인 확인·유예·재가입·취소 토큰·자기 환불 | 사유·승인·롤백 불가·이력 보존 강화 |
| **통합 정책 합의서 권고** | **YES** — `docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md` (가칭) 신설 후 자발/강제 양쪽 모두 이 정책서를 참조하도록 통일. |

**합의서가 다뤄야 할 공통 토픽**:
- PII 컬럼별 매트릭스 (anonymize / tombstone / keep / hard-delete)
- FK cascade 동작 표 (테이블별)
- 회기 SSOT (`remaining_sessions`, `consultant_client_mappings.session_count` 등) 처리
- 의료법·세법·전금법 보존 매트릭스
- 감사 로그 스키마 통일

---

## §6. 후속 위임 초안

### §6.1 시나리오 채택 후 `core-coder` 위임 (시나리오 B 기준)

```
[작업 유형] 신규 기능 — 자발 회원탈퇴(시나리오 B)
[참조 문서]
- docs/standards/SELF_WITHDRAWAL_PROCESS_AUDIT.md (본 보고서)
- docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md (별도 합의서, §5 권고)
- docs/guides/SECURITY_POLICY.md §3.3, §9.1
- docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md (안내 메시지 표시 경계)
- docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md
[수정 대상]
- backend
 - src/main/java/.../controller/UserSelfWithdrawalController.java (신규)
 - src/main/java/.../service/UserSelfWithdrawalService(Impl).java (신규)
 - src/main/java/.../service/impl/UserServiceImpl.java (anonymize·cascade)
 - src/main/java/.../service/PersonalDataDestructionService.java (실제 삭제 코드 활성화)
 - src/main/java/.../repository/UserRepository.java (existsByTenantIdAndEmail 등 isDeleted 필터 명시)
 - src/main/resources/db/migration/V202606xx_xxx__user_withdrawal_columns.sql (withdrawal_status, withdrawal_requested_at, withdrawal_scheduled_at)
- frontend
 - frontend/src/components/mypage/components/PrivacyConsentSection.js (스텁 제거 → 실제 모달)
 - frontend/src/components/mypage/components/WithdrawalModal.js (신규, UnifiedModal 사용)
 - frontend/src/utils/ajax.js + constants/api.js (DELETE_ACCOUNT 경로 정합)
- expo-app
 - expo-app/src/components/organisms/MoreAccountSettings.tsx (탈퇴 메뉴 추가)
 - expo-app/app/(client)/(more)/withdrawal.tsx (신규)
[완료 조건]
1. 운영 반영 전 하드코딩 게이트 통과(§17 / §1.3).
2. 비밀번호 재확인 + (선택) OTP, 본인 인증.
3. PENDING_PAYMENT·환불 진행 매핑 있을 시 차단·자동 환불 분기.
4. 푸시 토큰 비활성, 미발송 알림 큐 status=CANCELLED.
5. 사용자 통지 메일/카톡 + 어드민 대시보드 알림.
6. 30일 유예기간 + 취소 가능, cron 으로 만료 시 anonymize.
7. 동일 이메일 재가입 시 unique 충돌 없음(익명화).
8. core-tester 게이트: 신규 5건 단위 + 통합 3건 (정상/차단/취소) + E2E (탈퇴→재가입) 1건.
[리스크]
- ERP 환불 자동 산정 회귀 위험 → AdminServiceImplPartialRefundExhaustedScheduleCancelTest 와 동일 패턴으로 회귀 테스트 추가.
- 의료법 보존 정합성 → consultation_records 는 anonymize-only.
```

### §6.2 정책 합의서가 필요한 경우 `core-planner` 위임

```
[작업 유형] 정책 합의서 작성 — User Lifecycle Termination Policy
[참조 문서]
- docs/standards/SELF_WITHDRAWAL_PROCESS_AUDIT.md (본 보고서)
- docs/standards/CLIENT_HARD_DELETE_IMPACT_ANALYSIS.md (Agent f3975fe5 산출, 별도)
- docs/guides/SECURITY_POLICY.md
- docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md
[산출]
- docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md 신설
[필수 정의]
1. PII 컬럼별 처리 매트릭스(anonymize/tombstone/keep/hard-delete).
2. 자발 탈퇴 vs 어드민 강제 삭제 차이표.
3. 의료법·세법·전금법·개인정보보호법 보존 매트릭스.
4. FK cascade 동작 표(테이블별, soft vs hard).
5. 휴면(§39의6) 전환·재활성·자동 파기 일정.
6. 감사 로그 스키마 통일.
7. 재가입·재활성 규칙.
8. 운영 사고 시 롤백 절차.
[제약]
- 코드 0건 수정. 합의서만 산출.
- 직전 hard delete 분석 결과와 정합(Agent f3975fe5 보고서 인용).
```

---

## 부록 A — 본 점검에서 확인한 회원탈퇴 관련 코드 표면 인벤토리

**프론트엔드**
- `frontend/src/components/mypage/components/PrivacyConsentSection.js` — 스텁 버튼·모달
- `frontend/src/utils/ajax.js:751` — `deleteAccount()` (호출자 0건)
- `frontend/src/constants/api.js:81` — `DELETE_ACCOUNT: '/api/v1/users/account'` (경로 불일치)
- `frontend/src/components/mypage/MyPage.js` — `MyPage` 컴포넌트 (CLIENT/CONSULTANT/ADMIN 공용)
- `frontend/src/locales/ko/common.json:617` — 처리방침 "회원 탈퇴 시까지" 텍스트
- Expo: `expo-app/**` — 회원탈퇴 관련 코드 0건

**백엔드**
- `src/main/java/.../controller/UserController.java:565-578` — `deleteAccount`/`restoreAccount` (DELETE `/api/v1/users/{id}/account`)
- `src/main/java/.../service/impl/UserServiceImpl.java:1070-1078, 220-241` — `deleteUserAccount`/`restoreUserAccount`/`softDeleteById`/`hardDeleteById`
- `src/main/java/.../controller/PersonalDataRequestController.java:83-108` — `requestPersonalDataDeletion`
- `src/main/java/.../service/impl/PersonalDataRequestServiceImpl.java:106-167` — 비밀번호 재확인 + PENDING 로그
- `src/main/java/.../controller/PersonalDataDestructionController.java` — 어드민 파기 API (NO-OP)
- `src/main/java/.../service/PersonalDataDestructionService.java:106-310` — 만료 데이터 파기 (모두 주석 처리)
- `src/main/java/.../service/MyPageService.java:54`, `MyPageServiceImpl.java:380-397` — `deleteAccount(String userId)` (dead code)
- `src/main/java/.../repository/UserRepository.java:88, 101-102` — `existsByTenantIdAndEmail`, `findExpiredUsersForDestructionByTenantId`
- `src/main/java/.../repository/BaseRepository.java:405-414` — `softDeleteByIdAndTenantId`, `restoreByIdAndTenantId`
- `src/main/java/.../entity/User.java` — `isActive` 컬럼 / `isDeleted`,`deletedAt` (BaseEntity 상속)

**문서**
- `docs/guides/SECURITY_POLICY.md:75-82, 239-243` — 보존 기간·개인정보보호법
- `docs/archive/legacy-docs-backup-2025-10-14/SYSTEM_COMPLIANCE_LEGAL_REVIEW.md` — 과거 컴플라이언스 리뷰(아카이브)
- `docs/archive/legacy-docs-backup-2025-10-14/PRIVACY_POLICY_2024.md` — 과거 처리방침
- `docs/project-management/2025-12-03/TENANT_COMMON_CODE_CLASSIFICATION.md` — 탈퇴 관련 코드 분류(데이터 모델 참조)

---

## 부록 B — 본 보고서 작성 시 운영 가드 준수 사항

- 코드/설정/DB **무수정** (Read-only 가드 준수).
- 직전 hard delete explore (Agent `f3975fe5`) 산출 파일 미접촉.
- core_solution 단독 분석. `mind_garden` 미접촉.
- 메인 어시스턴트가 본 보고서를 검수한 뒤 `docs/standards/SELF_WITHDRAWAL_PROCESS_AUDIT.md` 로 저장 또는 `core-coder`/`core-planner` 위임으로 다음 단계 진행 결정.
