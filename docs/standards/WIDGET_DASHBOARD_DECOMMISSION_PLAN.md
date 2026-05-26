# 위젯 대시보드 시스템 폐기 합의서

**버전**: 1.0.0
**작성일**: 2026-05-26
**상태**: 합의서 (Plan only — 실행 전)
**브랜치**: `docs/widget-decommission-plan`
**역할**: core-planner
**근거 보고**: explore 인벤토리 — Agent `c1860243`
**채택 옵션**: 옵션 A — `/dashboard` 역할 기반 redirect + 위젯 시스템 전체 제거 + 기존 V2 대시보드 활용

---

## 0. 본 문서의 목적과 한계

- 본 합의서는 **읽기 전용 산출물**이다. 코드/DB/Flyway 변경 0건.
- Phase 1~6 의 자동 진행 금지. 각 Phase 운영 반영은 **별도 위임 + 사용자 컴펜** 필수.
- 본 합의서는 위임 분배의 단일 진입점 역할만 한다. (core-coder / core-tester / deployer 호출 없음.)

---

## 1. 배경 + 현재 상태

### 1.1 explore 인벤토리 결과 (Agent `c1860243`)

| 영역 | 파일 수 | LOC (추정) | 비고 |
|---|---|---|---|
| FE 위젯 컴포넌트 (`frontend/src/components/widgets/**`) | 110 | ~31,657 | 위젯 단위 React 컴포넌트 + 동봉 CSS |
| FE 편집기 (`DashboardFormModal`, `Dashboard3DPreview`, `DashboardManagement` 등) | 7 | ~4,231 | `/admin/dashboards` 진입 어드민 편집기 |
| FE 위젯 인프라 (`DynamicDashboard`, `WidgetBasedDashboard`, `WidgetRegistry` 등) | 5 | ~3,038 | `/dashboard` 진입점에서 사용 중 |
| FE 위젯 CSS | ~40 | (컴포넌트 동봉) | 컴포넌트와 함께 삭제 |
| BE `WidgetController` + Service + Domain + DTO | 19 | ~6,798 | 5개월 변경 없음 (2025-12 이후 동결) |
| DB 위젯 관련 (`widget_groups`, `widget_definitions`, `role_templates.default_widgets_json`) | Flyway 6건 | ~750 | 활성 데이터 보유 |
| i18n 시드 (ko) | 4 파일 | 39 키 | `admin/common/statistics/error` |
| LNB common_code | Flyway V45 1건 | 2 row | 어드민 LNB 노출 (`is_active=true`) |
| docs 활성 | ~119건 | — | archive 외 운영 문서 다수 |
| docs archive | ~80건 | — | 그대로 보존 |
| **합계** | **~181 FE/BE 파일 + 6 DB 마이그** | **~45K LOC + DB** | — |

### 1.2 진입점 / 라우트 현황

- **활성 사용 중**: `/dashboard` → `DynamicDashboard` → `WidgetBasedDashboard` (위젯 기반 동적 렌더링).
- **활성 사용 중**: `/admin/dashboards` → `DashboardManagement` (어드민 편집기, LNB 노출).
- **Dead route**: `/admin/dashboard-widget`, `/admin/dashboard-legacy`, `/admin/dashboard-old` (App.js 등록만 되어 있고 진입 동선 없음).
- **이미 위젯 미사용 정적 분리 완료**:
  - 어드민 V2 → `AdminDashboardV2` (`/admin/dashboard`)
  - 상담사 V2 → `ConsultantDashboardV2` (`/consultant/dashboard`)
  - 내담자 V2 → `ClientDashboard` (`/client/dashboard`)
  - 학원 → `/academy`

### 1.3 폐기 사유

1. **5개월 방치**: 백엔드 핵심 위젯 코드(`WidgetController`/`WidgetGroupService` 외 19파일)가 2025-12 이후 동결.
2. **품질 미달**: 디자인/동작 일관성 부족, 시각 회귀 보장 없음, 운영 중 사용자 명시 deprecated.
3. **이중 유지비**: V2 정적 대시보드가 이미 역할별로 분리되어 운영 중 — 위젯 시스템은 중복 자산.
4. **운영 표면 단순화**: `/dashboard` 단일 진입점을 역할 기반 redirect 로 단순화 시 LNB·라우트·백엔드 대형 표면 일괄 축소.

