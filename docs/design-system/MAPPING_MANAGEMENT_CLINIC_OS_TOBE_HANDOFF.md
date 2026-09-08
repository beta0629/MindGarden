# 배정 관리 Clinic-OS TO-BE 스펙 (Design Handoff)

**대상**: `/admin/mapping-management` (`MappingManagement` → `MappingManagementPage`)  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md` + live `/admin/dashboard`  
**상태**: **TO-BE 정본** — 구 `MAPPING_MANAGEMENT_CLINIC_OS_HANDOFF.md`(AS-IS chrome)를 supersede 한다.  
**범위**: Frontend chrome + viewMode·필터 칩 UX. 결제/환불 API·모달 비즈니스 로직 **변경 금지**. IntegratedMatchingSchedule calendar **건드리지 않음**.  
**작성**: core-designer 스펙 → core-coder 구현 (2026-09-08)

---

## 0. 사용자 관점

| 항목 | 내용 |
|------|------|
| **사용성** | 운영자(ADMIN/STAFF)가 배정 목록을 검색·상태칩·Saved View·list/card로 전환. 헤더 CTA「새 배정」이 유일한 primary. CONSULTANT는 생성 CTA fail-closed. |
| **정보 노출** | KPI 3셀(전체·활성·결제 대기) + (결제 대기 N>0일 때) amber attention rail. 세부 상태는 필터 칩(환불 포함). |
| **레이아웃** | quiet header → KPI strip → PaymentAttentionRail → search/chips → main stage(list\|card). calendar 뷰 이 페이지에서 제거. |

---

## 1. 레이아웃 구조 (위→아래)

```
AdminCommonLayout
└─ ContentArea (.mg-v2-mapping-management.mapping-management--clinic-os)
   ├─ ContentHeader (quiet) — title + MGButton solid primary「새 배정」(ADMIN/STAFF만)
   ├─ MappingKpiSection — 3-cell summary strip
   ├─ MappingPaymentAttentionRail — N=0이면 미렌더
   ├─ MappingSearchSection — search + status chips(+환불) + SavedViewControls
   └─ peek-layout
      ├─ R-MAIN: MappingListBlock stage (list|card, 동일 기하)
      └─ SidePeekShell (기존)
```

---

## 2. ViewMode

| 항목 | 계약 |
|------|------|
| allowed | `['list','card']` only |
| default | `list` (`mappingManagementSavedViewConstants.js`) |
| legacy | `table` → `list`, `calendar` → `list` |
| UI 라벨 | 「리스트」「카드」 |
| list 렌더 | 기존 `MappingTableView` |
| card 렌더 | 기존 `MappingListRow` grid |
| calendar | **이 페이지에서 제거** (IntegratedMatchingSchedule 유지) |

---

## 3. MappingPaymentAttentionRail (molecule)

- amber one-liner: `오늘 손볼 결제 {N}건 · 합계 {formatKrw}`
- N=0 → 숨김
- 합계 금액만 `color: var(--color-red-700)` (hex `#B91C1C` 직접 금지)
- 클릭 → 기존 `handleStatCardClick` payment 경로 재사용
- 집계: `PENDING_PAYMENT` **또는** `paymentStatus === PENDING` (클라이언트, **새 API 금지**)

---

## 4. 결제 대기 금액 색

행/카드/테이블의 결제 대기 금액: `var(--color-red-700)`.

---

## 5. CTA 높이 36px

페이지 스코프:

```css
.mg-v2-mapping-management.mapping-management--clinic-os {
  --mg-v2-component-height-compact: 2.25rem;
}
```

적용: Header MGButton, empty CTA, schedule 버튼, EntityRowActions ⋮ (mapping 스코프 override만).

---

## 6. 필터 「환불」

- `MAPPING_FILTER_OPTIONS`에 `{ value: PAYMENT_STATUS.REFUNDED, label: '환불' }`
- filteredMappings: `paymentStatus === 'REFUNDED'`
- ⋮ 환불 entry 유지. 결제/환불 API·모달 로직 변경 금지.

---

## 7. 카피·역할

- 사용자 가시 「매칭」→「배정」(i18n `admin:mapping.page.*` 정합). CTA = 「새 배정」.
- Quiet header: subtitle 제거.
- CONSULTANT: 생성 CTA·empty create·CreationModal fail-closed (ADMIN/STAFF만). API 미변경.

---

## 8. Clinic-OS tokens

- MGButton solid primary dusty teal
- B0KlA / AdminDashboardB0KlA 재도입 금지
- page hex 금지; 금액 accent는 `var(--color-red-700)`만

---

## 9. 구현 파일 (코더)

- `pages/MappingManagementPage.js` + `MappingManagementPage.css`
- `molecules/MappingPaymentAttentionRail.js(.css)`
- `utils/mappingPaymentAttention.js`
- `organisms/MappingListBlock.js`, `MappingListRow`, `MappingTableView`
- `constants/mapping.js`, `mappingManagementSavedViewConstants.js`
- Jest: clinicOsChrome, savedView, MappingListBlock, MappingListRow, rail, filter

---

## 10. 비범위

- IntegratedMatchingSchedule calendar 제거/변경
- payment/refund API 계약 변경
- AdminDashboardB0KlA 재도입
