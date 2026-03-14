# Phase 2 실행 태스크서 — 아토믹 디자인 common 통합

**작성일**: 2025-03-14  
**근거**: `ATOMIC_DESIGN_FULL_MIGRATION_PLAN.md`  
**회의 역할**: core-planner(오케스트레이션), core-designer(시각 일관성), core-publisher(마크업), core-coder(구현)

---

## 1. Phase 1 완료·미완료 정리

| 항목 | 상태 | 비고 |
|------|------|------|
| MappingScheduleCard | ✅ 완료 | CardContainer, StatusBadge, RemainingSessionsBadge, CardActionGroup 사용 |
| IntegratedMatchingSchedule | ✅ 완료 | ActionButton (신규 매칭) 사용 |
| CardMeta, CardActionGroup (integrated molecules) | ✅ 완료 | common에서 import |
| fc-event 분리 | ⬜ 미완료 | `fc-event` → `integrated-schedule__card--draggable` 전환 예정 |
| IntegratedMatchingSchedule.css 필터 UI | ⬜ 잔여 | `integrated-schedule__status-badge`, `integrated-schedule__status-btn` — StatusBadge variant 검토 |

**결의**: Phase 1 fc-event 분리는 Phase 2와 독립적이므로 **병렬 진행 가능**. Phase 2를 우선 실행한다.

---

## 2. Phase 2 실행 순서 (의존성 반영)

### 2.1 실행 순서

| 순번 | 파일 | 의존성 | 비고 |
|------|------|--------|------|
| 1 | ClientMappingTab | 없음 | StatusBadge, CardContainer |
| 2 | MappingCard | 없음 | StatusBadge, CardContainer, ActionButton |
| 3 | MappingListSection | MappingCard 완료 후 권장 | ActionButton |
| 4 | MappingListRow | 없음 | StatusBadge, ActionButton |
| 5 | MappingListBlock | 없음 | ActionButton |
| 6 | MappingContentHeader | 없음 | ActionButton |
| 7 | MappingDetailModal | 없음 | StatusBadge, ActionButton |
| 8 | MappingEditModal | 없음 | StatusBadge, ActionButton |

**병렬 가능 구간**: 순번 1~2 동시, 순번 3~8 중 3~8은 서로 독립이므로 2 완료 후 3~8 병렬 가능.

### 2.2 권장 실행 흐름

```
1) ClientMappingTab + MappingCard (병렬)
2) MappingListSection (1~2 완료 후)
3) MappingListRow, MappingListBlock, MappingContentHeader, MappingDetailModal, MappingEditModal (병렬)
```

---

## 3. core-designer 검토 결과 (StatusBadge variant 매핑)

### 3.1 StatusBadge status → variant (COMMON_UI_IMPLEMENTATION_SPEC 준수)

| status | variant |
|--------|---------|
| ACTIVE, PAYMENT_CONFIRMED, COMPLETED, DEPOSIT_PENDING | success |
| PENDING_PAYMENT, PENDING, SUSPENDED | warning |
| INACTIVE, TERMINATED, SESSIONS_EXHAUSTED | neutral |
| CANCELLED, 에러·거부 | danger |
| (안내) | info |

### 3.2 기존 MappingCard getStatusVariant → StatusBadge 매핑

| 기존 variant | StatusBadge variant |
|--------------|---------------------|
| success | success |
| warning | warning |
| info | info |
| secondary | neutral |
| error | danger |

**코드 전략**: StatusBadge는 `status` prop 전달 시 자동 매핑. `statusInfo.variant`가 있으면 `variant` prop으로 override 가능.

### 3.3 CardContainer modifier 스펙 (CARD_VISUAL_UNIFIED_SPEC)

- **ClientMappingTab compact**: `className="mg-v2-card-container mg-v2-mapping-card__compact"` — 내부 padding/gap 축소. CardContainer에 className 병합.
- **MappingCard**: `className="mg-v2-card-container"` — 기본. CardContainer 기본 스타일 적용.

---

## 4. core-publisher 마크업 검토

- **CardContainer**: `<div className={classNames}>` — 시맨틱 유지. children 구조는 기존과 동일.
- **StatusBadge**: `<span role="status">` — 접근성 준수.
- **ActionButton**: `<button type="button">` — 네이티브 버튼 사용.

---

## 5. core-coder 실행 태스크 (상세)

### 5.1 ClientMappingTab

**파일**: `frontend/src/components/admin/ClientComprehensiveManagement/ClientMappingTab.js`, `ClientMappingTab.css`

