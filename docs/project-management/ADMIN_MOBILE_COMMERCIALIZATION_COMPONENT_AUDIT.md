# 어드민 모바일(Expo) — 컴포넌트·모듈 정리 제안 (C0)

**오케스트레이션 SSOT**: [`ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md`](./ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md)

**일자**: 2026-05-18 · **담당**: core-component-manager · **코드 변경**: 없음 (제안만)  
**범위**: `expo-app/app/(admin)/`, `expo-app/src/components/` (Admin·Schedule·UnifiedModal·EmptyState·StatCard·MenuListItem 등)  
**참조**: `COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`, `core-solution-atomic-design`, `core-solution-common-modules`, `COMMON_MODULES_USAGE_GUIDE.md`

---

## 1. 현황 인벤토리

### 1.1 어드민 전용·연관 컴포넌트 (`expo-app/src/components/`)

| 계층 | 파일 | 역할 |
|------|------|------|
| **guards** | `AdminRoleGate.tsx` | 역할 게이트 |
| **atoms** | `StatCard`, `EmptyState`, `SearchBar`, `Badge`, `Chip`, `SkeletonLoader` | 홈 KPI·목록 빈 상태·검색·배지 |
| **molecules** | `AdminScheduleTimeSlotPicker`, `AdminScheduleSelectionSummary`, `AdminConsultantDayScheduleList`, `MenuListItem`, `ScheduleCard`, `StatCard`(동명), `SearchBar`(동명) | 스케줄 등록·허브·공통 메뉴 |
| **organisms** | ~~`AdminMappingPaymentConfirmModal`~~ **삭제(C3)**, `AdminMappingDepositConfirmModal`, `AdminMobilePlaceholderScreen`, `NotificationSettingsScreen`, `ConversationListScreen`(메시지 탭) | 입금(미연결)·플레이스홀더 |
| **common** | `UnifiedModal` | 확인·폼·FAB 시트·에러 모달 SSOT |

**페이지(라우트)**: `app/(admin)/` 하위 약 20개 화면 TSX + 레이아웃 8개. 운영 핵심은 `(home)`, `(operation)/*`, `(messages)`, `(review)`, `(more)`.

### 1.2 아토믹 계층 정합 (요약)

| 권장 | 현재 이슈 |
|------|-----------|
| Atoms = 표시·입력 primitive | `StatCard`/`SearchBar` **이중 정의**(atoms·molecules) |
| Molecules = 조합 UI | Admin 스케줄 3종은 **적절** (molecules 유지) |
| Organisms = 화면 블록·모달 | 결제 2모달은 Organism **적절**; 허브 `MappingListCard`는 **페이지 인라인** |
| Templates = SafeArea + TopBar + 스텝 껍데기 | `AppTopBar`는 templates로 import되나, **스텝 위저드 껍데기는 페이지 중복** |

### 1.3 C3 갱신 — `AdminMappingPaymentConfirmModal` 삭제 (2026-05-20 · `e52678ab7`)

**2026-05-20 C3(`e52678ab7`)**에서 `AdminMappingPaymentConfirmModal` Organism이 **삭제**되었다. 결제 1단계(confirm-payment)는 **`AdminMappingListCard` Molecule의 웹 Secondary CTA**(`shouldShowWebPaymentCta` · `openAdminWebIntegratedSchedule`)로 SSOT가 이동했으며, Primary CTA는 일정(`schedule`) 중심이다. §3 추출 후보 **#3 `AdminMappingSettlementForm`**은 PaymentConfirm·DepositConfirm·`mapping/create` step4 중복 제거용이었으나, PaymentConfirm 경로가 사라져 **범위가 DepositConfirm(미연결) + step4 결제 필드 chip·금액 UI**로 축소된다. §2 #5 리스트 카드 패턴은 **`AdminMappingListCard` 추출 완료**로 인라인 분기가 Molecule로 정리되었고, G2 회귀(`tsc` 0·`test:utils` 192/192)는 모달 삭제·FlashList prop 정리 후 **PASS**다. 후속: §7 core-coder 체크리스트 #2에서 PaymentConfirm 공통화 항목은 **웹 CTA·ListCard SSOT 유지**로 갱신; DepositConfirm 연결 여부는 P2(네이티브 100%) 또는 삭제 검토.

