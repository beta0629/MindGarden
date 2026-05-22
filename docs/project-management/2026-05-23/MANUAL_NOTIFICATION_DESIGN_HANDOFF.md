# 수동 알림 발송 (Manual Notification) 화면설계서 및 디자인 핸드오프

## 1. 화면 구조

### 페이지 레이아웃
- **좌측 사이드바**: 기존 어드민 레이아웃 유지 (약 260px, 다크 테마).
- **상단 바**: 배경 `var(--mg-v2-background-surface)`, 브레드크럼 (`홈 > 시스템 도구 > 수동 알림 발송`), 페이지 제목, 우측 시스템 액션 버튼 영역.
- **본문 영역**: 패딩 `var(--mg-spacing-24)` (모바일/태블릿 시 `16px`).
- **섹션 구성**:
  1. 수동 발송 폼 영역 (상단)
  2. 배치 히스토리 리스트 영역 (하단)

### 그리드 및 스페이싱
- 전체 컨테이너 패딩: `var(--mg-spacing-24)` (데스크톱), `var(--mg-spacing-16)` (모바일)
- 섹션 간 간격 (Row Gap): `var(--mg-spacing-32)`
- 컴포넌트 내부 간격: `var(--mg-spacing-16)`, 폼 필드 간격 `var(--mg-spacing-24)`

### 반응형 (Responsive)
- **데스크톱 (≥1024px)**: 2단 컬럼 가능 (좌측 폼, 우측 히스토리 또는 상/하 1단 배치) -> MVP는 상하 1단 배치 (폼 상단, 히스토리 하단) 권장.
- **태블릿/모바일 (<1024px)**: 1단 배치, 컨테이너 패딩 축소, 폼 컨트롤 width 100% 확장. 가독성 확보.

## 2. 발송 폼 UX (핵심 다중 선택)

### 2.1 채널 토글
- 기존 테스트 발송 UX 차용. Segmented Control 디자인.
- **옵션**: SMS / 카카오 알림톡

### 2.2 수신자 선택 — 다중
- **권장 컴포넌트**: `BadgeSelect` (`multiple={true}`)
- **검색 입력**: 이름/이메일/전화 부분 일치 (debounce 300ms).
- **결과 리스트**: 
  - 표시: "이름 (역할) - 마스킹된 전화번호"
  - `hasPhone`이 false인 유저 선택 불가 (disable).
- **선택된 칩(Chip) 영역**:
  - 선택된 N명 칩으로 나열.
  - 각 칩에 ✕ 아이콘 제공하여 개별 제거 가능.
- **상한 제어 (Max 50명)**:
  - 51명째 선택 시도 시 인라인 경고 노출: `"최대 50명까지 선택할 수 있습니다"` (빨간색 텍스트, `var(--mg-color-error)`).
- **전체 선택 / 전체 해제 버튼**:
  - 가시된 검색 결과(visible)에 한정하여 동작. (오발송 방지를 위해 미선택 상태를 권장하나, 편의를 위해 제공)
- **Role 필터**: (선택 옵션) 콤보박스로 ADMIN/CONSULTANT/CLIENT 등 1차 필터링 가능.

### 2.3 발송 사유 — 필수 + 강화
- 기존 `reason` 필드 필수 입력.
- **안내 텍스트**: `"발송 사유를 명확히 기재해 주세요 (감사로그에 N개 기록)"` (`var(--mg-color-text-secondary)`).
- **권장 길이 경고**: 30자 미만 입력 시 인라인 Warning 노출 ("사유를 30자 이상 상세하게 적는 것을 권장합니다.") -> hard limit 아님, 발송은 가능.

### 2.4 알림톡 템플릿 (다중 발송 시 동일 템플릿 + 동일 변수)
- 기존 테스트 발송(라이브/공통코드 토글 + 변수 입력 + 본문 미리보기) 100% 차용.
- MVP 제약: 변수는 모든 수신자에게 동일한 값으로 매핑. (사용자별 변수 치환은 P2)
- **가드**: 매핑 없음 뱃지 표시, 템플릿 미선택 시 발송 불가.

### 2.5 발송 버튼 — 2-step 모달
- **5명 이하**: 즉시 발송. 클릭 시 기존 테스트 발송과 동일한 UX (로딩 -> 결과).
- **6명 이상**: `UnifiedModal` 2-step 확인 로직:
  - **1단계 (모달 내용)**: "선택된 N명에게 [채널] 발송을 진행합니다.\n사유: [사유 요약]" -> 미리보기.
  - **2단계 (최종 확인)**: "정말 발송하시겠습니까? (취소 불가)" -> 체크박스 명시적 체크 후 '확인' 버튼 활성화 혹은 5초 카운트다운 후 활성화. (MVP: 체크박스 권장)

