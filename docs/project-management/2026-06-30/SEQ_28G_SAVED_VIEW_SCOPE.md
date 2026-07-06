# Seq 28g — Saved View Scope (Phase 1)

**작성일**: 2026-07-06  
**담당**: core-planner  
**거버넌스**: [`ADMIN_IMPLEMENTATION_GOVERNANCE.md`](./ADMIN_IMPLEMENTATION_GOVERNANCE.md) · [`ADMIN_IMPLEMENTATION_PROGRESS_CHECKLIST.md`](./ADMIN_IMPLEMENTATION_PROGRESS_CHECKLIST.md)  
**선행**: Seq **28a** ☑ (`useViewModePreference` SSOT, PR #448 merged)

---

## 목표

G2·G1·통합일정 목록의 **필터·정렬·viewMode 조합**을 사용자·테넌트 단위로 저장·복원한다.  
**Phase 1**은 **localStorage stub only** — BE API·공유 Saved View·UI 없음.

---

## 범위 (Phase 1)

| 항목 | 내용 |
|------|------|
| **산출물** | `useSavedViewPreference` stub hook · 저장 키 SSOT · Jest 1 suite |
| **제외** | BE API · 공유 Saved View · 네이버·알림 API · 목록 UI(저장/불러오기 버튼) |
| **연동 시점** | 28b~28e merge 후 별도 PR로 화면 연동 |

### 대상 화면 (우선순위)

1. user-management (`client` / `consultant` / `staff`)
2. mapping-management
3. integrated-schedule sidebar

---

## 저장 키 SSOT

```
mg.savedView.v1:{tenantId}:{userId}:{pageId}
```

- `resolveViewModeStorageScope()` 재사용 (`useViewModePreference`와 동형)
- `tenantId` 없으면 read/write no-op (멀티테넌트 필수)

### payload 스키마 v1

```json
{
  "viewMode": "list | table | smallCard",
  "filters": {},
  "sort": {},
  "density": "comfortable | compact"
}
```

JSON 직렬화 · 필드 누락 시 default 병합.

---

## stub hook 설계 (coder 전달)

| 항목 | 내용 |
|------|------|
| **파일** | `frontend/src/hooks/useSavedViewPreference.js` (신규) |
| **export** | `buildSavedViewStorageKey`, `resolveSavedViewStorageScope`, `useSavedViewPreference` |
| **API** | `useSavedViewPreference({ pageId, defaultView })` → `{ savedView, setSavedView, clearSavedView }` |
| **안전** | SSR·sessionManager 미존재 시 no-op · JSON parse 실패 시 default fallback |
| **테스트** | Jest round-trip 1건 (키 생성 · read/write · clear) |

### 브랜치·PR

- 문서: `docs/28f-28h-batch` (본 문서, PR #453)
- 코드: `feat/28g-saved-view-stub` — **1 PR = 1 가설**, 최소 diff

---

## DoD (Phase 1 stub)

- [ ] `useSavedViewPreference.js` export 및 `buildSavedViewStorageKey` SSOT
- [ ] `resolveSavedViewStorageScope` → `resolveViewModeStorageScope` 재사용
- [ ] read/write/clear no-op-safe (tenantId null 시)
- [ ] Jest 1 suite PASS
- [ ] 체크리스트 Seq 28g ☑ (stub merge 후)

---

## 후속 (Phase 2+, 본 scope 제외)

- 화면별 `useSavedViewPreference` 연동 PR (28b~28e 완료 후)
- BE persisted Saved View API
- 테넌트·역할 공유 preset