---

## 2. 중복 Top 5

| # | 중복 | 위치 | 제안 |
|---|------|------|------|
| **1** | **`StatCard` 동명 이중 구현** | `atoms/StatCard.tsx`(Pressable·unit) vs `molecules/StatCard.tsx`(Lucide·Reanimated) | 어드민 홈은 **atoms** 사용 중. molecules는 클라이언트/컨설턴트 대시보드용으로 보임 → **이름 분리**(`AnimatedStatCard` 등) 또는 props 통합 후 **단일 SSOT** + import 경로 문서화. |
| **2** | **`SearchBar` 동명 이중** | `atoms/SearchBar` vs `molecules/SearchBar`(필터 버튼) | 어드민: `user-management`, `schedule/create`, `mapping/create` → **atoms**; `messages` → **molecules**. 상용화 전 **역할별 하나**로 고정(검색만 vs 필터 포함). |
| **3** | **4·5스텝 위저드 UI 거의 동일** | `schedule/create.tsx` ↔ `schedule/mapping/create.tsx` | `filterBySearch`, `renderPickerRow`, `STEP_OF`·progress bar, `footer`/`footerBtn` 스타일 **복붙 수준**. 상수만 `adminScheduleRegisterCopy` / `adminMappingCopy` 차이. |
| **4** | **사용자 등록 3화면 폼 골격** | `user-management/create-{client,consultant,staff}.tsx` | `SafeAreaView` + `AppTopBar` + `ScrollView` + `TextInput` 필드 + `useAdminDuplicateCheckEmail` + `UnifiedModal`(에러) 패턴 반복. consultant는 name 필드 없음 등 **필드만 다름**. |
| **5** | **리스트 행 Pressable 카드 패턴** | `user-management/index`, `records/index`, `review/index`, `messages/index`, `schedule/index`(`MappingListCard`) | surface+border+행 Pressable+Badge 조합이 화면마다 재구현. `ScheduleCard`는 일정 탭만 사용, 매칭은 **인라인 카드**로 분기. |

**부가(라우트)**: SSOT `(operation)/user-management/*` — `users/` 라우트·딥링크 없음. 스모크·prep 문서 경로는 C4에서 `user-management`로 정합.

---

## 3. 추출 후보 Top 5

| # | 추출 컴포넌트 | 계층 제안 | 근거·포함 범위 |
|---|---------------|-----------|----------------|
| **1** | **`AdminWizardShell`** (가칭) | **Template** `templates/AdminWizardShell.tsx` | 스텝 타이틀·`STEP_OF`·progress track·하단 이전/다음/취소 footer. `schedule/create`, `mapping/create` 공통. |
| **2** | **`AdminMappingListCard`** | **Molecule** | `schedule/index.tsx` 내 `MappingListCard` (~120줄). 상태 Badge·CTA 행·`adminMappingSettlement` 연동 props. |
| **3** | **`AdminMappingSettlementForm`** (또는 PaymentFields) | **Molecule** + Organism 조합 | ~~PaymentConfirm~~ **삭제** — `DepositConfirmModal`(미연결) / `mapping/create` step4 **결제수단 chip·금액·참조** UI만 잔존. Organism은 UnifiedModal + mutation만 유지. |
| **4** | **`AdminFabActionSheet`** | **Molecule** | `user-management/index`(추가 FAB+시트), `schedule/index`(일정|매칭 FAB+UnifiedModal 옵션). 동일 FAB 스타일·haptics·`UnifiedModal` 리스트 액션. |
| **5** | **`AdminPickerList` + `filterBySearch` util** | **Molecule** + `utils/adminPickerSearch.ts` | 위저드 step1~3의 FlatList+`renderPickerRow`+SearchBar. `filterBySearch`는 두 create 파일에 **동일 함수** 복제. |

