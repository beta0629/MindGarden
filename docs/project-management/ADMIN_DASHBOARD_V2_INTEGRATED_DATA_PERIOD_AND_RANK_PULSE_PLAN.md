# 관리자 대시보드 V2 — 상담사 통합데이터 월별·년도별 집계 및 순위 변동 펄스 효과 기획

## 1. 제목·목표

- **제목**: 상담사 별 통합데이터 카드에 **월별·년도별 집계** 및 **순위 변동 시 펄스 효과** 적용
- **목표**: (1) 관리자가 기간(월/년)을 선택해 해당 기간 기준 완료 건수·완료율·평점으로 순위를 볼 수 있게 하고, (2) 기간 변경 또는 데이터 갱신 시 순위가 올라간/내려간 상담사 행에 펄스(pulse) 애니메이션을 적용해 시각적으로 강조한다.

---

## 2. 범위

| 포함 | 제외 |
|------|------|
| AdminDashboardV2 "상담사 별 통합데이터" 카드 | 다른 대시보드·다른 카드 |
| 기간 선택 UI(월별·년도별·전체), 기간별 API 호출·데이터 표시 | 기간 선택 외 대시보드 전역 필터 |
| 순위 변동 감지(이전 기간/이전 로드 대비), 펄스 CSS·클래스 | 순위 이력 저장·다른 페이지 노출 |
| consultation-completion·consultant-rating-stats 연동 | 신규 통계 API·다른 통계 |

**영향 영역**: 프론트 `AdminDashboardV2.js`, 관련 CSS(AdminDashboardB0KlA.css), 백엔드 AdminController·ConsultantRatingServiceImpl·AdminServiceImpl(기간 파라미터 확장 시).

---

## 3. 탐색(explore) 결과 요약

다음은 **explore** 서브에이전트 조사 결과를 반영한 API 현황이다.

### 3.1 GET /api/v1/admin/statistics/consultation-completion

- **파라미터**: `period` (선택, String). **year, month, startDate, endDate** 별도 파라미터 없음.
- **period 의미**:  
  - `"YYYY-MM"` → 해당 월 1일~말일.  
  - 미지정 → **당해 연도** 1/1~12/31.
- **제한**: **과거 연도 지정 불가**. year 단독 파라미터 없음.
- **DB**: 완료 건수는 기간 필터 적용됨. `totalCount`는 **전체 누적**이라, "해당 기간만의 완료율"은 현재 로직으로는 정확하지 않음(기간 내 완료율을 원하면 백엔드에서 기간 내 예약+완료 건수 필요).

### 3.2 GET /api/v1/admin/consultant-rating-stats

- **파라미터**: **없음**. 기간 관련 파라미터 전혀 없음.
- **응답**: 전체 기간 totalRatings, averageScore, topConsultants. recentTrends만 최근 7일.
- **월별·년도별 평점**: **백엔드 확장 필요**(기간 파라미터 + ratedAt 기간 필터).

### 3.3 결론

- **상담 완료**: 월별 숫자(completedCount)는 **현재 API로 가능** (period=YYYY-MM 호출). **년도별·과거 연도**는 **백엔드에 year(또는 start/end) 확장 필요**.
- **평점**: **월별·년도별 모두 백엔드 확장 필요**.

---

## 4. 월별·년도별 집계 정책

### 4.1 권장 방식: API 확장 + 프론트 기간 선택

- **consultation-completion**
  - **현재**: `period=YYYY-MM`(월), 미지정(당해 연도).
  - **확장 권장**: 쿼리 파라미터 **`year`**(선택) 추가.  
    - `year=2024` → 2024-01-01 ~ 2024-12-31.  
    - `period=YYYY-MM` 유지 → 해당 월.  
    - 둘 다 없음 → 당해 연도(기존 동작).
  - **선택(나중 단계)**: 기간 내 totalCount로 "기간 내 완료율" 제공 시 백엔드 추가 수정.

