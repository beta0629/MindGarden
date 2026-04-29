# 통합 스케줄 — 내담자 특이사항 UI 컴포넌트 리뷰

**작성일**: 2026-04-29  
**작성**: core-component-manager (코드 비수정, 제안·문서 전용)  
**근거 SSOT**: `docs/project-management/2026-04-28/INTEGRATED_SCHEDULE_CLIENT_NOTES_ORCHESTRATION.md` 2절(core-component-manager), 4절  
**참고 스킬**: `/.cursor/skills/core-solution-common-modules/SKILL.md`, `/.cursor/skills/core-solution-atomic-design/SKILL.md`

---

## 결론 한 줄

**1차는 `ScheduleClientNotesSection`을 스케줄(일정 상세) 맥락 전용 Organism으로 유지하는 것을 권고**하고, **동일 패턴을 다른 도메인과 즉시 공통 추출하지는 않는다** — 다만 빈 상태·로딩·삭제 확인은 공통 모듈로 치환할 **2차 개선 후보**로 두는 것이 비용 대비 효과가 크다.

---

## 1. 조사 대상 요약

### 1.1 `ScheduleClientNotesSection.js` 구조

| 영역 | 구현 요약 |
|------|-----------|
| **목록** | `notes` 배열을 `ul.mg-v2-list-unstyled` + `li` 카드형(`mg-v2-card mg-v2-card--flat`)으로 순회. 제목·유형·약속일·본문 표시. |
| **폼** | 하단 단일 폼: 공통코드 기반 `select`(유형), `input`(제목), `date`, `textarea`(내용). 등록 / 수정 시 동일 폼 재사용, `editingId`로 분기. |
| **로딩** | 전역 `loading`으로 목록 최초 로드·저장·삭제 공유. 목록이 비었을 때만 문구 `불러오는 중…` 표시. |
| **에러** | 목록/저장 실패 시 `console.error` + `notificationManager.error` (토스트). |
| **빈 상태** | 목록 0건이고 로딩 아닐 때 문단 한 줄 (`등록된 특이사항이 없습니다.`). |
| **앵커 없음** | `hasAnchor` false 시 섹션만 렌더하고 `SafeText` + `toDisplayString`으로 안내 문구. |
| **권한** | `RoleUtils`로 API 사용 여부·행별 수정/삭제 가능 여부(`canEditNote`) 분기. |

**API·공통 코드**

- `StandardizedApi.get/post/put/delete` + `CLIENT_SCHEDULE_NOTE_API` 상수 — **공통 API 룰 정합**.
- `getCommonCodes(SCHEDULE_CLIENT_NOTE_TYPE_GROUP)` — 오케스트레이션 P5(유형 라벨 공통코드)와 정합.

**버튼·표시**

- `MGButton` + `buildErpMgButtonClassName` / `ERP_MG_BUTTON_LOADING_TEXT` — ERP·스케줄 상세와 **동일 버튼 스타일 패턴**.
- 사용자 문자열 출력은 `SafeText` + `toDisplayString` — **표시 경계·React #130 방향과 정합** (옵션 라벨도 `toDisplayString`).

**아토믹 관점**

- 실제 위치는 `components/schedule/` — 스킬 권장의 `molecules/`·`organisms/` 폴더와는 불일치하나, **도메인(스케줄) 응집** 측면에서는 수용 가능. 2차로 `organisms/schedule/` 등으로 이동할지는 팀 규칙에 따름.

### 1.2 `ScheduleDetailModal.js`와의 결합

| 항목 | 내용 |
|------|------|
| **결합 방식** | 메인 본문에서 `activeDetailTab` / `effectiveTab`으로 **「상세 | 특이사항」탭** 분기. `effectiveTab === 'notes'`일 때만 `<ScheduleClientNotesSection scheduleData={displayData} user={user} />` 렌더. |
| **휴가·클라이언트** | `showNotesTab = !isVacationEvent() && (ADMIN \|\| STAFF)` — 휴가 시 탭 미노출로 오케스트레이션 P2와 정합. |
| **`adminNote`와 분리** | `adminNote`는 **별도 `UnifiedModal`(예약 확정 확인)** 내 `textarea` + `apiPut` confirm 바디 전용. 카피는 「입금 확인」「관리자 메모」. 특이사항 섹션 상단에 **「입금 확인용 메모와 별도」** 문구로 **의미·UI·API 모두 분리**됨 — 오케스트레이션 2절·8절과 **일치**. |
| **레이아웃** | 특이사항은 탭 전환으로 상세 본문과 **물리적으로 분리**; `adminNote`는 확정 플로우 서브모달에만 존재해 **혼동 가능성 낮음**. |

