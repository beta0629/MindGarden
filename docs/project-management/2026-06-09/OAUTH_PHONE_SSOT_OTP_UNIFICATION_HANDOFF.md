# OAuth 휴대폰 매칭 SSOT 일원화 (사용자 입력 + SMS OTP) — 핸드오프

**작성일**: 2026-06-09  
**작성자**: core-planner 위임  
**한 줄 목표**: 모든 OAuth (Apple/Google/Kakao/Naver) 휴대폰 매칭을 사용자 입력 + SMS OTP SSOT 로 일원화  
**관련 문서**:
- 정책 결정 트리거: [`../2026-06-08/NAVER_LOGIN_REVIEW_REJECTION_RESPONSE_2026_06_05.md`](../2026-06-08/NAVER_LOGIN_REVIEW_REJECTION_RESPONSE_2026_06_05.md) §0
- 운영 반영 게이트: [`../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)
- 하드코딩 게이트: [`../ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md`](../ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md) §17, [`../SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md`](../SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md) §1.3

---

## 목차

- [1. 배경](#1-배경)
- [2. 범위 — 포함/제외](#2-범위--포함제외)
- [3. 분배실행 — Phase × 서브에이전트](#3-분배실행--phase--서브에이전트)
- [4. 변경 파일 경로 요약](#4-변경-파일-경로-요약)
- [5. 충돌 회피 — 진행 중 작업과의 머지 순서](#5-충돌-회피--진행-중-작업과의-머지-순서)
- [6. 사용자 액션 항목](#6-사용자-액션-항목)
- [7. 운영 반영 게이트](#7-운영-반영-게이트)
- [8. 참조 PR 이력](#8-참조-pr-이력)
- [9. 변경 이력](#9-변경-이력)

---

## 1. 배경

- 2026-06-05 Naver 로그인 검수 반려 (휴대전화번호 권한 활용처 캡처 요구). 1차 대응 [`../2026-06-08/NAVER_LOGIN_REVIEW_REJECTION_RESPONSE_2026_06_05.md`](../2026-06-08/NAVER_LOGIN_REVIEW_REJECTION_RESPONSE_2026_06_05.md) 에서 (A) `mobile` 유지 결정 → 2026-06-09 정책 재검토 결과 **(C) `mobile` 미사용 + 사용자 입력 + SMS OTP 본인 검증** 으로 변경.
- Apple SIWA P1 (PR #149/#158/#161) 구축한 SMS OTP 인프라가 사실상 provider-agnostic 본인 검증 흐름이며, 이를 모든 OAuth provider 에 일반화하면 (1) Naver 검수 부담 최소화, (2) OAuth 응답 휴대폰 변조·미인증 회선 위험 제거, (3) 어드민 사전 등록 내담자 자동 매칭 신뢰성 유지가 동시 달성됨.
- 본 핸드오프는 정책·범위·서브에이전트 분배·충돌 회피·운영자 액션을 한 문서로 정리하여 후속 PR 의 단일 진입점으로 사용.

---

## 2. 범위 — 포함/제외

| 구분 | 항목 |
|---|---|
| **포함** | • BE OAuth phone verification provider-agnostic 일반화 (Apple SIWA P1 인프라 → `OAuthProvider` enum 기반 generic 흐름) |
|  | • Naver mobile 코드 전체 제거 — scope 요청 + 응답 파싱 + DTO `mobile` 필드 + User 매칭/저장 코드 모두 제거 (a/b 중 **(b)** 채택, core-planner 기본값) |
|  | • Kakao/Naver/Google OAuth 콜백에 OTP hook 삽입 (Apple 과 동일 흐름) |
|  | • FE 신규 OTP 화면 — Expo `oauth-phone-link.tsx` (provider-agnostic), Web `OAuthPhoneVerificationModal.js` |
|  | • 어드민 사전 등록 내담자 자동 매칭 — OTP 본인 검증 완료 후 동일 휴대폰 매칭 로직 적용 (휴대폰 SSOT 보존) |
|  | • Naver 검수 응답 문서 갱신 (§0 결정 분기, §3.3 PR 추가, §4 체크리스트, §7 후속 트랙) |
|  | • 단위·통합·회귀 테스트 (provider-agnostic OTP 흐름, mobile 제거 회귀) |
| **제외** | • PR #162 Apple email-fallback 제거 — 별도 후속 PR 로 분리 (본 PR 회귀 면적 축소) |
|  | • 기존 사용자에 대한 OTP 강제 — 휴대폰 변경 시에만 OTP 검증 (기존 휴대폰 유지 사용자는 영향 없음) |
|  | • mobile scope 재요청 — 향후 의사 없음 (정책 안정성) |

---

## 3. 분배실행 — Phase × 서브에이전트

> Phase 1A/1B 의 explore 결과는 본 핸드오프 §4 의 변경 파일 경로 요약에 인용되어 있음. 후속 Phase 위임 프롬프트에 본 §4 + §5 충돌 회피 + §7 운영 반영 게이트 인용을 포함할 것.

| Phase | 담당 서브에이전트 | 산출물 | 완료 조건 |
|---|---|---|---|
| **1A. BE 인벤토리** | `explore` | Apple SIWA P1 OTP 인프라 전체 파일 목록 + Naver mobile 사용처 (controller, service, DTO, repository, mapper) 목록 | 파일·라인 단위 인벤토리 산출, §4 BE 항목 입력 |
| **1B. FE 인벤토리** | `explore` | Expo `AuthService.ts` Apple OTP 흐름 라인, Web `SocialSignupModal.js` 의 dispatch 흐름 라인, OAuth 콜백 라우팅 | 회피 라인 명시 (107-249 등), §4 FE 항목 입력 |
| **2. 디자인 합의** | `core-designer` | OAuth 후 OTP 화면 시안 (Expo + Web) — provider-agnostic 라벨, 도움말, 에러 메시지 | 디자인 시스템 토큰만 사용 (하드코딩 0), `core-coder` 가 즉시 구현 가능한 스펙 |
| **3A. BE 코드 (provider-agnostic 일반화)** | `core-coder` | `OAuthProvider` enum, Apple OTP 인프라 19 파일 리네임 매트릭스, Flyway `V20260609_xxx__phone_otp_attempts_add_oauth_provider.sql`, OAuth2Controller / Abstract*Service 일반화 | 단위 테스트 통과, mobile 제거로 인한 회귀 테스트 통과, 하드코딩 게이트 통과 |
| **3B. BE 코드 (Naver mobile 제거)** | `core-coder` | scope 문자열 변경 (`name,email,mobile` → `name,email`), `NaverUserInfo.java` 의 `mobile` 필드 제거, `AbstractOAuth2Service.java` 의 mobile → User.phone 매핑 제거 | 검색 도구로 `mobile` 잔존 0건 (테스트·docs 제외), Naver 콜백 통합 테스트 통과 |
| **3C. BE 코드 (Kakao/Google/Naver OTP hook)** | `core-coder` | 각 ServiceImpl 에 OTP hook 삽입 (Apple 과 동일 흐름), `OAuthProvider` enum 분기 | 4개 provider 통합 테스트 모두 OTP 화면 진입 |
| **3D. 문서 갱신** | `generalPurpose` (이 핸드오프 작업) | 본 문서 + Naver 응답 문서 갱신 | §0/§3.3/§4/§7/§8 갱신 완료 |
| **4A. FE Expo** | `core-coder` | `oauth-phone-link.tsx` (신규), `oauthPhoneVerificationMapper.ts`, `oauthPhoneOtp.ts`, `oauthAuth.ts`, `AuthService.ts:178-201, 571-616` 확장 (다른 라인 회피), 라우팅 alias `apple-phone-link.tsx` → `oauth-phone-link.tsx` | Expo Metro alias·`getMmkv` 표준 준수 ([`../EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md`](../EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md) §5 체크리스트), provider 4종 모두 OTP 진입 확인 |
| **4B. FE Web** | `core-coder` | `OAuthPhoneVerificationModal.js`, `OtpCodeInput.js` (atom), `SocialSignupModal.js` 의 OTP 단계 dispatch 라인만 추가 (107-249 회피) | StandardizedApi 사용, UnifiedModal 기반, 디자인 토큰만 |
| **5. 테스트·운영 반영 게이트** | `core-tester` → `core-deployer` | 단위 + 통합 + E2E (provider-agnostic OTP), 회귀 (mobile 제거), 보안 (OTP 시도 횟수·만료) 테스트 결과 → 운영 반영 체크리스트 통과 | §7 운영 반영 게이트 모든 항목 OK, 사용자 액션 U1~U4 안내 |

> 본 Phase 3D 위임은 본 문서를 작성하는 작업입니다. Phase 1A/1B 의 explore 결과는 사용자 위임문에 인용된 경로를 그대로 채택하며, 미확정 상세는 후속 Phase 1A/1B 재실행 시 본 §4 표를 갱신합니다.

---

## 4. 변경 파일 경로 요약

> 출처: 본 위임문에 인용된 Phase 1A/1B explore 결과. 실제 구현 PR 의 진행 시 본 표는 1A/1B 재산출 결과로 정합성 검증 후 갱신.

### 4.1 BE (Java/Spring)

| 카테고리 | 경로 |
|---|---|
| 컨트롤러·서비스 | `controller/OAuth2Controller.java` |
|  | `service/impl/AbstractOAuth2Service.java` |
|  | `service/impl/AppleOAuth2ServiceImpl.java` |
|  | `service/impl/KakaoOAuth2ServiceImpl.java` |
|  | `service/impl/NaverOAuth2ServiceImpl.java` |
|  | `service/impl/GoogleOAuth2ServiceImpl.java` |
| DTO | `dto/NaverUserInfo.java` (mobile 필드 제거) |
|  | `dto/KakaoUserInfo.java` |
| Apple OTP 인프라 일반화 | Apple SIWA P1 의 19 파일 리네임 매트릭스 (Phase 1A explore 결과 인용 — 별도 첨부) |
| Enum 신규 | `OAuthProvider` (Apple/Google/Kakao/Naver) |
| Flyway | `V20260609_xxx__phone_otp_attempts_add_oauth_provider.sql` (`phone_otp_attempts` 테이블에 `oauth_provider` 컬럼 추가) |

### 4.2 FE — `expo-app/`

| 카테고리 | 경로 |
|---|---|
| 신규 화면 | `app/(auth)/oauth-phone-link.tsx` (provider-agnostic) |
| 신규 매퍼 | `src/services/auth/oauthPhoneVerificationMapper.ts` |
| 신규 유틸 | `src/utils/oauthPhoneOtp.ts` |
| 신규 API | `src/api/auth/oauthAuth.ts` |
| 기존 확장 | `src/services/AuthService.ts:178-201, 571-616` (다른 라인 회피) |
| 라우팅 alias | `apple-phone-link.tsx` → `oauth-phone-link.tsx` (deprecated alias 유지 1릴리스) |

> Expo 작업은 [`../EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md`](../EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md) §5 체크리스트 (Metro alias `@/`, `getMmkv` 단일 import, `metro.config.js`·`react-native-mmkv` 정합성) 준수 필수. import 경로만 여러 스타일로 바꾸는 패치 금지.

### 4.3 FE — `frontend/` (web)

| 카테고리 | 경로 |
|---|---|
| 신규 모달 | `components/auth/OAuthPhoneVerificationModal.js` (UnifiedModal 기반) |
| 신규 atom | `components/atoms/OtpCodeInput.js` |
| 기존 확장 | `components/auth/SocialSignupModal.js` 의 OTP 단계 dispatch 라인 추가 (107-249 라인 회피) |

### 4.4 docs

| 경로 | 변경 |
|---|---|
| `docs/project-management/2026-06-09/OAUTH_PHONE_SSOT_OTP_UNIFICATION_HANDOFF.md` | 본 문서 — 신규 작성 (Phase 3D) |
| `docs/project-management/2026-06-08/NAVER_LOGIN_REVIEW_REJECTION_RESPONSE_2026_06_05.md` | §0 결정 분기 (A)→(C), §3.3 추가 PR, §4 체크리스트 mobile 해제, §7 후속 트랙 OTP, §8 변경 이력 (Phase 3D) |

---

## 5. 충돌 회피 — 진행 중 작업과의 머지 순서

| 순서 | 작업 | 비고 |
|---|---|---|
| 1 | `[1d543328]` Kakao null 이름 버그 PR 머지 | 본 PR 과 `KakaoOAuth2ServiceImpl.java` 충돌 가능성 → 선행 머지 |
| 2 | `feat/oauth-phone-ssot` rebase | 위 머지 결과 기반 |
| 3 | PR #180 (CI 테스트 아키텍처) 머지 상태 확인 | 머지 완료 시: 신규 테스트는 surefire/failsafe 분리 표준 적용. 미머지 시: 기존 단일 surefire 구조 유지하고 후속 정합성 작업으로 분리 |
| 4 | 본 `feat/oauth-phone-ssot` PR 머지 | core-tester 게이트 통과 후 |
| 5 | (별도 후속) PR #162 Apple email-fallback 제거 | 본 PR 과 분리 — 회귀 면적 축소 |
| 6 | (별도 후속) Naver mobile 미사용 재검수 신청 | 운영 반영 후 사용자 액션 U1·U2 |

---

## 6. 사용자 액션 항목

| ID | 액션 | 시점 | 비고 |
|---|---|---|---|
| **U1** | Naver Developer Center → 내 애플리케이션 → MindGarden → "사용 API" 에서 휴대전화번호 체크 해제 | Phase 5 SUCCESS 후 (운영 반영 완료 시점) | 본 문서 §6 Naver 응답 문서 §4 인용 |
| **U2** | Naver 재검수 신청 — 본 문서 + 갱신된 [`../2026-06-08/NAVER_LOGIN_REVIEW_REJECTION_RESPONSE_2026_06_05.md`](../2026-06-08/NAVER_LOGIN_REVIEW_REJECTION_RESPONSE_2026_06_05.md) §0 갱신본 + 사업자등록증 + 캡처 #1~5 첨부 | Phase 5 SUCCESS 후 | 첨부 #3 (휴대폰 활용처 캡처) 는 안전 마진으로 그대로 첨부 |
| **U3** | Solapi 운영 키 확인 | Phase 5 배포 전 | PR #158 운영 반영 시점에 이미 등록되어 있다면 추가 작업 없음. 미등록 시 [`../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) §4.2 Secrets 절차 |
| **U4** | 운영 반영 일정 결정 (BE → FE 순차) | Phase 5 직전 | 점검 창 안내 (사용자에게 "OAuth 후 휴대폰 본인 검증 1단계 추가" 공지 권장) |