### 1.4 옵션 A 채택 사유

- **대안 비교**:
  - 옵션 B (위젯 시스템 부분 유지 + 디자인 개선): ~45K LOC 유지비 그대로, 5개월 방치 패턴 재발 위험.
  - 옵션 C (위젯 시스템 새로 재설계): 신규 투자 부담 + V2 와 또 다른 중복 발생.
- **옵션 A 의 결정 근거**:
  - V2 정적 대시보드가 모든 역할에서 이미 안정 운영 중.
  - 위젯 시스템 폐기로 ~45K LOC + DB 6 마이그 + i18n 39키 + LNB 1메뉴 일괄 축소 가능.
  - `/dashboard` 진입점은 역할 redirect 로 호환성 유지 — 외부 링크 깨짐 0건 목표.

---

## 2. 폐기 범위 (총 ~45K LOC + DB)

| 영역 | 파일 수 | LOC | 폐기 방식 |
|---|---|---|---|
| FE 위젯 컴포넌트 (`frontend/src/components/widgets/**`) | 110 | 31,657 | 디렉토리 전체 삭제 |
| FE 편집기 (`DashboardFormModal`, `Dashboard3DPreview`, `DashboardManagement` 등) | 7 | 4,231 | 일괄 삭제 + 라우트 제거 |
| FE 위젯 인프라 (`DynamicDashboard`, `WidgetBasedDashboard`, `WidgetRegistry` 외) | 5 | 3,038 | 일괄 삭제 |
| FE 위젯 CSS | ~40 | 컴포넌트 동봉 | 컴포넌트와 함께 |
| BE `WidgetController` + Service + Domain + DTO | 19 | 6,798 | 일괄 삭제 |
| DB `widget_groups` + `widget_definitions` + `role_templates.default_widgets_json` | 6 마이그 | 750 | DROP 마이그레이션 신설 |
| i18n 시드 (ko) | 4 파일 | 39 키 | 키 일괄 제거 codemod |
| LNB `common_code` (V45) | 1 마이그 | 2 row | `is_active=false` + DELETE 마이그레이션 신설 |
| docs 활성 | ~119건 | — | 마이그레이션 노트로 보존, archive 그대로 |

> 참고: 기존 위젯 관련 활성 문서는 본 합의서 + 마이그레이션 노트(섹션 6) 외에는 **삭제하지 않는다**. 추후 재참조용 archive 처리 권고.

---

## 3. Phase 별 분배실행 (단계적, 운영 반영 사이클별)

### 3.1 분배실행 표 (요약)

| Phase | 위험 | 소요 | 핵심 작업 | 위임 |
|---|---|---|---|---|
| Phase 1 — 즉시 폐기 | 저 | 0.5일 | dead 라우트 3개 + `WidgetBasedAdminDashboard.js` 제거 | core-coder + core-tester(smoke) + deployer |
| Phase 2 — LNB 숨김 + 편집기 제거 | 중 | 1일 | LNB `is_active=false` Flyway + 편집기 7파일 + `/admin/dashboards` 라우트 제거 | core-coder + core-tester + deployer (Flyway+FE) |
| Phase 3 — BE API + 엔티티 제거 | 중 | 1.5일 | BE 19파일 + `default_widgets_json` 의존 로직 제거 + 회귀 테스트 | core-coder + core-tester + deployer |
| Phase 4 — DB 마이그레이션 | 고 | 1일 | DROP TABLE/COLUMN + LNB DELETE Flyway, 운영 백업 게이트 | core-coder + core-tester(Flyway dry-run) + deployer |
| Phase 5 — `/dashboard` redirect + 위젯 코드 일괄 삭제 | 고 | 2일 | App.js redirect + `widgets/**` + 인프라 5파일 + 훅/유틸 삭제 + E2E | core-coder + core-tester(시각회귀+E2E) + deployer |
| Phase 6 — i18n 시드 + 잔여 청소 | 저 | 0.5일 | ko 시드 39키 제거 + `check:i18n-seed` PASS + 잔여 import 청소 | core-coder + core-tester + deployer |
| **합계** | — | **5–6일** | — | — |

### 3.2 Phase 1 — 즉시 폐기 (저위험, 0.5일)

**목표**: 사용자 동선이 0인 dead 라우트/파일 즉시 제거.

