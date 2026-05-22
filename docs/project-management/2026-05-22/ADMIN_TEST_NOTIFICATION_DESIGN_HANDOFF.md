# 어드민 SMS·카카오 알림톡 테스트 발송 도구 — UI/UX 스펙 (Design Handoff)

> **문서 목적**: `core-coder`가 코드 구현 시 즉시 참조할 수 있는 UI/UX 스펙, 와이어프레임, 컴포넌트 및 D8 디자인 토큰 매핑 가이드.
> **기반 기획**: `ADMIN_TEST_NOTIFICATION_TOOL_PLAN.md` (2026-05-22)

---

## §0 결정 요약 (TL;DR)

- **위치**: 기존 `frontend/src/components/admin/system/SystemTools.js` 내 신규 카드 1개 추가 및 클릭 시 하단 확장 패널 형태로 통합.
- **화면 구조 (1장)**: 수신자 선택(SELF/DB) + 채널 탭(SMS/알림톡) + 동적 변수 폼 + 발송 사유 및 카운터 + 이력 패널.
- **디자인 토큰 정합**: D8 `unified-design-tokens.css` SSOT 완전 정합. 하드코딩(hex, px) 0건 원칙.
- **운영 가드**: prod 환경 한정 2-step `UnifiedModal` 적용.

---

## §1 SystemTools.js 통합 전략

기존 `SystemTools.js`는 4개의 단순 액션 버튼 카드(새로고침, 로그, 캐시, 백업)로 구성되어 있습니다. 테스트 발송 도구는 입력 폼과 이력을 포함하므로 단순 버튼 액션과 다릅니다. 이를 통합하기 위해 3가지 안을 비교합니다.

### 1안: 신규 카드 클릭 시 `UnifiedModal` (Large) 팝업
- **장점**: 기존 카드 레이아웃을 해치지 않고, 별도의 넓은 폼 영역을 확보할 수 있습니다.
- **단점**: 이력 30건 확인을 위한 스크롤이 모달 내에 갇히며, prod 2-step 모달 발생 시 모달 위에 모달이 뜨는 중첩(z-index) 문제가 발생할 수 있습니다.

### 2안: 신규 카드 클릭 시 하단 인라인 패널 토글 (권장)
- **장점**: 기존 카드 패턴을 유지하면서, 클릭 시 하단에 독립된 폼/이력 섹션이 부드럽게 펼쳐집니다. 모달 중첩 문제가 없으며, 이력 확인이 용이합니다.
- **단점**: 상태 관리(열림/닫힘) 로직 및 애니메이션 추가가 필요합니다.

### 3안: SystemTools 하단에 상시 노출되는 별도 섹션(카드)
- **장점**: 접근성이 가장 좋습니다 (1-click 감소).
- **단점**: 시스템 도구 화면이 상시 복잡해지며, 기존 카드 그리드 패턴과 이질감이 큽니다.

**권장안: 2안 (신규 카드 클릭 시 하단 인라인 패널 토글)**
기존 `tools` 배열에 '알림 테스트' 카드를 추가하고, 해당 카드 클릭 시 그리드 하단에 전체 폭(100%)을 차지하는 발송 폼 및 이력 패널을 렌더링합니다.

---

## §2 와이어프레임

패널이 열렸을 때의 내부 UI 구조입니다. 좌측은 발송 폼, 우측은 이력 패널로 구성됩니다 (데스크탑 기준).

```text
+-----------------------------------------------------------------------------------+
| ▼ 알림 테스트 발송 패널 (토글 시 노출)                                            |
+-----------------------------------------------------------------------------------+
| [ 좌측: 발송 폼 영역 (Flex: 2) ]              | [ 우측: 발송 이력 (Flex: 1) ]     |
|                                               |                                   |
| (a) 수신자 영역                               | 최근 발송 이력 (최대 30건)        |
|  (o) 본인 (SELF)  ( ) DB 사용자 선택          | +-------------------------------+ |
|  * DB 사용자 선택 시:                         | | [알림톡] [성공] 14:20         | |
|    [ BadgeSelect (이름/이메일/역할 검색) ▼ ]  | | 수신: 010-****-1234           | |
|  * 선택된 수신자: 홍길동 (010-****-1234)      | | 사유: 템플릿 변수 매칭 테스트 | |
|                                               | +-------------------------------+ |
| (b) 채널 영역                                 | +-------------------------------+ |
|  [ 탭: SMS ] [ 탭: 카카오 알림톡 ]            | | [SMS] [실패] 13:15            | |
|                                               | | 수신: 010-****-5678           | |
|  [알림톡 탭 활성화 시]                        | | 사유: 길이 제한 테스트        | |
|  템플릿: [ enum 템플릿 선택 ▼ ]               | +-------------------------------+ |
|         [x] 솔라피 전체 보기 (실시간 조회)    | +-------------------------------+ |
|  변수 입력 (동적 렌더링):                     | | [알림톡] [성공] 10:05         | |
|  - 사용자명: [ 홍길동               ]         | | 수신: 010-****-1234           | |
|  - 결제금액: [ 50,000               ]         | | 사유: 신규 템플릿 검수        | |
|                                               | +-------------------------------+ |
| (c) 발송 사유 및 카운터                       |                                   |
|  발송 사유 (필수):                            |                                   |
|  [ 테스트 목적을 입력하세요 (감사로그 기록) ] |                                   |
|                                               |                                   |
|  잔여 한도: 분당 10/10 | 일당 98/100          |                                   |
|                                               |                                   |
|  [ 발송하기 (Primary Button) ]                |                                   |
+-----------------------------------------------+-----------------------------------+
```