| 구분 | 교체 전 | 교체 후 |
|------|---------|---------|
| import | `getMappingStatusKoreanNameSync` | `StatusBadge`, `CardContainer` from `../../common` |
| 상수 | `MAPPING_STATUS_COLOR_MAP`, `getMappingStatusColorToken`, `MAPPING_STATUS_VARIANT`, `getMappingStatusVariant` | **삭제** |
| 배지 | `<span className={...} style={{...}}>{getMappingStatusKoreanNameSync(mapping.status)}</span>` | `<StatusBadge status={mapping.status} />` |
| 카드 루트 | `<div className="mg-v2-card mg-v2-mapping-card mg-v2-mapping-card__compact">` | `<CardContainer className="mg-v2-mapping-card__compact">` |
| 버튼 | `Button variant="secondary"` | Phase 2 범위 외 (유지) |

**CSS**: `.mg-v2-mapping-client-block .mg-v2-card.mg-v2-mapping-card` → `.mg-v2-mapping-client-block .mg-v2-card-container.mg-v2-mapping-card__compact` 로 선택자 변경. CardContainer 기본 스타일과 중복되는 border/radius/shadow/::before은 제거하고 modifier만 유지.

---

### 5.2 MappingCard

**파일**: `frontend/src/components/admin/mapping/MappingCard.js`

| 구분 | 교체 전 | 교체 후 |
|------|---------|---------|
| import | `MGButton` | `ActionButton`, `StatusBadge`, `CardContainer` from `../../common` |
| 상수 | `getStatusVariant`, `getStatusIconComponent` (내부용) | StatusBadge는 `status` prop 사용. 아이콘은 StatusBadge children에 넣지 않음 (COMMON_UI 스펙: children 미지정 시 STATUS_KO 사용) |
| 카드 루트 | `<div className="mg-v2-content-card mg-v2-mapping-card">` | `<CardContainer className="mg-v2-mapping-card">` |
| 상태 배지 | `<span className={mg-v2-badge ${badgeVariant}}>...StatusIcon...{statusLabel}</span>` | `<StatusBadge status={mapping?.status} />` (또는 statusInfo.label 필요 시 `children={statusInfo.label}`) |
| ERP 배지 | `<span className="mg-v2-badge info">` | `<StatusBadge variant="info">ERP 연동</StatusBadge>` |
| MGButton 전체 | `MGButton variant="primary"` 등 | `ActionButton variant="primary"` (size는 `sm`→`small`, `variant` 매핑: primary→primary, success→success, outline→outline, danger→danger) |

**MGButton → ActionButton 변환표**:

| MGButton | ActionButton |
|----------|--------------|
| variant="primary" | variant="primary" |
| variant="success" | variant="success" |
| variant="outline" | variant="outline" |
| variant="danger" | variant="danger" |
| size="sm" | size="small" |
| preventDoubleClick | ActionButton은 지원 안 함 — onClick 내부에서 debounce 또는 상위 처리 유지 |
| clickDelay | 동일 |

**주의**: MGButton의 `loading`, `loadingText`, `preventDoubleClick`는 ActionButton에 없음. `preventDoubleClick`/`clickDelay`는 상위에서 처리하거나, 필요 시 ActionButton `disabled`로 대체.

---

### 5.3 MappingListSection

**파일**: `frontend/src/components/admin/mapping-management/organisms/MappingListSection.js`

| 구분 | 교체 전 | 교체 후 |
|------|---------|---------|
| import | — | `ActionButton` from `../../../common` |
| 빈 상태 버튼 | `<button type="button" className="mg-v2-button mg-v2-button-primary ..." onClick={onCreateClick}>` | `<ActionButton variant="primary" onClick={onCreateClick}><Plus size={20} style={{ marginRight: 8 }} />매칭 생성하기</ActionButton>` |

---

### 5.4 MappingListRow

**파일**: `frontend/src/components/admin/mapping-management/organisms/MappingListRow.js`

| 구분 | 교체 전 | 교체 후 |
|------|---------|---------|
| import | `MGButton` | `ActionButton`, `StatusBadge` from `../../../common` |
| 상태 배지 | `<span className={mg-v2-mapping-list-row__status mg-v2-badge ${badgeVariant}}>...StatusIcon...{statusLabel}</span>` | `<StatusBadge status={mapping.status} children={statusLabel} />` (또는 statusInfo.variant override 필요 시 `variant={statusInfo.variant}` — StatusBadge variant: neutral 등) |
| 버튼들 | `<button className="mg-v2-button mg-v2-button-primary mg-v2-button-sm">` | `<ActionButton variant="primary" size="small">` |
| | `mg-v2-button-success` | `variant="success"` |
| | `mg-v2-button-outline` | `variant="outline"` |
| | `mg-v2-button-danger` | `variant="danger"` |
| MGButton (승인) | `MGButton variant="success" ... loading={processing}` | `ActionButton variant="success" disabled={processing}>` (loading UI는 별도 처리 또는 상위에서) |