**작업**:
- `frontend/src/App.js` 에서 dead 라우트 3개 제거:
  - `/admin/dashboard-widget`
  - `/admin/dashboard-legacy`
  - `/admin/dashboard-old`
- `WidgetBasedAdminDashboard.js` 파일 삭제 (어드민 V2 분리 후 미참조).

**검증**:
- 빌드 성공 (`npm run build`).
- smoke: 어드민 로그인 후 LNB → 대시보드 진입 정상.

**위임**: core-coder + core-tester(smoke) + deployer.

**롤백**: git revert (라우트/파일 단순 복원).

---

### 3.3 Phase 2 — LNB 숨김 + 편집기 제거 (중위험, 1일)

**목표**: 어드민 편집기 진입 동선 차단 + 편집기 7파일 일괄 삭제.

**작업**:
- Flyway 신설: `V202606XX_005__hide_dashboard_management_lnb_menu.sql`
  - `UPDATE common_codes SET is_active=false, updated_at=NOW() WHERE code_value IN ('ADMIN_DASHBOARD_MANAGEMENT', 'HQ_DASHBOARD_MANAGEMENT');`
- 편집기 5종 + `DashboardManagement` + `Dashboard3DPreview` + 동봉 CSS 일괄 삭제 (~4,231 LOC).
- `frontend/src/App.js` 에서 `/admin/dashboards` 라우트 제거.
- LNB 렌더 캐시 무효화 확인.

**검증**:
- 어드민 LNB 에 "대시보드 관리" 미노출.
- `/admin/dashboards` 직접 진입 시 404 또는 redirect.
- 어드민 V2 대시보드 (`/admin/dashboard`) 정상 진입.

**위임**: core-coder + core-tester + deployer (Flyway + Frontend 동시 반영).

**롤백**: Flyway 역마이그(`is_active=true`) + git revert.

---

### 3.4 Phase 3 — 백엔드 API + 엔티티 제거 (중위험, 1.5일)

**목표**: 백엔드 위젯 API 표면 일괄 제거 + onboarding 의존 로직 안전 분리.

**작업**:
- BE 19파일 일괄 삭제 (~6,798 LOC):
  - `WidgetController`
  - `WidgetGroupService` / `WidgetPermissionService`
  - `DashboardIntegrationService` / `TenantDashboardService`
  - 엔티티 `WidgetGroup` / `WidgetDefinition` + 리포지토리 + DTO
- `OnboardingServiceImpl` / `TenantRoleServiceImpl` 의 `default_widgets_json` 로직 제거 (⚠ 회귀 위험).
  - 사용자 컴펜 **Q1 응답 후 결정** (정적 V2 redirect / onboarding 단순화 / 시드 상수 인라인 중 택일).
- 단위 테스트 + 회귀 테스트 (onboarding 흐름, role-template 생성 흐름).

**검증**:
- BE 빌드 + 단위 테스트 PASS.
- 신규 테넌트 생성 → 역할 템플릿 생성 → 어드민 로그인 → V2 대시보드 진입까지 회귀 0건.
- API 표면에서 `/api/v*/widget*`, `/api/v*/dashboard/integration*`, `/api/v*/tenant-dashboard*` 0건.

**위임**: core-coder + core-tester + deployer.

**롤백**: git revert + 운영 재기동. (DB 영향 없음 — Phase 4 이전.)

---

### 3.5 Phase 4 — DB 마이그레이션 (고위험, 1일)

**목표**: 위젯 관련 DB 자산 일괄 제거. 운영 백업 게이트 필수.

**작업**:
- Flyway 신설: `V202606XX_006__drop_widget_tables_and_columns.sql`
  - `DROP TABLE IF EXISTS widget_definitions;`
  - `DROP TABLE IF EXISTS widget_groups;`
  - `ALTER TABLE role_templates DROP COLUMN IF EXISTS default_widgets_json;`
  - `DELETE FROM common_codes WHERE code_group='WIDGET_TYPE';`
  - `DELETE FROM common_codes WHERE code_value IN ('ADMIN_DASHBOARD_MANAGEMENT', 'HQ_DASHBOARD_MANAGEMENT');`
- 역마이그레이션 스크립트 별도 보관(`docs/standards/migration-notes/widget-decommission-rollback.sql`) — 자동 적용 X, 비상 시 수동 실행.
- 운영 백업 (전체 DB dump) 필수 — deployer 게이트.

