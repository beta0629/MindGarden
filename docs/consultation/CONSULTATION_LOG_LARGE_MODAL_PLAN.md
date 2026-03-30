# 상담일지 작성 기능 기획안 — 큰 모달 통일·내담자 정보·중요 코멘트·심리검사 연동

> 회의용 요약·범위·단계·산출물·서브에이전트 가동 계획  
> @author core-planner | @since 2026-03-02

---

## 1. 회의용 요약 (1페이지)

### 무엇을 바꾸는지

| 항목 | 현재 | 목표 |
|------|------|------|
| **상담일지 작성 진입점** | ConsultationLogModal(일반 large 모달), ConsultationRecordScreen(풀 페이지) 혼재 | **큰 모달(Large/XL)** 하나로 통일 — 스케줄 클릭 후 상담일지 작성/수정은 모두 큰 모달에서 진행 |
| **내담자 정보** | 모달 내 소량만 노출(이름·나이·성별·연락처·상담목적 등), 풀페이지는 별도 카드 | 모달 **상단 고정 영역**에 내담자 프로필 요약을 항상 노출(이름·연락처·성별·등급/상태·메모·주소 요약·매칭·패키지 요약 등) |
| **상담 시 주의사항** | 별도 블록 없음 | **중요 코멘트** 블록 추가 — 내담자 메모(notes), 이전 상담일지 특이사항, 매칭/일정 메모 등 상담사가 반드시 볼 내용을 상단에 눈에 띄게 표시 |
| **심리검사** | 모달에는 없음, 풀페이지에만 링크+요약 | 심리검사가 있으면 모달 내 **전용 섹션**으로 요약/링크 노출, 요약문·위험도·핵심 해석 등이 있으면 우선 노출 |

### 왜 필요한지

- 상담사가 **한 화면에서** 내담자 정보 확인과 일지 작성을 동시에 할 수 있어야 함.
- 상담 전 **반드시 인지해야 할 내용**(메모·주의사항·이전 특이사항)이 흩어져 있지 않고 한곳에 모여 있어야 함.
- 심리검사 결과가 있을 때 상담일지 작성 맥락에서 바로 확인할 수 있어야 함.

### 어떤 순서로 진행할지

1. **Phase 1 (설계)**  
   core-designer: 상담일지 큰 모달 레이아웃, 상단 내담자 정보·중요 코멘트·심리검사 섹션의 와이어프레임/스펙 작성.
2. **Phase 2 (구현)**  
   core-coder: 스펙 확정 후 ConsultationLogModal을 큰 모달로 고정, 상단 블록(내담자 정보·중요 코멘트·심리검사) 구현 및 API 연동.
3. **Phase 3 (강화)**  
   core-coder: 심리검사 연동 강화(요약·위험도·핵심 해석 노출), 필요 시 백엔드 보강.  
   필요 시 core-debugger: 연동 이슈·500 원인 분석 및 수정 제안.

---

## 2. 목표·범위

### 2.1 목표 (1~2문장)

상담일지 작성 시 **큰 모달(Large/XL)** 하나로 통일하고, 모달 상단에 **내담자 프로필 요약**·**중요 코멘트**·**심리검사 섹션**을 두어, 상담사가 한 화면에서 내담자 정보·주의사항·심리검사 요약을 보면서 일지를 작성할 수 있게 한다.

### 2.2 기능 범위

**포함**

- 상담일지 “큰 모달” 적용 대상  
  - 스케줄(일정) 클릭 후 “상담일지 작성”으로 열리는 **ConsultationLogModal**  
  - 진입 경로: `UnifiedScheduleComponent` → `ScheduleDetailModal` → `onConsultationLogOpen(scheduleData)` → `ConsultationLogModal`  
