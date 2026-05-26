# 회기 관련 PL/SQL 표준화 프로시저 5종 — 아카이브

**아카이브 일자**: 2026-05-26  
**정책 결정**: Q1 = **1A** (PL/SQL 표준화 프로시저 폐기, Java SSOT 단일 경로)  
**합의서**: `docs/standards/SESSION_MANAGEMENT_POLICY_DECISIONS.md` (commit `ad4592ee8`)

## 폐기 대상 (5종)

| 프로시저 | 원본 (표준화) | deploy 카피 |
|----------|---------------|-------------|
| `UseSessionForMapping` | `UseSessionForMapping_standardized.sql` | `deploy/UseSessionForMapping_deploy.sql` |
| `AddSessionsToMapping` | `AddSessionsToMapping_standardized.sql` | `deploy/AddSessionsToMapping_deploy.sql` |
| `ProcessRefundWithSessionAdjustment` | `ProcessRefundWithSessionAdjustment_standardized.sql` | `deploy/ProcessRefundWithSessionAdjustment_deploy.sql` |
| `ProcessPartialRefund` | `ProcessPartialRefund_standardized.sql` | `deploy/ProcessPartialRefund_deploy.sql` |
| `GetRefundableSessions` | `GetRefundableSessions_standardized.sql` | `deploy/GetRefundableSessions_deploy.sql` |

## 폐기 사유 (요약)

- **5개월 이상 미가동** — 운영 트래픽 없음, Java 경로가 실질 SSOT.
- **enum 정면 충돌** — `MappingStatus` (`COMPLETED` vs `SESSIONS_EXHAUSTED`), `PaymentStatus` (`CONFIRMED` vs `APPROVED`) 등 PL/SQL·Java 드리프트.
- **이중 적용 리스크** — `SessionExtensionServiceImpl` 등에서 PL/SQL + Java sync 중복 호출 가능성.

## DB 반영

- Flyway: `V20260601_001__drop_deprecated_session_procedures.sql` (`core_solution` 단독 `DROP PROCEDURE IF EXISTS` 5종).

## 회귀 시 복원 절차

1. 본 디렉토리의 `*_standardized.sql` 및 `deploy/*_deploy.sql` 을 `database/schema/procedures_standardized/` (및 `deployment/`) 로 복사.
2. DBA/배포 파이프라인으로 프로시저 재생성 (테넌트 `tenant_id` 파라미터 버전 확인).
3. Flyway 롤백 또는 신규 마이그레이션으로 `DROP` 역순 복구 — **1A 정책과 충돌**하므로 운영 복원 전 정책 재컴펌 필수.
4. Java `PlSqlMappingSyncService` 회기 5종 메서드·호출부는 Phase 1 PR 이전 커밋 참조 (본 아카이브와 동일 브랜치 베이스 이전).

## 유지 프로시저 (본 아카이브 범위 외)

- `ValidateMappingIntegrity`, `SyncAllMappings`, `GetRefundStatistics` — `PlSqlMappingSyncService` 에서 계속 사용.
