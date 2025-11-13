# Phase 1 Data Model – Internal Operator Portal

작성일: 2025-11-13

## 1. 테이블 개요
| 테이블 | 설명 |
| --- | --- |
| `ops_onboarding_request` | 테넌트 온보딩 요청 및 결정 기록 |
| `ops_pricing_plan` | 내부 표준 요금제 메타데이터 |
| `ops_pricing_addon` | 애드온/추가 기능 메타데이터 |
| `ops_plan_addon` | 요금제와 애드온 매핑 |
| `ops_feature_flag` | 운영 포털용 Feature Flag 레지스트리 |
| `ops_audit_log` | 운영 행위 감사 로그 |

## 2. 테이블 상세
### 2.1 ops_onboarding_request
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | UUID | PK |
| `tenant_id` | VARCHAR(64) | MindGarden 테넌트 식별자 |
| `tenant_name` | VARCHAR(120) | 테넌트 명 |
| `requested_by` | VARCHAR(64) | 요청자 계정 |
| `status` | VARCHAR(20) | `PENDING`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `ON_HOLD` |
| `risk_level` | VARCHAR(16) | `LOW`, `MEDIUM`, `HIGH` |
| `checklist_json` | TEXT | 체크리스트 JSON |
| `decided_by` | VARCHAR(64) | 승인자 |
| `decision_at` | VARCHAR(30) | 결정 시간(ISO String) |
| `decision_note` | TEXT | 비고 |
| `created_at`, `updated_at` | TIMESTAMP | 감사 필드 |

### 2.2 ops_pricing_plan
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `plan_code` | VARCHAR(40) | 요금제 코드 (Unique) |
| `display_name` | VARCHAR(120) | 노출 이름 |
| `display_name_ko` | VARCHAR(120) | 노출 이름(한글) |
| `base_fee` | NUMERIC(12,2) | 기본 요금 |
| `currency` | VARCHAR(8) | 통화 (기본 KRW) |
| `description` | TEXT | 설명 |
| `description_ko` | TEXT | 설명(한글) |
| `active` | BOOLEAN | 사용 여부 |

### 2.3 ops_pricing_addon
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `addon_code` | VARCHAR(40) | 애드온 코드 (Unique) |
| `display_name` | VARCHAR(120) | 노출 이름 |
| `display_name_ko` | VARCHAR(120) | 노출 이름(한글) |
| `category` | VARCHAR(60) | 카테고리 |
| `category_ko` | VARCHAR(60) | 카테고리(한글) |
| `fee_type` | VARCHAR(16) | `FLAT`, `USAGE`, `PERCENTAGE` |
| `unit_price` | NUMERIC(12,2) | 단가 |
| `unit` | VARCHAR(32) | 단위 |
| `active` | BOOLEAN | 사용 여부 |

### 2.4 ops_plan_addon
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `plan_id` | UUID | `ops_pricing_plan` FK |
| `addon_id` | UUID | `ops_pricing_addon` FK |
| `notes` | VARCHAR(255) | 비고 |

### 2.5 ops_feature_flag
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `flag_key` | VARCHAR(64) | Feature Flag 키 (Unique) |
| `state` | VARCHAR(16) | `DISABLED`, `SHADOW`, `ENABLED` |
| `target_scope` | VARCHAR(64) | 적용 범위 (예: `HQ_ADMIN`, `tenant:123`) |
| `expires_at` | TIMESTAMP | 만료 시각 |

### 2.6 ops_audit_log
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `event_type` | VARCHAR(64) | 이벤트 분류 (예: `ONBOARDING_DECISION`) |
| `entity_type` | VARCHAR(64) | 엔티티 유형 (예: `ONBOARDING_REQUEST`) |
| `entity_id` | VARCHAR(64) | 엔티티 식별자 |
| `actor_id` | VARCHAR(64) | 수행자 |
| `actor_role` | VARCHAR(64) | 역할 |
| `action` | VARCHAR(120) | 수행 동작 |
| `metadata_json` | TEXT | 부가 정보 |

## 3. 관계 다이어그램 (텍스트)
```
ops_pricing_plan (1) ──< ops_plan_addon >── (1) ops_pricing_addon
ops_onboarding_request ──< ops_audit_log (event_type=ONBOARDING)
ops_feature_flag ──< ops_audit_log (event_type=FEATURE_FLAG)
```

## 4. 배치/프로시저 계획
- 월별 AI 사용량 집계는 기존 MindGarden PL/SQL 패키지를 호출하여 `ops_pricing_addon`과 연결 (Phase 2).
- 감사 로그 보관 기간: 3년 (추후 아카이브 정책 수립 예정).

## 5. 추가 TODO
- `ops_notification_event` (알림 이벤트 테이블) Phase 2에서 도입 예정
- `ops_dashboard_snapshot` (지표 캐시) 필요 시 추가
