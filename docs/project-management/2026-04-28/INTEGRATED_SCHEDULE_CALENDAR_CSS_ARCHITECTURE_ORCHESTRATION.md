# 통합 스케줄 — FullCalendar CSS 아키텍처·공휴일 시각 SSOT (오케스트레이션)

**작성일**: 2026-05-04  
**주관**: core-planner  
**상태**: **기획·회의 결정안(권고 1안)** — 구현·YAML 변경 없음. 실행은 아래 **위임 순서 표**에 따른 서브에이전트 배치.

**교차 참조 (한 줄)**: 공휴일 **데이터·배경 이벤트·연도 SSOT**는 [INTEGRATED_SCHEDULE_KR_HOLIDAYS_ORCHESTRATION.md](./INTEGRATED_SCHEDULE_KR_HOLIDAYS_ORCHESTRATION.md) §1–5. 캘린더·모달 **제품 맥락**은 [INTEGRATED_SCHEDULE_CLIENT_NOTES_ORCHESTRATION.md](./INTEGRATED_SCHEDULE_CLIENT_NOTES_ORCHESTRATION.md) §1–2. **본 문서**는 **스타일 충돌·스코프·토큰·접근성**만 담당한다.

---

## 1. 문제 요약

- `/admin/integrated-schedule` 월간 FullCalendar에서 **한국 공휴일**을 보이게 하려 **여러 번 패치**했으나, **`ScheduleB0KlA.css`** · **`IntegratedMatchingSchedule.css`** · **`ScheduleCalendarView.css`** · **FullCalendar 기본(벤더) 클래스**가 **특이도·로드 순서·`!important`** 로 겹쳐 **셀 배경·날짜 숫자 색**이 기대와 다르게 보인다.
- `mg-v2-ad-calendar-day--kr-public-holiday`가 **`td`에 부착**되어도 시각 변화가 거의 없다는 피드백 — **전역·다층 오버라이드**로 **회귀 위험**이 크다.
- 목표: **단일 진입점(스코프)·토큰 원칙·SSOT 한 줄·통합 스케줄 격리**로 재정렬하고, 이후 변경은 **문서화된 위임 순서**로만 진행한다.

---

## 2. 현재 CSS·스타일 소스 맵 (파일·역할)

| 소스 | 경로(앵커) | 역할·비고 |
|------|------------|-----------|
| **벤더 기본** | `@fullcalendar/*` 번들 CSS(빌드 체인에 따라 `main.css` 등) | 그리드·셀·이벤트 기본 레이아웃·색 — **최하위 특이도가 아님**(이후 오버라이드에 묻힘). |
| **스케줄 B0KlA** | `frontend/src/components/schedule/ScheduleB0KlA.css` | FullCalendar·헤더·범례·모달 등 **광범위 오버라이드** 주석 구역 존재. |
| **통합 스케줄 페이지** | `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.css` | 통합 스케줄 레이아웃·캘린더 주변 UI와 **FullCalendar 인접 규칙** 가능. |
| **캘린더 뷰(공용 UI)** | `frontend/src/components/ui/Schedule/ScheduleCalendarView.css` | `ScheduleCalendarView.js` 소비; **공휴일·토큰** 관련 주석·룰 존재. |
| **매핑 캘린더(organism)** | `frontend/src/components/admin/mapping-management/organisms/MappingCalendarView.css` | FullCalendar B0KlA 커스텀 블록(별 트랙과 중복 가능). |
| **레거시 스케줄** | `frontend/src/components/schedule/ScheduleCalendar.css` | 일반 스케줄 화면과 공유 가능 — **통합 전용과 분리 여부**가 회귀에 직결. |

**인벤토리 주의**: 동일 선택자가 **2개 이상 파일**에 있으면 **import 순서**가 곧 “디자인”이 된다. 정리 전 **explore**로 `fc-`·`mg-v2-ad-calendar`·`!important` **실제 정의 목록**을 뽑아 본 표에 **행 추가**한다.

---

## 3. 가상 회의 — 참석·의제·역할별 산출물만

**회의 형식**: core-planner 주재, 산출물은 **역할별 문서/코드 위임**으로만 정의(실제 멀티 에이전트 호출은 별 배치).