### 2.6 rate-limit 표시
- **위치**: 폼 상단 또는 하단 발송 버튼 근처.
- **표시 내용**: "이번 시간대 잔여: X건" (Badge 또는 텍스트).
- **제어**: 선택된 수신자 수(N명) > 잔여 횟수(X건)일 경우,
  - 발송 버튼 disabled.
  - 경고 메시지 노출: `"잔여 X건. N명 발송 불가. 잠시 후 다시 시도해 주세요."` (`var(--mg-color-error)`).

## 3. 결과 집계 UI

- **표시 시점**: 발송 완료 직후 (로딩 종료 후).
- **표시 방식**: `UnifiedModal` 내 카드 뷰 또는 페이지 내 상단 토스트 알림 + 결과 카드.
- **내용**:
  - 성공 / 실패 카운트: `예: "45건 성공 / 5건 실패"`
  - **실패 행 상세**: 실패한 경우 리스트 노출 [수신자 이름 / 마스킹 전화 / 실패 사유].
  - **재시도 버튼**: "실패 N건만 재시도" 버튼 제공. MVP에서는 화면에 표시된 실패 건만 대상으로 함.
- **감사 추적**: 모달 하단에 `배치 ID (batch_id)` 회색 텍스트로 명시.

## 4. 배치 히스토리

- **위치**: 발송 폼 하단 영역. 단건(테스트) 발송과 분리된 별도 배치 뷰 제공 권장.
- **그룹화**: `batch_id` 기준 그룹화 카드 (1행 = 1배치).
- **카드 정보**: 
  - 발송 일시, 채널, 템플릿(알림톡의 경우), 사유 요약, 총 발송 인원 수, 성공/실패 수.
- **상세 펼치기 (Accordion)**:
  - 행 클릭 시 하위로 수신자별 상세 이력 노출.
  - 리스트: [이름 / 연락처 / 솔라피 ID / 상태(성공/실패) / 에러 메시지].
  - `batch_id` 우측 상단 캡션으로 명시.

## 5. 디자인 토큰 매핑

모든 UI 요소는 `frontend/src/styles/unified-design-tokens.css`의 토큰을 사용합니다. 하드코딩된 색상 및 인라인 스타일은 금지됩니다. (`docs/standards/DESIGN_TOKEN_GAP_*` 원칙 준수)

- **배경색**: 
  - 메인 배경: `var(--mg-color-background-primary)` (`#FAF9F7`)
  - 섹션 블록(카드) 배경: `var(--mg-color-background-surface)` (`#F5F3EF` 혹은 `#FFFFFF`)
- **텍스트 색상**:
  - 본문/제목: `var(--mg-color-text-primary)` (`#2C2C2C`)
  - 보조/안내 텍스트: `var(--mg-color-text-secondary)` (`#5C6B61`)
  - 에러/경고: `var(--mg-color-error)`
- **주조색 (Brand / Primary)**:
  - 버튼, 포커스, 액센트 바: `var(--mg-color-brand-primary)` (`#3D5246`)
- **테두리 (Border)**:
  - 인풋, 카드 테두리: `var(--mg-color-border-primary)` (`#D4CFC8`)
- **라운드 (Border Radius)**:
  - 버튼: `var(--mg-radius-md)` (보통 8px~10px)
  - 섹션 블록/카드: `var(--mg-radius-lg)` (보통 16px)
- **스페이싱 (Spacing)**:
  - `var(--mg-spacing-8)`, `var(--mg-spacing-16)`, `var(--mg-spacing-24)`

*토큰 미존재 시 SSOT 토큰 추가 제안*: 필요 시 `--mg-v2-*` 계열의 어드민 전용 토큰을 추가 확장할 것을 제안합니다.

## 6. 권한·접근·경고 카피

- **접근 권한**: 어드민(ADMIN), 스태프(STAFF) 권한 보유자만 접근 가능.
- **폼 상단 고정 경고 (WarningBanner)**:
  > "이 도구는 실제 사용자에게 발송됩니다. 발송 사유는 감사로그에 영구 기록됩니다."
- **링크 제공**:
  > "테스트 목적이라면 [알림 테스트 발송](/admin/test-notification)을 사용하세요." (링크 컬러: `var(--mg-color-link)`)

## 7. i18n 키 목록

신규 작성될 `frontend/src/locales/ko/admin.json` 내 섹션:

