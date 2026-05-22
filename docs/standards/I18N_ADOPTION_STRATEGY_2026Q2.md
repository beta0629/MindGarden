# i18n 도입 전략 합의서 (2026 Q2 — Phase 2 진입)

> **작성**: 2026-05-21 (core-planner 오케스트레이션)
> **유형**: 의사결정 합의서 (Phase 1 부트스트래핑 산출물 무수정)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_DIRECTION.md` §3.4 / §4 P4 / §6 C5
> **연계**: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, `docs/standards/FRONTEND_DEVELOPMENT_STANDARD.md`

---

## 0. 결정 요약 (TL;DR)

- **Phase 2 진입 트리거**: D5 §6 C5 (a) **T-B 완료 직후 (~3주 후)**, 본 합의서 신설 완료 시점부터 카운트.
- **범위**: namespace 분할(common/admin/clinical/client/erp/auth/wellness) + 핵심 화면 한글 라벨 추출(빈도 상위).
- **언어**: ko 단일 유지 (영어/일본어는 Phase 3 별도 합의).
- **회귀 가드**: Phase 1과 동일하게 `t('key', '한글 fallback')` 강제, 키 누락 시 fallback 한글 렌더.
- **사용자 컨펌 필요**: 5건 (§6 C-i1 ~ C-i5).

---

## 1. Phase 1 상태 점검 (실측 2026-05-21)

| 항목 | 경로 | 상태 | 비고 |
|---|---|:---:|---|
| 부트스트랩 모듈 | `frontend/src/i18n/index.js` | ✅ 존재 | `react-i18next` + `i18next-browser-languagedetector` 초기화, ns: `common`/`admin` 등록, `returnEmptyString:false`, `useSuspense:false` |
| 공통 namespace | `frontend/src/locales/ko/common.json` | ✅ 10키 | action(7) + status(3) — 시범 범위 충족 |
| 어드민 namespace | `frontend/src/locales/ko/admin.json` | ⚠️ `{}` | 빈 골격 (Phase 2 채움 대상) |
| README | `frontend/src/locales/README.md` | ✅ 존재 | 키 규칙·점진 도입 절차 명시, 본 합의서 경로 예고 |
| App 통합 | `frontend/src/App.js` L3 `import './i18n'` | ✅ 통합 | 부트스트랩 1회 import 패턴 정상 |

> **결론**: Phase 1 부트스트래핑 **정상 완료**, Phase 2 진입 차단 요소 없음. `admin.json` 빈 골격은 Phase 2.1에서 채움.

---

## 2. Phase 2 목표·범위

| 구분 | 포함 | 제외 |
|---|---|---|
| 라이브러리 | `react-i18next` (Phase 1 동일) | 라이브러리 교체·버전 메이저 업 |
| 언어 | `ko` 단일 | `en`/`ja` 등 신규 언어 (Phase 3) |
| 대상 화면 | 어드민·상담사·내담자 어드민/대시보드/스케줄 핵심 라벨 (상위 7개 namespace) | 백엔드 응답 message/code, 이메일 템플릿, 알림 메시지 |
| 대상 앱 | `frontend/` | `expo-app/`, `frontend-trinity/`, `frontend-ops/` |
| 추출 방식 | 빈도 상위 한글 문자열 → namespace 매핑 → `t('key', '한글 fallback')` 치환 | 일괄 자동 치환(codemod 단독) — 휴먼 리뷰 필수 |
| 회귀 가드 | fallback 한글 강제, 단위/통합 테스트 통과, 시각 회귀 0건 | — |

---

## 3. 진입 조건

- **D5 트랙 T-B 완료** (다크/라이트 토큰 분기 정합 + 운영 hardcoding 게이트 < 1,000 진입).
- 본 합의서 **신설 완료** (현재 본 문서 작성 = 충족).
- 사용자 컨펌 §6 C-i1 ~ C-i5 **5건 모두 응답**.
- Phase 1 산출물 무수정 원칙 유지 (구조·키 규칙·README 본문).

---

## 4. namespace 설계

| namespace | 도메인 | Phase 2 단계 | 예상 키 수 | 비고 |
|---|---|:---:|---:|---|
| `common` | 공통 액션·상태·날짜·페이지네이션 | 2.1 (확장) | ~50 | Phase 1 10키 → 확장 |
| `admin` | 어드민 대시보드·메뉴·관리 라벨 | 2.1 (신규 채움) | ~120 | 현재 `{}` |
| `clinical` | 상담사·임상 기록·진료 라벨 | 2.2 | ~100 | 신규 |
| `client` | 내담자·예약·결제 라벨 | 2.3 | ~80 | 신규 |
| `erp` | ERP 거래·정산·재무 라벨 | 2.4 | ~60 | 신규 (`/core-solution-erp` 참조) |
| `auth` | 로그인·권한·역할·온보딩 라벨 | 2.4 | ~30 | 신규 |
| `wellness` | 웰니스/무드 저널/콘텐츠 라벨 | 2.5 | ~40 | 신규, `expo-app` 제외 |

> **분할 기준**: 단일 namespace 500키 초과 금지 (README 규칙 준수). 도메인 경계는 화면/메뉴 1차 분류 기준.

---

## 5. 마이그레이션 단계

| 단계 | 명 | 작업 | 산출물 | 완료 조건 |
|---|---|---|---|---|
| **2.1** | common/admin 채움 | 빈도 상위 한글 라벨 → `common`/`admin` 매핑·치환 | `ko/common.json` 확장, `ko/admin.json` 채움, 대상 컴포넌트 치환 | 운영 화면 회귀 0, 빌드 통과, namespace 2종 키 ≥ 100 |
| **2.2** | clinical 신설 | 상담사·임상 화면 라벨 추출 → `clinical` namespace | `ko/clinical.json` 신설, i18n `index.js` ns 추가 | 임상 화면 회귀 0 |
| **2.3** | client 신설 | 내담자·예약·결제 라벨 추출 → `client` namespace | `ko/client.json` 신설 | 내담자 화면 회귀 0 |
| **2.4** | erp·auth 신설 | ERP/인증 라벨 추출 → `erp`/`auth` namespace 병렬 | `ko/erp.json`, `ko/auth.json` | 결제·로그인 회귀 0 |
| **2.5** | wellness 신설·정리 | 웰니스 라벨 + namespace 분포 점검(>500키 분할) | `ko/wellness.json`, 분포 보고 1장 | 전체 namespace 분포 균형, Phase 2 종결 보고 |

> **공통 규칙**: 각 단계는 `core-coder` 구현 → `core-tester` 회귀 검증 → 완료 보고. 단계 간 직렬, 단계 내 namespace 신설 작업은 의존 없으면 병렬 가능 (2.4 erp/auth).

---

## 6. 사용자 컨펌 필요 항목

- **C-i1. Phase 2 진입 시점 재확인**: D5 §6 C5 (a) "T-B 완료 직후" 그대로 진행할지, T-B 완료 + 운영 게이트 < 1,000 안정 확인 1주 후로 미룰지.
- **C-i2. namespace 7종 분할 채택**: `common/admin/clinical/client/erp/auth/wellness` 7종 채택 vs 5종(common/admin/clinical/client/erp) 축소 안.
- **C-i3. 키 추출 방식**: 빈도 상위 자동 추출 스크립트 + 휴먼 리뷰(권장) vs 화면 단위 수동 추출만 진행.
- **C-i4. fallback 한글 강제 유지**: Phase 2 전 구간에서 `t('key', '한글')` fallback 강제 유지 (권장) vs 한정 namespace에서 키 단독 호출 허용.
- **C-i5. 영어 추가 시점**: Phase 3에서 `en` 추가할지, Phase 2 종료 직전 병렬로 영어 골격만 채울지.

### 6.1 사용자 컨펌 결과 (2026-05-22)

| 항목 | 결정 | 메모 |
|---|---|---|
| C-i1 | **즉시 진입** (T-B 완료 직후) | D5 §6 C5 (a) 권장 그대로. T-B 게이트 PASS 직후 Phase 2 시작 가능. |
| C-i2 | **7종 분할 채택** | `common/admin/clinical/client/erp/auth/wellness`. §3 namespace 골격 그대로 유지. |
| C-i3 | **자동 추출 + 휴먼 리뷰** | 빈도 상위 추출 스크립트 + 휴먼 리뷰 병행 (권장). `core-coder` 위임 시 추출 스크립트 별도 도구로 신설. |
| C-i4 | **fallback 한글 강제 유지** | Phase 2 전 구간 `t('key', '한글')` 강제. 회귀 가드 효과 우선. |
| C-i5 | **Phase 3에서 영어 추가** | 한국어 키 완전성 우선. Phase 2 종료 + 운영 회귀 0 안정 2주 후 별도 합의서 (`I18N_PHASE3_*.md`)로 전환. |

**Phase 2 진입 게이트**: T-B 운영 정착 확인 완료(2026-05-22 §3.2 PASS) → **즉시 진입 가능**. 다음 단계는 **2.0 `core-planner` 본 합의서 정합 + 2.1 `core-coder` `common`/`admin` 빈도 상위 추출·치환** 위임 (§8 표 기준).

### 6.2 Phase 2.1a 추출 스크립트 1차 실행 결과 + 휴리스틱 보강 결정 (2026-05-22)

**1차 실행 (`scripts/i18n/extract-hangul-strings.js`)**: 969 파일 스캔 → unique 한글 **6,261**·총 등장 **9,889** → namespace 분포 `common 3,898 / admin 1,264 / clinical 64 / client 276 / erp 412 / auth 150 / wellness 197` → **common 62% 편중**.

**Top 5**: 취소 53 / 내담자 46 / 완료 44 / 새로고침 36 / 활성 32.

**휴리스틱 보강 결정 (사용자 컨펌)**: Phase 2.1b 진입 전 **휴리스틱 보강 후 재추출**. `components/{consultant,schedule,dashboard,settings,community,academy,shop,statistics}` 등 미매핑 디렉터리를 `scripts/i18n/extract-hangul-strings.js` namespace 휴리스틱에 추가 매핑하여 common 비중을 ≤ 45%까지 낮춘다. 매핑 가이드:

| 디렉터리 | 권장 namespace | 근거 |
|---|---|---|
| `components/consultant/**` | `clinical` | 상담사 도구 = 임상 도메인 |
| `components/schedule/**` | `common` 유지 (cross-cutting) | 어드민·내담자 양쪽 공유 |
| `components/dashboard/**` | `admin` | 어드민 대시보드 위주 |
| `components/settings/**` | `admin` | 설정 페이지 = 어드민 |
| `components/community/**` | `client` | 커뮤니티 = 내담자 |
| `components/academy/**` | `client` | 아카데미 = 내담자 |
| `components/shop/**` | `client` | 쇼핑몰 = 내담자 |
| `components/statistics/**` | `admin` | 통계 = 어드민 |

**완료 조건**: 보강 후 재추출 결과에서 common 비중 ≤ 45% 도달 + Top 50 휴먼 리뷰 통과 → Phase 2.1b (common·admin 1차 치환) 진입.

### 6.3 Phase 2.1a-bis 2차 결과 + 추가 보강 매핑 (2026-05-22)

**2차 재추출 결과**: §6.2 7개 매핑 적용 후 common 1차 62.3% → 2차 **50.2%** (목표 ≤45% 미달 5.2%p).

**추가 보강 컨펌 (사용자, 2026-05-22, 본 합의서 적용 대상 9건)**:

| 디렉터리 | 권장 → 결정 namespace | 근거 |
|---|---|---|
| `components/dashboard-v2/**` | **admin** | dashboard 의 v2 변형, 동일 어드민 도메인 |
| `components/tenant/**` | **admin** | 멀티테넌트 관리 = 어드민 전용 도구 |
| `components/super-admin/**` | **admin** | 슈퍼어드민 = 어드민 |
| `components/compliance/**` | **admin** | 컴플라이언스 운영 = 어드민 |
| `components/ops/**` | **admin** | 운영(operations) = 어드민 |
| `components/finance/**` | **erp** | 재무 = ERP 도메인 |
| `components/training/**` | **client** | 교육 카테고리, 학원 확장 시 academy 와 동일 도메인 (사용자 자유응답 인용) |
| `components/mypage/**` | **common** 유지 | cross-cutting (어드민·내담자 양쪽 마이페이지) |
| `components/notifications/**` | **common** 유지 | 알림 = cross-cutting (어드민·내담자·상담사 공용) |

**3차 재추출 게이트**:
- common 비중 ≤ 45% 통과 시 → Phase 2.1b (common·admin 빈도 상위 50건 치환 1차) 진입
- 미달 시 → 추가 사용자 컨펌 라운드

---

## 7. 후속 (Phase 3 가늠)

- **Phase 3 후보**: (a) 영어/일본어 추가, (b) 백엔드 응답 message 다국어화, (c) 이메일/알림 템플릿 i18n, (d) `expo-app` 별도 합의 (Metro/번들 영향 검토 필요).
- **트리거**: Phase 2 종결(2.5 완료) + 운영 회귀 0 안정 2주.
- **별도 합의서**: `docs/standards/I18N_PHASE3_*.md` 신설 권장 (본 합의서 외부).

---

## 8. 분배실행 표 (Phase 2 진입 후 위임 골격)

> **본 합의서 단계에서는 골격만 제시**. 실제 위임은 §6 컨펌 후 메인 어시스턴트가 수행.

| Phase | 담당 서브에이전트 | 위임 프롬프트 골격 (요약) | 적용 스킬 | 모델 권장 |
|---|---|---|---|---|
| 2.0 | `core-planner` | 본 합의서 정합·범위 확정, 컨펌 결과 반영 | `/core-solution-planning` | 기본 |
| 2.1 | `core-coder` → `core-tester` | (coder) `common`/`admin` 빈도 상위 추출·치환, fallback 한글 강제 → (tester) 어드민/공통 회귀 0 검증 | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| 2.2~2.5 | `core-coder` → `core-tester` | (coder) namespace 신설·키 추출·치환 + `index.js` ns 추가 → (tester) 도메인별 회귀 검증 | `/core-solution-frontend`, `/core-solution-common-modules` | 기본 |
| 게이트 | `core-tester` | 모든 코드 변경 Phase는 회귀 0 통과 전 완료 보고 금지 | `/core-solution-testing` | 기본 |

---

## 9. 위험·완화

- **번들 사이즈 증가**: namespace 7종 동시 로드 시 번들 ↑ → namespace lazy load 검토 (Phase 2.5 분포 점검에서 결정).
- **키 충돌·중복**: 도메인 간 동일 한글 라벨 중복 → `common` 우선, 도메인 namespace는 도메인 한정 라벨만 보유.
- **시각 회귀(텍스트 길이 변동)**: ko 단일 유지로 Phase 2에서는 위험 낮음. Phase 3 다국어 시 별도 검토.
- **D5 색상 트랙과 동시 진행 회피**: T-B 완료 후 진입 트리거 준수 — 시각 회귀와 원인 분리 어려움 방지.

---

## 10. 참조

- `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_DIRECTION.md` §3.4 / §4 P4 / §6 C5 / §7 / §8 — Phase 2 진입 트리거·미존재 보고
- `frontend/src/i18n/index.js` — Phase 1 부트스트랩 (무수정)
- `frontend/src/locales/ko/common.json`, `ko/admin.json` — Phase 1 시범 namespace (무수정, Phase 2.1에서 확장)
- `frontend/src/locales/README.md` — 키 명명·점진 도입 절차 (무수정, 본 합의서를 SSOT 로 인용)
- `frontend/src/App.js` L3 `import './i18n'` — 통합 지점
- `docs/standards/FRONTEND_DEVELOPMENT_STANDARD.md` — 프론트엔드 표준
- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md` — 위임·테스터 게이트 강제 규칙

---

## 11. 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-21 | core-planner | i18n Phase 2 진입 합의서 신규 작성 (D5 §6 C5 후속). namespace 7종 설계, 마이그레이션 5단계, 사용자 컨펌 5건 분리. |