**모달 파일 레벨 주의(섹션 외)**

- 취소·확정·상태 변경 등은 여전히 `apiPut` 등 — 오케스트레이션의 「신규 노트만 StandardizedApi」 범위와는 별개. **특이사항 섹션 자체는 표준 준수**, **모달 전체의 API 일원화**는 별 이슈.

---

## 2. 중복·유사 컴포넌트 표

| 경로 | 유사점 | 차이 | 재사용 난이도 |
|------|--------|------|----------------|
| `frontend/src/components/schedule/ScheduleClientNotesSection.js` | (기준) 목록 + 인라인 폼 CRUD, 권한 분기, 토스트 | — | — |
| `frontend/src/components/schedule/ScheduleDetailModal.js` | 모달 내 섹션·폼·`MGButton`·`SafeText`/`toDisplayString` | 단일 행 `adminNote` + 확정 API; 다건 CRUD 아님 | 낮음 — 이미 부모-자식으로 역할 분리됨 |
| `frontend/src/components/consultant/ConsultationLogModal.js` | 내담자 **메모** 영역, `StandardizedApi.put`로 노트 저장, 모달 맥락 | **단일 텍스트 블롭**(context-profile notes); 목록·유형·약속일 없음; `importantComments`는 읽기 전용 집계 | 중간 — 데이터 모델이 다름. UI 블록만 공통화하면 과추상화 위험 |
| `frontend/src/components/admin/organisms/SystemNotificationListBlock.js` (+ `molecules/SystemNotificationFormModal.js`) | 목록 로드·필터·편집 모달·저장 플로우 | 공지 도메인·테이블형·모달 폼 분리 구조 | 중간~높음 — 패턴은 비슷하나 도메인·레이아웃 이질 |
| `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` | `UnifiedModal` + `textarea` 메모 필드 | 내담자 마스터 폼의 **한 필드**; CRUD는 클라이언트 단위 일괄 저장 | 높음 — 특이사항 다건 타임라인과 직접 공유 어려움 |
| `frontend/src/components/erp/AdminApprovalDashboard.js` (및 `SuperAdminApprovalDashboard.js`) | 코멘트 `textarea` + 승인/거절 버튼 | **단건 입력**·URL 쿼리 전달; 목록이 아님 | 높음 |
| `frontend/src/components/admin/ClientComprehensiveManagement/ClientMappingTab.js` | 매핑 카드에 `notes` 표시 | **읽기 위주** 카드; 인라인 CRUD 없음 | 높음 |

---

## 3. 추출 후보 (2차 배치 시 이득)

| 가칭 | 계층(안) | 이득 |
|------|-----------|------|
| **`AdminCrudCardList`** (또는 `MgNoteCardList`) | **Molecule** | `ul` + 카드형 행 + 하단 `MGButton` 그룹(수정/삭제) 레이아웃을 여러 화면에서 재사용. **도메인 필드는 slot/render props**로 두면 스케줄·공지 등에 과도한 결합 방지. |
| **`ModalTabBar`** | **Molecule** | `ScheduleDetailModal`의 `MGButton` 기반 탭 UI가 다른 B0KlA 모달에서 반복되면 추출 가치. 현재는 **한 파일 집중**이라 1차 추출 급하지 않음. |
| **`ScheduleClientNotesSection` (현 이름 유지)** | **Organism** | 스케줄 앵커(`scheduleId`/`clientId`/`mappingId`) + `CLIENT_SCHEDULE_NOTE_API` + 공통코드 그룹이 **한곳에 캡슐화**된 상태 유지가 SSOT 상 자연스러움. |