---

## 7. 운영 반영 게이트

본 PR 의 운영 반영 전 아래 게이트를 모두 통과해야 합니다. 각 항목은 `core-deployer` / `core-tester` 위임 프롬프트에 인용합니다.

| 게이트 | 출처 | 확인 항목 |
|---|---|---|
| OAuth redirect URI 등록 | [`../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) §4.1 | 4종 provider 운영 redirect URI 등록 (변경 없음 — 본 PR 은 redirect URI 미변경) |
| Solapi/JWT Secrets | [`../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) §4.2 | Solapi 운영 키, JWT secret 운영 환경 주입 |
| Flyway dry-run | [`../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) §5.2 | `V20260609_xxx__phone_otp_attempts_add_oauth_provider.sql` dry-run / 롤백 스크립트 |
| 하드코딩 게이트 (BE) | [`../ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md`](../ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md) §17 | 코드 검색·CI 하드코딩 검사·`check-hardcode` 결과 0건. core-coder Phase 3 위임에 본 인용 필수 |
| 하드코딩 게이트 (FE) | [`../SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md`](../SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md) §1.3 | 디자인 토큰 외 색상·간격·문자열 하드코딩 0건 |

---

## 8. 참조 PR 이력

| PR | 내용 | 본 PR 과의 관계 |
|---|---|---|
| #149 | Apple T1 SIWA — Sign in with Apple 1차 | 본 PR 의 OAuth provider-agnostic 일반화 출발점 |
| #158 | BE OTP 인프라 (`phone_otp_attempts` 테이블, Solapi 연동) | 본 PR 에서 `OAuthProvider` enum 으로 일반화 |
| #161 | FE OTP — Apple 후 휴대폰 입력·OTP 화면 | 본 PR 에서 provider-agnostic 화면으로 일반화 (`oauth-phone-link.tsx`) |
| #162 | Apple email-fallback (임시) | 본 PR 에서 **제외** (회귀 면적 축소). 별도 후속 PR 로 제거 |
| (예정) | `feat/oauth-phone-ssot` — 본 PR | Phase 3A/3B/3C/4A/4B/5 결과물 |

---

## 9. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-06-09 | 초안 작성 — 정책 (C) 채택, 범위·분배실행·파일 경로·충돌 회피·사용자 액션·운영 반영 게이트·참조 PR 정리 | core-planner 위임 (Phase 3D, 본 문서) |