**(d) prod 2-step 모달 플로우**:
'발송하기' 클릭 시 `process.env.REACT_APP_ENV === 'production'`인 경우에만 작동.
- **1단계**: `UnifiedModal` "발송 정보 확인" (수신자, 채널, 템플릿, 사유 요약) -> [다음] 클릭.
- **2단계**: `UnifiedModal` "정말 발송하시겠습니까?" (실제 사용자에게 발송됨을 경고) -> [최종 발송] 클릭.
- dev/local 환경에서는 모달 없이 즉시 발송 API 호출.

---

## §3 결과 모달 + 이력 패널

### 3.1 결과 모달 (`UnifiedModal` 표준 적용)
발송 API 응답 후 나타나는 모달입니다.
- **성공 시**: 
  - 제목 슬롯: "발송 성공" (좌측 아이콘 `var(--mg-color-success-main)`)
  - 본문 슬롯: `groupId`, `messageId` 노출.
  - 푸터 슬롯: [솔라피 콘솔에서 보기 (새 탭)] [닫기]
- **실패 시**:
  - 제목 슬롯: "발송 실패" (좌측 아이콘 `var(--mg-color-error-main)`)
  - 본문 슬롯: 에러 코드 및 실패 사유 명시.
  - 푸터 슬롯: [재시도] [닫기]

### 3.2 이력 패널
- **데이터**: `admin_test_notification_logs` 테이블 기반 최근 30건.
- **표시 항목**: 채널 뱃지(SMS/알림톡), 결과 뱃지(성공/실패), 발송 시각, 수신자(마스킹 `010-****-1234`), 발송 사유.
- **디자인**: 각 이력은 얇은 테두리(`var(--mg-color-border-main)`)를 가진 작은 카드로 렌더링되며, 스크롤 영역을 가집니다.

---

## §4 D8 디자인 토큰 매핑

하드코딩(hex, px)을 엄격히 금지하며, `frontend/src/styles/unified-design-tokens.css`의 토큰만 사용합니다.

### 4.1 색상 (Colors)
- **배경/표면**: 
  - 패널 배경: `var(--mg-color-surface-light)`
  - 입력창 배경: `var(--color-bg-surface)`
- **텍스트**: 
  - 기본 텍스트: `var(--mg-color-text-main)`
  - 설명/라벨/카운터: `var(--mg-color-text-secondary)`
- **주조색 (Primary)**: 
  - 발송 버튼, 탭 활성화: `var(--mg-color-primary-main)`
- **상태색 (Semantic)**: 
  - 성공 뱃지/아이콘: `var(--mg-color-success-main)`
  - 실패 뱃지/에러 텍스트: `var(--mg-color-error-main)`
  - 잔여 한도 경고: `var(--mg-color-warning-main)`
- **테두리**: 
  - 폼, 패널, 이력 카드 테두리: `var(--mg-color-border-main)`

### 4.2 간격 (Spacing)
- **패딩/마진**: `var(--admin-spacing-sm)` (8px), `var(--admin-spacing-md)` (16px), `var(--admin-spacing-lg)` (24px)
- **컴포넌트 간 Gap**: `var(--admin-spacing-md)`

### 4.3 라운드 & 그림자
- **Border Radius**: `var(--admin-radius-md)` (버튼/입력창), `var(--admin-radius-lg)` (카드/패널)
- **Box Shadow**: `var(--admin-shadow-sm)` (호버), `var(--admin-shadow-md)` (모달/패널)

---

## §5 컴포넌트 매핑

기존 공통 컴포넌트를 최대한 재사용하며, 신규 컴포넌트 생성을 최소화합니다.

### 5.1 재사용 (기존 공통 컴포넌트)
- **`UnifiedModal`** (Organism): 발송 결과 모달 및 prod 2-step 확인 모달.
- **`BadgeSelect`** (Molecule): DB 사용자 검색 및 선택 드롭다운.
- **`MGButton` / `BaseButton`** (Atom): 발송, 취소, 재시도 버튼.
- **`BaseCard`** (Atom): 발송 폼 컨테이너 및 이력 리스트 아이템.
- **`ContentHeader`** (Molecule): 패널 상단 제목.

