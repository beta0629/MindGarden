# SMS·알림톡 설정 + 채널 선호도 의존성 인벤토리

> 작성: explore 서브에이전트 `984e0c06` 산출 → core-coder 정착.
> 사용자 결정: **옵션 B (3 UI 모두 보존 + 라벨·안내문 갱신)** 채택.

## 1. 어드민 "SMS 설정" 페이지 (Cat A)

### 1.1 경로·메뉴·라우트

| 항목 | 위치 |
| --- | --- |
| 페이지 컴포넌트 | `frontend/src/components/admin/AdminTenantSmsSettingsPage.js` (266 LOC) + `.css` |
| 라우트 상수 | `frontend/src/constants/adminRoutes.js:48` `TENANT_SMS_SETTINGS = '/admin/tenant-sms-settings'` |
| App 라우터 lazy 등록 | `frontend/src/App.js:69` |
| 프론트 폴백 LNB | `frontend/src/components/dashboard-v2/constants/menuItems.js:79` (설정 그룹) |
| 프론트 보강 LNB | `frontend/src/utils/lnbMenuUtils.js:198` `mergeSupplementalAdminLnbItems` |
| DB 메뉴 시드 | `src/main/resources/db/migration/V20260425_001__lnb_admin_tenant_sms_settings_menu.sql` (`menu_code = ADM_SETTINGS_TENANT_SMS`, sort_order 8) |
| 테넌트 프로필 진입 버튼 | `frontend/src/components/tenant/TenantProfile.js:488` (`tenant-profile-sms-settings`) |

### 1.2 백엔드 의존성

| 항목 | 위치 |
| --- | --- |
| 컨트롤러 | `AdminTenantSmsSettingsController` — `GET/PUT /api/v1/admin/tenant-sms-settings`, `@PreAuthorize("hasAnyRole('ADMIN','STAFF')")` |
| 서비스 IF | `TenantSmsSettingsService` (4 메서드) |
| 서비스 Impl | `TenantSmsSettingsServiceImpl` (149 LOC) |
| 엔티티 / Flyway | `TenantSmsSettings` ↔ `tenant_sms_settings` (V20260425_002) |
| DTO | `TenantSmsSettingsResponse`, `TenantSmsSettingsUpdateRequest`, `TenantSmsEffectiveCredentials` |

### 1.3 제어 대상 필드 5종

| 컬럼 | 화면 라벨 | 발송 흐름에서의 효과 |
| --- | --- | --- |
| `sms_enabled` | "이 테넌트에서 SMS 발송 사용" 토글 | `isSmsEnabledForTenant()` → `SmsAuthService.isEffectiveSmsEnabled()` 게이트 + `NotificationChannelPreferenceResolutionService.resolveTenantInfrastructure()`에서 SMS 채널 후보 제거 |
| `provider` | 프로바이더 (nhn/solapi 등) | `getEffectiveCredentials()` → `SolapiSmsProvider`/`NhnSmsProvider` selection (`SmsAuthService:194`) |
| `sender_number` | 발신 번호 | `SolapiSmsProvider:96/169`, `NhnSmsProvider:49/109`, 인증 SMS `[Sender] 인증번호…` 본문 prefix |
| `api_key_ref` | API 키 참조 (Secrets 별칭) | `resolveRefOrFallback()` → Spring `Environment` / `System.getenv` 조회 → 전역 `sms.auth.api-key` 폴백 |
| `api_secret_ref` | API 시크릿 참조 | 동일 — 본문은 DB에 저장 금지 |

### 1.4 Task 1~8 정착 후 의미 평가

- **모든 5개 항목이 활성** — dead 아님.
- Task 1(`[마인드가든]` prefix 제거)은 본문 빌더(`buildSmsMessage` 등) 영향이고 본 페이지 항목과 무관.
- Task 8(`SMS_TEMPLATE` 미시드 → null) 은 **본문 템플릿** 정책이며, 본 페이지의 라우팅/자격증명과 직교(orthogonal).
- 단 **운영 단일 테넌트**(현재 운영 상황) + Solapi 단일 계정 운영 시 5개 항목 모두 ENV `SMS_*`로 충분하므로 GUI 운영 빈도는 낮음.