**낮은 우선**: `DetailField`(라벨·값 행) — `user-management/index`, `records/[id].tsx`에 유사; `AdminDetailField` molecule 후보(P2).

---

## 4. 적재적소 배치 제안

| 현재 | 제안 위치 | 이유 |
|------|-----------|------|
| `schedule/index` 인라인 `MappingListCard` | `molecules/AdminMappingListCard.tsx` | 도메인 카드·FlashList renderItem 전용 Molecule |
| `AdminSchedule*` 3종 | **molecules 유지** | TimeSlot·Selection·DayList는 스케줄 등록 Organism를 이루는 조합 단위로 적절 |
| `AdminMapping*ConfirmModal` | **organisms 유지** | API mutation·Alert·UnifiedModal 오케스트레이션 |
| 결제 chip·TextInput 묶음 | **molecules/AdminMappingPaymentFields.tsx** | Organism 슬림화·mapping/create step4 재사용 |
| `AdminMobilePlaceholderScreen` | **organisms 유지** | AppTopBar+카피 블록 단위 화면 |
| `AdminRoleGate` | **guards 유지** | 화면 컴포넌트가 아닌 가드 레이어 |
| 위저드 껍데기 | **templates/AdminWizardShell** | Pages는 step 상태·API만, 표시 레이아웃은 Template |
| `StatCard` (molecules) | **이름 변경 또는 deprecated** | atoms와 충돌 방지; 어드민 신규는 atoms StatCard + `toDisplayString` value |
| `PlaceholderScreen` vs `AdminMobilePlaceholderScreen` | **역할 분리 문서화** | 전역 Phase2 placeholder vs 어드민 API 힌트; 통합 시 Admin이 상속/래핑 |

**import SSOT (상용화 직후)**  
- 모달: `@/components/common/modals/UnifiedModal` only  
- 어드민 검색: atoms **또는** molecules 중 팀 합의 1개  
- KPI: `atoms/StatCard` + value는 mapper 또는 `toDisplayString` 선적용

---

## 5. 표시 경계 (`safeDisplay` / `toDisplayString`) — grep 힌트만

**SSOT**: `expo-app/src/utils/safeDisplay.ts` (`toDisplayString`, `toSafeNumber` 등). 회의 문서: JSX에 API 원본 직접 삽입 금지.

### 5.1 어드민 화면 중 `toDisplayString` **미사용** 파일 (grep)

- `app/(admin)/(operation)/index.tsx` — 정적 카피만, **낮은 위험**
- `app/(admin)/(more)/notification-settings.tsx` — 위임 화면, **낮은 위험**
- `app/(admin)/(operation)/user-management/create-client.tsx`
- `app/(admin)/(operation)/user-management/create-consultant.tsx`
- `app/(admin)/(operation)/user-management/create-staff.tsx`  
  → 폼은 사용자 입력 위주; **에러 모달 문자열**은 서버 메시지일 수 있어 `toDisplayString`/`toErrorMessage` 검토

### 5.2 `toDisplayString` **있으나** API 필드 직접 JSX 의심 (수정 후보)

| 파일 | 패턴 |
|------|------|
| `(messages)/index.tsx` | `{item.senderName}`, `{item.receiverName}` 직접 |
| `(operation)/schedule/index.tsx` | `{item.packageName}`; `ScheduleCard`에 `consultationType`, `status` 등 **정규화 전** 전달 가능 |
| `(operation)/schedule/mapping/create.tsx` | 패키지 행 `item.price.toLocaleString` — 수치는 `toSafeNumber` 후 포맷 권장 |
| `(operation)/user-management/index.tsx` | `phoneDisplay` — 빈 문자열 분기만, 비스칼ar 시 `toDisplayString(item.phone)` |
| `(operation)/mind-weather.tsx` | Badge `item.shareSummaryLabel` — 코드값이면 mapper에서 라벨화 |
| `(review)/[id].tsx` | `{item.specialty}` 조건부 직접 출력 |

### 5.3 양호 사례 (참고)