| 참석 관점 | 의제(논의 포인트) | 산출물(역할이 내놓을 것) |
|-----------|------------------|-------------------------|
| **core-designer** | 단일 스코프 하에서 **월간 day 셀**·공휴일·오늘·주말의 **시각 위계**(배경 vs 숫자 vs dot); **디자인 토큰**만으로 달성 가능한 밀도. | 토큰 매핑 표(역할·상태별)·와이어 1p·**금지 패턴**(임의 hex 남발) 명시. |
| **core-publisher** | FullCalendar가보내는 **마크업 계층**(`td`, `.fc-daygrid-day`, 내부 프레임) 대비 **시맨틱 보조**가 필요한지(추가 래퍼 vs 클래스만). | 필요 시 **HTML 스니펫 권고**(BEM·아토믹 정렬); **불필요한 DOM 추가 금지** 원칙. |
| **core-coder** | `data-calendar-skin="integrated"` **또는** 단일 **SCOPED 루트 클래스** 아래로 **모든 통합 전용 오버라이드 이관** 가능 여부·import 순서. | 스코프 루트 도입 PR·선택자 정리·**`!important` 예외 0~1곳** 문서화. |
| **core-component-manager** | `ScheduleCalendarView` vs `MappingCalendarView` vs 페이지 CSS **중복·분산** 목록, **다른 스케줄 화면**과의 경계. | **중복 제거·파일 소유권** 제안서(코더 실행 전 합의용). |

---

## 4. 회의 안건별 권고 1안 (결정안 초안 — 구현 전제 아님)

### 4.1 단일 진입점 vs 분산 3파일

- **권고 1안**: 통합 스케줄 FullCalendar에 대해 **`[data-calendar-skin="integrated"]` 또는 동등 단일 루트 클래스**를 **`IntegratedMatchingSchedule`(또는 캘린더 래퍼 최상단)** 에 부여하고, **통합 전용 캘린더 오버라이드는 그 하위 선택자로만** 작성한다.  
- `ScheduleB0KlA.css`의 **전역 FullCalendar 규칙** 중 통합에만 필요한 것은 **점진 이관**; 다른 화면이 의존하는 규칙은 **건드리지 않음**(아래 4.4).

### 4.2 토큰만 원칙 · `!important` 정책

- **권고 1안**: 색·배경·테두리는 **`unified-design-tokens.css` 계열 토큰**만 사용.  
- **`!important`**: 원칙 **금지**. 불가피한 **예외는 1곳**으로 한정하고, **파일·선택자·사유·대체 불가 이유**를 본 문서 또는 PR 본문에 **한 줄 SSOT**로 기록한다.

### 4.3 공휴일 표현: dayCell vs background event vs 둘 다

- **권고 1안 (SSOT 한 줄)**: **데이터·캘린더 이벤트 소스**는 [KR 공휴일 오케스트레이션](./INTEGRATED_SCHEDULE_KR_HOLIDAYS_ORCHESTRATION.md)의 **background 이벤트 레이어**를 유지하고, **시각 강조가 필요하면 `dayCellClassNames`는 토큰 기반 “보조 한 겹”만** 허용하되, **동일 정보를 이중으로 크게 읽히게 하지 않는다**(스크린리더·색 대비 기준은 4.5).  
- “둘 다”를 쓸 경우 역할 분담: **background = 면적**, **day 클래스 = 숫자/테두리 보조** 정도로 **위계 고정**.

### 4.4 통합 스케줄만의 격리 범위

- **권고 1안**: 새 규칙은 **`integrated` 루트 아래**만. `ConsultationLogCalendarBlock`·일반 `ScheduleCalendar` 등은 **회귀 테스트 대상에서 “비변경” 기본**; 건드릴 경우 **별 체크리스트 행** 필수.

### 4.5 접근성(날짜·공휴일 낭독)과 시각 강조

- **권고 1안**: **날짜 숫자**는 기본 FullCalendar 읽기 순서를 해치지 않는다. 공휴일 **이름**은 background 이벤트 **`title`** 등으로 이미 제공되는 경우 **중복 aria 라벨 추가 금지**; 추가 시 **core-designer + core-coder** 합의 하에 **한 경로만** visible/accessible name으로 잡는다. **색만으로 의미 전달 금지** — 패턴·테두리·텍스트 중 최소 1개 보조.

---

## 5. 위임 순서 표 (실행 배치)