**검증**:
- Flyway dry-run (스테이징) PASS.
- 운영 백업 SHA 확인 + 해시 보관.
- 적용 후 BE 헬스체크 + V2 대시보드 진입 정상.
- `\d widget_groups` / `\d widget_definitions` 미존재 확인.
- `role_templates` 컬럼 목록에서 `default_widgets_json` 미존재 확인.

**위임**: core-coder + core-tester(Flyway dry-run) + deployer (백업 게이트).

**롤백**: 운영 백업 복원 + Flyway out-of-order 차단.

---

### 3.6 Phase 5 — `/dashboard` 역할 redirect + 위젯 코드 일괄 삭제 (고위험, 2일)

**목표**: `/dashboard` 진입점을 역할 기반 redirect 로 변경하고 위젯 인프라 + 컴포넌트 디렉토리 전체 삭제.

**작업**:
- `frontend/src/App.js` `/dashboard` 라우트를 역할 기반 redirect 로 변경:
  - `ADMIN` / `HQ_ADMIN` / `BRANCH_SUPER_ADMIN` → `/admin/dashboard` (AdminDashboardV2)
  - `CONSULTANT` → `/consultant/dashboard` (ConsultantDashboardV2)
  - `CLIENT` → `/client/dashboard` (ClientDashboard)
  - `ACADEMY*` (`ACADEMY_ADMIN` / `ACADEMY_TEACHER` / `ACADEMY_STUDENT`) → `/academy`
  - 기타 / 미인증 → `/login` 또는 `/` (사용자 컴펜 **Q2** 응답 후 확정)
- 위젯 인프라 + 컴포넌트 일괄 삭제:
  - `frontend/src/components/widgets/**` 전체 (~31,657 LOC).
  - `DynamicDashboard.js` / `WidgetBasedDashboard.js` / `WidgetRegistry*` (~3,038 LOC).
  - `useWidget` 훅 / `widgetVisibilityUtils` / `widgetClasses` / `widgetConstants`.
- 잔여 import / dead reference 정리 (다음 Phase 6 와 일부 중복 가능).

**검증**:
- 모든 역할 로그인 후 `/dashboard` 진입 → 적절한 V2 대시보드로 redirect 확인 (E2E).
- 시각 회귀 (Playwright/Storybook 스냅샷 비교) 0건.
- `rg "DynamicDashboard|WidgetBasedDashboard|widgets/" frontend/src` 결과 0건.
- 빌드 산출물 LOC 감소 측정 (~38K → ~6K, 약 32K 감축).

**위임**: core-coder + core-tester(시각 회귀 + E2E) + deployer.

**롤백**: git revert + 재빌드. (DB 영향 없음 — Phase 4 이미 적용 완료지만 FE 가 위젯 API 호출하지 않으므로 안전.)

---

### 3.7 Phase 6 — i18n 시드 + 잔여 청소 (저위험, 0.5일)

**목표**: i18n 시드 39키 일괄 제거 + 잔여 dead reference 청소.

**작업**:
- ko 시드 위젯 키 일괄 제거 (codemod 또는 수동):
  - `frontend/src/locales/ko/admin.json` L573-735, L1317-1430
  - `frontend/src/locales/ko/common.json` L1080-1261
  - `frontend/src/locales/ko/statistics.json` L81
  - `frontend/src/locales/ko/error.json` L231
- 동일 키 영문(en) 시드도 동시 제거 (있을 경우).
- `npm run check:i18n-seed` 가드 PASS 확인.
- 잔여 widget 관련 import / dead reference 정리.

**검증**:
- `check:i18n-seed` PASS.
- `rg -i "widget" frontend/src/locales/` 결과 0건.
- ESLint + TypeScript 빌드 PASS.
- `rg -i "widget" frontend/src --type js --type jsx | wc -l` 결과 0건 (또는 본 합의서/archive 인용 외 0건).

**위임**: core-coder + core-tester + deployer.

**롤백**: git revert.

---

## 4. 위험 + 롤백 전략

### 4.1 Phase 별 위험도 / 롤백