- 모달 내 **상단 고정 영역** 구성  
  - **내담자 정보 블록**: 이름, 연락처(전화·이메일), 성별, 등급/상태, 메모(notes), 주소 요약, 매칭·패키지 요약 등  
  - **중요 코멘트 블록**: 내담자 메모, 이전 상담일지 특이사항, 관리자/상담사가 남긴 “상담 시 주의사항”(매칭 notes, 일정 notes, preparation_notes 등)  
  - **심리검사 블록**(있을 때만): 내담자별 심리검사 문서 목록·요약/링크, 요약문·위험도·핵심 해석 우선 노출  
- 데이터 소스(기존 API/필드 기준)  
  - 내담자: `GET /api/v1/admin/clients/with-stats/{clientId}` → `client` (이름·연락처·성별·등급·notes·주소 등), `Client` 엔티티·User(memo, notes)  
  - 매칭/패키지: Admin·Mapping API 응답 내 notes·패키지 정보  
  - 일정: `Schedule.notes`, `Consultation.preparation_notes`, `Consultation.consultantNotes`  
  - 심리검사: `GET /api/v1/assessments/psych/documents/by-client/{clientId}` → `PsychAssessmentDocumentListItem`(documentId, reportSummary 등), 필요 시 리포트 상세(위험도·핵심 해석) API  
- 역할: **CONSULTANT**(상담사) 중심. ADMIN에서 동일 모달 재사용 시 동일 레이아웃 적용.

**제외**

- ConsultationRecordScreen(풀 페이지)의 **삭제/통합**은 본 기획 범위에서 “큰 모달로 통일” 후 별도 단계로 검토(진입 경로 정리·리다이렉트 정책은 Phase 2 완료 후 결정).
- “중요 코멘트”의 **신규 입력 UI**(상담사가 여기서 코멘트를 새로 남기는 기능)는 본 단계 제외. **표시만** 구현.

### 2.3 영향 영역

| 영역 | 영향 |
|------|------|
| **프론트엔드** | `ConsultationLogModal.js`, `UnifiedScheduleComponent.js`(모달 호출), `ScheduleDetailModal.js`(상담일지 버튼), 참조용 `ConsultationRecordScreen.js`(내담자·심리검사 블록 참고) |
| **API** | 기존 사용: `GET /api/v1/admin/clients/with-stats/{id}`, `GET /api/v1/assessments/psych/documents/by-client/{clientId}`, `GET /api/schedules/consultation-records`, 상담일지 저장 API. 필요 시 일정/매칭/이전 일지 조회 API 명세 정리 |
| **백엔드** | 심리검사 “요약·위험도·핵심 해석” 노출 강화 시 `PsychAssessmentController`·리포트 DTO 확장 검토(Phase 3) |
| **디자인** | UnifiedModal size=large 고정 또는 XL 도입, B0KlA·unified-design-tokens, `docs/design-system` |

---

## 3. 의존성·순서

- **선행 조건**  
  - 기존 API 유지: `clients/with-stats/{id}`, `psych/documents/by-client/{clientId}`, consultation-records CRUD.  
  - 상담일지 모달 진입 시 전달되는 `scheduleData`에 `clientId` 포함(현재 `ScheduleDetailModal` → `onConsultationLogOpen`에서 event/schedule 전달).
- **작업 순서**  
  - UI/UX 스펙 확정(Phase 1) → 큰 모달 + 상단 블록 구현(Phase 2) → 심리검사 연동 강화(Phase 3).  
  - “중요 코멘트”에 필요한 **집계 API**(내담자 notes + 매칭 notes + 일정 notes + 이전 일지 특이사항 한 번에)가 없으면 Phase 2에서 프론트 다중 호출로 구현하거나, 백엔드에 단일 API 추가 검토(explore/core-coder 협의).

---

## 4. 사용자 관점 요구 (디자이너 전달용)

- **사용성**  
  - 상담사가 스케줄에서 “상담일지 작성” 클릭 → 큰 모달이 열리고, **스크롤 시에도 상단에 내담자 정보·중요 코멘트가 고정**되거나 항상 먼저 보이도록.  
  - 자주 쓰는 동작(저장·완료)은 모달 하단 액션에 유지.  
