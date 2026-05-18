# Admin Mobile — 상용화 디자인 핸드오프 (UI/UX 스펙)

**작성일**: 2026-05-18  
**작성자**: core-designer  
**상태**: **C2 구현 반영** — core-coder: `adminTheme`·`AdminWizardShell`·`AdminFabActionSheet`·`AdminMappingListCard` (테스터 게이트 대기)  
**참조 문서**: `ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md`, `COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`, `PENCIL_DESIGN_GUIDE.md`

---

## 1. 개요 및 배경

본 문서는 Admin Mobile 앱의 MVP 상태를 **상용화(Commercialization) 수준으로 격상**하기 위한 시각·UX SSOT입니다. 현장에서 어드민 및 스태프가 웹 없이도 앱을 통해 일정, 매칭, 결제 승인 등의 업무를 수행할 수 있도록, 데스크톱 기반의 B0KlA(웹 샘플) 디자인 언어를 모바일 레이아웃에 최적화하여 정의합니다. 본 문서는 코드 작성을 포함하지 않으며, `core-coder`가 참고할 구현 스펙만을 담고 있습니다.

### 핵심 사용성 3요소
1. **사용성**: ADMIN/STAFF 현장에서 일정, 매칭, 결제를 1~2 탭 만에 접근
2. **정보 노출**: 역할에 따른 탭 제어(스태프 검수 숨김), 정보 밀도 높은 허브 타일, 명확한 결제 상태 표시
3. **레이아웃**: 하단 5탭 셸, 플로팅 액션 버튼(FAB), 스텝형 위저드 폼, 시각적 카드 계층

---

## 2. 디자인 토큰 및 Admin Theme

웹 B0KlA 어드민 디자인 시스템을 모바일에 적용하기 위해 `adminTheme`을 정의합니다. Expo의 `ThemeProvider`에서 `role === 'admin' | 'staff'`일 경우 이 테마를 반환합니다.

### 2.1 adminTheme Hex 표 (B0KlA 대조)

| Expo Token (`theme.colors.*`) | Hex 값 | 용도 / B0KlA 매핑 |
| --- | --- | --- |
| `primary` | `#3D5246` | 주 버튼, 선택된 칩, 좌측 세로 악센트 바 |
| `primaryLight` | `#4A6354` | 보조 버튼, 부가 액션 |
| `bgMain` | `#FAF9F7` | 메인 스크린 배경 |
| `surface` | `#F5F3EF` | 카드, 위저드 셸(Wizard Shell), 모달, 하단 시트 배경 |
| `surfaceAlt` | `#EDE9E1` | 입력 폼 필드 배경, 비활성 칩 배경 |
| `textMain` | `#2C2C2C` | 페이지 제목, 카드 타이틀, 주요 수치(KPI) |
| `textSecondary`| `#5C6B61` | 부제목, 라벨, 힌트 텍스트 |
| `border` / `divider`| `#D4CFC8` | 카드 테두리, 목록 구분선, 미선택 칩 테두리 |
| `error` | `#E57373` | 에러 텍스트, 삭제/취소 버튼 |

> **STAFF 테마 분기(Subtle Variant 1안)**: STAFF 권한은 ADMIN과 **동일한 `adminTheme` 팔레트**를 사용하되, 시각적 혼동 방지를 원할 경우 TopBar 타이틀 옆에 "STAFF" 뱃지(배경 `#F0EDE8`, 텍스트 `#5C6B61`)를 표기하는 수준으로 제한하여 통일성을 유지합니다.

### 2.2 타이포·간격·반경 및 터치(44pt) 규격

- **Touch Target**: 모든 모바일 주 액션 버튼 및 리스트 항목은 **최소 44pt (44px) 높이**를 보장해야 합니다. `theme.spacing` 및 `height` 속성에 이를 강제합니다.
- **반경 (Border Radius)**: 
  - 카드 및 모달 (섹션 블록): `16px` (`borderRadius.xl`)
  - 일반 버튼: `10px` (`borderRadius.lg` ~ `md` 사이)
  - 칩 (Chip): `9999px` (`borderRadius.full`)
