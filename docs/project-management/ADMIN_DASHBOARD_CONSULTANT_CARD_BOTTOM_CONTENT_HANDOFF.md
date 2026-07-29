# 어드민 대시보드 — 「상담사 별 통합데이터」카드 하단 콘텐츠 핸드오프

**작성**: core-planner  
**일자**: 2026-07-29  
**상태**: 기획 완료 · **구현·배포 금지** (본 문서 기준 designer → coder → tester만)  
**범위**: `AdminDashboardV2` growth-row 우측 `mg-v2-ad-b0kla__card` (상담사 별 통합데이터) **하단 stretch 여백**만.  
**스크린샷 근거**: 프로그레스 뷰에서 §C(상담일지 누락) 아래 ~카드 높이 1/3 navy 공백.

---

## 1. 한줄 목표

growth-row stretch로 비는 카드 하단에, **기존 API·이미 로드된 매핑/입금 데이터를 재사용**해 **상담사별 회기 소진율(§D)** 섹션을 넣어 운영 스캔 밀도를 올린다.

---

## 2. 사용자 관점 (§0.4)

| 항목 | 내용 |
|------|------|
| **사용성** | ADMIN이 집계 기간·뷰를 유지한 채, 스크롤/탭 추가 없이 **완료율 → 건수 → 일지 누락 → 회기 소진**을 한 카드에서 세로 스캔. 클릭은 선택(상세는 UnifiedModal). |
| **정보 노출** | 테넌트 ADMIN만. 상담사 표시명은 기존과 동일 `maskEncryptedDisplay`. 내담자 PII·상담 내용 비노출. 소진율은 **활성(ACTIVE) 매핑** 집계 수준. |
| **레이아웃** | AdminCommonLayout 본문 유지. 카드 **§C 아래 §D 섹션**(border-top). **뷰 탭(테이블/그래프/프로그레스) 추가 금지**(이번 배치). B0KlA 다크 카드·토큰·아토믹 계층 준수. |

---

## 3. 현황 요약 (explore)

### 3.1 구조

| 역할 | 경로 |
|------|------|
| 카드 본체·머지·뷰 | `frontend/src/components/dashboard-v2/AdminDashboardV2.js` |
| growth-row CSS | `frontend/src/components/dashboard-v2/content/ContentArea.css` (`2fr 1fr`, stretch) |
| B0KlA 카드 스타일 | `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` |
| §A 누적 막대 | `molecules/CumulativeConsultantCountsChart.jsx` |
| §B 월별 배지 | `ui/Schedule/ConsultantCountsBadgeList.jsx` |
| §C 일지 누락 | `ui/Schedule/MissingConsultationLogsList.jsx` + `useCumulativeMissingConsultationLogs` |

별도 위젯 파일이 아니라 **페이지 인라인 카드**.

### 3.2 이미 쓰는 API

| 용도 | 엔드포인트 |
|------|------------|
| 완료율 랭킹 | `GET /api/v1/admin/statistics/consultation-completion` (+ 월별 `period`) |
| 평점 머지 | `GET /api/v1/admin/consultant-rating-stats` |
| 누적 건수 | `GET /api/v1/schedules/cumulative-consultant-counts` |
| 월별 건수 | `GET /api/v1/schedules/monthly-consultant-counts` |
| 일지 누락 | `GET /api/v1/schedules/cumulative-missing-consultation-logs` |

형제: mappings LIST, pending-deposit, session-extensions pending-payment, with-vacation(카운트만), today/statistics 등.

### 3.3 여백 원인

- **고정 height 1095용 placeholder 아님**.
- growth-row `align-items: stretch`로 **우측 카드가 좌측 시각화 그룹 높이에 맞춤**.
- 상단 랭킹은 `integrated-data-wrap` max-height + scroll, §A~§C는 내용만큼만 → **§C 아래 빈 navy**.

→ **§C 아래 섹션 추가**가 레이아웃상 정답. 탭 추가는 UX·복잡도만 늘림(기각).

### 3.4 뷰별 현재 콘텐츠

| 뷰 | 상단 | 하단 확장 |
|----|------|-----------|
| 프로그레스 | 완료율 바 랭킹 | §A/§B(기간) + §C |
| 테이블 | 순위·이름·평점·완료·완료율 | 동일 |
| 그래프 | 완료 건수 바 | 동일 |

---

## 4. 후보 (검증 후 채택/기각)