- **consultant-rating-stats**
  - **확장 필수**: 쿼리 파라미터 **`year`**, **`month`**(또는 `period=YYYY-MM`) 추가.  
  - 서비스에서 `ratedAt` 기간 필터 적용 후 totalRatings, averageScore, topConsultants 재계산.

- **프론트**
  - 기간 선택: **월별**(예: 2025-03), **년도별**(예: 2025), **전체**(기존: 당해 연도 또는 별도 정의) 중 선택.
  - 선택값에 따라  
    - consultation-completion: `period=YYYY-MM`(월별) 또는 `year=YYYY`(년도별, 백엔드 확장 후).  
    - consultant-rating-stats: `year`, `month`(또는 period) 전달(백엔드 확장 후).
  - **1차 구현 옵션**: 백엔드 확장 전에는 **월별만** 지원(consultation-completion만 period로 호출). 평점은 "전체 기간"으로 두고, 년도별은 백엔드 적용 후 연동.

### 4.2 기간 선택 UI

- **위치**: "상담사 별 통합데이터" 카드 내, **제목/부제목 아래**, **테이블/그래프/프로그레스 pill 토글 왼쪽 또는 위** 한 줄에 배치.
- **요소**:  
  - 집계 단위 선택: **월별** | **년도별** | **전체** (라디오 또는 pill).  
  - 월별일 때: **년·월** 선택 (드롭다운 또는 date picker 월만).  
  - 년도별일 때: **년** 선택.  
  - 전체: 추가 선택 없음(당해 연도 또는 전체 기간 정의에 따름).
- **접근성**: 라벨, role, aria-label 유지. B0KlA·unified-design-tokens.css 사용.

---

## 5. 순위 변동 감지

- **정의**: "이전 상태" 대비 "현재 상태"에서 **같은 consultantId**의 **순위(1~10)** 가 바뀐 경우.
  - **이전 상태**: (A) 직전에 선택했던 기간으로 로드한 결과의 순위, 또는 (B) 동일 기간에서 직전 loadStats() 결과의 순위.  
  - **권장**: (A) — 기간을 바꿀 때마다 "이전 기간의 순위"와 "현재 선택 기간의 순위"를 비교. 최초 로드 시에는 "이전 순위" 없음 → 펄스 없음.
- **저장 데이터**:  
  - `previousRankByConsultantId`: Map&lt;consultantId, rank&gt; (1~10).  
  - 기간 변경 또는 기간 유지 후 데이터 재로드 시, **현재** consultantIntegratedData로 순위 계산 후, **이전** previousRankByConsultantId와 비교.
- **산출**:  
  - **rankUp**: 이전에 순위가 있었고(또는 이전에 10위 밖이었고) 현재 순위가 더 앞선 경우(숫자 감소).  
  - **rankDown**: 이전에 순위가 있었고 현재 순위가 더 뒤로 밀린 경우(숫자 증가).  
  - **신규 진입**: 이전에 없던 consultantId가 상위 10명에 들어온 경우 → **rankUp**으로 처리해도 됨.  
  - **이탈**: 이전 10명이 현재 10명 밖으로 나간 경우 → 현재 리스트에는 없으므로 펄스 적용 대상 아님.
- **갱신 시점**: loadStats() 완료 후 consultantIntegratedData가 바뀌었을 때, **현재** 순위로 previousRankByConsultantId를 다음 비교를 위해 저장.

---

## 6. 펄스 효과 스펙

- **목적**: 순위가 올라간 행은 강조(긍정), 내려간 행은 약간 구분(변동 인지).
- **적용 대상**: 테이블 행, 프로그레스 행. 그래프는 막대/라벨에 동일 클래스 적용 가능(선택).
- **CSS 클래스** (B0KlA 네이밍):  
  - **순위 상승**: `mg-v2-ad-b0kla__integrated-data-row--rank-up`, `mg-v2-ad-b0kla__integrated-progress-row--rank-up`  
  - **순위 하락**: `mg-v2-ad-b0kla__integrated-data-row--rank-down`, `mg-v2-ad-b0kla__integrated-progress-row--rank-down`