- **정보 노출 범위**  
  - 내담자: 이름·연락처·성별·등급/상태·메모(notes)·주소 요약·매칭·패키지 요약(역할 CONSULTANT/ADMIN 동일).  
  - 중요 코멘트: 내담자 메모, 이전 상담일지 특이사항, 매칭/일정/준비 메모 — 상담사·관리자만 노출.  
  - 심리검사: 문서 목록·요약·있으면 위험도·핵심 해석 우선.  
- **레이아웃**  
  - 모달 상단: [내담자 정보 블록] → [중요 코멘트 블록] → [심리검사 블록(있을 때)] → (스크롤) → [상담일지 작성 폼] → [액션 버튼].  
  - 중요 코멘트는 시각적으로 구분(배경/테두리/아이콘)하여 “반드시 보라”는 인지가 되도록 설계 권장.

---

## 5. 단계(Phase) 목록 및 서브에이전트 가동 계획

### Phase 1: UI/UX 스펙 및 레이아웃 설계

| 항목 | 내용 |
|------|------|
| **담당** | **core-designer** |
| **목표** | 상담일지 큰 모달의 레이아웃, 상단 내담자 정보·중요 코멘트·심리검사 섹션의 와이어프레임/스펙 작성. |
| **전달할 태스크 설명 초안** | “상담일지 작성 기능을 **큰 모달(Large/XL)** 로 통일하는 UI/UX 스펙을 설계해 주세요.  
  - **사용성**: 상담사가 스케줄에서 상담일지 작성 클릭 시 한 화면에서 내담자 정보 확인과 일지 작성이 가능해야 하며, 상단 블록은 스크롤 시에도 인지 가능하도록 배치.  
  - **정보 노출**: 상단에 (1) 내담자 프로필 요약(이름·연락처·성별·등급/상태·메모·주소 요약·매칭·패키지 요약), (2) 중요 코멘트(내담자 메모·이전 일지 특이사항·상담 시 주의사항), (3) 심리검사(있을 때: 요약/링크·요약문·위험도·핵심 해석 우선).  
  - **레이아웃**: 모달 상단 고정 영역 순서 — 내담자 정보 → 중요 코멘트 → 심리검사 → 본문(일지 폼). 중요 코멘트는 눈에 띄는 블록으로 설계.  
  - 참조: `docs/consultation/CONSULTATION_LOG_LARGE_MODAL_PLAN.md`, `ConsultationRecordScreen.js` 내 내담자 카드·심리검사 섹션, `ConsultationLogModal.js` 현재 구조, `/core-solution-unified-modal`, `/core-solution-atomic-design`, `unified-design-tokens.css`, B0KlA·어드민 대시보드 샘플.  
  - 산출: 화면별 레이아웃·블록 구성·디자인 토큰 사용 스펙(또는 와이어프레임 설명). 코드 작성 없음.” |

### Phase 2: 큰 모달 + 상단 블록 구현

| 항목 | 내용 |
|------|------|
| **담당** | **core-coder** |
| **목표** | ConsultationLogModal을 큰 모달로 고정, 상단에 내담자 정보·중요 코멘트·심리검사 블록 구현 및 기존 API 연동. |
| **전달할 태스크 설명 초안** | “Phase 1에서 확정된 상담일지 큰 모달 스펙에 따라 **ConsultationLogModal**을 수정해 주세요.  
  - UnifiedModal은 **size='large'** 유지 또는 XL 지원 시 확장. 상단 고정 영역: (1) 내담자 정보 블록 — `GET /api/v1/admin/clients/with-stats/{clientId}` 사용(scheduleData.clientId), Client·User 필드(이름·연락처·성별·등급·notes·주소·매칭/패키지 요약 등) 노출.  
  - (2) 중요 코멘트 블록 — 내담자 notes, 매칭 notes, 일정 notes, 이전 상담일지 특이사항 등 표시(데이터 소스: with-stats 응답·일정·매칭·consultation-records API).  
  - (3) 심리검사 블록 — `GET /api/v1/assessments/psych/documents/by-client/{clientId}` 호출, 문서 목록·reportSummary·링크 노출.  
  - 참조: `docs/consultation/CONSULTATION_LOG_LARGE_MODAL_PLAN.md`, Phase 1 디자이너 산출물, `ConsultationRecordScreen.js` 내 데이터 로딩·심리검사 섹션, `/core-solution-frontend`, `/core-solution-atomic-design`, `/core-solution-api`.  
  - StandardizedApi·tenantId·에러 처리 준수.” |

