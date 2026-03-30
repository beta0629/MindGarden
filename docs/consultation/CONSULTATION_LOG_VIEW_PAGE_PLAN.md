# 상담일지 조회 전용 화면 기획서

## 1. 목표·범위

### 1.1 목표
- **상담일지 조회 전용 페이지**를 신규 구성한다.
- 매칭관리 페이지와 동일한 기본 레이아웃(AdminCommonLayout + ContentArea + ContentHeader + 본문)을 사용하며, **캘린더·목록·테이블 3가지 뷰**로 상담일지를 조회할 수 있고, **날짜/항목 클릭 시 기존 ConsultationLogModal로 상담일지 수정**이 가능해야 한다.

### 1.2 포함 범위
- 관리자(ADMIN)·상담사(CONSULTANT) 공통 진입 페이지(역할별 필터: 관리자 전체/상담사 본인만).
- 뷰 3종: **(A) 캘린더 뷰** (일자별), **(B) 목록(리스트) 뷰**, **(C) 테이블 뷰**.
- 캘린더: 상담 일자(sessionDate) 기준 표시, 일지 유무·완료/미완료 등 상태 구분 표시.
- 목록/테이블: 컬럼·정렬·필터, 행/항목 클릭 시 상담일지 수정 모달.
- 상담일지 수정: 기존 `ConsultationLogModal` 재사용, `recordId` 또는 `consultationId + sessionDate` 기반 로드 후 수정 모드.

### 1.3 제외 범위
- 상담일지 **신규 작성** 플로우는 이 페이지의 주 기능이 아님(스케줄/매칭 쪽에서 기존처럼 진입 가능). 필요 시 추후 “이 날짜에 일지 작성” 액션만 추가 검토.
- 상담일지 삭제·복원 등 부가 기능은 기획 범위 외(필요 시 별도 기획).

---

## 2. 사용자 역할별 기능

| 역할 | 진입 경로 | 조회 범위 | 필터 |
|------|-----------|-----------|------|
| **관리자(ADMIN)** | LNB 메뉴 → 상담일지 조회(신규 메뉴) | 테넌트 전체 상담일지 | 상담사·내담자·기간(선택) |
| **상담사(CONSULTANT)** | LNB 메뉴 → 상담일지 조회 | **본인(consultantId=자신)** 상담일지만 | 내담자·기간(선택) |

- 관리자: `GET /api/admin/consultation-records` (consultantId, clientId, page, size) 사용. consultantId 미지정 시 전체.
- 상담사: 동일 API를 **본인 consultantId로만** 호출하거나, 상담사 전용 API(`GET /api/consultant/{consultantId}/consultation-records`) 사용. 백엔드에서 본인 아닌 데이터 차단 필수.

---

## 3. 3가지 조회 형태 정의

### 3.1 (A) 캘린더 뷰 — 일자별
- **이름**: 캘린더 뷰 / 일자별 뷰
- **설명**: 세션 날짜(sessionDate) 기준으로 월/주 단위 캘린더에 상담일지가 있는 날을 표시. 날짜 셀 또는 이벤트 클릭 시 해당 일의 일지 목록 또는 단일 일지 수정 모달로 연결.
- **화면 구성**:
  - 상단: 뷰 전환 탭(캘린더 | 목록 | 테이블), 기간/상담사·내담자 필터(역할에 따라 본인만/전체).
  - 본문: FullCalendar 기반 월/주 뷰. 일자별로 “상담일지 N건” 또는 이벤트(내담자명·완료/미완료 배지) 표시.
