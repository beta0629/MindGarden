# 통합 스케줄 — 한국 공휴일 레이어 SSOT·후속 분배

**작성일**: 2026-05-04  
**개정**: 2026-05-04 (§6.1 캘린더 CSS 아키텍처 교차 링크) · 2026-05-04 (§7 CI 연결 단계: 분배·참조 워크플로·완료 보고 경로)  
**주관**: core-planner  
**상태**: **P2 구현 완료** — 캘린더 배경 레이어·표시 경계는 코드·테스트 산출물 기준. **연도·소스 전환**은 본 문서 체크리스트 후 **core-coder → core-tester → (필요 시) core-deployer** 순으로 위임.

---

## 1. 목적

통합 스케줄(및 동일 FullCalendar 소비 화면)에서 **대한민국 관공서 공휴일**을 **비상호작용 배경 레이어**로 한눈에 보이게 하고, **데이터 출처·갱신 주기·연도 확장**을 한 문서에서 잡아 **중복 서술·임의 분산**을 막는다.

---

## 2. 범위

| 구분 | 내용 |
|------|------|
| **In (현재)** | 프론트 정적 맵 `frontend/src/utils/krPublicHolidays.js` → `KR_PUBLIC_HOLIDAY_FULLCALENDAR_EVENTS` · `CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY` · 레이아웃/범례·Jest `krPublicHolidays.test.js` 등 **이미 반영된 P2** 범위. |
| **한계 (명시)** | **연도 2024–2028만** 테이블에 존재. **2029 이상**은 표시 없음(빈 레이어). 법령·대체공휴일·윤달 등 변경 시 **수동 갱신** 전제. |
| **Out (별도 결정)** | 선거일·은행 전용 휴일 등 **비관공서** 일정; 백엔드 영속 공휴일 엔티티(미도입 시 N/A). |

---

## 3. 데이터 소스 옵션

| 옵션 | 요약 | 트레이드오프 |
|------|------|----------------|
| **A. 정적(현행)** | ISO 키 → 명칭 맵, 모듈 로드 시 이벤트 배열 1회 생성 | 배포 없이는 연도 확장 불가·법 개정 시 PR 필요 |
| **B. API/외부 캐시** | 공공 API 또는 관리자 입력 + 캐시 TTL | 인프라·장애·테넌트 정책 정의 필요; 코스트·SLA |

**권고**: 운영에서 연도 넘김이 잦으면 B를 별 스펙으로 분리하고, 그 전까지는 **A + 연도 확장 체크리스트**로 운영.

---

## 4. 연도 확장·갱신 체크리스트 (정적 유지 시)

1. 행정안전부 등 **관공서 공휴일 고시** 반영 연도 확정.
2. `KR_PUBLIC_HOLIDAYS_BY_ISO`에 **YYYY-MM-DD** 추가·명칭 병합 규칙(동일일 `'·'`) 준수.
3. `buildKrPublicHolidayFullCalendarEvents` / export 상수 **재검증**(중복 키·오타).
4. **Jest** `frontend/src/utils/__tests__/krPublicHolidays.test.js` 샘플 연도·건수·경계일 갱신.
5. 캘린더 **범례·카피**가 연도 의존 문구를 쓰는지 스캔(하드코딩·표시 경계 게이트).
6. 필요 시 **E2E** 통합 스케줄 시나리오에 해당 연도 **스팟** 1건.

---

## 5. 위임 순서 (한 표)

