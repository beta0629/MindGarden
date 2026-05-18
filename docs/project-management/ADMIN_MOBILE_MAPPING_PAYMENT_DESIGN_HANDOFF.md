# Admin Mobile Mapping Payment - Design Handoff

## 1. 개요
- **목표**: Sprint 1c - 매칭 결제 승인(입금 확인)을 위한 웹 브릿지(Web Bridge) CTA 추가
- **대상**: 어드민 모바일 Expo 앱 (결제 승인 기능은 웹 SSOT 유지, 모바일은 웹 링크 제공)
- **원칙**: 네이티브 모달 구현 없이 웹 링크로 우회, `COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`의 `safeDisplay` 가이드라인(ADMIN/STAFF 권한) 준수.

## 2. 정책 결정: `PENDING_PAYMENT` 상태의 「일정 잡기」
- **권장안**: **(A) 비활성(Disabled) + 보조 문구 노출**
- **사유**: 사용자가 왜 일정을 잡을 수 없는지 명확한 피드백을 제공하여 UX 혼란을 방지합니다. 숨김(C) 처리할 경우 기능의 존재 자체를 인지하지 못할 수 있으며, 활성 유지 후 서버 실패(B)는 불필요한 API 호출 및 부정적 경험을 유발합니다.

## 3. 화면별 UI/UX 스펙

### 3.1. 매칭 생성 완료 화면 (Step 5)
- **경로**: `expo-app/app/(admin)/(operation)/schedule/mapping/create.tsx`
- **레이아웃 & CTA 계층**:
  ```text
  [성공 아이콘]
  새로운 매칭이 생성되었습니다.

  (Hint) 결제 대기 상태에서는 웹에서 입금 확인이 필요합니다.

  [ Primary ] 매칭 목록으로
  [ Secondary ] 웹에서 결제 확인 ↗ (ExternalLink 아이콘)
  [ Tertiary ] 이 매칭으로 일정 잡기 (mappingId 존재 시 노출)
  ```
- **스타일링**:
  - Secondary CTA: Outline 스타일, 텍스트 색상 주조색(`var(--mg-primary)` / `#3D5246`), 우측에 `ExternalLink` 아이콘 배치.

### 3.2. 매칭 목록 카드 (MappingListCard)
- **경로**: `expo-app/app/(admin)/(operation)/schedule/index.tsx`
- **레이아웃 & CTA 계층**:
  - **상태: `PENDING_PAYMENT` / `DEPOSIT_PENDING`**
    ```text
    [카드 헤더: 내담자 정보 및 상태 뱃지(결제 대기)]
    [카드 바디: 매칭 상세 정보]
    ---
    (Hint) 결제가 완료되어야 일정을 잡을 수 있어요.
    [ Secondary ] 웹에서 입금 확인 ↗    [ Primary(Disabled) ] 일정 잡기
    ```
  - **상태: `ACTIVE`**
    ```text
    [카드 헤더: 내담자 정보 및 상태 뱃지(진행 중)]
    [카드 바디: 매칭 상세 정보]
    ---
    [ Primary ] 일정 잡기
    ```

## 4. 카피 초안 (Copy Drafts)
`expo-app/src/constants/adminMappingCopy.ts` 등에 추가할 카피 키 제안:
- `OPEN_WEB_PAYMENT_CTA`: "웹에서 결제 확인"
- `DEPOSIT_PENDING_WEB_CTA`: "웹에서 입금 확인"
- `WEB_PAYMENT_HINT`: "결제 대기 상태에서는 웹에서 입금 확인이 필요합니다."
- `SCHEDULE_BLOCKED_PAYMENT_HINT`: "결제가 완료되어야 일정을 잡을 수 있어요."

## 5. 웹 라우트 키 (Web Routes)
`ADMIN_MOBILE_WEB_ROUTES` 추가 키 제안:
- `INTEGRATED_SCHEDULE`: `/admin/schedule`
- `MAPPING_MANAGEMENT`: `/admin/mapping`
- `mappingManagementPendingPayment(id)`: `/admin/mapping?highlight=${id}&status=PENDING_PAYMENT` (선택적 딥링크)

## 6. 접근성 및 인터랙션 (Accessibility)
- **접근성 라벨 (`accessibilityLabel`)**: "웹 브라우저를 열어 결제 확인 페이지로 이동합니다."
- **접근성 역할 (`accessibilityRole`)**: `button` (또는 `link`)
- **인터랙션**: `pressed` 상태 시 `opacity: 0.7` 적용.

## 7. Core-Coder 완료 조건 (Checklist)
- [ ] `mapping/create.tsx` Step 5에 Primary(매칭 목록으로), Secondary(웹에서 결제 확인 + ExternalLink), Tertiary(일정 잡기) CTA를 계층에 맞게 배치했는가?
- [ ] `MappingListCard`에서 `PENDING_PAYMENT` / `DEPOSIT_PENDING` 상태일 때 제안된 정책(A)에 따라 '일정 잡기' 버튼을 비활성화하고 안내 문구를 노출했는가?
- [ ] 웹 브릿지 버튼 클릭 시 `AdminMessagesWebFallback` 패턴을 참고하여 `Linking.openURL` 및 `buildAdminWebUrl`을 정상적으로 호출하는가?
- [ ] 카피 초안 및 웹 라우트 키를 상수 파일에 분리하여 적용했는가?
- [ ] `COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`의 `safeDisplay`를 적용하여 ADMIN/STAFF 권한에서만 해당 액션이 노출되도록 처리했는가?
- [ ] 접근성 라벨 및 Pressed Opacity(0.7) 피드백이 적용되었는가?