| ID | 후보 | 우선 | 데이터 실현성 | 근거 | 판정 |
|----|------|------|---------------|------|------|
| **C1** | **상담사별 활성 매칭 회기 소진율** | **P0** | **높음** | mappings LIST에 `usedSessions`/`remainingSessions`/`totalSessions`/`consultantId`/`status` 존재. 대시보드 `loadStats`가 이미 LIST 호출(카운트만 사용 중) → **추가 fetch 없이 FE 집계 가능**. 진행 바 UI와 패턴 일치. | **권장 채택** |
| **C2** | 상담사별 입금 확인 대기 | P1 | 높음 | `pendingDepositList` / pending-deposit + session-extensions **이미 로드**. consultantId 기준 그룹핑. | **차순위·공간 여유 시 §E 또는 §D 보조 칩** |
| **C3** | 평점(만족도) 미니 랭킹/바 | P2 | 높음(이미 머지) | `consultantIntegratedData.rating`·테이블에 이미 노출. 프로그레스 하단 재표시는 **정보 중복**. 시계열 추이 API 없음. | **단독 §D로는 기각**(필요 시 상단 프로그레스에 보조열만) |
| **C4** | 상담사별 신규 매칭(최근 N일) | P2 | 중 | mappings에 생성일·상태 있으나 **대시보드용 상담사별 집계 SSOT 없음**. FE 필터 가능하나 정의(NEW_DAYS) 합의 필요. | **본 배치 제외** |
| **C5** | 이번 주 스케줄 밀도 | P3 | 낮~중 | DoW·today stats는 테넌트/당일. **상담사별 weekly density API 없음**. | **기각(후속)** |
| **C6** | 출근/가용 | — | 낮음 | `with-vacation`은 KPI 인원수만. 학원 attendances와 무관. | **기각** |

---

## 5. 권장안 (C1) — 레이아웃·스펙 초안

### 5.1 한줄 권장

**§C(상담일지 누락) 바로 아래 §D「회기 소진율」가로 프로그레스 랭킹** — ACTIVE 매핑의 `used/total` 상담사별 평균(또는 가중 합), 기존 B0KlA progress row 재사용.

### 5.2 블록 배치 (카드 내부 위→아래)

```
[제목 + 부제]
[집계 기간 pill: 전체 | 월별 | 년도별]
[뷰 SegmentedTabs: 테이블 | 그래프 | 프로그레스]
[integrated-data-wrap — 기존 뷰 본문]
[§A 누적 상담 건수]     ← period=all 만
[§B 월별 상담 건수]     ← period=month 만
[§C 상담일지 누락]      ← 항상
[§D 회기 소진율]        ← 신규 (권장, 항상 · 스냅샷)
  (선택 P1) [§E 입금 대기 요약 칩 1줄]
```

- **탭/뷰 모드 추가 없음.**
- §D는 **기간 pill과 독립 스냅샷**(잔여 회기는 “현재 ACTIVE”가 운영 의미). 디자이너가 섹션 헤더에「현재 활성 매칭」힌트 문구 배치.
- 공간이 남으면 §E는 **건수 배지 1행**(상담사명 + N건), 상세는 UnifiedModal.

### 5.3 데이터 규칙 (코더 확정용 — 기획 경계)

| 항목 | 규칙 |
|------|------|
| 모집단 | `status === 'ACTIVE'` 매핑만 |
| 상담사 키 | `consultantId` (없으면 행 제외) |
| 소진율(매핑) | `totalSessions > 0` 이면 `usedSessions / totalSessions * 100`, 아니면 스킵 |
| 상담사 집계 | **가중**: Σused / Σtotal (권장) 또는 매핑 단순 평균 — 코더가 소수 건 edge 확인 후 문서화 |
| 정렬 | 소진율 DESC, top N은 상단 통합데이터와 동일하게 **최대 10** |
| 표시 | `N위 · 이름 · track/fill · XX%` (+ 선택: `잔여 Σremaining` 보조 텍스트) |
| 빈 상태 | ACTIVE 매핑 0 → §D 숨김 또는 empty 문구(§C 패턴 준수) |
| API | **1차: 기존 mappings LIST 페이로드 재사용**. LIST가 카운트만 파싱 중이면 **동일 응답의 mappings 배열을 state에 보관**해 집계. 부족 시 최소 BE 필드만 확장(별 Phase). |

### 5.4 UI·디자인 제약

- B0KlA: `mg-v2-ad-b0kla__*` , 토큰만(`unified-design-tokens.css`). hex 하드코딩 금지.
- 아토믹: 가능하면 **Molecule**(progress row 재사용) + 카드 내 **section Organism 패턴**(§A~§C와 동일).
- 모달: 상세(매핑 목록) 필요 시 **UnifiedModal만**. 커스텀 오버레이 금지.
- `safeDisplay` / `maskEncryptedDisplay` 표시 경계 준수.
- 반응형: growth-row 1열 접힘 시 §D도 동일 폭·터치 타깃.

### 5.5 사용성·정보·레이아웃 (디자이너 전달용)

