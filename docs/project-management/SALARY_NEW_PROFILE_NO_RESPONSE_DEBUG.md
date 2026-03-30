# 급여관리 "새 프로필 생성" / "지금 프로필 작성하기" 버튼 무반응 — 원인 분석·수정 제안

## 1. 증상

- **화면**: 급여·세금 관리 (SalaryManagement)
- **동작**: "새 프로필 생성" 또는 "지금 프로필 작성하기" 버튼 클릭 시 **아무 반응 없음** (모달이 열리지 않음)

---

## 2. 근본 원인

| 구분 | 내용 |
|------|------|
| **직접 원인** | `SalaryProfileFormModal`이 `consultant`가 없으면 렌더하지 않음. 334행: `if (!isOpen \|\| !consultant) return null;` |
| **연쇄 원인** | "새 프로필 생성"·"지금 프로필 작성하기" 버튼은 `setIsProfileFormOpen(true)`만 호출하고 **`selectedConsultant`를 설정하지 않음**. 모달에는 `consultant={selectedConsultant}`로 전달되므로, 이 진입 경로에서는 항상 `consultant === null` → 모달이 항상 `null` 반환. |

**한 줄 요약**: 새 프로필 버튼이 `consultant`를 설정하지 않아, 모달이 "열림+상담사 없음" 상태에서 조건부로 아예 렌더되지 않아 사용자에게는 "클릭해도 아무 일도 안 일어남"으로 보임.

---

## 3. 코드 상 추적 요약

| 파일 | 위치 | 확인 내용 |
|------|------|-----------|
| `SalaryManagement.js` | 570, 585행 | "새 프로필 생성" / "지금 프로필 작성하기" → `onClick={() => setIsProfileFormOpen(true)}` 만 호출 |
| `SalaryManagement.js` | 273–276행 | `handleCreateProfile(consultant)` 는 `setSelectedConsultant(consultant)` 후 `setIsProfileFormOpen(true)` 호출 → **상담사 지정 후 열기** |
| `SalaryManagement.js` | 630행 | 카드별 "편집" 버튼 → `onClick={() => handleCreateProfile(consultant)}` → 이 경로에선 모달 정상 오픈 |
| `SalaryManagement.js` | 901–906행 | `SalaryProfileFormModal` 에 `consultant={selectedConsultant}` 전달 |
| `SalaryProfileFormModal.js` | 334행 | `if (!isOpen \|\| !consultant) return null;` → consultant 없으면 모달 미렌더 |

---

## 4. 추가로 확인할 수 있는 지점

- **다른 진입 경로**: 상담사 카드가 있을 때 **"편집"** 버튼은 `handleCreateProfile(consultant)`를 사용하므로, 해당 경로에서는 모달이 정상 오픈됨. 즉 "무반응"은 **상담사가 선택되지 않은 채로 모달을 열려는 두 버튼에만** 해당.
- **handleCreateProfile**: 이미 "편집"에서 사용 중이며, 동작은 정상. "새 프로필 생성"·"지금 프로필 작성하기"에서 이 핸들러를 쓰지 않는 것이 불일치의 원인.
- **프로필 0개일 때**: `salaryProfiles.length === 0` 이면 카드가 없어 "편집"이 없고, 사용 가능한 진입은 위 두 버튼뿐이라 **첫 프로필 작성 시 항상 무반응**이 됨.

---

## 5. 수정 방안 (2~3줄)

1. **최소 수정**: "새 프로필 생성"·"지금 프로필 작성하기" 클릭 시 **상담사 선택 단계**를 한 번 거치게 하거나, **모달을 열기 전에 `selectedConsultant`를 설정**하도록 변경. (예: 첫 번째 상담사 자동 선택, 또는 상담사 선택 모달/드롭다운 노출 후 `handleCreateProfile(consultant)` 호출.)
2. **모달 쪽 대안**: `consultant`가 없을 때도 모달을 열고, **모달 내부에 상담사 선택 드롭다운**을 두어 "누구의 프로필을 만들지"를 모달 안에서 선택하게 하는 방식. 이 경우 `SalaryProfileFormModal`의 `!consultant` 시 `return null` 조건을 완화하고, consultant가 없을 때의 UI·저장 로직을 추가해야 함.

---

## 6. 기획 위임용 요약 (core-planner · UX·플로우 결정)

- **현상**: 새 프로필 버튼은 `consultant`를 넘기지 않아, 모달이 렌더 조건(`!consultant`)에 걸려 열리지 않음. 따라서 **근본적으로 "새 프로필을 누구에게 만들지"를 정하는 UX가 빠져 있음**.
- **선택지 요약**  
  - **(A) 버튼 클릭 → 상담사 선택 단계 추가 후 모달 오픈**  
    - 예: 클릭 시 상담사 목록 모달/드롭다운을 먼저 띄우고, 선택 시 `handleCreateProfile(selectedConsultant)` 호출해 기존 모달 오픈.  
  - **(B) 모달이 consultant 없이도 열리게 하고, 모달 내부에서 상담사 선택**  
    - 모달 진입 시 consultant 없음 허용, 모달 내 상담사 선택 드롭다운 노출 후 "선택한 상담사" 기준으로 프로필 생성.  
  - **(C) 기타**  
    - 예: 상담사 1명일 때만 "새 프로필 생성" 노출하고 자동 선택 등.
- **정리**: (A)는 "선택 → 모달" 2단계로 명확하고 기존 `handleCreateProfile`과 일치. (B)는 한 화면에서 끝나지만 모달 컴포넌트·저장 로직 변경이 필요. **기획(core-planner)에서 (A)/(B)/(C) 중 플로우를 정한 뒤, core-coder에 수정 범위(진입 경로 vs 모달 내부) 전달**하면 됨.

---

## 6.1 기획 결정·수정 계획 (추가)

**플로우 결정 및 core-coder 위임문**은 별도 계획서에 정리되어 있습니다.

- **계획서**: [SALARY_NEW_PROFILE_FIX_PLAN.md](./SALARY_NEW_PROFILE_FIX_PLAN.md)
- **결정**: **(A) 버튼 클릭 → 상담사 선택 단계 추가 후 모달 오픈**
- **Phase**: Phase 1 — core-coder 위임문 포함. 호출 시 해당 문서 §5(위임문)를 전달하면 됨.

---

## 7. 수정 후 체크리스트

- [ ] "새 프로필 생성" 클릭 시 상담사 선택 또는 모달이 의도한 플로우로 열리는지 확인
- [ ] "지금 프로필 작성하기" 클릭 시 동일 플로우 적용 여부 확인
- [ ] 프로필 0개 상태에서 첫 프로필 작성이 가능한지 확인
- [ ] 기존 "편집" 버튼(카드 → handleCreateProfile) 동작이 유지되는지 확인
