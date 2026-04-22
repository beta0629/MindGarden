# 관리자 전화 검증 — E2E 시나리오 (Wave 6, 문서 전용)

**문서 유형:** 프로젝트 관리 / Playwright E2E 설계 메모 (코드·워크플로 변경 없음)  
**작성일:** 2026-04-23  
**상위 계획:** [PHONE_VERIFICATION_TEST_PLAN.md](./PHONE_VERIFICATION_TEST_PLAN.md)  
**참고 표준:** `docs/standards/TESTING_STANDARD.md`, `.cursor/skills/core-solution-testing/SKILL.md`

---

## 1. 전제 (공통)

| 항목 | 내용 |
|------|------|
| **인증** | 관리자(또는 스태프·내담자 관리 권한이 허용되는 역할) 로그인 세션. Bearer 토큰은 **Secrets·환경 변수**로만 주입. |
| **테넌트** | API 표준에 따라 `X-Tenant-ID`(또는 프로젝트에서 합의한 동일 헤더) 필수. E2E는 **동적 생성 `tenantId`·시드 픽스처**로 격리; 운영 전화·프로덕션 ID **하드코딩 금지** (`core-solution-testing`). |
| **시드 계정** | 로그인·픽스처 사용자는 **Flyway/테스트 데이터 빌더·CI Secrets** 등으로 준비. 저장소 평문 자격·고정 번호 의존 지양. |
| **정책 TBD** | 테넌트 간 동일 번호 허용 여부 등은 `PHONE_VERIFICATION_POLICY.md` 확정 후 기대값(assert) 갱신. |

---

## 2. 시나리오 표 (E2E-PV-03 ~ 05)

단계는 Given / When / Then 수준으로만 기술한다. **모킹**은 Playwright `route` 등으로 네트워크 계약을 고정하는 것을 가정한다.

| ID | 대상 | Given | When | Then (성공) | Then (실패·부정) | 모킹할 API (예) |
|----|------|--------|------|-------------|------------------|-----------------|
| **E2E-PV-03** | 내담자 등록 | 관리자 로그인, tenant 헤더 유효, 내담자 탭 진입 | 신규 내담자 폼에 **tenant 내 이미 존재하는 정규화 번호** 입력 후 저장 | (정책·P1 반영 후) 저장 성공은 **신규 번호**에만 | **409/400 등 합의된 오류**, UI에 테넌트 범위 충돌 안내(카피는 스펙 슬롯) | 주: `POST /api/v1/admin/clients`. 전화 선행 중복 UI가 붙으면 `GET /api/v1/auth/duplicate-check/phone` 또는 관리자용 동일 시맨틱 엔드포인트(제품 합의안) |
| **E2E-PV-04** | 상담사 등록 | 동일 | 상담사 생성 모달에서 동일 정규화 번호로 제출 | 신규 번호만 성공 | 서버/클라이언트 검증에 따라 거부 + 메시지 | 주: `POST /api/v1/admin/consultants`. 이메일 중복 버튼 경로: `GET /api/v1/admin/duplicate-check/email` (현행 UI). 전화 중복은 저장 응답 또는 향후 전화 중복 API |
| **E2E-PV-05** | 스태프 등록 | 동일 | 스태프 생성 모달에서 전화·필수 필드 입력 후 등록 | 신규 번호·유효 데이터만 성공 | `registerStaff` 경로에서 중복 시 거부 + 이메일 중복과 대칭되는 피드백(제안서) | 주: `POST /api/v1/admin/staff`. 이메일: `GET /api/v1/admin/duplicate-check/email` (현행). 전화 선행 검사가 생기면 해당 duplicate API |

> **참고:** 현재 관리자 내담자/스태프/상담사 폼의 전화 필드는 대부분 **단순 `input`**이며, 공개 가입 `TabletRegister`의 `KoreanMobileDuplicateField`와 동일한 **인라인 중복 버튼**은 붙어 있지 않을 수 있다. E2E는 **저장 API 응답**을 중심으로 두고, P1 이후 UI가 맞춰지면 duplicate-check 모킹을 보강한다.

---

## 3. 라우트·컴포넌트 인벤토리

| 영역 | URL (예) | 셸·페이지 컴포넌트 | 주요 자식 / 모달 |
|------|----------|-------------------|------------------|
| **내담자 (ClientModal)** | `/admin/user-management?type=client` | `frontend/src/components/admin/UserManagementPage.js` | `frontend/src/components/admin/ClientComprehensiveManagement.js` → `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` |
| **상담사 (Consultant)** | `/admin/user-management?type=consultant` | 동일 `UserManagementPage.js` | `frontend/src/components/admin/ConsultantComprehensiveManagement.js` (인라인 생성/수정 모달) |
| **스태프 (StaffManagement)** | `/admin/user-management?type=staff` | 동일 `UserManagementPage.js` | `frontend/src/components/admin/StaffManagement.js` |

**라우트 상수:** `frontend/src/constants/adminRoutes.js` — `USER_MANAGEMENT: '/admin/user-management'` 등.

**레거시 리다이렉트:** `frontend/src/App.js` — 예: `/admin/consultant-comprehensive` → `?type=consultant`.

---

## 4. CI 실행·스킵 제안