### 1.5 권고: **부분 정리 (옵션 B 채택)**

- **삭제 후보**: 없음.
- **보강 후보**:
  - 화면 안내문에 "이 설정은 단일 테넌트 운영 중에는 보통 ENV(`SMS_*`)로 충분합니다. 빈 값이면 전역 폴백을 사용합니다." 명시.
  - `sms_enabled` 토글은 "테넌트 단위 SMS 전체 차단" 용도 — 운영자 실수 방지용 confirm modal 권장.

## 2. 어드민 "알림톡 설정" 페이지 (Cat B)

### 2.1 경로·메뉴·라우트

| 항목 | 위치 |
| --- | --- |
| 페이지 컴포넌트 | `frontend/src/components/admin/AdminKakaoAlimtalkSettingsPage.js` (275 LOC) + `.css` |
| 라우트 상수 | `frontend/src/constants/adminRoutes.js:46` `KAKAO_ALIMTALK_SETTINGS = '/admin/kakao-alimtalk-settings'` |
| App 라우터 | `frontend/src/App.js:68` lazy |
| 프론트 폴백 LNB | `menuItems.js:78` |
| 프론트 보강 LNB | `lnbMenuUtils.js:199` |
| DB 메뉴 시드 | `V20260424_004__lnb_admin_kakao_alimtalk_settings_menu.sql` (`ADM_SETTINGS_KAKAO_ALIMTALK`, sort_order 7) |
| 테넌트 프로필 진입 버튼 | `TenantProfile.js:465` |

### 2.2 백엔드 의존성

| 항목 | 위치 |
| --- | --- |
| 컨트롤러 | `AdminTenantKakaoAlimtalkSettingsController` — `GET/PUT /api/v1/admin/kakao-alimtalk-settings`, ADMIN/STAFF |
| 서비스 | `TenantKakaoAlimtalkSettingsService` / Impl (122 LOC) |
| 엔티티 / Flyway | `TenantKakaoAlimtalkSettings` ↔ `tenant_kakao_alimtalk_settings` (V20260424_003) |
| DTO | `TenantKakaoAlimtalkSettingsResponse`, `…UpdateRequest` |

### 2.3 제어 대상 필드 10종

| 컬럼 | 화면 라벨 | 발송 흐름에서의 효과 |
| --- | --- | --- |
| `alimtalk_enabled` | "테넌트 알림톡 발송 사용" 토글 | `isAlimTalkEnabledForTenant()` → `NotificationChannelPreferenceResolutionService.resolveTenantInfrastructure()` 게이트 |
| `template_consultation_confirmed` | 상담 확정 | `findBizTemplateCodeOverride(tenant, CONSULTATION_CONFIRMED)` (`NotificationServiceImpl:320`, **§11.4 우선순위 1순위**) |
| `template_consultation_reminder` | 상담 리마인더 | 〃 (REMINDER) |
| `template_consultation_cancelled` | 상담 취소 | 〃 (CANCELLED) |
| `template_refund_completed` | 환불 완료 | 〃 (REFUND_COMPLETED) |
| `template_schedule_changed` | 일정 변경 | 〃 (SCHEDULE_CHANGED) |
| `template_payment_completed` | 결제 완료 | 〃 (PAYMENT_COMPLETED) |
| `template_deposit_pending_reminder` | 입금 대기 리마인더 | 〃 (DEPOSIT_PENDING_REMINDER) |
| `kakao_api_key_ref` | API 키 참조 | `KakaoSolapiCredentialResolver` (`integration/solapi/KakaoSolapiCredentialResolver.java:36~38`) — `<REF>_API_KEY` → 전역 `kakao.alimtalk.solapi.api-key` → `sms.auth.api-key` 폴백 체인 |
| `kakao_sender_key_ref` | 발신 프로필 키 참조 | 동일 — `<REF>_PFID` → `SOLAPI_ALIMTALK_PFID` |