- **데이터 소스**: 목록 API로 해당 월(또는 주) 구간 데이터 조회. **현재 Admin API에 startDate/endDate 없음** → Phase 1에서는 페이지네이션으로 넉넉히 조회 후 프론트에서 sessionDate로 필터링 가능. Phase 2에서 백엔드에 `startDate`, `endDate` 추가 시 해당 구간만 요청 권장.
- **상태 표시**: 일지 유무, `isSessionCompleted`(완료/미완료) 구분. 색상/아이콘으로 완료(녹색)·미완료(주황) 등 B0KlA 토큰 사용.
- **클릭 동작**: 날짜 클릭 → 해당 날짜 일지 목록(같은 날 여러 건일 수 있음)을 미니 리스트/팝오버로 보여주고, 항목 선택 시 ConsultationLogModal 오픈. 또는 날짜에 일지 1건만 있으면 바로 모달 오픈.

### 3.2 (B) 목록(리스트) 뷰
- **이름**: 목록 뷰 / 리스트 뷰
- **설명**: 카드형 또는 리스트형으로 상담일지 항목을 나열. 반응형에 유리하게 카드형 우선 검토.
- **화면 구성**:
  - 상단: 뷰 전환 탭, 필터(상담사·내담자·기간), 정렬(세션일자 최신순/과거순 등).
  - 본문: 카드 리스트. 카드당 세션일자, 내담자명, 상담사명, 회기, 완료여부, 요약(선택) 등.
- **데이터 소스**: `GET /api/admin/consultation-records` (또는 상담사용 API) page/size.
- **클릭 동작**: 카드(행) 클릭 → `ConsultationLogModal`을 **recordId**로 열어 수정 모드.

### 3.3 (C) 테이블 뷰
- **이름**: 테이블 뷰
- **설명**: 테이블 형태로 상담일지 목록 표시. 데스크톱 위주, 모바일에서는 가로 스크롤 또는 카드 전환 고려.
- **화면 구성**:
  - 상단: 뷰 전환 탭, 필터·정렬(목록 뷰와 동일).
  - 본문: 테이블. 컬럼 예: 세션일자, 회기, 내담자명, 상담사명, 완료여부, 요약(일부), 작성일 등.
- **데이터 소스**: 동일 목록 API.
- **클릭 동작**: 행 클릭 → `ConsultationLogModal`을 **recordId**로 열어 수정 모드.

---

## 4. 캘린더 뷰 상세

- **표시 단위**: 일자(날짜 셀). 한 날짜에 여러 건이 있으면 “N건” 또는 이벤트 리스트로 표시.
- **상태 표시**: 완료(isSessionCompleted=true) / 미완료(false). 디자인 토큰(`--mg-success-*`, `--mg-warning-*`) 사용.
- **클릭 시**: 해당 날짜의 일지 목록 → 항목 선택 시 모달; 1건이면 바로 모달.
- **캘린더 컴포넌트**: 프로젝트 내 `MappingCalendarView`(FullCalendar dayGrid), `ScheduleCalendarView` 등 참고. 상담일지 전용 이벤트 소스(events 배열)로 sessionDate 기반 이벤트 생성.

---

## 5. 목록/테이블 뷰 상세

- **공통 필터**: 상담사(관리자만), 내담자, 기간(시작일·종료일). 역할이 상담사면 상담사 필터 비노출(본인 고정).
- **정렬**: 세션일자 기준 최신순/과거순 기본. 필요 시 회기·작성일 정렬 추가.
- **목록 뷰 컬럼(카드 항목)**: 세션일자, 회기, 내담자명, 상담사명, 완료여부, 작성일(또는 수정일).
- **테이블 뷰 컬럼**: 세션일자, 회기, 내담자명, 상담사명, 완료여부, 요약(예: clientCondition 50자), 작성일.
- **클릭 시**: 항목/행 클릭 → `ConsultationLogModal`에 **recordId** 전달하여 수정 모드로 오픈.

---

## 6. 상담일지 수정 플로우

