# 테넌트 컨텍스트 사용 표준 (Tenant Context Usage)

멀티테넌트 요청에서 현재 테넌트 ID를 ThreadLocal로 다루는 방식과 책임을 정리한 문서입니다.

---

## 1. TenantContextHolder vs TenantContext

| 구분 | TenantContext | TenantContextHolder |
|------|----------------|---------------------|
| 역할 | ThreadLocal 저장소 (저수준) | TenantContext 래퍼 + 유틸 메서드 |
| **표준** | 직접 사용 비권장 | **모든 비즈니스/컨트롤러 코드에서 사용** |
| getTenantId() | 있음 (null 가능) | 있음 (null 가능) |
| getRequiredTenantId() | 없음 | **있음 (null/empty 시 IllegalStateException)** |

- **표준**: 애플리케이션 코드(Controller, Service, Repository default 메서드 등)에서는 **TenantContextHolder**만 사용한다.
- TenantContext는 TenantContextHolder 내부 구현 및 Hibernate Resolver 등에서만 참조한다.

---

## 2. setTenantId 호출 책임

다음 위치에서 현재 요청/작업의 테넌트를 설정한다.

| 위치 | 설명 |
|------|------|
| **필터** | 일반 API: `TenantContextFilter`에서 헤더/세션 등으로 tenantId 확정 후 `TenantContextHolder.setTenantId(tenantId)` |
| **공개 API 필터** | tenant 없이 접근 가능한 경로도, 테넌트가 결정되면 동일하게 set |
| **컨트롤러** | 세션 사용자 기준으로 tenantId를 보완해야 할 때 (예: 대시보드 목록 조회 전 세션 사용자의 tenantId로 set) |
| **스케줄러/배치** | 테넌트 단위 루프에서 각 테넌트 처리 전 `TenantContextHolder.setTenantId(tenantId)` |

---

## 3. clear 호출 책임

ThreadLocal 누수 방지를 위해 다음 위치에서 반드시 clear 한다.

| 위치 | 설명 |
|------|------|
| **필터** | `finally` 블록에서 `TenantContextHolder.clear()` |
| **스케줄러/배치** | 테넌트 루프의 `finally`에서 `TenantContextHolder.clear()` |
| **비동기** | `TaskDecorator`에서 자식 스레드 작업 종료 시 `finally`로 `TenantContextHolder.clear()` |

---

## 4. tenantId 조회: getTenantId() vs getRequiredTenantId()

| 상황 | 사용 메서드 |
|------|-------------|
| tenantId가 **필수**인 경로 (없으면 비즈니스 오류) | `TenantContextHolder.getRequiredTenantId()` |
| tenantId가 없을 수 있는 경로 (선택/폴백 처리) | `TenantContextHolder.getTenantId()` + null 체크 |

- **getRequiredTenantId()**: null 또는 empty면 `IllegalStateException("Tenant ID is not set in current context")` 발생.  
  기존에 `getTenantId()` 후 `if (tenantId == null \|\| tenantId.isEmpty()) throw ...` 하던 패턴은 `getRequiredTenantId()` 한 줄로 교체한다.
- Repository의 default 메서드(`findAllActiveByCurrentTenant()` 등)는 tenantId 필수 정책에 맞게 내부에서 `getRequiredTenantId()`를 사용한다.

---

## 5. 체크리스트

- [ ] 모든 Controller/Service/Repository에서 tenantId 접근 시 **TenantContextHolder** 사용 (TenantContext 직접 사용 금지)
- [ ] setTenantId는 필터·컨트롤러·스케줄러 등 **정해진 책임 위치**에서만 호출
- [ ] clear는 필터/스케줄러/비동기 TaskDecorator의 **finally**에서 호출
- [ ] tenantId가 필수인 로직에는 **getRequiredTenantId()** 사용하고, 중복 null/empty throw 제거
- [ ] BaseRepository의 `*ByCurrentTenant()` default 메서드는 tenantId 없을 때 HQ 폴백 없이 **getRequiredTenantId()** 사용

---

**관련 문서**: `TENANT_ID_GENERATION_STANDARD.md`, `TENANT_ROLE_SYSTEM_STANDARD.md`, `.cursor/skills/core-solution-multi-tenant/SKILL.md`