### 2.4 Task 1~8 정착 후 의미 평가

- **Task 6 정리 대상 (dead config)** 은 다음과 같으며 본 페이지와는 **다른 위치**다:
  - `kakao.alimtalk.fallback-to-sms` yml 키 (application-prod.yml) — 삭제됨
  - `ALIMTALK_CONFIG.FALLBACK_TO_SMS` 공통코드 시드 (`KakaoAlimTalkServiceImpl:617` dead seed 제거)
  → **본 페이지의 10개 필드 중 어느 것도 Task 6의 dead 항목과 겹치지 않는다.**
- 7개 템플릿 코드 컬럼은 **`NotificationServiceImpl.resolveAlimTalkBizTemplateCode`의 1순위 SSOT**. 빈값이면 공통코드 `ALIMTALK_BIZ_TEMPLATE_CODE` → `type.name()` 폴백.
- `alimtalk_enabled` 는 채널 게이트로 작동. 운영 단일 채널 가정에서도 "장애 시 즉시 테넌트 단위 차단" 비상 스위치 의미.
- `kakao_api_key_ref`/`kakao_sender_key_ref`는 **테넌트별 다른 PFID/계정 분리 운영** 시 유일한 GUI.

### 2.5 권고: **부분 정리 (옵션 B 채택)**

- **삭제 후보**: 없음.
- **보강 후보**:
  - 안내문에 "비어있으면 전역 ENV(`SOLAPI_ALIMTALK_*`)와 공통코드 `ALIMTALK_BIZ_TEMPLATE_CODE`로 폴백됨" 명시.
  - 단일 테넌트·단일 PFID 운영 중에는 자주 만질 필요 없음을 라벨에 표시.

## 3. 내담자 채널 선호도 UI (Cat C)

### 3.1 컴포넌트

| 항목 | 위치 |
| --- | --- |
| 라디오 섹션 | `frontend/src/components/mypage/components/NotificationChannelPreferenceSection.js` (177 LOC) |
| 마이페이지 통합 | `frontend/src/components/mypage/components/ProfileSection.js:390` (CLIENT·CONSULTANT만 노출) |
| 어드민 내담자 모달 | `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js:799` |
| 어드민 내담자 종합 | `frontend/src/components/admin/ClientComprehensiveManagement.js:51` |
| 어드민 상담사 종합 | `frontend/src/components/admin/ConsultantComprehensiveManagement.js:1803/2204` |
| i18n 상수 | `frontend/src/constants/notificationChannelPreference.js` (15 키) |

> ⚠️ **`frontend/src/components/client/ClientSettings.js`** 는 별도 페이지(`/client/settings`, `loadSettings()` → `/api/clients/{id}/settings` 호출)로 `smsNotifications` 토글만 있고 **채널 선호 라디오는 없음**. 사용자가 언급한 "내담자 설정페이지의 카카오·SMS 선택"은 **마이페이지(`/client/mypage`) 의 `NotificationChannelPreferenceSection`** 으로 추정.

### 3.2 백엔드