1. 사용자가 캘린더의 날짜/이벤트, 목록 카드, 테이블 행 중 하나를 클릭.
2. **전달 데이터**:
   - **recordId 있는 경우**(목록/테이블에서 선택한 일지): `recordId`만 전달.
   - **캘린더에서 날짜만 선택 후 항목 선택한 경우**: 해당 항목의 `recordId` 전달.
   - (대안) consultationId + sessionDate 조합으로 기존 스케줄 기반 API를 쓸 수도 있으나, **일지 조회 전용 페이지에서는 recordId 단건 조회가 단순함.**

3. **ConsultationLogModal 재사용 시 필요한 변경**:
   - **Option A**: `recordId` prop 추가. `recordId`가 있으면 `scheduleData` 없이 `GET /api/admin/consultation-records/{recordId}`(관리자) 또는 상담사용 단건 API로 조회 후, 응답에서 consultationId, clientId, sessionDate, sessionNumber 등으로 **가상 scheduleData**를 만들어 기존 loadData 로직에 넘기거나, 단건 응답으로 폼·client·psych 일괄 세팅.
   - **Option B**: 페이지에서 단건 조회 후 `ConsultationLogModal`에 `scheduleData` 형태로 넘김. (id=consultationId, clientId, sessionDate, sessionNumber, …) 기존 모달은 수정 없이 동작. 단, 관리자 페이지에서는 `/api/admin/consultation-records/{recordId}`로 조회한 뒤 해당 record에서 consultationId, clientId 등을 꺼내 scheduleData처럼 구성해야 함.
   - **권장**: Option A — 모달에 `recordId`(또는 `initialRecordId`)를 선택 인자로 추가하고, recordId가 있으면 단건 API로 로드 후 수정 모드로 폼 채우기. 저장 시 기존처럼 `PUT /api/v1/schedules/consultation-records/{recordId}` 또는 `PUT /api/admin/consultation-records/{recordId}`(역할에 따라) 호출.

4. **저장 후**: 모달 닫기, 목록/캘린더/테이블 데이터 갱신(해당 페이지/뷰 refetch).

---

## 7. API 사용 계획

| 용도 | API | 비고 |
|------|-----|------|
| 목록 조회(관리자) | `GET /api/admin/consultation-records?consultantId=&clientId=&page=&size=` | 현재 스펙. 기간 필터는 Phase 2에서 `startDate`, `endDate` 추가 권장 |
| 목록 조회(상담사) | `GET /api/consultant/{consultantId}/consultation-records` 또는 Admin API에 consultantId=본인 | 백엔드에서 본인 데이터만 반환 |
| 단건 조회(관리자) | `GET /api/admin/consultation-records/{recordId}` | 모달 로드 시 |
| 단건 조회(상담사) | `GET /api/consultant/{consultantId}/consultation-records/{recordId}` | 모달 로드 시 |
| 수정 | `PUT /api/admin/consultation-records/{recordId}` 또는 `PUT /api/v1/schedules/consultation-records/{recordId}` | 역할에 따라 엔드포인트 선택 |

- StandardizedApi 사용, tenantId·에러 처리 표준 준수.
- 캘린더용 월 단위 조회 효율화를 위해, Phase 2 이후 백엔드에 `startDate`, `endDate` 추가 시 프론트에서 해당 파라미터로 요청.

---

## 8. 라우트 제안

- **관리자**: `/admin/consultation-logs` (Admin 레이아웃 내)
- **상담사**: `/consultant/consultation-logs` 또는 동일 경로를 역할에 따라 “본인만”으로 제한

또는 **공통 경로** 하나로 두고 역할로 필터만 다르게: 예) `/admin/consultation-logs`, 상담사는 `/consultant/consultation-logs` (LNB 메뉴는 역할별로 노출).

- LNB 메뉴 구조·권한: `LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md` 참고하여 “상담일지 조회” 메뉴 추가.

---

## 9. Phase 구분

