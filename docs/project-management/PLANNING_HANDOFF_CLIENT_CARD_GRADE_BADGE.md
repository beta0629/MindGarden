# [기획 위임] 내담자·상담사 목록 작은 카드 — 배지 레이아웃 개선

**대상**: 코어 기획  
**등록일**: 2026-03-17  
**상태**: **옵션 B 채택** — 코어 코더 구현 위임  
**요약**: **내담자 목록** 및 **상담사 목록**의 **작은 카드(compact)** 에서 상태/등급·레벨 배지가 카드 밖으로 나가 레이아웃이 깨져 보이는 문제. **옵션 B(레이아웃 수정, 배지 유지)** 로 결정되었으며, 구현은 `TASK_CORE_CODER_COMPACT_CARD_BADGE_LAYOUT.md` 로 코어 코더에게 위임됨.

---

## 1. 현상

### 1.1 내담자 목록 (작은 카드)

- **화면**: 내담자 목록 (`내담자 목록`) — 그리드에서 **작은 카드** 뷰일 때
- **위치**: 각 내담자 카드 우측 상단, `활성` 상태 뱃지 오른쪽에 **등급 뱃지** (예: `👤 브론즈`)
- **증상**: 등급 뱃지가 카드 오른쪽 경계에 붙거나 밖으로 나가 **깨져 보임**. 컴팩트 카드 폭이 좁은데 상태 뱃지 + 등급 뱃지가 함께 들어가 공간 부족.

### 1.2 상담사 목록 (작은 카드)

- **화면**: 상담사 목록 — 그리드에서 **작은 카드** 뷰일 때
- **위치**: 각 상담사 카드 우측 상단, **레벨 뱃지**(예: `주니어 상담사`, `마스터 상담사`) + **상태 뱃지**(`활성`)
- **증상**: 레벨 뱃지 + 상태 뱃지가 카드 밖으로 나가거나 오른쪽 경계에 밀려 **깨져 보임**. 내담자 카드와 동일한 레이아웃 한계.

### 1.3 기술 정보 (재현·수정 시 참고)

| 구분 | DOM | 컴포넌트 | 뷰 모드 |
|------|-----|----------|---------|
| **내담자** | `.mg-v2-profile-card--compact` > `.__header` > `.__badges` > `span.mg-v2-grade-badge` | `ClientComprehensiveManagement/ClientOverviewTab.js` — `renderCompactClientCard()` | `viewMode === 'smallCard'` |
| **상담사** | `.mg-v2-profile-card--compact` > `.__header` > `.__badges` > `span.mg-v2-consultant-level-badge` + `span.mg-v2-status-badge` | `ConsultantComprehensiveManagement.js` — smallCard 그리드 내 compact 카드 (2곳: 사용자 관리 탭, 상담사 목록 섹션) | `viewMode === 'smallCard'` |
| **공통 스타일** | `ProfileCard.css` — `.mg-v2-profile-card--compact`, `.mg-v2-profile-card__badges` |

---

## 2. 개선 방향 제안 (기획 결정 요청)

아래 중 **하나를 선택**해 주시거나, 동의하는 방향으로 정리해 주시면 됩니다.  
**적용 범위**: 내담자·상담사 **둘 다** 동일 정책 적용 권장 (컴팩트 카드 공통 스펙).

### 옵션 A: 작은 카드에서 등급/레벨 뱃지 제거

- **내용**: 컴팩트 카드에는 **상태 뱃지(활성 등)** 만 노출하고, **내담자 등급(👤 브론즈)**·**상담사 레벨(주니어/마스터 상담사)** 는 표시하지 않음.
- **장점**: 레이아웃 깨짐 즉시 해소, 구현 단순, 내담자·상담사 카드 정책 통일.
- **단점**: 작은 카드만 보는 사용자는 목록에서 등급/레벨을 알 수 없음 (상세/리스트 뷰에서는 유지 가능).

### 옵션 B: 레이아웃 변경 (등급·레벨 유지)

- **내용**: 등급·레벨은 유지하되, 카드 안에서 넘치지 않도록 레이아웃 조정.
  - 예: 뱃지 영역 줄바꿈 허용, 등급/레벨만 아이콘 또는 약어 표시, 폰트/패딩 축소, 카드 최소 폭 조정 등.
- **장점**: 목록에서도 등급·레벨 정보 유지.
- **단점**: 디자인·여백 규칙에 맞게 구체 레이아웃을 기획·확정해야 함.

### 옵션 C: 기획另行 제안

- **내용**: A/B 외에 “등급/레벨 표시 방식”, “작은 카드에 넣을 정보 범위” 등 다른 기준으로 제안해 주시면, 그에 맞춰 수정 방향 정리.

---

## 3. 위임 요청 사항

1. **방향 결정**: 위 옵션 A/B/C 중 채택할 방향(또는 구체 제안)을 정해 주세요. (내담자·상담사 동일 적용 권장)
2. **수정 범위**: 결정된 방향에 따른 **UI/UX 스펙**(작은 카드에 무엇을 표시할지, 등급/레벨 표시 여부·형태)을 정리해 주시면, 개발에서 **내담자·상담사 목록 모두** 반영하겠습니다.
3. **우선순위**: 배포 일정에 맞춰 우선순위(즉시 반영 vs 다음 스프린트 등)를 알려 주시면 일정 반영하겠습니다.

결정 내용은 이 문서에 요약해 두거나, 별도 기획 문서/이슈로 정리해 주시면 됩니다.

---

## 3.1 구현 위임 (옵션 B 채택 시)

- **옵션 B** 로 진행: 레이아웃만 수정하여 배지를 카드 안에 보이게 함.
- **실행 위임**: 코어 코더 — 작업 명세는 **`TASK_CORE_CODER_COMPACT_CARD_BADGE_LAYOUT.md`** 참고.

---

## 4. 참고 파일

| 구분 | 경로 |
|------|------|
| **내담자** 컴포넌트 | `frontend/src/components/admin/ClientComprehensiveManagement/ClientOverviewTab.js` |
| **상담사** 컴포넌트 | `frontend/src/components/admin/ConsultantComprehensiveManagement.js` (smallCard 그리드 렌더 부분 2곳) |
| 공통 스타일 | `frontend/src/components/admin/ProfileCard.css` (`.mg-v2-profile-card--compact`, `.mg-v2-profile-card__badges`) |
| 내담자 등급 유틸 | `frontend/src/utils/codeHelper.js` (`getUserGradeKoreanNameSync`, `getUserGradeIconSync`) |
| 상담사 레벨 표시 | `ConsultantComprehensiveManagement.js` 내 `getConsultantBadgeDisplay()` 사용 |