### Phase 3: 심리검사 연동 강화

| 항목 | 내용 |
|------|------|
| **담당** | **core-coder** (필요 시 백엔드 확장), **core-debugger**(연동 이슈 시) |
| **목표** | 심리검사가 있을 때 요약문·위험도·핵심 해석 등이 있으면 모달 내 전용 섹션에서 우선 노출되도록 설계·구현. |
| **전달할 태스크 설명 초안** | “상담일지 모달의 심리검사 섹션을 강화해 주세요.  
  - `PsychAssessmentDocumentListItem`의 reportSummary 외에, 리포트에 **위험도·핵심 해석** 등이 있으면 해당 내용을 모달 내에서 우선 노출하도록 설계.  
  - 기존 API: `GET /api/v1/assessments/psych/documents/by-client/{clientId}`. 필요 시 `PsychAssessmentController`·리포트 DTO에 요약/위험도/핵심 해석 필드 추가 검토.  
  - 참조: `PsychAssessmentController.java`, `PsychAssessmentDocumentListItem.java`, `ConsultationRecordScreen.js` 심리검사 영역, `/core-solution-backend`, `/core-solution-frontend`.” |

### Phase 4 (선택): 연동 이슈 분석·수정 제안

| 항목 | 내용 |
|------|------|
| **담당** | **core-debugger** |
| **목표** | Phase 2·3 과정에서 500·API 오류·권한 오류 등이 발생 시 원인 분석 및 core-coder용 수정 제안. |
| **전달할 태스크 설명 초안** | “상담일지 큰 모달 연동 중 [증상 요약]이 발생했습니다. 재현 절차: [스케줄 클릭 → 상담일지 작성 → …]. 확인할 로그·API: [해당 엔드포인트·tenantId]. 원인 분석 후 core-coder에게 수정 제안을 전달해 주세요. 코드 수정은 하지 않습니다.” |

---

## 6. 리스크·제약

- **API 경로 불일치**: ConsultationLogModal은 현재 `/api/admin/users`로 클라이언트 조회. `clients/with-stats/{id}`로 통일 시 상담사 역할 권한(PreAuthorize) 확인 필요.
- **중요 코멘트 집계**: 여러 소스(User.notes, ConsultantClientMapping.notes, Schedule.notes, Consultation.preparation_notes, 이전 일지)를 한 번에 주는 전용 API가 없을 수 있음. Phase 2에서 다중 호출로 구현하거나, 백엔드에 “상담일지용 클라이언트 요약+코멘트” API 추가 검토.
- **심리검사**: reportSummary는 현재 리포트 마크다운 앞 100자. “위험도·핵심 해석”이 구조화되어 있지 않으면 Phase 3에서 파싱 또는 백엔드 필드 확장 필요.
- **반응형**: 큰 모달은 데스크톱 우선이되, 모바일에서도 사용 가능하도록 반응형 전제(기획 스킬 §0).

---

## 7. 단계별 완료 기준·체크리스트

### Phase 1 (core-designer)

- [ ] 상담일지 큰 모달 레이아웃이 문서/와이어프레임으로 정리됨.
- [ ] 상단 블록 순서(내담자 정보 → 중요 코멘트 → 심리검사) 및 중요 코멘트 시각적 구분이 명시됨.
- [ ] 코더가 구현할 수 있을 정도의 블록·토큰·반응형 요구가 포함됨.

### Phase 2 (core-coder)