- **타이포그래피**: 
  - 제목 (Header): `20px ~ 24px`, fontWeight `600`
  - 본문 (Body): `14px ~ 16px`, fontWeight `400`
  - 캡션 (Caption): `12px`, fontWeight `400`

---

## 3. 세부 UI/UX 스펙 (P0 화면)

### 3.1 하단 5탭 셸 (App Navigation Shell)
- **탭 구성**: 홈 (`home`), 운영 (`operation`), 메시지 (`messages`), 검수 (`review`), 더보기 (`more`)
- **STAFF 권한 숨김**: STAFF 로그인 시 검수(`review`) 탭은 렌더링하지 않으며(숨김 처리), 4탭 셸로 유동적 대응.
- **스타일**: 선택된 탭 아이콘 및 텍스트는 `primary`(`#3D5246`), 미선택 탭은 `textTertiary` 적용. Safe Area(홈 인디케이터 구역) 여백 확보.

### 3.2 홈 (home/index) - KPI StatCard 그리드
- **레이아웃**: 2열 기반 그리드 (상단 브레드크럼 + 제목 영역). 웹 샘플의 60% 패리티 유지.
- **요소**:
  - 각 `StatCard`는 좌측에 **4px 폭의 악센트 바(`primary`)**가 존재하며, 내부는 배경 `#F5F3EF`, 테두리 1px `#D4CFC8` 적용.
  - 숫자는 `24px` 크기 (`#2C2C2C`, 600)로 렌더링.

### 3.3 운영 > 스케줄 (operation/schedule/index)
- **상단 세그먼트**: `[일정 | 매칭]` 토글 탭 제공 (전체 가로폭 차지, 높이 44px).
- **매칭 탭 (MappingListCard)**:
  - 카드 헤더: 내담자 정보 + 상태 뱃지
  - 카드 내용: 세부 정보 텍스트 (14px)
  - 결제 3단계 CTA (하단): `PENDING_PAYMENT` 상태 시 Primary 버튼 비활성화, Secondary(Outline) 버튼 "웹에서 결제 확인 ↗" 활성화. [상세: `ADMIN_MOBILE_MAPPING_PAYMENT_DESIGN_HANDOFF.md`](./ADMIN_MOBILE_MAPPING_PAYMENT_DESIGN_HANDOFF.md) 참조.
- **FAB (Floating Action Button)**: 우측 하단 고정 원형 버튼. 클릭 시 하단에서 `AdminFabActionSheet` 노출 (일정 생성 / 매칭 생성 옵션).

### 3.4 스케줄 등록 4스텝 (operation/schedule/create)
- **레이아웃**: `AdminWizardShell` 권장 레이아웃 사용.
- 상단: `1/4 진행률 바` (배경 `#E8E4DE`, 채움 `#3D5246`)
- 중앙: 폼 영역 (Safe Area 뷰, 스크롤 가능). [상세: `ADMIN_MOBILE_SCHEDULE_CREATE_DESIGN_HANDOFF.md`](./ADMIN_MOBILE_SCHEDULE_CREATE_DESIGN_HANDOFF.md) 참조.
- 하단: 이전/다음/완료 버튼 (높이 48px, 터치 최적화).

### 3.5 신규 매칭 등록 5스텝 (operation/schedule/mapping/create)
- 스케줄 등록과 동일한 `AdminWizardShell` 재사용.
- Step 5 (완료 및 결제):
  - Primary 버튼: "매칭 목록으로"
  - Secondary 버튼: "웹에서 결제 확인 ↗" (입금 대기 시, ExternalLink 아이콘 표기)
  - Tertiary 버튼: "이 매칭으로 일정 잡기" (단, 결제 완료시에만 활성화)

---

## 4. 공통 패턴 (상호작용 및 컴포넌트)