| Phase | 위험도 | 주요 위험 | 롤백 |
|---|---|---|---|
| Phase 1 | 저 | dead 라우트 외부 북마크 가능성 | git revert |
| Phase 2 | 중 | LNB 캐시 무효화 누락, 편집기 직접 진입 사용자 잔존 | Flyway 역마이그 + git revert |
| Phase 3 | 중 | onboarding 회귀 (default_widgets_json 의존) | git revert (DB 영향 없음) |
| Phase 4 | **고** | DROP TABLE / DROP COLUMN — 비가역 | **운영 백업 복원** + 역마이그 SQL 수동 실행 |
| Phase 5 | **고** | `/dashboard` 진입점 변경, 외부 링크 영향 | git revert + 재빌드 |
| Phase 6 | 저 | i18n 키 누락 시 화면 미노출 | git revert |

### 4.2 공통 운영 정책

- 각 Phase 운영 반영 후 **24h 모니터링** (에러 로그, 신규 가입자 onboarding, 세션별 redirect 분포).
- Phase 4 직전 전체 DB dump + 해시 보관 (deployer 게이트).
- Phase 5 직전 정적 자산 백업 (전 빌드 산출물 보관).
- 모든 Phase 는 **단일 PR** 단위로 분리하여 git history 추적 용이성 확보.

---

## 5. 일정 추정

| 일자 | Phase | 산출물 |
|---|---|---|
| D+0 (0.5일) | Phase 1 | dead 라우트 + 파일 제거 PR + 운영 반영 |
| D+1 (1일) | Phase 2 | LNB 숨김 Flyway + 편집기 삭제 PR + 운영 반영 |
| D+2.5 (1.5일) | Phase 3 | BE 일괄 삭제 PR + onboarding 회귀 테스트 + 운영 반영 |
| D+3.5 (1일) | Phase 4 | DB DROP Flyway + 운영 백업 + 운영 반영 |
| D+5.5 (2일) | Phase 5 | `/dashboard` redirect + 위젯 코드 일괄 삭제 PR + E2E + 운영 반영 |
| D+6 (0.5일) | Phase 6 | i18n 시드 + 잔여 청소 PR + 운영 반영 |
| **합계** | — | **5–6 영업일** |

> 각 Phase 운영 반영 후 다음 Phase 시작 (단계별 검증). 사용자 컴펜 응답 지연 시 일정 연장 가능.

---

## 6. KPI + 검증

### 6.1 정량 KPI

- 모든 역할이 `/dashboard` 접속 시 적절한 V2 대시보드로 redirect 확인 (E2E 100% PASS).
- 위젯 관련 grep 결과 **0건** (소스코드 / 시드 / DB).
  - `rg -i "widget" frontend/src --type js --type jsx | wc -l` → 0
  - `rg -i "widget" backend/src/main/java | wc -l` → 0 (테스트 / archive 제외)
  - `rg -i "widget" frontend/src/locales/ | wc -l` → 0
  - DB: `widget_groups` / `widget_definitions` 테이블 미존재, `default_widgets_json` 컬럼 미존재.
- D11 가드 + `check:i18n-seed` PASS 유지.
- onboarding 흐름 회귀 **0건**.
- 빌드 산출물 LOC 감소 측정 (~45K LOC + 6 Flyway).

### 6.2 정성 KPI

- 어드민/상담사/내담자 사용자 인지 변화 모니터링 (대시보드 진입 동선 단순화 만족도).
- 운영 반영 후 24h 에러율 +0% (위젯 API 호출 잔존 없음 확인).

---

## 7. 게이트 + 사용자 컴펜

### 7.1 사용자 컴펜 Q1 — Phase 3 진입 전 (BE 제거)

**Q1**: `default_widgets_json` 의존 onboarding 로직 — 폐기 시 onboarding 기본 위젯 시드를 어떻게 대체할지?

**후보 옵션**:
- **A. 정적 V2 기본 페이지로 redirect**:
  - 신규 가입자 / 신규 테넌트 → onboarding 완료 후 역할별 V2 대시보드로 직접 진입.
  - `default_widgets_json` 시드 호출 자체를 OnboardingServiceImpl 에서 제거.
  - **장점**: 가장 단순, 위젯 시스템과 완전 단절.
  - **단점**: onboarding 시점에 사용자 맞춤 환영 콘텐츠가 없으면 첫 인상 약화 가능.
