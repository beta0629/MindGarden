# 단회기 패키지 추가 가이드

**작성일**: 2025-01-20  
**대상 테넌트**: beta74@live.co.kr

---

## 📋 작업 내용

`beta74@live.co.kr` 테넌트에 단회기 패키지 6개를 추가합니다.

**추가할 패키지:**
- 단회기 75,000원 (SINGLE_75000)
- 단회기 80,000원 (SINGLE_80000)
- 단회기 85,000원 (SINGLE_85000)
- 단회기 90,000원 (SINGLE_90000)
- 단회기 95,000원 (SINGLE_95000)
- 단회기 100,000원 (SINGLE_100000)

---

## 🔧 실행 방법

### 방법 1: SQL 스크립트 직접 실행 (권장)

1. **개발 서버 접속**
```bash
ssh root@beta0629.cafe24.com
```

2. **MySQL 접속**
```bash
mysql -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution
```

3. **SQL 스크립트 실행**
```bash
source /path/to/scripts/development/utilities/add_single_session_packages_to_tenant.sql
```

또는 파일 내용을 복사해서 직접 실행:
```sql
-- 설정: 이메일 주소
SET @contact_email = 'beta74@live.co.kr';
SET @created_by = 'SYSTEM_MANUAL_ADD';

-- 테넌트 ID 확인
SET @tenant_id = (
    SELECT tenant_id 
    FROM tenants 
    WHERE LOWER(contact_email) = LOWER(@contact_email)
    AND is_deleted = FALSE
    LIMIT 1
);

-- ... (나머지 INSERT 문들)
```

### 방법 2: 백엔드 API 사용 (향후 구현 가능)

`OnboardingServiceImpl.addDefaultTenantCommonCodes()` 메서드를 사용할 수 있지만, 현재는 전체 기본 코드를 추가하므로 단회기 패키지만 추가하려면 SQL 스크립트가 더 적합합니다.

---

## ✅ 실행 후 확인

다음 SQL로 추가된 패키지를 확인할 수 있습니다:

```sql
SELECT 
    code_group,
    code_value,
    korean_name,
    code_label,
    extra_data,
    sort_order,
    is_active,
    created_at
FROM common_codes
WHERE tenant_id = @tenant_id
AND code_group = 'CONSULTATION_PACKAGE'
AND code_value LIKE 'SINGLE_%'
ORDER BY sort_order;
```

---

## 📝 참고사항

- 중복 체크가 포함되어 있어 이미 존재하는 패키지는 추가되지 않습니다.
- `WHERE NOT EXISTS` 절을 사용하여 안전하게 추가됩니다.
- 각 패키지는 `extra_data`에 다음 정보를 포함합니다:
  - `price`: 가격
  - `duration`: 상담 시간 (50분)
  - `unit`: 단위 ("회")
  - `sessions`: 회기 수 (1회기)

---

**스크립트 위치**: `scripts/development/utilities/add_single_session_packages_to_tenant.sql`