| 패턴 | 가이드라인 | 토큰 / 컴포넌트 |
| --- | --- | --- |
| **EmptyState** | "데이터가 없습니다" 텍스트를 중앙에 크게 표시하고, 연관 CTA 버튼 제공 | `textSecondary` (14px), 패딩 32px |
| **SkeletonLoader** | 로딩 상태에서 블록 크기에 맞게 맥박 애니메이션 적용 | `#E8E4DE` ~ `#F0EDE8` |
| **에러 토스트 대체** | 일시적인 오류는 단순 텍스트 토스트 대신, 사용자가 명확히 확인해야 할 주요 에러인 경우 `UnifiedModal`로 안내 | `UnifiedModal` (확인 버튼 필수) |
| **Action Sheet** | FAB 클릭 또는 아이템 더보기 시 화면 하단에서 올라오는 리스트 시트 (`AdminFabActionSheet`) | 배경 `#FAF9F7`, 최상단 Handle 바 적용 |

---

## 5. 시각 패리티 A(60%) 체크리스트

모바일 상용화를 위한 디자인 통과 기준(PASS)입니다. (최소 4항목 이상 충족 시 통과)

- [ ] **레이아웃**: B0KlA 어드민 대시보드와 유사하게 메인 배경 `#FAF9F7` 위에 카드 `#F5F3EF` 및 `#D4CFC8` 보더를 사용하여 섹션을 구분했는가?
- [ ] **타이포그래피**: `Noto Sans KR` (또는 기본 고딕 폰트) 사용, 본문(14px)과 제목(20px+) 텍스트 계층이 웹과 동일하게 분리되었는가?
- [ ] **색상**: `adminTheme`에 명시된 `#3D5246` (Primary) 기반으로 버튼, 악센트 바, 칩이 일관되게 렌더링되는가?
- [ ] **카드 구조**: KPI 카드와 스케줄 카드 왼쪽에 4px 두께의 악센트 바(Accent Bar)를 표현했는가?
- [ ] **액션 영역**: 터치 타깃이 44px 이상이며, 비활성 버튼의 경우 명확히 `disabled` 상태로 인지되는가?
- [ ] **표시 경계 (Safe Display)**: 빈 값이나 잘못된 타입의 필드가 그대로 렌더링되지 않고, `toDisplayString` 등을 거쳐 처리되었는가?

---

## 6. core-coder 완료 조건 10항

`core-coder`는 해당 문서를 바탕으로 C2/C3 Phase 구현 시 다음 10개 항을 준수해야 합니다.

1. `expo-app/src/theme/tokens.ts` 내에 `adminTheme` (또는 `ADMIN_COLORS`)을 표 2.1을 참조하여 하드코딩 없이 구성한다.
2. `expo-app/src/theme/ThemeProvider.tsx`에서 `role === 'admin' | 'staff'`일 경우 `adminTheme`을 사용하도록 로직을 분기한다.
3. 스태프(STAFF) 권한 접근 시 하단 탭 네비게이터에서 `review` 탭 라우트를 숨기도록(`display: none` 혹은 제외) 분기 처리한다.
4. 모든 클릭 가능한 버튼 및 행(Pressable/TouchableOpacity)은 최소 높이(Touch Target) `44px`를 확보한다.
5. P0 화면의 카드 UI(`StatCard`, `ScheduleCard`, `MappingListCard`)는 배경 `#F5F3EF` 및 테두리 `#D4CFC8` 기반의 `adminTheme` 속성만 사용한다.
6. 일정 등록(`schedule/create`) 및 매칭 등록(`mapping/create`)은 템플릿 컴포넌트 `AdminWizardShell`을 추출하여 스텝별 UI의 중복 코드를 제거한다.
7. FAB 컴포넌트를 추출(`AdminFabActionSheet`)하여 재사용 구조로 묶는다.
8. 매칭 리스트 카드(`MappingListCard`)에서 `PENDING_PAYMENT` 상태 시 Primary 버튼은 `disabled`하고 Secondary 버튼("웹에서 결제 확인")을 우회 링크로 활성화한다.
9. 렌더링되는 모든 데이터는 `COMMON_DISPLAY_BOUNDARY` 가이드에 따라 JSX에 원본을 삽입하지 않고 `toDisplayString` / `toSafeNumber` 래퍼나 Atom을 거치게 한다.
10. Expo 모바일 환경에서만 지원되지 않는 기능(FullCalendar 드래그 앤 드롭, ERP 전체 화면 등)을 무리하게 구현하지 않고, 모바일 특화된 플로우(인벤토리 위주)로 한정한다.
