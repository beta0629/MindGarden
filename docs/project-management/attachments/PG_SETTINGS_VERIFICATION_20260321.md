# PG 설정 페이지 수정 검증 결과

**문서 버전**: 1.0.0  
**검증 일자**: 2026-03-21  
**담당**: core-tester  
**참조**: PG_SETTINGS_PAGE_ERROR_ORCHESTRATION.md §4.3

---

## 1. 변경 범위 확인 (정적 검증)

| 파일 | 변경 내용 | 검증 결과 |
|------|-----------|-----------|
| **App.js** | PG 설정 라우트 4개 등록, `/tenant/pg-configuration` → `/tenant/pg-configurations` 리다이렉트 | ✅ 적용 확인 |
| **pgApi.js** | URL 패턴 `tenants/{tenantId}/pg-configurations` 로 수정 | ✅ 적용 확인 |
| **PgConfigurationList.js** | `showNotification` → `notificationManager.success` | ✅ 적용 확인 |

### 1.1 App.js 라우트 상세

```
/tenant/pg-configuration        → Navigate to /tenant/pg-configurations (리다이렉트)
/tenant/pg-configurations       → PgConfigurationList
/tenant/pg-configurations/new   → PgConfigurationCreate
/tenant/pg-configurations/:id   → PgConfigurationDetail
/tenant/pg-configurations/:id/edit → PgConfigurationEdit
```

### 1.2 pgApi.js URL 패턴

- Base: `/api/v1/tenants/${tenantId}/pg-configurations`
- 목록: `GET .../pg-configurations`
- 상세: `GET .../pg-configurations/{configId}`
- 생성: `POST .../pg-configurations`
- 수정: `PUT .../pg-configurations/{configId}`
- 삭제: `DELETE .../pg-configurations/{configId}`
- 연결 테스트: `POST .../pg-configurations/{configId}/test-connection`

---

## 2. 체크리스트 (§4.3 기준)

| 항목 | 상태 | 비고 |
|------|------|------|
| **ADMIN/STAFF: PG 설정 목록·등록·상세·수정·삭제·연결 테스트 스모크** | ⚠️ E2E 스펙 추가됨, 실행 미완료 | 프론트엔드 서버 미기동으로 connection refused |
| **회귀: 테넌트 프로필, 계좌 관리 등 인접 설정 메뉴** | ⚠️ E2E 스펙 추가됨, 실행 미완료 | 동일 사유 |

---

## 3. E2E 테스트

### 3.1 추가된 스펙

- **경로**: `tests/e2e/tests/admin/pg-configuration.spec.ts`
- **내용**:
  - ADMIN: `/tenant/pg-configuration` 접근 시 `/tenant/pg-configurations`로 리다이렉트
  - ADMIN: `/tenant/pg-configurations` 목록 페이지 로드 및 렌더링
  - ADMIN: PG 설정 등록 페이지(`/tenant/pg-configurations/new`) 접근 스모크
  - 회귀: 테넌트 프로필 `/tenant/profile` 접근 정상
  - 회귀: 계좌 관리 `/admin/accounts` 접근 정상

### 3.2 실행 방법

```bash
# 프론트엔드 서버를 먼저 기동
cd /Users/mind/mindGarden && npm run frontend

# 별도 터미널에서 E2E 실행 (manual config — webServer 없음)
cd tests/e2e && BASE_URL=http://localhost:3000 TEST_USERNAME=... TEST_PASSWORD=... \
  npx playwright test tests/admin/pg-configuration.spec.ts --config=playwright.manual.config.ts --project=chromium
```

### 3.3 실행 결과 (2026-03-21)

- **상태**: 5개 테스트 모두 실패
- **원인**: `net::ERR_CONNECTION_REFUSED at http://localhost:3000/login` — 프론트엔드 서버 미기동
- **결론**: E2E 스펙 자체는 유효. 서버 기동 후 재실행 필요.

---

## 4. 백엔드 통합 테스트

- **대상**: `TenantPgConfigurationControllerIntegrationTest`
- **결과**: 9개 중 7개 실패
- **원인 요약**:
  - 응답 형식 불일치: 테스트는 `$.configId`, `$`(배열)를 기대하나 실제 API는 `{ success, data, ... }` 래퍼 반환
  - delete: 204 기대, 200 반환
  - testConnection: `$.result`, `$.success` 경로/값 불일치

→ **프론트엔드 수정과 무관**. 백엔드 통합 테스트 어설션을 API 표준 응답 형식에 맞게 수정할 필요 있음.

---

## 5. 권장 사항

| 우선순위 | 항목 | 담당 |
|----------|------|------|
| **P1** | 프론트엔드 서버 기동 후 E2E 스펙 실행 및 통과 확인 | 개발자 |
| **P2** | `TenantPgConfigurationControllerIntegrationTest` 어설션 수정 — `$.data`, ApiResponse 래퍼 반영 | core-coder |
| **P3** | PG 설정 라우트에 `ProtectedRoute` 적용 (ADMIN/STAFF) — 오케스트레이션 §4.2 권장 | core-coder |

---

## 6. 산출물 요약

- ✅ E2E 스펙: `tests/e2e/tests/admin/pg-configuration.spec.ts` 추가
- ✅ 검증 문서: 본 문서
- ⚠️ E2E 실제 실행: 서버 기동 후 수동 실행 필요
- ⚠️ 백엔드 통합 테스트: 어설션 수정 권장
