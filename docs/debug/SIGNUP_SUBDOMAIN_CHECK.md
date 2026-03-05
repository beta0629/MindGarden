# 회원가입 시 서브도메인 접근 점검

**질문**: 서브도메인으로 접근하면 도메인을 조회해서 테넌트 조회한 뒤 회원가입시키면 되지 않나? 문제 있을까?

**결론**: 네, 그렇게 동작하도록 이미 구현되어 있습니다. 서브도메인 접근 → (도메인/호스트에서 서브도메인 추출) → 테넌트 조회 → 회원가입 흐름이며, 아래 항목만 확인하면 됩니다.

---

## 1. 현재 흐름 (서브도메인 접근 시)

```
[사용자] https://mindgarden.dev.core-solution.co.kr/register 접속
    ↓
[회원가입 제출] POST /api/v1/auth/register
    - 요청 Host: mindgarden.dev.core-solution.co.kr (같은 호스트로 API 호출 시)
    - 또는 X-Tenant-Subdomain: mindgarden (프론트에서 추출해 헤더로 전달)
    ↓
[TenantContextFilter] extractTenantId()
    ① Host 헤더 → extractTenantSubdomain(host)
       - "mindgarden.dev.core-solution.co.kr" → 패턴 .dev.core-solution.co.kr 제거 → "mindgarden"
    ② 또는 X-Tenant-Subdomain 헤더 → "mindgarden"
    ↓
[TenantRepository] findBySubdomainIgnoreCase("mindgarden")
    → tenants 테이블에서 subdomain = 'mindgarden' (대소문자 무시) 조회
    → Tenant → tenantId 반환
    ↓
[TenantContextHolder] setTenantId(tenantId)
    ↓
[AuthController.register()] getTenantId()
    → null이면 400 반환 ("테넌트 정보가 필요합니다...")
    → 있으면 user.setTenantId(tenantId) 후 가입 처리
```

즉, **도메인(호스트)에서 서브도메인을 조회하고, 그 서브도메인으로 테넌트를 조회한 뒤 회원가입**하는 구조가 맞습니다.

---

## 2. 점검 체크리스트 (서브도메인 관점)

| 항목 | 상태 | 비고 |
|------|------|------|
| Host에서 서브도메인 추출 | ✅ | `extractTenantSubdomain()` – `.dev.core-solution.co.kr` 등 4종 패턴, dev/app/api/staging/www 제외 |
| 서브도메인 → 테넌트 조회 | ✅ | `findBySubdomainIgnoreCase(subdomain)` – `tenants.subdomain` 컬럼 사용 |
| API가 다른 호스트일 때 | ✅ | 프론트 `getSignupSubdomain()` + `X-Tenant-Subdomain` 헤더로 동일 로직 보완 |
| tenantId 없을 때 가입 차단 | ✅ | register에서 null이면 400 반환 |
| tenants 테이블에 subdomain 존재 | ⚠️ 운영 확인 | 해당 서브도메인(예: mindgarden) 행이 있고 `subdomain` 값이 일치해야 함 |
| 다단계 서브도메인 (예: a.mindgarden.dev...) | ⚠️ 제한 | 현재는 접미사 제거 후 앞부분 전체를 서브도메인으로 사용. DB에 "a.mindgarden"처럼 저장된 테넌트가 없으면 조회 실패 가능 |

---

## 3. 잠재 이슈 (있을 수 있는 문제)

1. **tenants.subdomain 데이터**
   - 해당 도메인(예: mindgarden.dev.core-solution.co.kr)으로 접속해 가입하려면, `tenants` 테이블에 `subdomain = 'mindgarden'`(또는 동일 의미 값)인 행이 있어야 합니다.
   - 없으면 테넌트 조회 실패 → tenantId null → 400 "테넌트 정보가 필요합니다" 발생.

2. **프록시/로드밸런서에서 Host 변경**
   - Nginx 등에서 `Host`를 백엔드로 그대로 넘기지 않으면, 서버가 받는 Host가 서브도메인이 아닐 수 있습니다.
   - 이 경우 프론트에서 보내는 `X-Tenant-Subdomain`에 의존하게 되므로, 프론트와 백엔드가 같은 도메인/호스트를 쓰는지, 또는 헤더 전달이 유지되는지 확인 필요.

3. **로컬 개발**
   - localhost는 서브도메인 패턴에 안 걸리므로, `local.default-tenant-id`(또는 `LOCAL_DEFAULT_TENANT_ID`) 설정이 있으면 해당 테넌트로 가입됩니다. 미설정 시 tenantId null → 400.

---

## 4. 요약

- **서브도메인으로 접근 → 도메인(호스트)에서 서브도메인 추출 → 테넌트 조회 → 회원가입** 흐름은 구현되어 있으며, 설계상 문제 없습니다.
- **추가로 확인할 것**: (1) 사용하는 서브도메인에 해당하는 `tenants.subdomain` 데이터 존재 여부, (2) 프록시/배포 환경에서 Host 또는 X-Tenant-Subdomain 전달 여부, (3) 로컬에서는 기본 테넌트 ID 설정 여부.
