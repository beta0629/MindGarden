---
name: core-solution-multi-tenant
description: 멀티테넌트 시스템. tenantId 없음 절대 허용 안 됨. DB·API·백엔드 모든 레이어에서 tenantId 필수
---

# 멀티테넌트 시스템 (Tenant ID 필수)

Core Solution(MindGarden)은 **멀티테넌트** 시스템입니다. **tenantId가 없는 데이터·API·쿼리는 절대 허용되지 않습니다.**

## 절대 원칙

- **tenantId 없음 = 금지**: 테넌트 소속 데이터는 반드시 tenantId와 함께 존재해야 합니다.
- **예외 없음**: 특수 케이스라고 하여 tenantId를 생략하지 않습니다.

## ⚠️ 쿼리 오류 방지 (매우 중요)

- **tenantId는 필수값**: Repository/Service에서 `findByTenantId(tenantId)` 등 **tenantId를 인자로 받는 쿼리에 null을 넘기면 절대 안 됨**.
- **null 전달 시**: JPQL `WHERE e.tenantId = :tenantId`에 null 바인딩되면 DB/드라이버에 따라 **500 Internal Server Error** 또는 예외 발생.
- **규칙**:
  - `findByTenantId(null)` 호출 금지. 호출 전 반드시 `tenantId != null && !tenantId.isEmpty()` 검증.
  - Service에서 `TenantContextHolder.getTenantId()`가 null이면 **빈 리스트 반환 금지** → **예외 throw** (예: `IllegalStateException("tenantId는 필수입니다.")`).
  - Controller에서 세션/헤더의 tenantId가 없으면 **403 Forbidden** 반환 후 서비스 호출하지 않음. 필요 시 `TenantContextHolder.setTenantId(tenantId)` 설정 후 서비스 호출.
- **참고 사례**: `GET /api/v1/consultation-messages/all` 500 원인 — tenantId 없이 `findByTenantId(null)` 호출. 컨트롤러에서 tenantId 검증 + Context 설정, 서비스에서 null이면 예외 throw로 수정.

## 1. 데이터베이스 (DB)

- **테이블**: 테넌트별 데이터를 저장하는 테이블에는 반드시 `tenant_id` 컬럼 포함 (NOT NULL)
- **인덱스**: `tenant_id` 또는 `(tenant_id, ...)` 복합 인덱스 필수
- **쿼리**: 모든 SELECT/INSERT/UPDATE/DELETE에 `tenant_id` 조건 포함
- **프로시저**: tenant_id 파라미터 필수, WHERE 절에 tenant_id 조건 포함

```sql
-- ✅ 올바름
SELECT * FROM users WHERE tenant_id = ? AND is_deleted = FALSE;

-- ❌ 금지 (tenant_id 없음)
SELECT * FROM users WHERE is_deleted = FALSE;
```

## 2. 백엔드 (Java/Spring)

- **Entity**: 테넌트 테이블은 `tenantId` 필드 필수. `BaseEntity` 상속 시 tenantId 포함
- **Repository**: `findByTenantId...` 형태로 조회. tenantId 없이 전체 조회 금지
- **Service**: `TenantContextHolder` 또는 `SessionUtils`로 현재 tenantId 취득 후 모든 비즈니스 로직에 전달
- **Controller**: 요청에서 `X-Tenant-Id` 헤더 또는 세션의 tenantId 검증 후 `TenantContextHolder.setTenantId()` 설정

## 3. API (프론트·백엔드)

- **X-Tenant-Id 헤더**: 모든 API 요청에 `X-Tenant-Id` 헤더 포함 (StandardizedApi가 세션 기반으로 자동 추가)
- **수동 생략 금지**: tenantId 없이 API 호출 금지
- **검증**: 백엔드에서 tenantId가 null/빈값이면 400 Bad Request 또는 403 Forbidden 반환

## 4. 체크리스트

| 영역 | 확인 항목 |
|------|-----------|
| DB | 새 테이블에 tenant_id 컬럼 포함 여부 |
| DB | 기존 쿼리/프로시저에 tenant_id 조건 포함 여부 |
| Entity | tenantId 필드 존재 여부 |
| Service | TenantContextHolder/session에서 tenantId 취득 후 사용 여부 |
| Service/Repository | **findByTenantId(null) 등 tenantId null로 쿼리 호출 금지** (500 쿼리 오류 원인) |
| API | X-Tenant-Id 헤더 또는 세션 tenantId 검증 여부 |

## 참조 문서

- `docs/standards/DATABASE_MIGRATION_STANDARD.md` — tenant_id 필수
- `docs/standards/MIGRATION_GUIDE.md` — 테넌트 마이그레이션
- `docs/standards/API_DESIGN_STANDARD.md` — X-Tenant-ID 헤더