**statusInfo.variant 매핑**: MappingListRow의 `statusInfo.variant`가 'secondary' 등이면 StatusBadge `variant="neutral"` 등으로 변환. 또는 StatusBadge `status={mapping.status}`만 넘기고 variant는 StatusBadge 내부 매핑에 맡김.

---

### 5.5 MappingListBlock

**파일**: `frontend/src/components/admin/mapping-management/organisms/MappingListBlock.js`

| 구분 | 교체 전 | 교체 후 |
|------|---------|---------|
| import | — | `ActionButton` from `../../../common` |
| 빈 상태 버튼 | `<button type="button" className="mg-v2-button mg-v2-button-primary ..." onClick={onCreateClick}>` | `<ActionButton variant="primary" onClick={onCreateClick}><Plus size={20} />매칭 생성</ActionButton>` |

---

### 5.6 MappingContentHeader

**파일**: `frontend/src/components/admin/mapping-management/content/MappingContentHeader.js`

| 구분 | 교체 전 | 교체 후 |
|------|---------|---------|
| import | — | `ActionButton` from `../../../common` |
| 버튼 | `<button type="button" className="mg-v2-button mg-v2-button-primary" onClick={onCreateClick}>` | `<ActionButton variant="primary" onClick={onCreateClick}><Plus size={20} />새 매칭 생성</ActionButton>` |

---

### 5.7 MappingDetailModal

**파일**: `frontend/src/components/admin/mapping/MappingDetailModal.js`

| 구분 | 교체 전 | 교체 후 |
|------|---------|---------|
| import | — | `StatusBadge`, `ActionButton` from `../../common` |
| getStatusBadge | `statusConfig` + `<span className={mg-v2-badge ${config.className}}>{label}</span>` | `<StatusBadge status={status} />` |
| getPaymentStatusBadge | (결제 상태 — PENDING/APPROVED/REJECTED) | StatusBadge `variant` 사용: PENDING→warning, APPROVED→success, REJECTED→danger. `children={label}` |
| actions 닫기 버튼 | `<button className="mg-v2-button mg-v2-button-secondary" onClick={onClose}>` | `<ActionButton variant="secondary" onClick={onClose}><XCircle size={18} />닫기</ActionButton>` |

**참고**: 탭 버튼(`mg-v2-ad-b0kla__pill`)은 B0KlA 전용 스타일이므로 ActionButton으로 교체하지 않음 (플랜 Phase 2 범위 외).

---

### 5.8 MappingEditModal

**파일**: `frontend/src/components/admin/MappingEditModal.js`

| 구분 | 교체 전 | 교체 후 |
|------|---------|---------|
| import | `MGButton`, `getMappingStatusKoreanNameSync` | `ActionButton`, `StatusBadge` from `../common` |
| getStatusBadgeClass | 삭제 | StatusBadge `status={mapping?.status}` 사용 |
| MGButton | `MGButton variant="primary"` 등 | `ActionButton variant="primary"` (size="sm"→size="small") |
| status 표시 | `getStatusBadgeClass` + className | `<StatusBadge status={mapping?.status} />` |

---

## 6. 적용 스킬·참조 문서

| 항목 | 경로 |
|------|------|
| 프론트엔드 | `/core-solution-frontend` |
| 아토믹 디자인 | `/core-solution-atomic-design` |
| 공통 UI 스펙 | `docs/design-system/v2/COMMON_UI_IMPLEMENTATION_SPEC.md` |
| 카드 시각 스펙 | `docs/design-system/v2/CARD_VISUAL_UNIFIED_SPEC.md` |
| 마이그레이션 플랜 | `docs/project-management/ATOMIC_DESIGN_FULL_MIGRATION_PLAN.md` |

---

## 7. 체크리스트 (core-coder 완료 시)

- [ ] ClientMappingTab: MAPPING_STATUS_* 삭제, StatusBadge·CardContainer 적용, CSS 선택자 변경
- [ ] MappingCard: StatusBadge·CardContainer·ActionButton 적용, MGButton 제거
- [ ] MappingListSection: ActionButton 적용
- [ ] MappingListRow: StatusBadge·ActionButton 적용, MGButton 제거
- [ ] MappingListBlock: ActionButton 적용
- [ ] MappingContentHeader: ActionButton 적용
- [ ] MappingDetailModal: StatusBadge·ActionButton 적용
- [ ] MappingEditModal: StatusBadge·ActionButton 적용, MGButton 제거
- [ ] 모든 변경 파일에서 hex 하드코딩 없음, `var(--mg-*)` 토큰만 사용
- [ ] 빌드·lint 통과

---

**문서 버전**: 1.0