| 항목 | 위치 |
| --- | --- |
| Enum | `constant/NotificationChannelPreferenceCode` — `TENANT_DEFAULT / KAKAO / SMS` (3값) |
| DB 컬럼 | `users.notification_channel_preference VARCHAR(32) NOT NULL DEFAULT 'TENANT_DEFAULT'` (`V20260424_005__users_notification_channel_preference.sql`) |
| 엔티티 필드 | `User#notificationChannelPreference` (`entity/User.java:277`) |
| 정규화·라우팅 서비스 | `NotificationChannelPreferenceResolutionService` (202 LOC) — `normalizeIncomingPreference`, `buildProfileSnapshot`, `resolveDeliveryOrder`, `resolveTenantInfrastructure` |
| 프로필 응답 4필드 | `MyPageResponse:46-50` / `UserProfileResponse:102-115` — `notificationChannelPreference`, `tenantNotificationChannelKakaoAvailable`, `tenantNotificationChannelSmsAvailable`, `tenantDefaultNotificationChannelHint`, `notificationChannelPreferenceUiAdjusted` |
| 저장 경로 | `MyPageServiceImpl.updateMyPageInfo`, `UserProfileServiceImpl:172-176`, `AdminServiceImpl.applyManagedUserNotificationPreferenceIfRequested` (2530, 2592, 2656) |
| 신규 등록 시 적용 | `ConsultantRegistrationRequest:74`, `ClientRegistrationRequest:78` |

### 3.3 사용 흐름

```
사용자 (CLIENT/CONSULTANT)
└─ 마이페이지 라디오 선택 (TENANT_DEFAULT | KAKAO | SMS)
└─ PUT /api/.../profile → normalizeIncomingPreference
└─ 테넌트 인프라 게이트 충돌 시 자동으로 TENANT_DEFAULT 환원
└─ users.notification_channel_preference = 저장값

이벤트 발송 (HIGH/MEDIUM priority)
└─ NotificationServiceImpl.sendNotification
└─ dispatchByResolvedChannelOrder(user, type, priority, phone, params)
├─ pref = NotificationChannelPreferenceCode.fromStored(user.notification_channel_preference)
├─ resolveDeliveryOrder(pref, priority, mayKakao, maySms, tenantId)
│ ├─ KAKAO → [KAKAO, SMS]
│ ├─ SMS → [SMS, KAKAO]
│ └─ TENANT_DEFAULT
│ ├─ HIGH → [KAKAO, SMS]
│ └─ MEDIUM → [SMS, KAKAO]
└─ 각 채널 순차 시도
└─ SMS 분기에서 buildSmsMessage == null (Task 8) → continue → 다음 채널
```

### 3.4 채널 선호도가 **참조되지 않는** dispatch 경로

| 경로 | `notification_channel_preference` 참조? | 효과 |
| --- | --- | --- |
| `BatchNotificationDispatchServiceImpl` (D-2 예약 리마인더 등 트랙 A/B 배치) | **❌ 미참조** | `NotificationDispatchHelper.dispatchAlimtalk`/`dispatchSms` 직접 호출 — 알림톡 → SMS 폴백 고정 |
| `MobilePushDispatchServiceImpl` (푸시) | **❌ 미참조** | 푸시 채널은 별도, 본 UI 와 무관 (앱 미배포 상태) |
| `AdminTestNotificationServiceImpl` (`/admin/test-notification`) | **❌ 미참조** | 관리자가 채널 직접 지정 |
| `AdminManualNotificationServiceImpl` (`/admin/manual-notification`) | **❌ 미참조** | 〃 |
| `NotificationServiceImpl.dispatchByResolvedChannelOrder` (HIGH/MEDIUM) | **✅ 참조** | 본 UI의 유일한 dispatch consumer |

### 3.5 Task 6 + Task 8 정착 후 의미 평가

- **사용자가 "SMS" 선택**:
  - Task 8 이후 — `SMS_TEMPLATE` 공통코드 미시드 시 `buildSmsMessage == null` → SMS 분기 `continue` → 다음 채널(KAKAO)로 자동 폴백. 의미 있음(의미 없는 fallback 차단).
- **사용자가 "KAKAO" 선택**:
  - Task 6 정리(`FALLBACK_TO_SMS` dead) 이후에도 dispatcher 가 알림톡 실패 시 SMS 시도. 즉 KAKAO 선택은 **"우선 시도"** 의미이고, 실패 시 SMS 폴백은 여전.
- **사용자가 "TENANT_DEFAULT"**:
  - HIGH = 알림톡 우선, MEDIUM = SMS 우선 (테넌트 기본 정책).