- **애니메이션**:  
  - **pulse**: 짧은 시간(예: 1.5~2초) 동안 배경색 또는 box-shadow가 살짝 진했다가 원래대로 돌아오는 효과.  
  - **색**: rank-up은 `--mg-success-*` 또는 `--ad-b0kla-green` 계열, rank-down은 `--mg-warning-*` 또는 중성 강조.  
  - 토큰: `unified-design-tokens.css` 사용, 하드코딩 색상 금지.
- **지속**: 애니메이션은 **한 번만** 재생(기간/데이터 변경 시 1회). 자동으로 클래스 제거하거나, 다음 로드 시 제거해도 됨.
- **접근성**: `prefers-reduced-motion` 시 애니메이션 비활성화 또는 단순 페이드만 적용.

---

## 7. 의존성·순서

1. **탐색(explore)** — 완료. API 기간 파라미터·기간별 집계 가능 여부 보고 완료.
2. **백엔드(선택·1차 이후)**: consultation-completion에 `year` 추가; consultant-rating-stats에 `year`/`month`(또는 period) 추가.
3. **프론트**: 기간 선택 state, loadStats 시 기간 파라미터 전달, consultantIntegratedData 기간 반영, previousRankByConsultantId 저장·비교, 펄스 클래스 부여, CSS 애니메이션.

---

## 8. Phase 목록 및 분배실행

| Phase | 담당 | 목표 | 호출 시 전달할 태스크 설명 |
|-------|------|------|----------------------------|
| **Phase 1** | **core-coder** | 백엔드 기간 파라미터 확장 | (1) AdminController `getConsultationCompletionStatistics`: 쿼리 파라미터 `year`(선택) 추가. `year`가 있으면 해당 연도 1/1~12/31로 startDate/endDate 설정. (2) AdminController `getConsultantRatingStatistics`: 쿼리 파라미터 `year`, `month`(또는 `period=YYYY-MM`) 추가. ConsultantRatingServiceImpl에서 기간 필터 적용 후 totalRatings, averageScore, topConsultants 반환. 테넌트 격리·기존 응답 구조 유지. docs/standards, core-solution-backend 스킬 참조. |
| **Phase 2** | **core-coder** | 프론트 기간 선택·API 연동·순위 변동·펄스 | 기획서: `docs/project-management/ADMIN_DASHBOARD_V2_INTEGRATED_DATA_PERIOD_AND_RANK_PULSE_PLAN.md`. (1) AdminDashboardV2에 기간 선택 state(집계 단위: 월/년/전체, 연·월 값). 카드 "상담사 별 통합데이터" 내 제목 아래·pill 토글 위/옆에 기간 선택 UI 추가. (2) loadStats 호출 시 선택 기간에 따라 consultation-completion에 period 또는 year, consultant-rating-stats에 year/month 전달(Phase 1 반영 후). (3) consultantIntegratedData는 기간별 응답으로 계산 유지. (4) previousRankByConsultantId 저장; 기간/데이터 변경 후 현재 순위와 비교해 rankUp/rankDown 목록 산출. (5) 테이블·프로그레스 행에 rank-up/rank-down 시 해당 modifier 클래스 적용. (6) AdminDashboardB0KlA.css에 펄스 애니메이션 추가. unified-design-tokens, B0KlA, prefers-reduced-motion 참조. |
| **Phase 3 (선택)** | **core-designer** | 펄스 비주얼 B0KlA 스타일 제안 | "상담사 별 통합데이터" 카드에서 순위 상승/하락 행에 적용할 **펄스(pulse) 애니메이션** 비주얼을 B0KlA·어드민 대시보드 샘플 스타일에 맞게 제안. 색상(rank-up: 성공 계열, rank-down: 경고/중성), 지속 시간, 강도. 코드 작성 없음. |

