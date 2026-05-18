# Admin Mobile Phase 2 — 일정 등록 및 사용자 추가 UI/UX 스펙 (Design Handoff)

**작성자**: core-designer  
**기준 기획 문서**: `ADMIN_MOBILE_SCHEDULE_REGISTER_ORCHESTRATION.md`  
**목표**: 어드민 모바일 앱 내 일정 등록 4스텝 및 사용자(내담자/상담사/스태프) 추가 플로우의 화면 설계와 디자인 스펙 정의  
**비범위**: FullCalendar DnD, ERP 결제 모달 UI

---

## 1. 개요 및 배경
어드민 및 스태프가 모바일 앱을 통해 현장 및 이동 중에도 웹(`ScheduleModal`)과 동일한 수준으로 상담 일정을 등록하고 관리할 수 있도록 모바일 친화적인 스텝 폼 UI를 제공합니다. 또한 일정 등록 중 필요한 경우 사용자를 즉시 추가할 수 있도록 인라인 생성 및 FAB(Floating Action Button) 확장을 설계합니다.

---

## 2. 권한 기반 노출 (ADMIN vs STAFF)

화면 및 컴포넌트 노출은 사용자의 역할(Role)에 따라 동적으로 제어됩니다.

- **STAFF (스태프)**
  - 하단 탭 내 **검수 탭 숨김** (운영 중심 메뉴 구성).
  - 일정 등록 내 **가예약 토글 노출 및 사용 가능**.
  - **상담사 등록**: `CONSULTANT_MANAGE` 권한 보유 시에만 「상담사 추가」 버튼 및 스텝 인라인 노출.
  - **스태프 등록**: 일절 노출되지 않음.
- **ADMIN (최고 관리자)**
  - 모든 탭, 버튼, 토글 노출 (내담자/상담사/스태프 등록 모두 활성화).

---

## 3. 세부 UI/UX 스펙 및 와이어프레임

### 3.1 스케줄 라이트 목록 (`schedule.tsx`) — 일정 등록 진입
기존 오늘 일정 조회 화면에 일정 등록 진입점(FAB)을 추가합니다.

- **레이아웃**:
  - 상단: 날짜 이동 (◀ 오늘 날짜 ▶)
  - 본문: 플래시리스트 (FlashList) 기반 일정 카드
  - 하단 우측: 플로팅 액션 버튼 (FAB)
- **와이어프레임**:
  ```text
  [ AppTopBar: 일정 ]
  -----------------------------------
  [ < ]   2026년 5월 18일 (월)   [ > ]
  -----------------------------------
  [ Card: 10:00 - 11:00 김상담 - 이내담 ]
  [ Card: 13:00 - 14:00 김상담 - 박내담 ]
  ...

                               [ + ]  <-- FAB (일정 등록)
  ```
- **상호작용**: FAB 탭 시 `schedule/create` 화면(Stack)으로 이동.

### 3.2 일정 등록 스텝 폼 (`schedule/create.tsx`)
총 4단계로 구성된 모바일 폼 스텝입니다. 상단에 진행 상태를 보여주는 스텝 인디케이터를 고정합니다.

#### 공통 헤더 및 스텝 인디케이터
- **레이아웃**:
  - AppTopBar: `[X(취소)] 일정 등록`
  - 스텝 인디케이터: 1/4 형태의 프로그레스 바 또는 숫자 인디케이터
- **컴포넌트**: `ContentHeader` (앱 내 헤더 컴포넌트), `ProgressBar` 또는 `StepIndicator` (Atom)

#### Step 1: 상담사 선택
- **와이어프레임**:
  ```text
  [스텝 인디케이터: 1/4 상담사 선택]
  [ SearchInput: 이름 또는 연락처 검색 ]
  -----------------------------------
  [ List Item: 김상담 (활성) ]
  [ List Item: 이비활 (비활성) ]
  ...
  -----------------------------------
  [ + 상담사 신규 등록 ] <-- 링크 텍스트 (권한 시 노출)
  ```
- **상호작용**:
  - 리스트 아이템 탭 시 선택되며 Step 2로 자동 전환.
  - 신규 등록 링크 탭 시 `create-consultant` 화면으로 이동 (생성 후 Step 1로 돌아와 선택된 상태로 유지).

#### Step 2: 내담자 선택
- **와이어프레임**:
  ```text
  [스텝 인디케이터: 2/4 내담자 선택]
  [ SearchInput: 이름 또는 연락처 검색 ]
  -----------------------------------
  [ List Item: 박내담 ]
  [ List Item: 최내담 ]
  ...
  -----------------------------------
  [ + 내담자 신규 등록 ] <-- 링크 텍스트
  ```

#### Step 3: 날짜 및 시간 선택
- **와이어프레임**:
  ```text
  [스텝 인디케이터: 3/4 날짜/시간]
  [ DatePicker: 2026년 5월 19일 ]
  -----------------------------------
  시작 시간
  [ TimePicker: 오후 2:00 ]
  
  종료 시간
  [ TimePicker: 오후 3:00 ] (시작 시간 기반 자동 세팅, 수정 가능)
  -----------------------------------
  [이전]                 [다음]
  ```
- **비고**: 매칭 카드에서 "일정 잡기" 탭 시 Step 3부터 시작 (사전 데이터 주입).

