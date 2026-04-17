# 개발–운영 정합 및 분기 오케스트레이션 (기획 위임 기록)

**작성**: 2026-04-02  
**목적**: 운영(production)을 단일 진실원으로 개발을 맞추고, dev/prod 분기가 필요할 때는 **정책·설정·플래그**로 정리한 뒤 구현에 넘기기 위한 **core-planner** 산출 보관.  
**참조**: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`

---

## 1. 현황 전제 (범위)

**운영 기준 개발 정합**은 개발 브랜치·로컬이 임의로 앞서거나 뒤처지지 않고, **운영에 실제 배포·동작 중인 조합**을 단일 진실원으로 삼아 맞추는 것이다.

포함 범위:

- 배포 아티팩트와 대응 **Git ref(SHA/태그)**
- Spring **활성 프로파일** 및 `application-*.yml` 계층
- **CI/CD** 워크플로(예: `deploy-production.yml` vs `deploy-dev.yml`, 프론트·백엔드 분리 배포)
- 런타임 인프라 차이(nginx, 환경 변수·시크릿 **주입 경로만** 대조 — 값은 문서에 기록하지 않음)
- Redis/DB/Flyway(또는 동등 마이그레이션) 정합
- 프론트 **`REACT_APP_*`**·번들·API 베이스 URL
- 기능 플래그·테넌트 정책: 운영과 동일한 기본값·노출을 목표, 개발 전용 동작은 **명시된 정책·설정 경로**로만 허용

**운영 배포 진입점**: GitHub Actions **`🚀 Core Solution 운영 배포`** (`deploy-production.yml`) — JAR·프론트 업로드 및 `mindgarden.service` 재기동. 일반 CI만으로는 운영 서버가 갱신되지 않는다.

---

## 2. 갭 분석 체크리스트 (운영 대비 개발)

| # | 확인 항목 |
|---|-----------|
| 1 | 운영 배포 **커밋 SHA/태그**와 개발·스테이징 브랜치 **drift** |
| 2 | 백엔드 **`spring.profiles`** 및 `application-prod.yml` vs `application-dev.yml` / `application-local.yml` 델타 |
| 3 | **GitHub Actions** `deploy-production.yml` / `deploy-dev.yml`(및 `deploy-frontend-prod.yml`, `deploy-frontend-dev.yml` 등) 빌드·배포 대상 차이 |
| 4 | **nginx** 리버스 프록시 경로·정적·WebSocket 운영 대비 일치 여부 |
| 5 | **환경 변수·시크릿**: 이름·주입 경로만 대조 (값 비기록) |
| 6 | **Redis/세션/캐시** 키·TTL·클러스터 |
| 7 | **DB**: Flyway 적용 순서·버전, 운영 필수 시드 vs 개발 DB |
| 8 | **API 경로**(`/api/v1/` 등)·컨텍스트 패스 |
| 9 | **CORS·CSRF·보안 필터** 의도적 차이 문서화 여부 |
| 10 | **멀티테넌트** `tenantId` 누락·개발만 폴백 여부 (스킬: `.cursor/skills/core-solution-multi-tenant/SKILL.md`) |
| 11 | 프론트 빌드 **`REACT_APP_*`** 및 API 호스트 |
| 12 | **기능 플래그** 운영·개발 기본값 드리프트 |
| 13 | **외부 연동**(결제·ERP 등): 프로파일 분기 vs 임시 하드코딩 분기 |
| 14 | **로깅·PII 마스킹** 차이 |
| 15 | **`PRE_PRODUCTION_GO_LIVE_CHECKLIST`** 중 개발만 완화된 항목의 역주입 필요 여부 |

---

## 3. 분기 필요 판단 기준

### 설정·플래그만으로 충분한 경우

- 동일 비즈니스 규칙·데이터 모델에서 **엔드포인트·크레덴셜·로그·CORS** 등 환경 속성만 다른 경우.
- 분기는 **설정 파일·빌드 인자·플래그 저장소**에만 둔다.

### 비즈니스 로직 분기가 불가피한 경우

- 운영만 법규·결제·실데이터 제약이 있고, 개발은 시뮬·더미 등 **다른 규칙 집합**이 필요한 경우.
- 동일 API가 환경별 **허용 역할·검증·부작용**이 달라야 하는 경우.

**원칙**: 임의 `if (dev)` 산재 지양. **Strategy/Policy + 프로파일·플래그 주입**으로 한 코드베이스에 유지하고, **정책 문서화 선행**.

---

## 4. 서브에이전트 배분표

| Phase | 담당 | 목표 | 병렬 |
|-------|------|------|------|
| P0 | **explore** | 워크플로·`application-*.yml`·프론트 env·nginx·Flyway 인벤토리·갭 표 | 선행 |
| P1 | **core-component-manager** (선택) | 환경 분기 관련 UI/API 중복 제안서만 | P0 후, P1b와 병렬 가능 |
| P1b | **core-designer** (선택) | dev/prod 분기 UX(배지·경고), 토큰 | 필요 시만 |
| P2 | **core-coder** | 승인된 정합·분기 구현 | P1/P1b 확정 후 |
| P3 | **core-tester** | dev/스테이징/운영 최소 스모크 | P2 후 |

---

## 5. 위임 프롬프트 초안 (복붙용)

### A) explore

```
역할: explore (인벤토리 전용).