- `(home)/index.tsx`, `user-management/index`(name/email), `records/*`, `review/index`, `mind-weather`, 결제 모달 organisms — **다수 `toDisplayString` 적용**

**후속(회의 Phase 2)**: Atom `SafeText` 도입 시 어드민 리스트·카드부터 치환 우선순위 매김(component-manager → core-coder PR 분할).

---

## 6. 상용화 공통화 우선순위

| 우선순위 | 항목 | 이유 |
|----------|------|------|
| **P0** | 위저드 `AdminWizardShell` + `filterBySearch` util | 일정·매칭 등록이 MVP 핵심; drift 시 버그·UX 불일치 |
| **P0** | `#130` 고위험 리스트: **messages**, **schedule/index**(매칭 카드·ScheduleCard props) | 운영자가 매일 보는 화면 |
| **P0** | `StatCard` / `SearchBar` import **단일화** | 잘못된 계층 import 방지·번들·스타일 일관 |
| **P1** | `AdminMappingListCard` + `AdminMappingSettlementForm` | 결제·매칭 허브 상용 품질·모달-웹 패리티 유지 |
| **P1** | `AdminFabActionSheet` + 사용자 등록 **폼 템플릿** | FAB·등록 플로우 반복 제거 |
| **P1** | `AdminPickerList` (위저드 picker) | 스텝 화면 코드 30~40% 감소 기대 |
| **P2** | `AdminDetailField`, `RecordCard`/`ClientCard` 재사용 검토 | records·community와 시각 통일 |
| **P2** | `SafeText` Atom, `PlaceholderScreen` 정리 | 전역 표시 경계 Phase; 어드민은 P0·P1 후 |

---

## 7. core-coder 전달 체크리스트 (5줄)

1. **`schedule/create`·`mapping/create`에서 `AdminWizardShell`(+ `adminPickerSearch`) 추출**하고 페이지는 step/ mutation만 남긴다.  
2. **`AdminMappingListCard`** SSOT 유지(추출 완료); ~~PaymentConfirm~~ 삭제 반영 — 웹 CTA만 유지. DepositConfirm·step4 **결제 필드 Molecule** 공통화는 P2.  
3. **어드민 import SSOT**: `StatCard`→`atoms`, `SearchBar`→팀 합의 1경로; molecules 동명 파일은 rename 또는 deprecated 처리한다.  
4. **`messages/index`, `schedule/index` 리스트/카드 JSX에 `toDisplayString`/`toSafeNumber` 적용**(회의 §4 규칙; 로컬 `String()` 산발 금지).  
5. **사용자 등록 3화면**은 `AdminUserCreateFormLayout`(가칭)으로 골격 통합; `(operation)/user-management/*` 경로·허브 링크 SSOT 유지.

---

## 8. 부록 — 어드민 페이지 ↔ 컴포넌트 매핑

| 화면 | 주요 공통 컴포넌트 | 인라인·추출 대상 |
|------|-------------------|------------------|
| `(home)/index` | atoms StatCard, QuickActionBar | — |
| `(operation)/index` | MenuListItem | — |
| `(operation)/schedule` | ScheduleCard, `AdminMappingListCard`, UnifiedModal, `AdminMappingDepositConfirmModal`(미연결) | FAB sheet |
| `(operation)/schedule/create` | AdminSchedule* molecules, UnifiedModal | Wizard shell, PickerList |
| `(operation)/schedule/mapping/create` | 동상 | 동상 |
| `(operation)/user-management` | SearchBar(atoms), UnifiedModal, FAB | List row, FAB sheet |
| `(operation)/records` | EmptyState, Badge | rowCard → RecordCard 검토 |
| `(messages)/index` | SearchBar(molecules), UnifiedModal | row + safeDisplay |
| `(review)/*` | Badge, EmptyState | — |
| `(more)/*` | MenuListItem, ProfileCard, NotificationSettingsScreen | — |

---

*본 문서는 core-component-manager 산출물이며, 구현·이동·통합은 **core-coder**가 수행한다. 변경 후 **core-tester**가 어드민 Maestro 스모크·#130 회귀를 권장한다.*