**즉시 공통 Organism으로 끌어올리기 어려운 이유**: 앵커 키 조합·권한 규칙·엔드포인트가 **스케줄·내담자 노트 전용**이며, `ConsultationLogModal`의 메모는 **다른 API·단일 필드** 모델이다.

---

## 4. 공통 모듈 정합 체크리스트 (현 구현 대비)

| 모듈 / 관행 | 상태 | 비고 |
|-------------|------|------|
| **UnifiedModal** | **OK** | 특이사항은 부모 `ScheduleDetailModal`이 쉘 담당. 중첩 전용 모달 추가 없음 — 오케스트레이션 4절과 정합. |
| **MGButton** + ERP 버튼 클래스 빌더 | **OK** | 상세 모달·특이사항 섹션과 동일 패턴. |
| **safeDisplay (`toDisplayString`) + SafeText** | **OK** | 목록·안내·옵션 라벨에 적용. |
| **StandardizedApi (특이사항 CRUD)** | **OK** | |
| **ContentArea / ContentHeader / ContentSection** | **OK (모달 맥락 예외)** | 페이지 본문 표준이나, 본 기능은 **모달 확장**이 SSOT — 모달 내부는 `mg-v2-ad-modal__section` 패턴으로 충분. |
| **EmptyState** | **주의** | 공통 가이드상 빈 목록은 `EmptyState` 권장. 현재는 문단 한 줄로 처리 — **시각·접근성 일관성**을 위해 2차 치환 검토. |
| **UnifiedLoading** | **주의** | 초기 로드가 텍스트만 표시. 전역 `loading`이 폼·목록과 겹칠 때 UX는 허용 가능하나, **가이드 정렬**을 원하면 스켈레톤/스피너 공통화 검토. |
| **ConfirmModal / UnifiedModal confirm** | **주의** | 삭제 시 `window.confirm` 사용 — 프로젝트 다른 CRUD가 `UnifiedModal` 확인 패턴을 쓰면 **일관성** 측면에서 정리 여지. |
| **BadgeSelect / CustomSelect (유형)** | **선택** | 유형 옵션이 소수·고정에 가깝다면 BadgeSelect 검토 가능. 현재는 공통코드 기반 `select`로 **확장성** 확보됨 — 디자이너 합의 후 결정. |
| **CardContainer / CardActionGroup** | **선택** | 리스트 카드가 인라인 스타일 + 클래스 혼용. 아토믹 스킬상 **CardContainer·CardActionGroup** 정렬 시 유지보수 이득. |

---

## 5. core-coder에게 전달할 권고 (최대 5개)

1. **1차 범위**: `ScheduleClientNotesSection`을 **스케줄 도메인 Organism**으로 두고, 다른 화면과의 **강제 공통화는 보류** — 대신 `EmptyState`·삭제 확인(`UnifiedModal` 계열)만 틈날 때 정리하면 공통 모듈 가이드와의 괴리가 줄어든다.  
2. **`ScheduleDetailModal`의 레거시 `apiPut`**: 특이사항과 무관하나, 오케스트레이션의 「스케줄 도메인 내 ajax 혼용 지양」을 장기적으로 맞출 경우 **별 태스크**로 `StandardizedApi` 이관 우선순위를 정한다.  
3. **폴더 정책**: 팀이 `organisms/` 강제라면 `ScheduleClientNotesSection`만 **`components/organisms/schedule/`** 등으로 이동하고 import 경로만 정리하는 **기계적 이동**을 검토(동작 변경 없음).  
4. **`window.confirm` → 확인 모달**: 접근성·스타일 일관성을 위해 기존 `ScheduleDetailModal`의 `UnifiedModal` confirm 패턴과 맞추는 것을 권장.  
5. **문서·카피**: `adminNote`와 특이사항의 **용어 분리**는 이미 양호 — 향후 `ConsultationLogModal`의 「일정 메모」/`specialConsiderations` 안내와 **제품 용어집**에서 한 번에 정리하면 사용자 혼동을 더 줄일 수 있다.

---

*본 문서는 컴포넌트 관리 전용 산출물이며, 코드 변경은 core-coder 위임·검증은 core-tester 게이트를 따른다.*
