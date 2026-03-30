# 관리자 대시보드 V2: "상담사 별 통합데이터" 카드 영역 정책

## 1. 제목·목표

- **제목**: "우수 상담사 평점" 카드 → **"상담사 별 통합데이터"** 카드로 전환·고도화
- **목표**: 평가 데이터만 보이던 카드를, 상담사별 통합 지표(상담 건수·완료율·평점·내담자 수 등)를 한 화면에서 볼 수 있는 영역으로 변경하여 관리자 활용도를 높인다.

## 2. 범위

| 구분 | 내용 |
|------|------|
| **포함** | `AdminDashboardV2.js` 내 `mg-v2-content-growth-row` 우측 카드(1149~1181행), 해당 카드의 데이터 소스·state·API 연동 |
| **제외** | 다른 대시보드 카드, 상담사 상세 페이지, 별도 통계 전용 페이지 |
| **영향** | 관리자(ADMIN) 대시보드 V2 진입 시 해당 카드 영역만 변경 |

## 3. 의존성·순서

- **선행 완료**: explore로 현황·API 파악 완료
- **순서**: 기획 정책 정리(본 문서) → (선택) core-designer 레이아웃·비주얼 제안 → core-coder 구현

## 4. "상담사 별 통합데이터" 지표·데이터 소스

### 4.1 노출 지표 제안(우선순위 순)

| 순위 | 지표명 | 설명 | 데이터 소스 | 비고 |
|------|--------|------|-------------|------|
| 1 | 상담사명 | 이름(필수) | 기존 모든 API 공통 | - |
| 2 | 평점 | 평균 하트 점수(소수 1자리) | `GET /api/v1/admin/consultant-rating-stats` → `topConsultants[].averageHeartScore` | 프론트는 현재 `averageScore` 사용 중, 백엔드는 `averageHeartScore`만 반환 → 폴백 처리 필요 |
| 3 | 상담 완료 건수 / 완료율 | 기간 내 완료 건수 및 완료율 | `GET /api/v1/admin/statistics/consultation-completion` → 상담사별 `completedCount`, `completionRate` | AdminDashboardV2 `loadStats()`에서 이미 로드(`consultationStats`) |
| 4 | 현재/최대 내담자 | 수용 현황 | `GET /api/v1/admin/consultants/with-stats` → `currentClients`, `maxClients` | 별도 호출 또는 기존 로드 여부 확인 후 연동 |
| 5 | (선택) 최근 활동 요약 | 최근 매칭 등 | `consultants/with-stats` → `recentMappings` 등 | 카드 공간·가독성에 따라 2차 반영 |

### 4.2 데이터 소스 요약

- **이미 대시보드에서 로드 중**: `consultant-rating-stats`, `consultation-completion`, `vacation-statistics`, `consultants/with-vacation`
- **추가 연동 검토**: `GET /api/v1/admin/consultants/with-stats` — 상담사별 현재/최대 내담자·최근 매칭. (한 번에 전체 목록 조회 시 대시보드 초기 로드 비용 고려)
- **필드 정합성**: `consultant-rating-stats`의 `topConsultants`는 `averageHeartScore` 반환. 프론트에서 `averageScore` 미존재 시 `averageHeartScore` 폴백 처리. `profileImageUrl`은 현재 API에 없음 — 통합 카드에서 프로필 이미지는 생략하거나, 별도 API/캐시와 조합해 2차 확장.

## 5. 카드 제목·섹션 구성 제안

- **카드 제목**: "상담사 별 통합데이터"
- **부제/설명(선택)**: "평점·상담 완료·내담자 수 등" (한 줄 이하)
- **내용 영역 구성**:
  - **기본안**: 상담사 목록(이름) + 지표를 **테이블형**으로 표시 — 상담사명 | 평점 | 완료 건수 | 완료율 | 현재/최대 내담자. B0KlA 카드 스타일 유지, `mg-v2-ad-b0kla__card` 내부에 테이블 또는 리스트 형태.
  - **대안**: 상담사별 **작은 카드(행)** — 한 행에 이름 + 주요 수치 2~3개. 반응형·가독성 우선이면 카드형 행을 권장.
- **표시 상한**: 상담사 수가 많을 수 있으므로 상위 N명(예: 8~10명) 또는 스크롤 가능한 영역으로 제한.

## 6. 데이터 없음 시(Empty state)

- **문구**: "상담사 통합 데이터가 없습니다."
- **클래스/위치**: 기존 `mg-v2-ad-b0kla__counselor-empty`와 동일한 역할의 empty 블록. 필요 시 클래스명을 `mg-v2-ad-b0kla__integrated-data-empty` 등으로 통일.

## 7. 리스크·제약