목표: 운영(production)을 단일 진실원으로 하여, 저장소 내 배포·런타임 설정 차이를 목록화한다. 코드 대량 수정 금지.

범위:
- .github/workflows: deploy-production.yml, deploy-dev.yml, deploy-frontend-prod.yml, deploy-frontend-dev.yml, deploy-nginx-dev.yml 등 운영·개발 쌍
- Spring: application-prod.yml vs application-dev.yml vs application-local.yml (키 이름·프로파일 체인만; 비밀 값은 경로만)
- 프론트: REACT_APP_* 사용처, 빌드 스크립트, API 베이스 URL 패턴
- DB: Flyway(또는 동등) 마이그레이션 위치·네이밍
- 멀티테넌트: tenantId 강제 여부가 환경별로 달라질 수 있는 지점

산출물:
- 표 1: 항목 | 운영 경로/키 | 개발 경로/키 | 차이 요약(한 줄) | 리스크
- 표 2: 우선 조치 순위 High/Medium/Low
- core-coder에 넘길 파일 경로 목록 (시크릿·비밀번호·키 값 금지)
```

### B) core-coder

```
역할: core-coder.

목표: explore 산출과 승인된 정책에 따라 "운영 기준 개발 정합" 또는 "명시된 dev/prod 분기"만 구현한다.

필수 참조:
- .cursor/skills/core-solution-deployment/SKILL.md
- .cursor/skills/core-solution-multi-tenant/SKILL.md
- docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md (해당 항목만)
- docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md §17, SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md §1.3 (UI 터치 시)

완료 조건:
- 의도된 차이는 spring.profiles / REACT_APP_* / feature flag·설정 계층에만 두고, 임의 if-dev 산재 최소화
- 하드코딩 URL·시크릿·환경별 매직 문자열 금지
- tenantId 누락 경로 없음

금지: 운영 비밀번호·API 키를 소스·로그·프롬프트에 넣지 말 것.
```

### C) core-tester

```
역할: core-tester.

목표: 환경별 최소 스모크로 "운영 기준 정합" 회귀를 확인한다.

시나리오:
- 스테이징(또는 운영에 가까운 프로파일): 헬스/로그인·세션·핵심 API(/api/v1/), 관리자 LNB 1화면, 콘솔 치명 오류 0건
- 개발: 동일 시나리오 + 개발 전용 플래그 시 문구·배지만 의도된 차이인지 확인
- 운영: 읽기 위주 스모크 또는 릴리스 직후 체크리스트; PII·실결제는 정책 준수

산출: 통과/실패 표, 실패 시 재현 경로·로그 위치(비밀 마스킹).
```

### D) core-component-manager (선택)

```
역할: core-component-manager (코드 직수정 없음).

목표: 환경 분기와 관련해 프론트 중복 API 클라이언트·레이아웃·에러 표시 경계 목록화, core-coder용 제안서.

입력: explore 갭 표.
산출: 중복 후보, StandardizedApi·공통 레이아웃 우선 권고, 코더 체크리스트 5~10줄.
```

---

## 6. 착수 시 권장 다음 액션 (3가지)

1. **운영(및 스테이징) 배포에 대응하는 Git ref(SHA)** 를 기록하고, 개발 기본 브랜치와 drift를 고정한다.  
2. **explore**로 갭 표를 만든 뒤, 승인된 항목만 **core-coder**에 넘겨 재배포·설정 반영한다.  
3. **core-tester**로 dev/스테이징/운영(가능 범위) **동일 스모크 시나리오**를 고정하고 `PRE_PRODUCTION_GO_LIVE_CHECKLIST` 해당 항목을 갱신한다.

---

## 7. 실행 순서 (호출 주체용)

**P0 explore → (P1 / P1b 병렬 가능) → P2 core-coder → P3 core-tester** 순으로 서브에이전트를 호출하고, 단계 산출을 취합해 사용자에게 한 장으로 보고한다. 비밀값은 프롬프트·문서에 넣지 말고 **경로·키 이름**만 사용한다.

---

**관련 문서**: 본 배치는 대화 중 core-planner 위임 응답을 정리한 것이다. 진행 시 이 파일을 열어 §5 프롬프트를 복사해 Task에 붙이면 된다.