**스캐폴드 스펙(옵트인, 미설정 시 전부 skip·exit 0):** `tests/e2e/tests/admin/admin-e2e-scaffold.spec.ts` — 예: `cd tests/e2e && ADMIN_E2E=1 npx playwright test tests/admin/admin-e2e-scaffold.spec.ts --project=chromium`

| 항목 | 제안 |
|------|------|
| **게이트** | 예: 환경 변수 `ADMIN_E2E=1`(또는 동등한 이름)일 때만 `tests/e2e/tests/**/admin-phone-*.spec.ts` 같은 관리자 전용 스펙을 **포함** 실행. |
| **Secrets 없음** | `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` / 테넌트 시드 관련 Secret이 비어 있으면 **test.skip** 또는 워크플로 잡 분기로 **스킵**하고, PR 코멘트·요약에 “관리자 E2E 미실행(자격 미설정)”을 남긴다. |
| **로컬** | `.env` 또는 셸 export로만 자격 주입; 저장소에 평문 금지. |

### 선택 자격 (로그인 후 E2E)

스캐폴드에서 **로그인 응답 이후** URL(대시보드·어드민)까지 검증하려면 `ADMIN_E2E=1`에 더해 **`ADMIN_E2E_EMAIL`**, **`ADMIN_E2E_PASSWORD`** 를 환경에 설정한다. 셋이 모두 있을 때만 해당 테스트가 실제 로그인·내비 흐름을 수행한다.  
자격은 **로그, Playwright 리포트, 터미널 echo, CI 요약**에 절대 출력하지 말고, GitHub Actions 등에서는 Encrypted secrets로만 주입한다.  
유출이 의심되면 비밀번호를 즉시 로테이트하고, 사용한 머신·캐시·스크린샷 공유 경로를 점검한다.

---

## 5. Molecule `KoreanMobileDuplicateField` vs 관리자 `inputOnly`

`KoreanMobileDuplicateField` (`frontend/src/components/common/molecules/KoreanMobileDuplicateField.js`)는 **항상** 중복확인 버튼·로딩·`checkStatus`(duplicate/available) 영역을 포함한다. 코드베이스에서 “`inputOnly` / `withDuplicate`”라는 prop 분기는 없으며, 아래는 **E2E 관점에서의 구분**이다.

| 패턴 | 설명 | 대표 화면 | E2E 주 셀렉터 |
|------|------|-----------|----------------|
| **withDuplicate** | `KoreanMobileDuplicateField` 사용 — `id` prop으로 input id 고정, 중복 버튼은 `.mg-v2-auth-email-check-btn` 인근 | 예: `frontend/src/components/auth/TabletRegister.js` (`id="phone"`) | `#phone`, 중복 버튼: `role=button` + 라벨 텍스트 또는 인접 클래스 |
| **inputOnly** | 단일 `input type="tel"` — 중복 버튼 없음, 저장 시 서버 검증 | 관리자 내담자·스태프·상담사(현행) | 아래 표 참고 |

### 관리자 전화 필드 — E2E 셀렉터

| 화면 | 파일 | `inputOnly` 셀렉터 | 비고 |
|------|------|-------------------|------|
| 내담자 모달 | `ClientModal.js` | `#phone` | `name="phone"` |
| 스태프 생성 모달 | `StaffManagement.js` | `#staff-phone` | `name="phone"` |
| 상담사 생성/수정 폼 | `ConsultantComprehensiveManagement.js` | `input[name="phone"]` (모달 컨텍스트 내) | **현재 `id` 없음** — 안정화 시 `id="consultant-phone"` 등 부여 권장 (구현은 별도 배치) |

### `data-action` — 중복확인 버튼 (Wave 11, `KoreanMobileDuplicateField` / `MGButton`)

| 영역 | 화면·파일 | 값 |
|------|-----------|-----|
| **공개 가입** | `TabletRegister.js` (이메일) | `register-public-email-duplicate-check` |
| **공개 가입** | `TabletRegister.js` (휴대폰) | `register-public-phone-duplicate-check` |
| **관리자·내담자** | `ClientModal.js` (휴대폰) | `client-modal-phone-duplicate-check` |
| **관리자·내담자** | `ClientModal.js` (이메일) | `email-duplicate-check` |
| **관리자·상담사** | `ConsultantComprehensiveManagement.js` | `consultant-modal-phone-duplicate-check` |
| **관리자·스태프** | `StaffManagement.js` (생성) | `staff-create-phone-duplicate` |
| **관리자·스태프** | `StaffManagement.js` (편집) | `staff-edit-phone-duplicate` |

> 미지정 시 분자 기본값은 `phone-duplicate-check` (`KoreanMobileDuplicateField` JSDoc). 화면별로 위 표와 동일한 문자열을 Playwright·단위 테스트에 맞출 것.

---

## 6. 관련 링크

- 정책·컴포넌트 제안: [PHONE_VERIFICATION_POLICY.md](./PHONE_VERIFICATION_POLICY.md), [PHONE_VERIFICATION_COMPONENT_PROPOSAL.md](./PHONE_VERIFICATION_COMPONENT_PROPOSAL.md)
- 화면 스펙: `docs/design-system/SCREEN_SPEC_PHONE_VERIFICATION_ADMIN_AND_SIGNUP.md`

---

**문서 끝.**