- [ ] ConsultationLogModal이 큰 모달(size=large 또는 XL)로 열림.
- [ ] 상단에 내담자 정보 블록이 표시되며, `clients/with-stats`(또는 동의한 API) 연동 완료.
- [ ] 중요 코멘트 블록이 노출되며, 내담자 메모·매칭/일정 메모·이전 일지 특이사항 등 데이터 소스 연동됨.
- [ ] 심리검사 블록이 표시되며, `documents/by-client/{clientId}` 연동·링크·reportSummary 노출됨.
- [ ] UnifiedModal·B0KlA·디자인 토큰 준수.

### Phase 3 (core-coder)

- [ ] 심리검사 섹션에서 요약문·위험도·핵심 해석 등이 있으면 우선 노출되도록 구현됨.
- [ ] 필요 시 백엔드 DTO/API 확장이 반영됨.

### Phase 4 (core-debugger, 필요 시)

- [ ] 증상·재현 절차·확인 포인트가 문서화됨.
- [ ] core-coder용 수정 제안·체크리스트가 전달됨.

---

## 8. 실행 요청문 (서브에이전트 호출 순서)

다음 순서로 서브에이전트를 호출해 주세요.

1. **Phase 1 — core-designer**  
   위 §5 Phase 1의 “전달할 태스크 설명 초안” 전문을 프롬프트로 전달하여, 상담일지 큰 모달의 레이아웃·상단 내담자 정보·중요 코멘트·심리검사 섹션의 와이어프레임/스펙을 요청하세요.  
   산출물은 `docs/design-system/` 또는 `docs/consultation/`에 화면설계서로 저장하고, 본 기획서에 경로를 명시하세요.

2. **Phase 2 — core-coder**  
   Phase 1 산출물과 본 기획서 §2·§4·§5 Phase 2를 전달하여, ConsultationLogModal 수정(큰 모달 + 상단 세 블록 구현·API 연동)을 요청하세요.

3. **Phase 3 — core-coder**  
   심리검사 연동 강화(요약·위험도·핵심 해석 우선 노출, 필요 시 백엔드 확장)를 요청하세요.

4. **연동 이슈 발생 시 — core-debugger**  
   증상·재현 절차·로그 포인트를 전달하여 원인 분석 및 수정 제안을 요청한 뒤, 수정은 core-coder에 위임하세요.

---

## 9. 참고 코드·문서

| 구분 | 경로 |
|------|------|
| 현재 상담일지 모달 | `frontend/src/components/consultant/ConsultationLogModal.js` |
| 풀 페이지 상담일지 + 심리검사 | `frontend/src/components/consultant/ConsultationRecordScreen.js` |
| 스케줄 클릭 후 상담일지 오픈 | `frontend/src/components/consultant/EventModal.js`, `frontend/src/components/schedule/UnifiedScheduleComponent.js`, ScheduleDetailModal |
| 심리검사 API | `PsychAssessmentController.java` — `GET /api/v1/assessments/psych/documents/by-client/{clientId}` |
| 내담자 with-stats | `AdminController` — `GET /api/v1/admin/clients/with-stats/{id}`, `ClientStatsServiceImpl.getClientWithStats` |
| Client·User·매칭 notes | `Client.java`, `User.java`(memo, notes), `ConsultantClientMapping.java`(notes), `Schedule.java`(notes), `Consultation.java`(preparation_notes, consultantNotes) |
| 모달·디자인 | `UnifiedModal.js`(size: auto/small/medium/large/fullscreen), `/core-solution-unified-modal`, `unified-design-tokens.css`, `docs/design-system`, B0KlA |

---

## 10. 문서 저장 경로 제안

- **기획안**: `docs/consultation/CONSULTATION_LOG_LARGE_MODAL_PLAN.md` (본 문서)
- **화면설계서**(Phase 1 산출): `docs/design-system/SCREEN_SPEC_CONSULTATION_LOG_MODAL.md` 또는 `docs/consultation/CONSULTATION_LOG_MODAL_UI_SPEC.md`

회의에서 범위·단계·담당이 논의된 뒤, Phase 1 → 2 → 3 순으로 서브에이전트를 호출하면 됩니다.