| 순서 | 담당 | 할 일 |
|:----:|------|------|
| 1 | **core-coder** | 연도 추가·맵 정합·상수·캘린더 소비부·표시 경계·하드코딩 게이트. 참조: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`, 운영 게이트 `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`. |
| 2 | **core-tester** | 단위(`krPublicHolidays`) + 월/주 뷰 스팟 + 회귀(확장 타입·배경만 상호작용 없음). |
| 3 | **core-deployer** | 저장소 워크플로·경로 트리거·릴리즈 노트에 **데이터 갱신 배포**가 필요할 때만; 절차는 `/.cursor/agents/core-deployer.md`·`/core-solution-deployment`. |

---

## 6. 교차 참고

- 통합 스케줄 **내담자 특이사항** 오케스트레이션: [INTEGRATED_SCHEDULE_CLIENT_NOTES_ORCHESTRATION.md](./INTEGRATED_SCHEDULE_CLIENT_NOTES_ORCHESTRATION.md) (캘린더·모달 맥락; 공휴일은 본 SSOT). **CI 연결 단계** 상세·완료 보고 경로는 동 문서 §13과 본 문서 §7을 함께 본다.

### 6.1 FullCalendar 스타일·스코프·토큰 (데이터 SSOT와 분리)

- **시각·CSS 충돌·단일 스코프·`!important` 정책**은 데이터 본 문서가 아니라 **[INTEGRATED_SCHEDULE_CALENDAR_CSS_ARCHITECTURE_ORCHESTRATION.md](./INTEGRATED_SCHEDULE_CALENDAR_CSS_ARCHITECTURE_ORCHESTRATION.md)** 에서 주관한다. **한 줄**: 공휴일 **이벤트/맵 SSOT는 본 문서**, **셀·색·특이도 전쟁은 동 문서 §2–§5**에서 정리·위임한다.

---

## 7. CI 연결 단계

통합 스케줄·관련 E2E를 GitHub Actions에 붙일 때 **역할 분리**로 진행한다. **YAML 본문은 작성하지 않는다**(플래너·본 문서는 분배·경로만; 구현은 **core-coder**).

**한계(한 문장)**: 통합 스케줄 스펙이 **백엔드(예: 8080) 미기동 등으로 조건 스킵**이면, CI에서는 실제 회귀 없이도 잡이 **항상 녹색**으로 끝날 수 있어, 녹색만으로는 통합 스케줄 회귀를 보장하지 못한다.

### 7.1 1단계(병렬 준비)

- **explore**: 스펙·스킵 조건·의존 경로(E2E·헬퍼·README) 정리.
- **core-deployer**: 워크플로 **초안**(트리거·job 구성; 저장소 관행). 설계 시 **`.github/workflows/e2e-consultation-log-smoke.yml`**의 **시크릿 게이트**와 **fork 안전** 패턴을 **명시적으로 참조**해 동일 취지를 적용한다.
- **본 문서 갱신**: `docs/project-management/2026-04-28/` 내 본 SSOT·[내담자 특이사항 오케스트레이션](./INTEGRATED_SCHEDULE_CLIENT_NOTES_ORCHESTRATION.md) §13에 단계·경로를 반영한다.

### 7.2 2단계(병렬 실행)

- **core-coder**: **`.github/workflows/e2e-integrated-schedule-smoke.yml`** 를 **신규 추가**하거나 **기존 워크플로를 확장**한다(본문은 코더 산출).
- **core-tester**: 로컬 실행 전제와 **문서상 시크릿 매트릭스**(`tests/e2e/README.md`·워크플로 주석과 정합)를 정리·검증한다.

### 7.3 완료 보고 시 경로(bullet)

- `docs/project-management/2026-04-28/INTEGRATED_SCHEDULE_KR_HOLIDAYS_ORCHESTRATION.md`
- `docs/project-management/2026-04-28/INTEGRATED_SCHEDULE_CLIENT_NOTES_ORCHESTRATION.md`
- `.github/workflows/e2e-integrated-schedule-smoke.yml` (코더 산출·존재 시)
- `.github/workflows/e2e-consultation-log-smoke.yml` (시크릿 게이트·fork 안전 **참조 전용**)

---

*본 문서는 오케스트레이션·분배용이며, 법령 해석·최종 일정 확정은 담당자가 공식 고시를 따른다.*