- **잠재 이슈 (별도 디버그 권고)**: `NotificationServiceImpl#isKakaoAlimTalkEnabled(user)` 가 카카오 소셜 로그인 또는 legacy `notification_preferences` JSON 에 `"kakao"` 문자열이 있을 때만 true 반환. 일반 회원가입 + JSON null 사용자는 `mayKakao=false` → KAKAO 채널이 후보에서 **완전 제거**. 사용자가 라디오에서 "카카오 알림톡" 골라도 SMS로만 발송됨.

### 3.6 권고: **부분 정리 (옵션 B 채택)**

- **삭제 후보**: 없음.
- **보강 후보**:
  - 라디오 옵션 설명문 (현재 i18n 상수 25~27행) 에 "선택은 우선 시도일 뿐, 실패 시 다른 채널로 폴백됩니다" 명시.
  - `SMS` 옵션의 실효성 — Task 8 정착(SMS_TEMPLATE 미시드 시 SMS skip) 이후 SMS_TEMPLATE 시드가 사실상 알림톡으로 자연 흡수되는 운영에서는 사용자가 "SMS" 선택해도 SMS_TEMPLATE 미시드 시 알림톡으로 폴백. 사용자 안내문 갱신 필요.
  - `isKakaoAlimTalkEnabled` 게이트 회귀 여부를 별도 디버거에 위임 (본 라운드에 포함).

## 4. 후속 영향 (Cat D)

### 4.1 어드민 페이지 삭제 시 PFID/sender/템플릿 운영 경로

| 변경 항목 | 어드민 UI 외 대체 경로 |
| --- | --- |
| Solapi PFID 갱신 | ENV `SOLAPI_ALIMTALK_PFID` 변경 + JVM 재기동 (deployer 위임) — **단일 PFID 운영에 한정** |
| 테넌트별 PFID 분리 | `tenant_kakao_alimtalk_settings.kakao_sender_key_ref` + `<REF>_PFID` ENV. 어드민 페이지 없으면 DB 직수정 필요 → 운영자 GUI 손실. |
| Solapi sender_number 변경 | ENV `SOLAPI_ALIMTALK_SENDER_NUMBER` (전역) — 어드민 페이지의 `tenant_sms_settings.sender_number` 는 SMS 전용. |
| 알림톡 템플릿 코드 갱신 | (1) 솔라피 콘솔에서 신규 템플릿 등록·검수, (2) `tenant_kakao_alimtalk_settings.template_*` 컬럼 변경(어드민 페이지) **또는** `ALIMTALK_BIZ_TEMPLATE_CODE` 공통코드 변경. |
| 테넌트 단위 알림톡 비상 차단 | `alimtalk_enabled=false` 토글 — 어드민 페이지 없으면 DB 직수정만 가능. |

### 4.2 사용자 동의 철회 / 거부 정책

- **현 채널 선호 UI는 "거부" 기능이 없다** — 3옵션 모두 채널 선택일 뿐 "전체 알림 거부" 옵션은 없음.
- 거부는 다음 두 경로로만 가능:
  1. legacy `User.notificationPreferences` (TEXT) — 문자열 `"sms_disabled"` 포함 시 SMS 차단 (`NotificationServiceImpl#isSmsEnabled:210-213`). **UI 없음** — DB 직수정·관리자 직권만.
  2. 마이페이지에서 전화번호 자체를 비우면 모든 SMS·알림톡 발송 skip (`dispatchByResolvedChannelOrder:174` `phoneNumber != null` 게이트).
- 채널 선호 UI를 삭제해도 **거부 기능은 영향 없음** (애초 거부 UI가 별개).

### 4.3 운영 데이터 보존