### 5.2 신규 컴포넌트 (최대 2개)
- **`TestNotificationForm`** (Organism): 수신자, 채널, 변수 입력, 사유를 포함하는 복합 폼.
- **`TestNotificationHistory`** (Organism): 최근 30건 발송 이력을 보여주는 리스트 패널.

---

## §6 접근성·반응형

- **WCAG AA 대비비 검증**: 
  - 라이트/다크 모드 모두 텍스트(`var(--mg-color-text-main)`)와 배경(`var(--mg-color-surface-light)`) 간 최소 4.5:1 대비비 보장.
  - 에러 메시지(`var(--mg-color-error-main)`) 가독성 검증.
- **키보드 네비게이션**: 
  - 탭(Tab) 키로 수신자 라디오 -> BadgeSelect -> 채널 탭 -> 템플릿 선택 -> 변수 입력 -> 사유 입력 -> 발송 버튼 순차 이동 보장.
  - `UnifiedModal` 오픈 시 포커스 트랩(Focus Trap) 적용.
- **반응형 (Responsive)**:
  - 768px 이하 모바일 뷰: 발송 폼(좌측)과 이력 패널(우측)을 1컬럼(세로 배치)으로 전환.
  - 탭 메뉴 및 라디오 버튼은 터치 친화적 크기(최소 44px 높이) 적용.

---

## §7 codemod·하드코딩 게이트

운영 반영 게이트(`PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`) 충족을 위한 확인 체크리스트입니다.

- [ ] **인라인 스타일 금지**: `style={{ color: '#000' }}` 등 인라인 스타일 절대 금지.
- [ ] **px 단위 하드코딩 금지**: 간격, 라운드 등 모두 `var(--admin-*)` 토큰 사용.
- [ ] **색상 하드코딩 금지**: 반드시 `var(--mg-color-*)` 토큰 사용. `check-hardcode.sh` 통과 필수.

---

## §8 코더 핸드오프 체크리스트

P2-a(BE) 및 P2-b(FE) 담당 코더는 다음 항목을 준수하여 구현해야 합니다.

1. [ ] **멀티테넌트 격리**: API 및 프론트엔드 조회 시 `tenant_id` 기준 격리 필수.
2. [ ] **권한 제어**: 프론트 진입 및 API 호출 시 `ADMIN`, `STAFF` 역할만 허용 (그 외 403 처리 및 UI 미노출). ※ 2026-05-22 14:25 정정: HQ_ADMIN·SUPER_ADMIN은 deprecated 레거시이며 현행 4역할 체계(`frontend/src/constants/roles.js`)는 ADMIN·STAFF·CONSULTANT·CLIENT.
3. [ ] **rate-limit UI**: 분당 10건 / 일당 100건 잔여 카운터를 폼 하단에 실시간 표시.
4. [ ] **prod 2-step 모달 분기**: `process.env.REACT_APP_ENV === 'production'` 일 때만 발송 전 2단계 경고 모달(`UnifiedModal`) 렌더링.
5. [ ] **디자인 토큰 엄수**: 모든 CSS는 §4에 명시된 토큰만 사용하며, 신규 CSS 작성 시 하드코딩을 배제.

---

## §9 위험·시각 회귀 우선 영역

- **다크 모드 폼 가시성**: `TestNotificationForm` 내 입력창 및 `BadgeSelect`의 다크 모드 텍스트/배경 대비.
- **모달 중첩 레이아웃**: prod 2-step 모달과 결과 모달이 연속으로 뜰 때의 z-index 및 오버레이 시각 회귀.
- **SystemTools 기존 카드 깨짐**: 신규 카드 추가 및 패널 확장 시 기존 4개 카드의 그리드 레이아웃 유지 여부.

---

## §10 변경 이력

- **2026-05-22 `core-designer`**: 어드민 테스트 발송 도구 UI/UX 와이어프레임 및 D8 토큰 매핑 핸드오프 작성 완료.
- **2026-05-22 `core-coder` (P2-b)**: FE 구현 완료 — `SystemTools.js`에 신규 카드 1개(`test-notification`) + 하단 인라인 패널 토글(§1 권장안 2안) 통합. 신규 Organism 2개(`TestNotificationForm`, `TestNotificationHistory`) 및 `api/admin/testNotificationApi.js`(StandardizedApi) 추가. 권한 가드는 정정된 `USER_ROLES.ADMIN`/`USER_ROLES.STAFF`만 화이트리스트(C2 정정 반영, 레거시 `HQ_ADMIN`/`SUPER_ADMIN` 미사용). 디자인 토큰 §4와 일치(인라인 스타일/HEX/RGB 0건). prod 분기는 `process.env.REACT_APP_ENV === 'production'` 시 `UnifiedModal` 2-step. TODO: i18n Phase 2에서 `admin.json` `testNotification.*` 키 정합 검토.
- **2026-05-22 14:25 KST main-assistant**: §8 권한 정정 — `HQ_ADMIN`·`SUPER_ADMIN` → `ADMIN`·`STAFF` (현행 4역할 체계 SSOT `frontend/src/constants/roles.js`).