- **Phase 1과 Phase 2**: Phase 1(백엔드) 완료 후 Phase 2(프론트) 진행. 1차로 백엔드 확장 없이 **월별만** 프론트에서 period로 호출하고, 평점은 기존 전체 사용 후 Phase 1 적용 시 년도·월 연동 가능.
- **Phase 3**: 코더가 기본 펄스 스펙(§6)으로 구현한 뒤, 디자이너 제안이 있으면 반영 가능.

---

## 9. 리스크·제약

- **완료율 해석**: 현재 API는 기간 내 completedCount만 기간 필터이고 totalCount는 전체 누적. "기간 내 완료율" 문구를 쓸 경우 백엔드에서 기간 내 예약 건수 제공 필요.
- **과거 연도**: consultation-completion에 year 미확장 시 년도별은 "당해 연도"만 가능.
- **평점 기간**: consultant-rating-stats 확장 전까지는 평점은 "전체 기간"으로만 표시.

---

## 10. 단계별 완료 기준·체크리스트

### Phase 1 (백엔드)

- [ ] consultation-completion에 `year` 쿼리 파라미터 처리 추가, 해당 연도 1/1~12/31 집계 반환.
- [ ] consultant-rating-stats에 `year`/`month`(또는 period) 처리, 기간 필터된 topConsultants 등 반환.
- [ ] 기존 호출(파라미터 없음) 동작 유지.

### Phase 2 (프론트)

- [ ] "상담사 별 통합데이터" 카드에 기간 선택 UI(월/년/전체, 연·월) 노출.
- [ ] 기간 선택 시 loadStats에서 해당 기간으로 API 호출, 통합데이터가 기간별로 갱신됨.
- [ ] 이전 기간 순위 저장·비교 후 rankUp/rankDown 적용, 해당 행에 modifier 클래스 부여.
- [ ] rank-up/rank-down 행에 펄스 애니메이션 적용. prefers-reduced-motion 대응.
- [ ] 테이블·프로그레스 뷰 모두 동일 규칙 적용.

### Phase 3 (디자이너, 선택)

- [ ] B0KlA 스타일 펄스 비주얼 제안서 또는 스펙 문서 제공.

---

## 11. 수정·추가 파일 (체크리스트)

| 구분 | 파일 | 내용 |
|------|------|------|
| 백엔드 | AdminController.java | getConsultationCompletionStatistics에 year; getConsultantRatingStatistics에 year/month(또는 period). |
| 백엔드 | AdminServiceImpl.java | consultation-completion year 처리. |
| 백엔드 | ConsultantRatingServiceImpl (또는 동일 서비스) | 기간 파라미터 처리, ratedAt 기간 필터. |
| 프론트 | AdminDashboardV2.js | 기간 state, 기간 선택 UI, loadStats 기간 전달, previousRankByConsultantId, rankUp/rankDown 클래스 부여. |
| 프론트 | AdminDashboardB0KlA.css | .mg-v2-ad-b0kla__integrated-data-row--rank-up/down, progress 행 동일, pulse 애니메이션, reduced-motion. |

---

## 12. 실행 요청문

1. **Phase 1**: **core-coder**를 호출하여 위 "Phase 1" 전달 태스크대로 백엔드 기간 파라미터를 확장해 주세요.
2. **Phase 2**: **core-coder**를 호출하여 위 "Phase 2" 전달 태스크대로 기획서를 참조해 프론트 기간 선택·API 연동·순위 변동 감지·펄스 클래스 및 CSS를 구현해 주세요.
3. **(선택) Phase 3**: **core-designer**를 호출하여 위 "Phase 3" 전달 태스크대로 펄스 비주얼 B0KlA 스타일 제안을 해 주세요. 제안 반영은 core-coder가 Phase 2 결과를 수정하는 형태로 진행 가능합니다.

Phase 1 완료 후 Phase 2를 진행하는 것을 권장합니다. 1차로 월별만 지원하고 consultation-completion만 period로 호출한 뒤, Phase 1 적용 후 년도·평점 기간을 연동할 수 있습니다.
