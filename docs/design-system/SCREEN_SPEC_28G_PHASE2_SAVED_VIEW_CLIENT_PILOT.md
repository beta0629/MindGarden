# Seq 28g Phase 2 — Saved View UI (Client Pilot) 화면설계

**작성일**: 2026-07-07  
**담당**: core-designer  
**관련**: Seq 28g Phase 2 (Client Pilot)  
**대상 화면**: `/admin/user-management?type=client` (`ClientComprehensiveManagement`)

---

## 1. 배경 및 목표

- **Phase 1 (완료)**: `useSavedViewPreference`를 통한 silent persist (UI 없음, 단일 상태 저장).
- **Phase 2 (현재)**: 명시적으로 필터+viewMode 조합을 이름 붙여 저장하고 불러오는 UI 추가.
- **제약 사항**:
  - Client 탭에만 Pilot 적용 (1 PR = 1 가설). Consultant/Staff 탭은 후속 PR에서 적용.
  - BE API 연동 및 테넌트/역할 간 공유 preset 없음 (Phase 3 이후).
  - 오직 현재 사용자의 로컬 환경(localStorage)에만 저장.

---

## 2. 사용자 관점 (UX)

1. **사용성**: 사용자는 현재 설정한 검색어, 필터, 정렬, 뷰 모드(List/Grid) 상태를 "이름"을 지정하여 저장할 수 있다.
2. **접근성**: 저장된 뷰는 필터 영역 상단에 Chip(알약) 형태 또는 드롭다운으로 노출되어 원클릭으로 불러올 수 있다.
3. **초기화**: '기본값' 또는 '초기화' 버튼을 통해 언제든 디폴트 상태로 돌아갈 수 있다.
4. **정보 노출**: 본인(tenant + userId) 스코프에만 한정.

---

## 3. 레이아웃 및 UI 스펙 (Pencil Design Guide 준수)

### 3.1 위치 (Layout)
- `ClientFilters.js` 내 `mg-v2-filters-section` 상단 또는 `ContentHeader` 하단 보조 행에 배치.
- **과하지 않게(Minimal)**: 기존 필터 UI를 해치지 않도록 높이 32px~40px 수준의 얇은 행(Row)으로 구성.

### 3.2 UI 컴포넌트 구성 (Atomic Design)

#### 1) `SavedViewControls` (Molecules)
- **역할**: Saved View 전체를 감싸는 컨테이너.
- **배치**: 가로 정렬(Flex Row), `gap: 8px`, `align-items: center`.
- **CSS 클래스**: `mg-v2-saved-view-controls`

#### 2) `SavedViewChip` (Atoms)
- **역할**: 개별 저장된 뷰를 나타내는 버튼.
- **스타일 (활성 - Active)**:
  - 배경: `var(--mg-color-primary-main)` (#3D5246)
  - 텍스트: `var(--mg-color-background-main)` (#FAF9F7), 12px, fontWeight 600
  - 테두리: 없음
  - Radius: 16px
  - Padding: 4px 12px
- **스타일 (비활성 - Inactive)**:
  - 배경: `var(--mg-color-surface-main)` (#F5F3EF)
  - 텍스트: `var(--mg-color-text-secondary)` (#5C6B61), 12px
  - 테두리: 1px solid `var(--mg-color-border-main)` (#D4CFC8)
  - Radius: 16px
  - Padding: 4px 12px

#### 3) `Save / Load / Clear` 액션 (Atoms/Molecules)
- **Save 버튼**: "현재 뷰 저장" (텍스트 버튼 또는 Icon 버튼). 클릭 시 이름 입력 모달/프롬프트 호출.
- **Load 드롭다운**: 저장된 뷰가 많을 경우(예: 4개 이상) Chip 대신 드롭다운으로 축약 노출.
- **Clear/Reset**: "기본값" Chip을 항상 맨 앞에 고정 배치하여 클릭 시 필터 초기화.

### 3.3 모달 (Save View Modal)
- 공통 모듈인 `UnifiedModal` 사용.
- **타이틀**: "현재 뷰 저장"
- **입력 폼**: 뷰 이름 (텍스트 인풋, 최대 20자)
- **버튼**: 취소(Outline) / 저장(Primary)

---

## 4. 데이터 스키마 및 SSOT

### 4.1 LocalStorage Key SSOT
Phase 1과 동일한 키 구조를 유지하되, 내부 페이로드 구조를 배열 형태로 확장.
```text
mg.savedView.v1:{tenantId}:{userId}:{pageId}
```

### 4.2 Named Views 배열 스키마 (v1)
기존 단일 객체에서 다중 뷰 관리 형태로 변경.
```json
{
  "activeViewId": "default",
  "views": [
    {
      "id": "default",
      "label": "기본값",
      "payload": {
        "viewMode": "list",
        "filters": {},
        "sort": {},
        "density": "comfortable"
      },
      "updatedAt": "2026-07-07T00:00:00Z",
      "isReadonly": true
    },
    {
      "id": "view_1712345678",
      "label": "미결제 내담자",
      "payload": {
        "viewMode": "list",
        "filters": { "status": "unpaid" },
        "sort": {},
        "density": "comfortable"
      },
      "updatedAt": "2026-07-07T00:05:00Z"
    }
  ]
}
```
- `id`: 고유 식별자 (timestamp 기반 등)
- `label`: 사용자가 지정한 뷰 이름
- `payload`: 필터, 정렬, 뷰 모드 상태 객체
- `updatedAt`: 최종 저장 시간

---

## 5. Jest Gate 항목 초안 (core-tester / core-coder 인계용)

1. **렌더링 테스트**: `ClientComprehensiveManagement` 렌더링 시 `SavedViewControls`가 정상적으로 표시되는가?
2. **기본값 테스트**: 초기 접속 시 '기본값' 뷰가 활성화 상태(Active)로 노출되는가?
3. **저장 기능 테스트**:
   - 필터 변경 후 '현재 뷰 저장' 클릭 시 모달이 뜨는가?
   - 이름 입력 후 저장 시 새로운 `SavedViewChip`이 렌더링되는가?
   - `localStorage`에 올바른 스키마(`id`, `label`, `payload`, `updatedAt`)로 저장되는가?
4. **불러오기 테스트**: 비활성 상태의 Chip 클릭 시 해당 `payload`의 필터와 뷰 모드가 화면에 즉시 반영되는가?
5. **초기화 테스트**: '기본값' Chip 클릭 시 모든 필터가 초기화되고 기본 뷰 모드로 돌아가는가?
6. **격리 테스트**: 다른 `tenantId` 또는 `userId`로 접근 시 이전 사용자의 저장된 뷰가 노출되지 않는가?

---

## 6. Must Not (금지 사항)
- **BE API 호출 금지**: 오직 `localStorage`만 사용한다.
- **테넌트/역할 공유 금지**: 현재 사용자의 로컬 스코프에만 한정한다.
- **Consultant / Staff 탭 적용 금지**: 본 PR(Phase 2)은 Client 탭 Pilot에만 집중한다.
- **임의의 CSS 색상 하드코딩 금지**: 반드시 `var(--mg-color-*)` 토큰을 사용한다.
- **코드 직접 작성 금지**: 본 문서는 화면 설계 스펙이며, 실제 구현은 `core-coder`에게 위임한다.