| Phase | 내용 | 담당 | 목표 |
|-------|------|------|------|
| **Phase 1** | 레이아웃 + 한 가지 뷰 | core-designer → core-coder | AdminCommonLayout + ContentArea + ContentHeader, 필터(상담사/내담자), **목록(리스트) 뷰**만 구현. 목록 클릭 시 모달(recordId) 연동까지. |
| **Phase 2** | 나머지 뷰 | core-coder | **캘린더 뷰**, **테이블 뷰** 추가. 뷰 전환 탭, 동일 데이터 소스로 3가지 뷰 표시. 캘린더는 월 기준 sessionDate 이벤트 표시, 클릭 시 모달. (필요 시 API에 startDate/endDate 추가는 core-coder·백엔드 작업) |
| **Phase 3** | 수정 연동·마무리 | core-coder | ConsultationLogModal의 recordId 기반 로드(또는 scheduleData 호환 객체 주입) 확정, 저장 후 목록/캘린더 refetch. 역할별 필터(관리자 전체/상담사 본인) 검증. LNB 메뉴 등록. |

---

## 10. 리스크·제약

- **멀티테넌트**: 모든 API·화면에서 tenantId 필수. 기존 Admin/Consultant API가 이미 테넌트 격리되어 있으면 유지.
- **기존 모달**: ConsultationLogModal이 현재 scheduleData·user.id(consultantId) 기준으로 `/api/v1/schedules/consultation-records?consultantId=&consultationId=` 호출. recordId만으로 열 때는 단건 API로 바꾸거나, 페이지에서 조회 후 scheduleData 형태로 넘겨야 함.
- **캘린더 데이터량**: 월 전체 일지를 한 번에 받지 않으면, 현재 API로는 page로 넉넉히 가져온 뒤 프론트에서 sessionDate 필터링. 나중에 startDate/endDate 지원 시 한 달만 요청하도록 변경 권장.

---

## 11. 단계별 완료 기준·체크리스트

### Phase 1
- [ ] AdminCommonLayout으로 감싼 페이지 컴포넌트 생성, title/검색 등 페이지별 설정 반영.
- [ ] ContentArea + ContentHeader(제목: 상담일지 조회) + 필터(상담사·내담자) + 목록(리스트) 블록 구성.
- [ ] 목록 데이터: GET /api/admin/consultation-records (또는 상담사용) 호출, 역할에 따라 consultantId 제한.
- [ ] 목록 항목 클릭 시 ConsultationLogModal 오픈. recordId 전달 방식(모달 수정 또는 페이지에서 scheduleData 구성) 중 하나 구현.
- [ ] 반응형: 목록은 카드형 등 모바일 대응.

### Phase 2
- [ ] 뷰 전환 탭(캘린더 | 목록 | 테이블) 추가.
- [ ] 캘린더 뷰: FullCalendar로 sessionDate 이벤트 표시, 완료/미완료 구분, 날짜/이벤트 클릭 시 모달 또는 일지 선택 후 모달.
- [ ] 테이블 뷰: 컬럼(세션일자, 회기, 내담자, 상담사, 완료여부, 요약 등), 행 클릭 시 모달.
- [ ] (선택) GET /api/admin/consultation-records에 startDate, endDate 파라미터 추가 후 캘린더에서 해당 월만 요청.

### Phase 3
- [ ] ConsultationLogModal이 recordId만으로 열릴 때 단건 조회 후 수정 모드로 동작하는지 확인.
- [ ] 저장 후 목록/캘린더/테이블 데이터 refetch.
- [ ] 관리자: 전체 상담사 필터. 상담사: 본인 일지만 노출. LNB에 “상담일지 조회” 메뉴 추가 및 라우트 연결.

---

## 12. 실행 위임 요청문

- **Phase 1 설계**: **core-designer** 호출. 기획서 경로: `docs/consultation/CONSULTATION_LOG_VIEW_PAGE_PLAN.md`. 전달문에 아래 포함.
  - 사용성: 관리자/상담사가 상담일지를 빠르게 찾고, 목록에서 클릭 한 번으로 수정 모달을 열 수 있게.
  - 정보 노출: 역할별로 본인/전체, 세션일자·내담자·상담사·완료여부 노출.
  - 레이아웃: 매칭관리와 동일하게 AdminCommonLayout + ContentArea + ContentHeader + 본문(필터 + 목록 블록). B0KlA·unified-design-tokens.css 참조.