- **API 호출 수**: `consultants/with-stats`를 새로 쓰면 요청 1회 추가. 대시보드 초기 로드 시간에 영향 가능 — 필요 시 캐시·기존 `loadStats()` 내 통합 검토.
- **필드명 불일치**: `averageHeartScore` vs `averageScore` — 코더 구현 시 백엔드 응답 기준으로 프론트에서 통일 처리.
- **프로필 이미지**: 통합데이터 카드 1차에서는 프로필 이미지 없이 이름+지표만 노출해도 무방(탐색 결과 기준).

## 8. 단계별 완료 기준·체크리스트

### Phase: core-designer(선택)

- [ ] B0KlA·어드민 대시보드 샘플 기준으로 "상담사 별 통합데이터" 카드 내 레이아웃(테이블/카드형 행)·비주얼 제안서 또는 스펙 문서 작성
- [ ] 사용성(관리자가 한눈에 보는 흐름)·정보 노출 범위·배치가 기획서(§4·§5)와 일치하는지 확인

### Phase: core-coder

- [ ] `AdminDashboardV2.js` 1149~1181행 "우수 상담사 평점" 카드 블록을 "상담사 별 통합데이터" 카드로 교체
- [ ] 제목을 "상담사 별 통합데이터"로 변경, 부제는 선택 적용
- [ ] 지표: 상담사명, 평점(`averageHeartScore` 폴백), 상담 완료 건수·완료율(`consultationStats` 활용), 현재/최대 내담자(`consultants/with-stats` 연동 여부 결정 후 반영) 구성
- [ ] 데이터 소스: 기존 `loadStats()` 내 데이터 우선 사용, 필요 시 `consultants/with-stats` 호출 추가(성능 고려)
- [ ] Empty state: "상담사 통합 데이터가 없습니다." 노출
- [ ] B0KlA 카드 스타일(`mg-v2-ad-b0kla__card` 등) 유지, 반응형 유지
- [ ] `averageScore` 미존재 시 `averageHeartScore` 사용하도록 기존 평점 파생 데이터 수정

---

## 9. 분배실행(실행 분배표)

| Phase | 담당 서브에이전트 | 전달할 태스크 설명(프롬프트 요약) | 의존성 |
|-------|-------------------|-----------------------------------|--------|
| **1** | **explore** | (완료) AdminDashboardV2 "우수 상담사 평점" 블록·데이터 소스·상담사 통계 API 조사 | - |
| **2** | **core-planner** | (완료) 본 정책 문서 작성 — 지표 목록·데이터 소스·UI 구성·empty state·체크리스트 | Phase 1 |
| **3** | **core-designer** (선택) | `docs/project-management/CONSULTANT_INTEGRATED_DATA_CARD_PLAN.md`와 §4·§5·§6을 참조하여, "상담사 별 통합데이터" 카드 내부 레이아웃(테이블 vs 카드형 행)·비주얼을 B0KlA·MindGarden 어드민 스타일로 제안. 사용성(한눈에 보는 흐름)·정보 노출 범위·배치 요구 반영. 산출: 스펙 문서 또는 시안 설명. 코드 작성 없음. | Phase 2 |
| **4** | **core-coder** | `docs/project-management/CONSULTANT_INTEGRATED_DATA_CARD_PLAN.md`와 (디자이너 산출물이 있으면) 해당 스펙을 참조하여, `frontend/src/components/dashboard-v2/AdminDashboardV2.js` 1149~1181행 "우수 상담사 평점" 카드를 "상담사 별 통합데이터" 카드로 교체·구현. 지표(상담사명, 평점, 상담 완료 건수/완료율, 현재·최대 내담자), 데이터 소스(loadStats 기존 데이터 + 필요 시 consultants/with-stats), empty state "상담사 통합 데이터가 없습니다.", B0KlA 스타일 유지. 평점 필드명 averageHeartScore 폴백 처리. `/core-solution-frontend`, `/core-solution-atomic-design` 적용. | Phase 2 또는 Phase 3 |

---

## 10. 실행 요청문(호출 주체용)

1. **Phase 1·2**: 탐색 및 기획 정책 정리 완료.
2. **Phase 3(선택)**: core-designer를 호출할 때 위 분배실행 표 Phase 3의 "전달할 태스크 설명"과 본 문서 경로(`docs/project-management/CONSULTANT_INTEGRATED_DATA_CARD_PLAN.md`)를 전달하세요.
3. **Phase 4**: core-coder를 호출할 때 분배실행 표 Phase 4의 "전달할 태스크 설명"과 본 문서 경로를 전달한 뒤, 디자이너 산출물이 있으면 함께 전달하세요.

이 순서로 서브에이전트를 호출하면, 기획이 취합한 결과를 바탕으로 "상담사 별 통합데이터" 카드 전환이 완료됩니다.