| 순서 | 담당 | 할 일 |
|:----:|------|------|
| 1 | **explore** | `fc-` / `mg-v2-ad-calendar` / `kr-public` / `!important` **정의 위치·중복·import 순서** 인벤토리(표). 충돌 상위 10건만 우선. |
| 2 | **core-component-manager** | 파일 소유권·중복 제거·“통합 전용 vs 공용” 경계 제안서. |
| 3 | **core-designer** | §4·스킬 `/core-solution-planning` §0(사용성·정보 노출·배치) 반영한 **토큰·밀도·위계** 시안. |
| 4 | **core-publisher** | (필요 시) 래퍼·시맨틱 **마크업 스니펫**만; JS/React 변경은 코더. |
| 5 | **core-coder** | 루트 스코프 도입·선택자 이관·토큰 치환·예외 `!important` 0~1곳 문서화. 참조: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, `COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`, 운영 게이트 `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`, `/core-solution-frontend`, `/core-solution-design-system-css`. |
| 6 | **core-tester** | 월간 **공휴일·일반일·주말** 스팟, **다른 캘린더 화면 스모크**, Jest 회귀(공휴일 유틸과 연계 시). `build:ci` 통과. |

**병렬 가능**: (1) explore 와 (2) component-manager 는 **동시 착수 가능**(결과를 (3) 디자이너가 흡수).

---

## 6. 완료 조건 (체크리스트)

- [ ] **하드코딩 게이트**: 신규 색상 **임의 hex** 없음; 토큰 또는 디자이너 예외 문서화.  
- [ ] **`build:ci`** 및 프론트 관행 테스트(프로젝트 표준) 통과 — 실행은 **shell / core-tester** 위임.  
- [ ] **스크린샷 체크리스트**: 통합 스케줄 **월간** — 평일 / 주말 / 공휴일 / 오늘 / 이벤트 있는 날 각 1장 이상; **다른 스케줄 1화면** 회귀 캡처 1장.  
- [ ] **접근성**: VoiceOver 또는 동등으로 **날짜 그리드** 1회 이상 스팟(공휴일 주간이 있으면 해당 주).  
- [ ] 본 문서 **§2 소스 맵**에 explore 산출 **행 반영**; **§4**와 실제 구현이 어긋나면 **개정일·변경 요약** 1줄.

**수동 스크린샷 회귀 매트릭스** (`data-calendar-skin` 스코프 PR·코더 변경과 병렬 검증용; 자동화 대체 아님)

| # | 캡처 대상 | 확인 포인트 | 스코프·비고 |
|---|-----------|-------------|-------------|
| 1 | 통합 스케줄 **월간** 전체 | `[data-calendar-skin="integrated"]` 루트 하단 그리드·헤더·토큰 색 위계; `ScheduleLegend`·모달 인접 톤 일치 | §4.1과 동일 속성명 `data-calendar-skin="integrated"` |
| 2 | **공휴일**이 있는 day **셀** 클로즈업 | 배경·날짜 숫자·background 이벤트 중복 강조 없음(§4.3) | 동일 스코프 하위만 |
| 3 | **다른 스케줄** 화면 1곳(1컷) | 통합 전용 규칙이 누수하지 않음(§4.4 비변경 기본) | 루트에 위 속성 **없음**인 캘린더 권장 |
| 4 | 통합 **주간** 뷰 | 공휴일이 걸친 주 1컷; 이벤트 밀도·가독성 | `data-calendar-skin="integrated"` 스코프 |
| 5 | **a11y** 스팟 | VoiceOver 등으로 날짜 그리드·공휴일 주간 1회(§4.5); 중복 accessible name 없음 | 스크린샷+짧은 메모 |
| 6 | **`build:ci`** 게이트 | 프론트 `build:ci`·관행 테스트 녹색; PR 전 `CI=true npm test` 등 팀 표준과 동일 | 스크린샷 아님·로그·아티팩트 보관 |

---

## 7. 실행 요청문 (부모 에이전트용)

다음 순서로 서브에이전트를 호출하고, **결과를 core-planner에 반환**한 뒤 사용자에게 최종 요약한다.

1. **explore**: 통합 스케줄·FullCalendar 관련 CSS 충돌 인벤토리.  
2. **core-component-manager**: 분산·중복·격리 제안.  
3. **core-designer**: 토큰·위계·접근성 균형.  
4. **core-publisher**: 마크업 필요 시 스니펫만.  
5. **core-coder**: 스코프 루트·선택자 이관(프로덕션 코드는 사용자 검수 후 커밋).  
6. **core-tester**: 회귀·`build:ci`·스크린샷 증적.

---

**문서 이력**: 2026-05-04 초안(가상 회의·권고 1안·위임 순서·완료 조건).
