# [코어 코더 위임] 내담자·상담사 컴팩트 카드 — 배지 레이아웃 수정 (옵션 B)

**대상**: 코어 코더  
**등록일**: 2026-03-17  
**결정**: 기획에서 **옵션 B(레이아웃 변경, 배지 유지)** 채택  
**목표**: 작은 카드(compact)에서 **등급/레벨·상태 배지가 카드 안에 들어가 보이도록** 레이아웃만 수정. 배지 제거 없음.

---

## 1. 요구사항

- **적용 범위**: **내담자 목록** + **상담사 목록** 작은 카드 뷰 (`viewMode === 'smallCard'`)
- **조건**: 
  - 내담자: 상태 뱃지(활성) + 등급 뱃지(👤 브론즈 등) **둘 다 유지**
  - 상담사: 레벨 뱃지(주니어/마스터 상담사 등) + 상태 뱃지(활성) **둘 다 유지**
- **결과**: 배지가 카드 밖으로 나가지 않고, 카드 경계 안에서 여유 있게 보여야 함.

---

## 2. 수정 범위 (파일)

| 구분 | 경로 | 수정 내용 |
|------|------|-----------|
| **공통 스타일** | `frontend/src/components/admin/ProfileCard.css` | `.mg-v2-profile-card--compact` 및 하위 `.mg-v2-profile-card__header`, `.__badges` 등 compact 전용 레이아웃 추가/수정 |
| (참고) 그리드 | `frontend/src/components/common/ListBlockView.css` | 필요 시 `.mg-v2-list-block__grid--small` 카드 최소 폭 등만 조정 (선택) |

**컴포넌트 JS/JSX 수정 없음** 목표. 레이아웃은 **CSS만**으로 해결 (flex 줄바꿈, min-width, 배지 영역 너비 제한 등).

---

## 3. 구현 힌트

- **원인**: compact에서 `.__badges`가 `flex-shrink: 0`이고 `.__info`가 flex로 공간을 많이 쓰면, 좁은 카드에서 배지가 오른쪽으로 밀려 나감.
- **가능한 방향 (택일 또는 조합)**  
  - **A.** `.mg-v2-profile-card--compact .mg-v2-profile-card__info`에 `min-width: 0` 부여해 flex 자식이 줄어들 수 있게 하기.  
  - **B.** compact에서 `.__header`를 `flex-wrap: wrap`으로 두고, `.__badges`가 두 번째 줄로 내려가도 되도록 하기 (배지 영역을 100% 너비 또는 새 줄로).  
  - **C.** compact에서만 배지 폰트/패딩을 소폭 축소해 공간 확보 (가독성 유지 범위 내).  
  - **D.** `.mg-v2-list-block__grid--small .mg-v2-profile-card--compact`에 `min-width`를 주어 카드가 너무 좁아지지 않게 하기.

위 조합으로 **배지가 카드 밖으로 나가지 않고, 두 배지 모두 읽기 쉽게** 보이면 됨.

---

## 4. 완료 기준

- [ ] 내담자 목록 → 작은 카드 뷰에서 상태 뱃지 + 등급 뱃지가 카드 경계 안에 표시됨.
- [ ] 상담사 목록 → 작은 카드 뷰에서 레벨 뱃지 + 상태 뱃지가 카드 경계 안에 표시됨.
- [ ] 다양한 해상도(좁은 그리드 컬럼 수)에서도 오버플로우 없음.
- [ ] 기존 큰 카드/리스트 뷰 스타일은 변경 없음.

---

## 5. 참고

- 기획 배경: `docs/project-management/PLANNING_HANDOFF_CLIENT_CARD_GRADE_BADGE.md` (옵션 B 채택)
- 내담자 compact: `ClientComprehensiveManagement/ClientOverviewTab.js` — `renderCompactClientCard()`
- 상담사 compact: `ConsultantComprehensiveManagement.js` — smallCard 그리드 내 `mg-v2-profile-card--compact` (2곳)
