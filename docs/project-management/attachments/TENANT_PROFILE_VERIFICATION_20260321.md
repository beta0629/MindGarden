# 테넌트 프로필 수정 검증 보고서

**일자**: 2026-03-21  
**대상**: `frontend/src/components/tenant/TenantProfile.js` (P0 tenant 추출·P3 amount 안전 처리)  
**기준**: TENANT_PROFILE_ACCESS_ERROR_ORCHESTRATION.md §4.3

---

## 1. 변경 사항 요약

| 우선순위 | 수정 내용 | 적용 여부 |
|----------|-----------|-----------|
| **P0** | `data.data?.tenant ?? data.tenant` 이중 방어로 tenant 추출 | ✅ 적용됨 (90행) |
| **P3** | `subscription.amount` → `toSafeNumber(subscription.amount).toLocaleString()` + `amount != null` 가드 | ✅ 적용됨 (302~306행) |

---

## 2. §4.3 체크리스트 검증 결과

### 2.1 ADMIN/STAFF: 테넌트 프로필 접근·탭 스모크

| 항목 | 결과 | 비고 |
|------|------|------|
| `/tenant/profile` 접근 | E2E 대기 | 프론트엔드 서버 미기동으로 E2E 실행 불가 |
| 개요 탭 렌더링 | 스펙 작성 완료 | `tenant-profile.spec.ts` |
| 구독 관리 탭 | 스펙 작성 완료 | SubscriptionManagement 연동 |
| 결제 수단 탭 | 스펙 작성 완료 | PaymentMethodRegistration 연동 |

**E2E 스펙**: `tests/e2e/tests/admin/tenant-profile.spec.ts`  
**실행 방법** (프론트엔드 `npm start` 후):

```bash
cd tests/e2e
BASE_URL=http://localhost:3000 TEST_USERNAME=superadmin@mindgarden.com TEST_PASSWORD=admin123 \
  npx playwright test tests/admin/tenant-profile.spec.ts --project=chromium --config=playwright.manual.config.ts
```

### 2.2 비허용 역할: 접근 시 리다이렉트 또는 403

| 항목 | 결과 | 비고 |
|------|------|------|
| CLIENT 등 비허용 역할 | 정책 미적용 | `/tenant/profile`에 ProtectedRoute 미적용. TenantProfile 내부에서 role 검사 없음. |
| 현재 동작 | tenantId 있는 모든 로그인 사용자 접근 가능 | LNB에 노출은 ADM_SETTINGS_TENANT(ADMIN/STAFF)에 한정되어 있어, CLIENT는 메뉴에서 보이지 않음. 직접 URL 입력 시 접근 가능. |

**권장**: 정책 확정 후 `ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}` 적용 검토.

### 2.3 회귀: billing 연동

| 항목 | 결과 | 비고 |
|------|------|------|
| SubscriptionManagement | 코드 연동 유지 | `tenantId` prop 전달, 탭 전환 시 마운트 |
| PaymentMethodRegistration | 코드 연동 유지 | `tenantId`, `onSuccess`, `onCancel` props |
| amount 안전 처리 | P3 수정 반영 | `toSafeNumber`·가드 적용으로 React #130 위험 감소 |

---

## 3. 수동 검증 체크리스트

프론트엔드·백엔드 기동 후 아래를 수동으로 확인하세요.

- [ ] ADMIN 계정으로 로그인 → LNB 설정 > 테넌트 프로필 클릭 → `/tenant/profile` 로드
- [ ] 개요 탭: 테넌트 정보·구독 요약·결제 수단 요약 표시 (빈 화면/에러 없음)
- [ ] 구독 관리 탭: SubscriptionManagement 영역 표시, 콘솔 오류 없음
- [ ] 결제 수단 탭: PaymentMethodRegistration(추가 버튼)·결제 수단 목록 표시
- [ ] 구독이 있는 경우: `subscription.amount`가 객체여도 React #130 없음 (toSafeNumber 적용)
- [ ] (선택) CLIENT 계정으로 `/tenant/profile` 직접 접근 시 현재 동작 확인 (리다이렉트 여부)

---

## 4. E2E 테스트 실행 결과

| 테스트 | 상태 | 원인 |
|--------|------|------|
| ADMIN: /tenant/profile 접근 시 페이지 로드 및 개요 탭 렌더링 | 미실행 | `net::ERR_CONNECTION_REFUSED` — localhost:3000 미기동 |
| ADMIN: 개요·구독 관리·결제 수단 탭 전환 스모크 | 미실행 | 동일 |

---

## 5. 권장 수정사항

| 우선순위 | 항목 | 권장 내용 |
|----------|------|-----------|
| P2 | ProtectedRoute 적용 | 정책 확정 시 `/tenant/profile`, `/tenant/settings`에 ADMIN/STAFF 역할 보호 추가 |
| P3 | E2E CI 통합 | `playwright.config.ts`의 webServer.command 추가 또는 CI에서 사전 기동 후 `playwright.manual.config.ts` 사용 |

---

## 6. 산출물 목록

- **E2E 스펙**: `tests/e2e/tests/admin/tenant-profile.spec.ts`
- **검증 문서**: 본 문서 (`docs/project-management/attachments/TENANT_PROFILE_VERIFICATION_20260321.md`)
