# OPS Portal 테넌트 코드 복사 로직 상세 설명

**작성일**: 2025-11-26  
**버전**: 1.0.0  
**작성자**: AI Assistant

---

## 📋 목차

1. [개요](#개요)
2. [왜 코드 복사가 필요한가?](#왜-코드-복사가-필요한가)
3. [현재 구현 로직](#현재-구현-로직)
4. [기술적 상세](#기술적-상세)
5. [트러블슈팅](#트러블슈팅)

---

## 개요

MindGarden는 **멀티테넌트 SaaS** 시스템으로, 각 테넌트(고객사)는 독립적인 데이터를 가지면서도 일부 공통 설정을 공유합니다. 신규 테넌트 생성 시 **기본 설정값(공통코드)을 자동으로 복사**하여 즉시 사용 가능한 상태로 만드는 것이 핵심입니다.

### 핵심 개념

- **SYSTEM 타입 코드**: 모든 테넌트가 공유 (`tenant_id = NULL`)
- **TENANT 타입 코드**: 테넌트별로 독립 관리 (`tenant_id = 'tenant001'`)
- **코드 복사**: 신규 테넌트 생성 시 기존 테넌트의 TENANT 타입 코드를 복사

---

## 왜 코드 복사가 필요한가?

### 문제 상황

신규 테넌트가 생성되면:

```
❌ 문제: TENANT 타입 코드가 없음
→ 상담 패키지 목록이 비어있음
→ 전문분야 선택 불가
→ 결제 방법 없음
→ 시스템 사용 불가
```

### 해결 방법

```
✅ 해결: 기존 테넌트의 TENANT 타입 코드를 복사
→ 기본 상담 패키지 자동 생성
→ 기본 전문분야 자동 생성
→ 기본 결제 방법 자동 생성
→ 바로 시스템 사용 가능
```

### 공통코드 시스템의 두 가지 타입

#### 1. SYSTEM 타입 (모든 테넌트 공유)

```sql
-- 예: 결제 상태, 시스템 설정
SELECT * FROM common_codes 
WHERE tenant_id IS NULL;

-- 결과:
code_group        | code_value | korean_name | tenant_id
PAYMENT_STATUS    | PENDING    | 결제 대기    | NULL
PAYMENT_STATUS    | COMPLETED  | 결제 완료    | NULL
```

#### 2. TENANT 타입 (테넌트별 독립)

```sql
-- 예: 상담 패키지, 전문분야
SELECT * FROM common_codes 
WHERE tenant_id = 'tenant001';

-- 결과:
code_group              | code_value | korean_name      | tenant_id
CONSULTATION_PACKAGE    | BASIC      | 기본 패키지       | tenant001
CONSULTATION_PACKAGE    | PREMIUM    | 프리미엄 패키지   | tenant001
SPECIALTY               | GENERAL    | 일반 상담        | tenant001
```

### 복사되는 코드 그룹 (V53 마이그레이션 정의)

```sql
-- CopyDefaultTenantCodes 프로시저에서 복사하는 코드 그룹들
CONSULTATION_PACKAGE  -- 상담 패키지
PACKAGE_TYPE          -- 패키지 타입
PAYMENT_METHOD        -- 결제 방법
SPECIALTY             -- 전문분야
CONSULTATION_TYPE     -- 상담 유형
MAPPING_STATUS        -- 매핑 상태
RESPONSIBILITY        -- 담당자 구분
CONSULTANT_GRADE      -- 상담사 등급
```

---

## 현재 구현 로직

### 전체 흐름도

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 사용자가 온보딩 신청 (프론트엔드)                        │
│    - 테넌트명, 사업자 정보 입력                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. OPS Portal 프론트엔드 (3001)                             │
│    POST /api/v1/ops/onboarding/requests                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. OPS Portal 백엔드 (8081) - 개발 DB                       │
│    - ops_onboarding_request 테이블에 저장                   │
│    - status: PENDING                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. OPS 관리자가 승인 버튼 클릭                              │
│    POST /api/v1/ops/onboarding/requests/{id}/decision       │
│    { status: "APPROVED", actorId: "admin@..." }            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. OPS Portal 백엔드 (8081)                                 │
│    OnboardingService.decide()                               │
│    ↓                                                        │
│    if (status == APPROVED) {                                │
│      // 메인 백엔드 API 호출 ← 🆕 핵심!                     │
│      restTemplate.postForObject(                            │
│        "http://localhost:8080/api/v1/onboarding/...",       │
│        payload                                              │
│      )                                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. 메인 백엔드 (8080) - 메인 DB                             │
│    OnboardingController.decide()                            │
│    ↓                                                        │
│    OnboardingApprovalService.processOnboardingApproval()    │
│    ↓                                                        │
│    CALL ProcessOnboardingApproval(...)                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. MySQL 프로시저 실행 (메인 DB)                            │
│    ProcessOnboardingApproval                                │
│    ↓                                                        │
│    CALL CreateOrActivateTenant(                             │
│      p_tenant_id,                                           │
│      p_tenant_name,                                         │
│      p_business_type,                                       │
│      ...                                                    │
│    )                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. CreateOrActivateTenant 프로시저                          │
│    ↓                                                        │
│    INSERT INTO tenants (...)  -- 테넌트 생성                │
│    ↓                                                        │
│    CALL CopyDefaultTenantCodes(                             │
│      p_tenant_id,  -- 새 테넌트 ID                          │
│      (SELECT tenant_id FROM tenants                         │
│       WHERE status='ACTIVE' LIMIT 1)  -- 소스 테넌트        │
│    )                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. CopyDefaultTenantCodes 프로시저 ← 🎯 핵심 로직!          │
│                                                             │
│    -- 기존 테넌트의 TENANT 타입 코드 복사                    │
│    INSERT INTO common_codes (                               │
│      code_group, code_value, korean_name, ...,             │
│      tenant_id  -- 🆕 새 테넌트 ID로 설정                   │
│    )                                                        │
│    SELECT                                                   │
│      cc.code_group, cc.code_value, cc.korean_name, ...,    │
│      'tenant002'  -- 🆕 새 테넌트 ID                        │
│    FROM common_codes cc                                     │
│    INNER JOIN code_group_metadata cgm                       │
│      ON cc.code_group = cgm.group_name                      │
│    WHERE cc.tenant_id = 'tenant001'  -- 소스 테넌트         │
│      AND cgm.code_type = 'TENANT'                           │
│      AND cc.is_active = TRUE                                │
│                                                             │
│    -- 복사 결과:                                            │
│    tenant001의 상담 패키지 → tenant002로 복사               │
│    tenant001의 전문분야 → tenant002로 복사                  │
│    tenant001의 결제 방법 → tenant002로 복사                 │
│    ...                                                      │
└─────────────────────────────────────────────────────────────┘
```

### 단계별 상세 설명

#### Step 1-4: 온보딩 요청 생성 및 승인 대기

- 사용자가 OPS Portal에서 온보딩 신청
- `ops_onboarding_request` 테이블에 `PENDING` 상태로 저장
- OPS 관리자가 검토 후 승인/거부 결정

#### Step 5: OPS Portal의 메인 백엔드 API 호출 (핵심!)

**파일**: `backend-ops/src/main/java/com/mindgarden/ops/service/onboarding/OnboardingService.java`

```java
@Transactional
public OnboardingRequest decide(UUID requestId, OnboardingStatus status, String actorId, String note) {
    OnboardingRequest request = repository.findById(requestId)
        .orElseThrow(() -> new IllegalArgumentException("요청을 찾을 수 없습니다."));

    // 승인인 경우 메인 백엔드 API 호출하여 실제 테넌트 생성
    if (status == OnboardingStatus.APPROVED) {
        try {
            log.info("메인 백엔드 API 호출: 테넌트 생성 프로시저 실행 - tenantId={}", request.getTenantId());
            
            // 메인 백엔드 API 호출
            String url = mainBackendUrl + "/api/v1/onboarding/requests/" + requestId + "/decision";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("status", status.name());
            payload.put("actorId", actorId);
            payload.put("note", note);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            
            restTemplate.postForObject(url, entity, Object.class);
            
            log.info("✅ 메인 백엔드 API 호출 성공: 테넌트 생성 완료");
        } catch (Exception e) {
            log.error("❌ 메인 백엔드 API 호출 실패: {}", e.getMessage(), e);
            // 실패해도 OPS Portal의 상태는 업데이트 (수동 재시도 가능)
            status = OnboardingStatus.ON_HOLD;
            note = (note != null ? note + "\n\n" : "") + "[오류] 테넌트 생성 실패: " + e.getMessage();
        }
    }

    request.setStatus(status);
    request.setDecidedBy(actorId);
    request.setDecisionAt(DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
    request.setDecisionNote(note);
    OnboardingRequest saved = repository.save(request);

    // 감사 로그 기록
    auditService.record(...);

    return saved;
}
```

**설정**: `backend-ops/src/main/resources/application.yml`

```yaml
# 메인 백엔드 URL (테넌트 생성 프로시저 호출용)
main:
  backend:
    url: ${MAIN_BACKEND_URL:http://localhost:8080}  # 로컬
    # url: ${MAIN_BACKEND_URL:http://dev.m-garden.co.kr}  # 개발
```

#### Step 6-7: 메인 백엔드에서 프로시저 호출

**파일**: `src/main/java/com/coresolution/core/controller/OnboardingController.java`

```java
@PostMapping("/requests/{id}/decision")
public ResponseEntity<ApiResponse<OnboardingRequest>> decide(
        @PathVariable Long id,
        @RequestBody @Valid OnboardingDecisionRequest payload) {
    // 권한 체크
    OpsPermissionUtils.requireAdminOrOps();
    
    log.info("온보딩 요청 결정: id={}, status={}, actorId={}", 
        id, payload.status(), payload.actorId());
    
    // 프로시저 호출
    OnboardingRequest updated = onboardingService.decide(
        id,
        payload.status(),
        payload.actorId(),
        payload.note()
    );
    
    log.info("✅ 온보딩 요청 결정 완료: id={}, status={}", id, payload.status());
    return updated("온보딩 요청이 승인되었습니다.", updated);
}
```

#### Step 8: CreateOrActivateTenant 프로시저

**파일**: `src/main/resources/sql/procedures/create_or_activate_tenant.sql`

```sql
CREATE PROCEDURE CreateOrActivateTenant(
    IN p_tenant_id VARCHAR(64),
    IN p_tenant_name VARCHAR(120),
    IN p_business_type VARCHAR(40),
    IN p_approved_by VARCHAR(64),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    -- 테넌트 생성
    INSERT INTO tenants (
        tenant_id,
        name,
        business_type,
        status,
        subscription_status,
        created_at,
        updated_at,
        ...
    ) VALUES (
        p_tenant_id,
        p_tenant_name,
        p_business_type,
        'ACTIVE',
        'ACTIVE',
        NOW(),
        NOW(),
        ...
    );
    
    -- 기본 테넌트 코드 자동 복사
    CALL CopyDefaultTenantCodes(
        p_tenant_id,
        (SELECT tenant_id FROM tenants WHERE is_deleted = FALSE AND status = 'ACTIVE' LIMIT 1),
        @copy_success,
        @copy_message
    );
    
    IF @copy_success = TRUE THEN
        SET p_success = TRUE;
        SET p_message = CONCAT('테넌트 생성 완료 (코드 복사: ', @copy_message, ')');
    ELSE
        SET p_success = TRUE;  -- 코드 복사 실패해도 테넌트 생성은 성공으로 처리
        SET p_message = CONCAT('테넌트 생성 완료 (코드 복사 실패: ', @copy_message, ')');
    END IF;
    
    COMMIT;
END;
```

#### Step 9: CopyDefaultTenantCodes 프로시저 (핵심!)

**파일**: `src/main/resources/sql/procedures/copy_default_tenant_codes.sql`

```sql
CREATE PROCEDURE CopyDefaultTenantCodes(
    IN p_tenant_id VARCHAR(64),           -- 새 테넌트 ID
    IN p_source_tenant_id VARCHAR(64),    -- 소스 테넌트 ID
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_copied_count INT DEFAULT 0;
    DECLARE v_tenant_code_groups TEXT DEFAULT '';
    
    START TRANSACTION;
    
    -- 테넌트별 코드 그룹 목록 (V53에서 정의된 TENANT 타입)
    SET v_tenant_code_groups = 'CONSULTATION_PACKAGE,PACKAGE_TYPE,PAYMENT_METHOD,SPECIALTY,CONSULTATION_TYPE,MAPPING_STATUS,RESPONSIBILITY,CONSULTANT_GRADE';
    
    -- 기본 테넌트 코드 복사 (소스 테넌트에서 새 테넌트로)
    INSERT INTO common_codes (
        code_group,
        code_value,
        korean_name,
        code_label,
        code_description,
        sort_order,
        is_active,
        color_code,
        icon,
        parent_code_group,
        parent_code_value,
        extra_data,
        tenant_id,        -- 🆕 새 테넌트 ID로 설정
        created_at,
        updated_at,
        is_deleted,
        version
    )
    SELECT 
        cc.code_group,
        cc.code_value,
        cc.korean_name,
        cc.code_label,
        cc.code_description,
        cc.sort_order,
        cc.is_active,
        cc.color_code,
        cc.icon,
        cc.parent_code_group,
        cc.parent_code_value,
        cc.extra_data,
        p_tenant_id,      -- 🆕 새 테넌트 ID로 설정
        NOW(),
        NOW(),
        FALSE,
        0
    FROM common_codes cc
    INNER JOIN code_group_metadata cgm ON cc.code_group = cgm.group_name
    WHERE cc.tenant_id = p_source_tenant_id    -- 소스 테넌트의 코드만
    AND cgm.code_type = 'TENANT'               -- TENANT 타입만
    AND cc.is_deleted = FALSE
    AND cc.is_active = TRUE
    AND FIND_IN_SET(cc.code_group, v_tenant_code_groups) > 0;
    
    -- 복사된 레코드 수 확인
    SET v_copied_count = ROW_COUNT();
    
    -- 복사된 코드가 없는 경우 기본 코드 생성
    IF v_copied_count = 0 THEN
        -- 기본 상담 패키지 코드 생성
        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            sort_order, is_active, tenant_id, created_at, updated_at,
            is_deleted, version
        ) VALUES 
        ('CONSULTATION_PACKAGE', 'BASIC', '기본 패키지', '기본 패키지', '기본 상담 패키지', 1, TRUE, p_tenant_id, NOW(), NOW(), FALSE, 0),
        ('CONSULTATION_PACKAGE', 'PREMIUM', '프리미엄 패키지', '프리미엄 패키지', '프리미엄 상담 패키지', 2, TRUE, p_tenant_id, NOW(), NOW(), FALSE, 0),
        -- ... 더 많은 기본 코드들
        ;
        
        SET v_copied_count = ROW_COUNT();
        SET p_message = CONCAT('기본 테넌트 코드 생성 완료: ', v_copied_count, '개');
    ELSE
        SET p_message = CONCAT('테넌트 코드 복사 완료: ', v_copied_count, '개');
    END IF;
    
    SET p_success = TRUE;
    COMMIT;
END;
```

---

## 기술적 상세

### 1. 왜 메인 백엔드를 거쳐야 하나?

#### DB 구조

```
개발 DB (core_solution)
├─ OPS Portal 전용 테이블
│  ├─ ops_onboarding_request ✅
│  ├─ ops_audit_log ✅
│  └─ ops_feature_flag ✅
│
└─ 메인 시스템 테이블
   ├─ tenants ✅
   ├─ common_codes ✅
   ├─ code_group_metadata ✅
   └─ 프로시저들 ✅
       ├─ CreateOrActivateTenant
       └─ CopyDefaultTenantCodes
```

#### 문제: OPS Portal이 직접 프로시저를 호출하면?

```
❌ 프로시저가 메인 DB에 있음
❌ OPS Portal은 개발 DB를 바라보지만 tenants, common_codes 테이블은 메인 스키마
❌ 권한 분리 문제 (OPS는 읽기 전용, 쓰기는 메인 백엔드만)
❌ 트랜잭션 관리 복잡성
```

#### 해결: 메인 백엔드 API를 호출

```
✅ 메인 백엔드가 프로시저 실행 권한 보유
✅ 트랜잭션 관리 일원화
✅ 보안 및 권한 체계 유지
✅ API 기반 통신으로 시스템 간 결합도 낮춤
```

### 2. 소스 테넌트 자동 선택 로직

```sql
-- 소스 테넌트 자동 선택
SELECT tenant_id FROM tenants 
WHERE is_deleted = FALSE 
  AND status = 'ACTIVE' 
LIMIT 1

-- 결과: 'tenant001' (첫 번째 활성 테넌트)
```

**장점**:
- 항상 **첫 번째 활성 테넌트**를 소스로 사용
- 새 테넌트는 **검증된 기본 설정**을 상속받음
- 관리자가 소스를 지정할 필요 없음
- 일관된 초기 설정 보장

### 3. 실패 처리 및 재시도

#### OPS Portal의 실패 처리

```java
try {
    // 메인 백엔드 API 호출
    restTemplate.postForObject(...);
    status = APPROVED; ✅
} catch (Exception e) {
    // 실패 시 ON_HOLD 상태로 전환
    status = ON_HOLD; ⚠️
    note = "[오류] 테넌트 생성 실패: " + e.getMessage();
}
```

#### 재시도 API

**엔드포인트**: `POST /api/v1/onboarding/requests/{id}/retry`

```java
@PostMapping("/requests/{id}/retry")
public ResponseEntity<ApiResponse<OnboardingRequest>> retryApproval(
        @PathVariable Long id,
        @RequestBody(required = false) Map<String, String> payload) {
    OpsPermissionUtils.requireAdminOrOps();
    
    log.info("온보딩 승인 프로세스 재시도: id={}", id);
    
    String actorId = payload != null && payload.containsKey("actorId") 
        ? payload.get("actorId") 
        : "SYSTEM_RETRY";
    
    OnboardingRequest updated = onboardingService.retryApproval(id, actorId, note);
    
    log.info("✅ 온보딩 승인 프로세스 재시도 완료: id={}", id);
    return updated("온보딩 승인 프로세스가 재시도되었습니다.", updated);
}
```

### 4. 환경별 설정

#### 로컬 환경 (`application.yml`)

```yaml
main:
  backend:
    url: http://localhost:8080
```

#### 개발 환경 (`application-dev.yml`)

```yaml
main:
  backend:
    url: http://dev.m-garden.co.kr
```

#### 운영 환경 (`application-prod.yml`)

```yaml
main:
  backend:
    url: https://api.m-garden.co.kr
```

---

## 트러블슈팅

### 문제 1: 코드 복사가 실행되지 않음

**증상**:
- 신규 테넌트 생성 후 공통코드가 비어있음
- 상담 패키지, 전문분야 등이 표시되지 않음

**원인**:
- OPS Portal이 메인 백엔드 API를 호출하지 않음
- 프로시저가 실행되지 않음

**해결**:
1. OPS Portal 로그 확인:
   ```bash
   grep "메인 백엔드 API 호출" backend-ops/logs/application.log
   ```

2. 메인 백엔드 URL 설정 확인:
   ```yaml
   main:
     backend:
       url: http://localhost:8080  # 올바른 URL인지 확인
   ```

3. 메인 백엔드가 실행 중인지 확인:
   ```bash
   curl http://localhost:8080/actuator/health
   ```

### 문제 2: ON_HOLD 상태로 전환됨

**증상**:
- 온보딩 승인 후 상태가 `ON_HOLD`로 변경됨
- `decision_note`에 오류 메시지 기록됨

**원인**:
- 메인 백엔드 API 호출 실패
- 프로시저 실행 중 오류 발생

**해결**:
1. `decision_note` 확인:
   ```sql
   SELECT decision_note FROM ops_onboarding_request 
   WHERE status = 'ON_HOLD' 
   ORDER BY updated_at DESC LIMIT 1;
   ```

2. 메인 백엔드 로그 확인:
   ```bash
   grep "ProcessOnboardingApproval" backend/logs/application.log
   ```

3. 재시도:
   ```bash
   curl -X POST http://localhost:8081/api/v1/ops/onboarding/requests/{id}/retry \
     -H "Content-Type: application/json" \
     -d '{"actorId": "admin@mindgarden.com"}'
   ```

### 문제 3: 소스 테넌트가 없음

**증상**:
- 프로시저 실행 중 "소스 테넌트를 찾을 수 없음" 오류
- 기본 코드가 생성되지 않음

**원인**:
- DB에 활성 테넌트가 하나도 없음
- 첫 번째 테넌트 생성 시 발생

**해결**:
- `CopyDefaultTenantCodes` 프로시저는 소스 테넌트가 없으면 **기본 코드를 자동 생성**합니다
- 복사 실패 시 fallback 로직:
  ```sql
  IF v_copied_count = 0 THEN
      -- 기본 코드 생성
      INSERT INTO common_codes (...) VALUES
      ('CONSULTATION_PACKAGE', 'BASIC', '기본 패키지', ...),
      ('CONSULTATION_PACKAGE', 'PREMIUM', '프리미엄 패키지', ...),
      ...
  END IF;
  ```

### 문제 4: 중복 코드 생성

**증상**:
- 동일한 `code_group` + `code_value` + `tenant_id` 조합이 중복 생성됨
- Unique constraint 오류 발생

**원인**:
- 프로시저가 여러 번 실행됨
- 재시도 로직 오류

**해결**:
1. 중복 코드 확인:
   ```sql
   SELECT code_group, code_value, tenant_id, COUNT(*) as cnt
   FROM common_codes
   WHERE tenant_id = 'tenant002'
   GROUP BY code_group, code_value, tenant_id
   HAVING cnt > 1;
   ```

2. 중복 제거:
   ```sql
   -- 최신 레코드만 남기고 삭제
   DELETE cc1 FROM common_codes cc1
   INNER JOIN common_codes cc2
   WHERE cc1.code_group = cc2.code_group
     AND cc1.code_value = cc2.code_value
     AND cc1.tenant_id = cc2.tenant_id
     AND cc1.created_at < cc2.created_at;
   ```

3. Unique constraint 추가 (예방):
   ```sql
   ALTER TABLE common_codes
   ADD UNIQUE INDEX uk_code_tenant (code_group, code_value, tenant_id);
   ```

---

## 요약

### 목적
신규 테넌트에게 **즉시 사용 가능한 기본 설정**을 제공

### 방법
기존 테넌트의 **TENANT 타입 공통코드**를 복사

### 현재 구조
```
OPS Portal (승인) 
  → 메인 백엔드 API 호출 
    → 프로시저 실행 (테넌트 생성 + 코드 복사)
      → 신규 테넌트 즉시 사용 가능 ✅
```

### 이점
- ✅ 신규 테넌트가 빈 시스템이 아닌 **기본 설정이 갖춰진 상태**로 시작
- ✅ 관리자가 매번 수동으로 코드를 입력할 필요 없음
- ✅ 표준화된 초기 설정으로 **일관된 사용자 경험** 제공
- ✅ 소스 테넌트의 **검증된 설정**을 상속받아 안정성 확보

---

## 관련 파일

### 백엔드 (OPS Portal)
- `backend-ops/src/main/java/com/mindgarden/ops/service/onboarding/OnboardingService.java`
- `backend-ops/src/main/java/com/mindgarden/ops/config/RestTemplateConfig.java`
- `backend-ops/src/main/resources/application.yml`
- `backend-ops/src/main/resources/application-dev.yml`

### 백엔드 (메인)
- `src/main/java/com/coresolution/core/controller/OnboardingController.java`
- `src/main/java/com/coresolution/core/service/OnboardingApprovalService.java`
- `src/main/resources/sql/procedures/create_or_activate_tenant.sql`
- `src/main/resources/sql/procedures/copy_default_tenant_codes.sql`

### 마이그레이션
- `src/main/resources/db/migration/V53__add_code_type_to_code_group_metadata.sql`
- `src/main/resources/db/migration/V55__integrate_tenant_code_copy_to_onboarding.sql`

---

**문서 버전**: 1.0.0  
**최종 업데이트**: 2025-11-26  
**다음 리뷰 예정일**: 2025-12-26