- **Phase 1 구현**: **core-coder** 호출. “상담일지 조회 전용 페이지, 매칭관리와 동일 레이아웃, 목록 뷰 + 필터 + ConsultationLogModal recordId 연동. 참조: MappingManagementPage, ConsultationLogModal, Admin API 상담일지 목록/단건/수정.”
- **Phase 2 구현**: **core-coder** 호출. “캘린더 뷰·테이블 뷰 추가, 뷰 전환 탭, 동일 API 사용. MappingCalendarView·ScheduleCalendarView 참고.”
- **Phase 3 구현**: **core-coder** 호출. “ConsultationLogModal recordId 기반 로드 확정, 저장 후 refetch, 역할별 필터 및 LNB 메뉴 등록.”

---

## 13. 디자이너 전달 사항

- **참조 레이아웃**: `MappingManagement.js` + `MappingManagementPage.js` (AdminCommonLayout, ContentArea, ContentHeader, 필터·리스트 블록). 동일 구조로 “상담일지 조회” 페이지 블록 구성.
- **사용성**: (1) 3가지 뷰(캘린더/목록/테이블) 전환 탭으로 한 화면에서 전환 가능. (2) 자주 쓰는 동작: 기간·상담사(관리자)·내담자 필터 → 목록/캘린더에서 항목 클릭 → 모달에서 수정.
- **정보 노출**: 목록·테이블·캘린더에 세션일자, 내담자명, 상담사명, 완료여부 필수. 역할별로 관리자만 “상담사” 필터/컬럼 노출.
- **레이아웃**: 상단 ContentHeader(제목: 상담일지 조회), 그 아래 필터 영역, 뷰 전환 탭, 본문(캘린더 | 카드 리스트 | 테이블). 모달은 UnifiedModal·ConsultationLogModal 재사용.
- **색상·토큰**: `unified-design-tokens.css`, B0KlA 어드민. 완료/미완료는 `--mg-success-*`, `--mg-warning-*` 등.
- **반응형**: 목록은 카드형 우선, 테이블은 데스크톱에서만 또는 가로 스크롤. 캘린더는 기존 FullCalendar 반응형 유지.

---

## 14. 코더 전달 사항

- **레이아웃**: 신규 페이지는 반드시 **AdminCommonLayout**으로 감싼다. 본문은 children으로 넣고, title/loading 등만 페이지별 지정. 참조: `MappingManagement.js`, `MappingManagementPage.js`.
- **API**: StandardizedApi 사용. 목록 `GET /api/admin/consultation-records`, 단건 `GET /api/admin/consultation-records/{recordId}`, 수정 `PUT /api/admin/consultation-records/{recordId}`. 상담사는 consultantId=본인으로 제한하거나 상담사 전용 API 사용.
- **모달**: `ConsultationLogModal` 재사용. recordId로 열 때는 (1) 모달에 recordId prop 추가 후 단건 API로 로드해 폼 세팅, 또는 (2) 페이지에서 단건 조회 후 scheduleData 호환 객체로 전달. 저장 시 PUT 호출 후 목록/캘린더 refetch.
- **캘린더**: `MappingCalendarView`(FullCalendar dayGrid) 또는 `ScheduleCalendarView` 참고. events를 consultation records의 sessionDate 기반으로 구성, eventClick에서 recordId 전달해 모달 오픈.
- **테넌트**: tenantId는 API·백엔드에서 필수. 프론트는 세션/StandardizedApi 기준으로 전달.
- **경로**: 라우트 예 ` /admin/consultation-logs`, 상담사 ` /consultant/consultation-logs`. LNB 메뉴는 `LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md`에 맞춰 추가.