- **B. onboarding 자체 단순화**:
  - 기본 위젯 시드 단계 자체를 onboarding 흐름에서 삭제.
  - `TenantRoleServiceImpl` 의 default_widgets_json 컬럼 의존 코드 제거.
  - **장점**: 코드 표면 최대 축소.
  - **단점**: 기존 onboarding UX 변경 (사용자 안내 필요).
- **C. 시드 상수 인라인 (보수적)**:
  - `default_widgets_json` 컬럼은 Phase 4 에서 제거하되, 그 전까지 OnboardingServiceImpl 에 시드를 하드코딩 상수로 옮겨 임시 호환.
  - **장점**: Phase 3 → 4 전환 안전성 최대화.
  - **단점**: 코드 표면 일시적 증가, Phase 4 이후 다시 제거 필요.

**권고**: **옵션 A** (정적 V2 redirect) — 위젯 시스템과 가장 명확히 단절되며 운영 표면 단순화 효과 최대.

### 7.2 사용자 컴펜 Q2 — Phase 5 진입 전 (`/dashboard` redirect 매핑 확정)

**Q2**: 역할별 redirect 매핑 확정 — 위 5개 역할 + 기타 역할(영업/지점관리자/지점부관리자/지점장/시스템관리자 등) 처리?

**후보 옵션**:
- **A. 명시 매핑 + 기타는 `/admin/dashboard` 로 통합**:
  - 명시: ADMIN/HQ_ADMIN/BRANCH_SUPER_ADMIN → `/admin/dashboard`
  - CONSULTANT → `/consultant/dashboard`
  - CLIENT → `/client/dashboard`
  - ACADEMY_* → `/academy`
  - 기타 (BRANCH_ADMIN / BRANCH_MANAGER / SALES / SYSTEM_ADMIN 등) → `/admin/dashboard` 통합.
- **B. 모든 역할 명시 매핑 (whitelist)**:
  - 모든 운영 역할에 대해 명시적 redirect 매핑 등록, 미정의 역할은 `/login` 또는 `/`.
  - **장점**: 보안/예측성 최고.
  - **단점**: 신규 역할 추가 시 매핑 누락 시 사용자가 `/login` 으로 떨어짐.
- **C. 권한 그룹 기반 매핑**:
  - 역할 → 권한 그룹 (ADMIN_GROUP / CONSULTANT_GROUP / CLIENT_GROUP / ACADEMY_GROUP) → 대시보드 매핑.
  - **장점**: 신규 역할 추가 시 그룹만 지정하면 됨.
  - **단점**: 권한 그룹 정의 필요 (현재 SSOT 확인 필요).

**권고**: **옵션 A** (명시 매핑 + 기타는 `/admin/dashboard`) — 단순/예측 가능 + 운영 역할 매핑 누락 시에도 어드민 V2 로 진입 보장.

### 7.3 게이트 정책

- 운영 반영은 각 Phase 별 **별도 deployer 위임** — 자동 진행 X.
- Phase 3 진입 전 Q1 응답 필수.
- Phase 5 진입 전 Q2 응답 필수.
- Phase 4 진입 전 운영 백업 SHA + 해시 deployer 보고 필수.

---

## 부록 A. 본 합의서의 호환 문서

- `docs/standards/ALL_DASHBOARDS_COMMERCIALIZATION_PLAN.md` (V2 대시보드 정의서).
- `docs/standards/ADMIN_DASHBOARD_COMMERCIALIZATION_IMPROVEMENT_PLAN.md` (어드민 V2 개선안).
- `docs/standards/DASHBOARD_DESIGN_GUIDE.md` (V2 정적 디자인 가이드).
- `docs/standards/DASHBOARD_LAYOUT_MIGRATION_PLAN.md` (V2 레이아웃 마이그레이션 계획).

## 부록 B. explore 인벤토리 인용 위치

- 본 합의서 섹션 1.1 / 2 / 3 / 5 의 LOC / 파일 수 / Flyway 수는 모두 explore 인벤토리 보고(Agent `c1860243`)에 근거한다.
- 보고 갱신 발생 시 본 합의서도 v1.1 갱신.

---

**합의 완료 조건**:
1. 본 합의서 develop / `docs/widget-decommission-plan` 브랜치 commit + push.
2. 사용자 컴펜 Q1 / Q2 응답 수령.
3. Phase 1 위임 시점 — 사용자 명시 승인 후 core-coder 위임.