1. **사용성**: 관리자가 “누가 곧 회기 소진/연장 대상인가”를 §C 직후에서 바로 본다. 클릭 최소(기본은 읽기 전용 바).
2. **정보 노출**: ADMIN·테넌트 집계. 이름 마스킹. 내담자명 기본 비노출(모달 드릴다운 시에도 최소).
3. **레이아웃**: §C와 동일 `border-top` 섹션. 제목 레벨 h4. 프로그레스 행은 기존 `integrated-progress-*` 비주얼과 정렬. 카드 하단 stretch를 **내용으로 채움**(불필요한 min-height 금지).

---

## 6. 리스크·제약

| 리스크 | 대응 |
|--------|------|
| mappings LIST가 대량이면 집계 비용 | top 상담사만 / ACTIVE 필터 선행; 필요 시 전용 경량 API는 후속 |
| 좌측 시각화 배치와 파일 충돌 | `AdminDashboardV2.js`·B0KlA CSS만 최소 변경. VisualizationGroup 무변경 원칙 |
| 년도별 period TODO | §D와 무관. 본 배치에서 year 연동 하지 않음 |
| 입금대기(C2)와 KPI 중복 | §E는 “상담사별”만, 상단 KPI 총량은 유지 |

---

## 7. 완료 기준·체크리스트

### 기획(본 문서)

- [x] 현황·여백 원인 파악
- [x] 후보 3~5 + 실현성
- [x] 권장 1안 + 레이아웃
- [x] 다음 Phase 순서 명시

### designer

- [ ] §D(·선택 §E) B0KlA 다크 스펙·토큰·여백·빈 상태
- [ ] 펜슬/샘플과 톤 일치, 하드코딩 색 없음

### coder

- [ ] §D FE 집계 + UI (§A~§C 패턴)
- [ ] StandardizedApi·상수·i18n
- [ ] UnifiedModal(드릴다운 시) / 표시 경계
- [ ] 운영 하드코딩 게이트(§17 / §1.3 / PRE_PRODUCTION 해당 시)

### tester

- [ ] ACTIVE 0/다수, used/total edge, 마스킹, 반응형, stretch 여백 완화 확인

---

## 8. 분배실행 (다음 단계만 — 본 턴 실행 금지)

| Phase | 담당 | 모델 권장 | 의존 | 전달 요약 |
|-------|------|-----------|------|-----------|
| **1** | **core-designer** | **`gemini-3.1-pro`** | — | 본 문서 §2·§5. 카드 하단 §D(회기 소진율) 비주얼·토큰·빈상태. 선택 §E 입금대기 칩. 코드 작성 금지. |
| **2** | **core-coder** | (기본) | Phase 1 | 디자이너 스펙 + §5.3. `AdminDashboardV2` §D 구현, mappings 재사용, 표준·UnifiedModal. |
| **3** | **core-tester** | (기본) | Phase 2 | §7 tester 체크리스트. |

**순서 고정**: designer(gemini) → coder → tester.  
**본 배치에서 하지 않음**: 배포·커밋 강요·core-deployer·탭 뷰 추가·스케줄 밀도/출근 API 신규.

### Phase 1 프롬프트 초안 (부모 에이전트용)

```
docs/project-management/ADMIN_DASHBOARD_CONSULTANT_CARD_BOTTOM_CONTENT_HANDOFF.md 기준.
AdminDashboardV2 「상담사 별 통합데이터」카드 §C 아래 §D「회기 소진율」B0KlA 다크 스펙 작성.
사용성·정보노출·레이아웃은 문서 §2·§5.5.
기존 integrated-progress / cumulative-section 패턴 정렬.
코드·CSS 직접 수정 금지. 산출: 스펙 블록(토큰·간격·상태·반응형).
```

### Phase 2 프롬프트 초안

```
핸드오프 §5 + designer 산출물.
§D 회기 소진율: ACTIVE 매핑 used/total 상담사별 집계, progress row UI.
가능하면 추가 API 없이 mappings LIST 재사용.
표준: frontend/api/멀티테넌트/UnifiedModal/표시경계.
하드코딩 게이트 문서 경로 인용.
```

### Phase 3 프롬프트 초안

```
§D 단위·화면 스모크: 빈 목록, 소진 0%/100%, 이름 마스킹, growth-row 하단 여백, 모바일 1열.
```

---

## 9. 관련 문서

- `docs/project-management/ADMIN_DASHBOARD_PERIOD_VIZ_CONSULTATION_PROGRESS_HANDOFF.md` (좌측 시각화 — 충돌 주의)
- `docs/design-system/ADMIN_DASHBOARD_VISUALIZATION_GROUP_LAYOUT_SPEC.md`
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`