#### Step 4: 세부 정보 및 확정
- **와이어프레임**:
  ```text
  [스텝 인디케이터: 4/4 세부 입력]
  
  [ Label: 상담 유형 ]
  [ Dropdown/Picker: 개별 상담 ]
  
  [ Label: 상담 시간(분) ]
  [ Input: 60분 ]
  
  [ Label: 제목 (선택) ]
  [ Input: 김상담 - 박내담 ]
  
  [ Label: 메모 (선택) ]
  [ TextArea: ]
  
  -----------------------------------
  가예약 (보증금 결제 전) [ Toggle Switch ]
  -----------------------------------
  [이전]                 [등록 완료]
  ```
- **가예약 토글**: ADMIN 및 STAFF 모두 노출 (body의 `tentativeBeforeDeposit` 매핑).

### 3.3 사용자 추가 화면 (`users.tsx` FAB 확장 & `users/create-*`)
사용자 탭의 FAB를 확장형으로 디자인하거나, Action Sheet를 통해 3가지 생성 옵션을 제공합니다.

- **FAB 탭 시 Action Sheet (`UnifiedModal` 활용)**:
  - 내담자 추가 (`create-client.tsx`)
  - 상담사 추가 (`create-consultant.tsx` - STAFF의 경우 권한 체크)
  - 스태프 추가 (`create-staff.tsx` - ADMIN 전용)

- **생성 폼 와이어프레임 (예: 내담자 생성 `create-client.tsx`)**:
  ```text
  [ < 뒤로 ]   내담자 추가
  -----------------------------------
  [ Label: 이름 * ]
  [ Input: 홍길동 ]
  
  [ Label: 이메일 또는 연락처 * ]
  [ Input: 010-0000-0000 ]
  
  [ Label: 비밀번호 (선택) ]
  [ Input: ******** ]
  -----------------------------------
                         [ 등록 ]
  ```
- **상호작용**: 등록 버튼 탭 시 저장소로 POST 요청. 이메일 입력 필드는 `onBlur` 시 중복 체크(`duplicate-check/email`) 후 에러 메시지 렌더링.

### 3.4 상태 및 예외 처리
- **로딩**: 버튼 내 Spinner 표시 (`isLoading` 상태) 및 오버레이 차단.
- **에러**: Toast 메시지 또는 `UnifiedModal`로 안내 (예: "과거 날짜에는 일정을 등록할 수 없습니다.").
- **빈 상태 (Empty State)**: 검색 결과가 없을 경우 기존 `EmptyState` 컴포넌트를 재사용하여 "검색 결과가 없습니다. 신규 등록하시겠습니까?" 액션 제공.
- **취소/뒤로 가기**: 모달 닫기 시 "작성 중인 내용이 사라집니다. 취소하시겠습니까?" 경고 모달 노출 (선택).

---

## 4. 토큰 및 컴포넌트 매핑 (Atomic 계층)

기존 `expo-app/src/theme/tokens.ts` (또는 `mindgarden-design-system.pen`의 React Native 매핑 변수)를 재사용합니다.

### Design Tokens
- **Primary Color**: `tokens.colors.primary.main` (#3D5246) - FAB, 주 버튼, 활성 스텝 색상
- **Background**: `tokens.colors.background.default` (#FAF9F7) - 화면 배경
- **Surface**: `tokens.colors.background.paper` (#F5F3EF) - 입력 폼 배경, 카드 배경
- **Text**: `tokens.colors.text.primary` (#2C2C2C), `tokens.colors.text.secondary` (#5C6B61)
- **Border**: `tokens.colors.border.default` (#D4CFC8)
- **Spacing**: `tokens.spacing[4]` (16px), `tokens.spacing[6]` (24px)
- **Radius**: `tokens.radius.md` (8px), `tokens.radius.lg` (12px)

### Atomic Components
- **Atoms**: `Button`, `IconButton`, `TextInput`, `SearchInput`, `Toggle`, `ProgressBar`, `Typography`
- **Molecules**: `FormField` (Label + Input + Error), `ListItem` (Avatar/Icon + Text), `EmptyState`
- **Organisms**: `StepFormContainer`, `ConsultantPicker`, `ClientPicker`, `TimeSlotSelector`, `UnifiedModal` (예외/확인 메시지)
- **Templates**: `ScreenLayout` (AppTopBar + Content Scroll + Bottom Fixed Action)

---

## 5. 전달 체크리스트 (For core-coder & core-publisher)

- [ ] **레이아웃**: `schedule.tsx`에 FAB를 추가하고 `schedule/create.tsx` 스택 라우트를 구성했는가?
- [ ] **모달 표준**: 확인 및 경고성 다이얼로그는 반드시 `UnifiedModal`을 재사용했는가?
- [ ] **권한 렌더링**: `AdminRoleGate` 또는 권한 체크 유틸을 사용하여 STAFF의 경우 스태프 추가 및 권한 없는 상담사 추가 UI를 숨김 처리했는가?
- [ ] **스텝 폼 UI**: 4단계 스텝 이동 시 상단 인디케이터 갱신 및 이전/다음(또는 선택 시 즉시 이동) 플로우를 반영했는가?
- [ ] **토큰 사용**: 하드코딩된 `#hex` 색상 대신 `tokens.ts`의 변수를 사용했는가?
- [ ] **오류 메시지**: 이메일 중복 및 날짜/시간 예외 등 API 검증 실패 시 사용자 친화적인 메시지(`UnifiedModal` 또는 Toast)를 표시했는가?
- [ ] **인라인 사용자 등록**: `create-client` 완료 시 `clientId`를 반환받아 기존 폼(Step 2)에 즉시 매핑(선택 상태) 되도록 연동했는가?
- [ ] **표시 경계 적용**: `toDisplayString` 등 `COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md` 기준을 따라 데이터를 표시했는가?