| 컬럼/테이블 | 보존 권고 | 사유 |
| --- | --- | --- |
| `users.notification_channel_preference` | **보존** | 컬럼 비용 미미 (VARCHAR(32) DEFAULT). UI만 삭제하고 enum/서비스 보존 시 향후 UI 재도입 용이. |
| `users.notification_preferences` (legacy JSON) | **보존 + 폐기 일정 명시** | `isSmsEnabled`/`isKakaoAlimTalkEnabled` 가 여전히 참조. 별도 마이그레이션 배치 필요. |
| `tenant_sms_settings` 테이블 | **보존** | 어드민 페이지 삭제하더라도 `SmsAuthService.isEffectiveSmsEnabled` / `SolapiSmsProvider.getEffectiveCredentials` 가 직접 사용 → 백엔드 코드까지 같이 정리해야 안전 삭제 가능. |
| `tenant_kakao_alimtalk_settings` 테이블 | **보존** | `findBizTemplateCodeOverride` 가 §11.4 우선순위 1순위로 의존. 삭제 시 알림톡 라우팅 변경 필요. |

### 4.4 메뉴 시드 정리 시

- 메뉴 항목만 hide 하려면 **Flyway 추가** + 프론트 `mergeSupplementalAdminLnbItems`/`menuItems.js` 보강 부분도 함께 제거. 2중화돼 있어 누락하면 사용자에게 보임.

## 5. 종합 권고 — 옵션 B (채택)

### 옵션 비교

| 옵션 | 어드민 SMS 페이지 | 어드민 알림톡 페이지 | 마이페이지 채널 선호 UI |
| --- | --- | --- | --- |
| **A — 전부 삭제** | 삭제 | 삭제 | 삭제 |
| **B — 부분 정리 ✅** | 보존 + 안내문 보강 | 보존 + 안내문 보강 | 보존 + i18n 옵션 설명 보강 |
| **C — 어드민 보존 + 마이페이지 채널 UI 삭제** | 보존 | 보존 | 삭제 |

### 옵션 B 채택 근거

1. **dead 항목 0개** — Task 1~8 정착으로 정리된 `kakao.alimtalk.fallback-to-sms` yml 키 / `ALIMTALK_CONFIG.FALLBACK_TO_SMS` 시드는 본 3개 UI와 무관.
2. 어드민 SMS·알림톡 페이지의 모든 항목은 `SmsAuthService` / `KakaoSolapiCredentialResolver` / `findBizTemplateCodeOverride` / `resolveTenantInfrastructure` 가 활성 참조 중.
3. 마이페이지 채널 선호 UI는 `NotificationServiceImpl.dispatchByResolvedChannelOrder`(HIGH/MEDIUM 동기 발송) 에서 활성 참조 중. 단 배치/푸시/어드민 도구 dispatch 경로 4개는 미참조.
4. 운영 단일 테넌트·단일 PFID 가정에서 어드민 페이지 활용 빈도는 낮지만, 비상 차단·테넌트별 분리 옵션은 보존하는 편이 안전.
5. **사용자 질문에 대한 직접 답**:
   - "SMS, 알림톡 설정 페이지는 이제 필요 없는거네" → **부분 필요**. 운영 단일 테넌트·단일 PFID 한정으로는 GUI 운영 빈도가 낮지만 백엔드 코드가 활성 참조 중이므로 페이지만 삭제하면 운영자 GUI를 잃는 비대칭이 발생.
   - "내담자 설정페이지에 카카오 및 SMS 선택을 모두 삭제 해야 되는건지" → **선택 옵션은 보존 권고**. 단 (a) `ClientSettings.js`(`/client/settings`)의 `smsNotifications` 토글은 legacy — 별도 검토, (b) 마이페이지(`NotificationChannelPreferenceSection`) 라디오 3옵션은 의미 있음.

## 6. 변경 이력

- 2026-05-23 작성 — explore `984e0c06` 산출 → core-coder 정착
- 2026-05-23 사용자 옵션 B 확정 — 라벨·안내문 갱신 + 디자이너 카피 + 코더 패치 + 디버거 회귀 입증 위임