```json
"manualNotification": {
  "title": "수동 알림 발송",
  "warningActualSend": "이 도구는 실제 사용자에게 발송됩니다. 발송 사유는 감사로그에 영구 기록됩니다.",
  "testLinkText": "테스트 목적이라면 알림 테스트 발송을 사용하세요.",
  "channelSelect": "발송 채널",
  "recipientSelect": "수신자 선택 (최대 50명)",
  "recipientMaxError": "최대 50명까지 선택할 수 있습니다.",
  "reasonLabel": "발송 사유 (필수)",
  "reasonPlaceholder": "발송 사유를 명확히 기재해 주세요 (감사로그에 N개 기록)",
  "reasonLengthWarning": "사유를 30자 이상 상세하게 적는 것을 권장합니다.",
  "rateLimitPrefix": "이번 시간대 잔여",
  "rateLimitError": "잔여 {{limit}}건. {{count}}명 발송 불가. 잠시 후 다시 시도해 주세요.",
  "confirmModalTitle": "발송 최종 확인",
  "confirmModalBody": "선택된 {{count}}명에게 {{channel}} 발송을 진행합니다.\\n사유: {{reason}}",
  "confirmCheckbox": "정말 발송하시겠습니까? (취소 불가)",
  "resultSuccess": "{{count}}건 성공",
  "resultFailed": "{{count}}건 실패",
  "retryFailed": "실패 {{count}}건만 재시도",
  "historyBatchId": "배치 ID",
  "historyNoData": "발송 이력이 없습니다."
}
```

## 8. 컴포넌트 분해 (아토믹)

- **Atoms**: 
  - `SearchInput` (수신자 검색)
  - `Chip` (선택된 수신자 표시, ✕ 버튼 포함)
  - `Counter` (선택된 인원 / 50 텍스트)
  - `WarningBanner` (상단 고정 경고 문구)
- **Molecules**: 
  - `RecipientPicker` (검색 인풋 + 결과 리스트 + 선택된 Chip 컨테이너)
  - `VariableInputGrid` (기존 재사용, 알림톡 변수 입력)
  - `RateLimitDisplay` (잔여 횟수 및 경고 표시)
- **Organisms**: 
  - `ManualNotificationForm` (발송 폼 전체)
  - `BatchResultModal` (발송 직후 결과 요약 및 재시도)
  - `BatchHistoryGroupCard` (히스토리 행 단위 그룹 + 아코디언 상세)
- **Templates**: 
  - `AdminManualNotificationPage` (페이지 최상위 템플릿, 헤더/폼/히스토리 레이아웃 조합)

## 9. core-coder 핸드오프 체크리스트

코더는 구현 시 다음 사항을 확인해야 합니다.

- [ ] **변경 파일 경로 예측**:
  - `frontend/src/components/admin/system/AdminManualNotificationPage.js` (신설)
  - `frontend/src/components/admin/system/ManualNotificationForm.js` (신설)
  - `frontend/src/components/admin/system/BatchHistoryGroupCard.js` (신설)
  - `frontend/src/locales/ko/admin.json` (i18n 업데이트)
- [ ] **백엔드 API 호출 스펙**:
  - `POST /api/v1/admin/notification/manual/batch` (Payload: 채널, 템플릿ID, 수신자 ID 배열, 사유, 변수Map / 응답: batch_id, 성공/실패 목록)
  - `GET /api/v1/admin/notification/manual/history` (batch_id 기준 페이징 조회)
  - `GET /api/v1/admin/notification/rate-limit` (현재 남은 횟수 조회)
- [ ] **검증 시나리오 7건** (P1.4 core-tester 게이트 인풋):
  1. 수신자 검색 시 이름, 이메일 부분 일치 결과 노출 확인
  2. 51명째 선택 시도시 인라인 경고 노출 및 선택 방지 확인
  3. 사유 30자 미만 입력 시 경고 노출 확인 (단, 발송은 되어야 함)
  4. 5명 선택 후 발송 시 모달 없이 즉시 발송되는지 확인
  5. 6명 이상 선택 후 발송 시 2-step `UnifiedModal` 노출 확인
  6. Rate-limit 잔여 횟수 초과 시 발송 버튼 비활성화 확인
  7. 배치 발송 후 히스토리 카드에 `batch_id` 그룹핑 노출 및 상세 아코디언 확인

## 10. 운영 게이트 정합

- [ ] **하드코딩 0건, 인라인 스타일 0건**: 모든 CSS는 `unified-design-tokens.css` 또는 `*.module.css` (또는 `styled-components`)를 통한 토큰 매핑 사용.
- [ ] **UnifiedModal 사용**: 신규 모달 구현 금지, 반드시 `components/common/UnifiedModal` 공통 모듈 사용. (자체 모달 X)
- [ ] **React #130 safeDisplay**: 리스트나 텍스트 렌더링 시 React 에러 방지를 위해 방어 코드(`?.`, `|| ""`) 및 `safeDisplay` 유틸 적용.
- [ ] **어드민 샘플 톤 일관성**: 섹션 블록 라운드 처리, 좌측 악센트 바 텍스트, 다크 사이드바와의 시각적 조화 보장. (참조: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)
