# 급여관리 "새 프로필 생성" 무반응 — 수정 계획 (기획·분배)

**참조**: [SALARY_NEW_PROFILE_NO_RESPONSE_DEBUG.md](./SALARY_NEW_PROFILE_NO_RESPONSE_DEBUG.md) (원인 분석·수정 제안)

---

## 1. 목표

- "새 프로필 생성" / "지금 프로필 작성하기" 버튼 클릭 시 **의도한 플로우로 동작**하도록 수정한다.
- 프로필 0개 상태에서도 **첫 프로필 작성**이 가능해야 하며, 기존 "편집" 버튼 동작은 유지한다.

---

## 2. 플로우 결정: **(A) 버튼 클릭 → 상담사 선택 단계 추가 후 모달 오픈**

| 선택지 | 내용 |
|--------|------|
| **(A)** | 버튼 클릭 시 **상담사 선택 단계**(모달/드롭다운)를 먼저 거친 뒤, 선택한 상담사로 `handleCreateProfile(consultant)` 호출 → 기존 프로필 폼 모달 오픈 |
| (B) | 모달이 consultant 없이도 열리게 하고, 모달 내부에 상담사 선택 드롭다운 추가 |
| (C) | 기타 (예: 상담사 1명일 때만 버튼 노출·자동 선택 등) |

**결정: (A)**

**결정 이유 (한두 줄)**  
기존 `handleCreateProfile(consultant)`와 `SalaryProfileFormModal`의 "consultant 필수" 계약을 그대로 활용할 수 있어 **모달 컴포넌트·저장 로직 변경이 없고**, "먼저 상담사 선택 → 프로필 폼" 2단계로 사용자 인지가 명확하며, 진입 경로(두 버튼)만 수정하면 된다.

---

## 3. 수정 범위 (core-coder 전달용)

### 3.1 수정할 파일

| 파일 | 역할 |
|------|------|
| `frontend/src/components/erp/SalaryManagement.js` | 진입 경로 수정 + 상담사 선택 단계 UI/상태 추가. **모달 내부(`SalaryProfileFormModal.js`)는 수정하지 않음.** |

### 3.2 진입 경로 vs 모달 내부

| 구분 | 내용 |
|------|------|
| **진입 경로** | "새 프로필 생성" 버튼(약 570행), "지금 프로필 작성하기" 버튼(약 585행). 현재 `onClick={() => setIsProfileFormOpen(true)}`만 호출 → **상담사 선택 단계를 거친 뒤** `handleCreateProfile(consultant)` 호출로 변경. |
| **모달 내부** | `SalaryProfileFormModal.js`는 **변경하지 않음**. `consultant` 없이 열리는 경우를 허용하지 않고, 상담사 선택은 **항상 부모(SalaryManagement)에서 완료한 뒤** 모달에 consultant를 넘기는 방식 유지. |

### 3.3 구현 요구사항 (요지)

- **상담사 선택 단계**:  
  - 두 버튼 클릭 시 **상담사 목록을 보여주는 소형 모달**(또는 드롭다운)을 연다.  
  - 목록은 기존 `consultants` 상태 사용. `consultants.length === 0`이면 선택 UI를 띄우지 않고, 이미 화면에 "상담사 데이터가 없습니다" 문구가 있으므로 필요 시 토스트 등으로 안내만 해도 됨.  
  - 사용자가 상담사 한 명을 선택하면 **해당 consultant로 `handleCreateProfile(consultant)` 호출** → 상담사 선택 모달 닫기 → 프로필 폼 모달(`SalaryProfileFormModal`)이 기존처럼 열리게 한다.
- **기존 동작 유지**:  
  - 카드별 "편집" 버튼은 계속 `onClick={() => handleCreateProfile(consultant)}` 그대로 사용(변경 없음).
- **공통 컴포넌트·표준**:  
  - 모달은 `UnifiedModal` 사용. 디자인 토큰·아토믹 디자인·프로젝트 표준 참조 (`/core-solution-unified-modal`, `/core-solution-frontend`).

### 3.4 체크리스트 (완료 기준)

- [ ] "새 프로필 생성" 클릭 시 상담사 선택 단계가 열리고, 선택 후 프로필 폼 모달이 열리는지 확인
- [ ] "지금 프로필 작성하기" 클릭 시 동일 플로우 적용 여부 확인
- [ ] 프로필 0개 상태에서 첫 프로필 작성이 가능한지 확인
- [ ] 기존 "편집" 버튼(카드 → handleCreateProfile) 동작이 유지되는지 확인
- [ ] 상담사 0명일 때 두 버튼 클릭 시 선택 UI를 띄우지 않거나, 안내 후 종료하는지 확인

---

## 4. 분배실행 — Phase별 서브에이전트 위임

| Phase | 담당 | 목표 | 호출 시 전달할 태스크 설명 (프롬프트 초안) |
|-------|------|------|--------------------------------------------|
| **Phase 1** | **core-coder** | (A) 플로우 구현: 버튼 클릭 → 상담사 선택 단계 → handleCreateProfile → 프로필 모달 오픈 | 아래 "5. core-coder 위임문" 전체를 전달. |

---

## 5. core-coder 위임문 (Phase 1 호출 시 전달용)

다음 내용을 **core-coder** 호출 시 프롬프트로 전달한다.

---

**태스크 요약**: 급여관리에서 "새 프로필 생성" / "지금 프로필 작성하기" 버튼이 클릭 시 무반응인 문제를 수정한다. 원인은 `SalaryProfileFormModal`이 `consultant`가 없으면 렌더하지 않는데, 두 버튼이 `setIsProfileFormOpen(true)`만 호출하고 `selectedConsultant`를 설정하지 않기 때문이다.

**기획 결정**: **(A) 버튼 클릭 → 상담사 선택 단계 추가 후 모달 오픈.**  
즉, 두 버튼 클릭 시 먼저 상담사 목록을 보여주는 소형 모달(또는 드롭다운)을 띄우고, 사용자가 상담사를 선택하면 기존 `handleCreateProfile(consultant)`를 호출해 프로필 폼 모달을 연다. `SalaryProfileFormModal.js`는 수정하지 않는다.

**참조 문서**  
- `docs/project-management/SALARY_NEW_PROFILE_NO_RESPONSE_DEBUG.md` (원인·코드 위치)  
- `docs/project-management/SALARY_NEW_PROFILE_FIX_PLAN.md` (본 계획서)

**수정할 파일**  
- `frontend/src/components/erp/SalaryManagement.js` 만 수정.

**구현 요구사항**  
1. "새 프로필 생성"(약 570행), "지금 프로필 작성하기"(약 585행)의 `onClick`을 변경: `setIsProfileFormOpen(true)` 직접 호출 대신, **상담사 선택 단계**를 띄우는 동작으로 바꾼다.  
2. 상담사 선택 단계: `consultants`를 사용해 목록을 보여주는 소형 모달(UnifiedModal 사용)을 추가한다. 목록에서 한 명 선택 시 `handleCreateProfile(selectedConsultant)` 호출 후 선택 모달을 닫고, 기존대로 프로필 폼 모달이 열리게 한다.  
3. `consultants.length === 0`일 때는 선택 모달을 띄우지 않거나, 띄운 경우 "상담사가 없습니다" 안내 후 닫기만 하도록 처리.  
4. 카드의 "편집" 버튼(`handleCreateProfile(consultant)` 호출)은 그대로 유지.  
5. 디자인·모달 표준: `/core-solution-unified-modal`, `/core-solution-frontend`, `unified-design-tokens.css` 참조.

**완료 기준(체크리스트)**  
- "새 프로필 생성" / "지금 프로필 작성하기" 클릭 → 상담사 선택 → 프로필 폼 모달 오픈  
- 프로필 0개에서 첫 프로필 작성 가능  
- "편집" 버튼 동작 유지  
- 상담사 0명일 때 처리 일관됨  

---

## 6. 실행 요청문 (호출 주체용)

**다음 순서로 서브에이전트를 호출해 주세요.**

1. **Phase 1 — core-coder**  
   - **전달 내용**: 위 "5. core-coder 위임문" 섹션 전체를 프롬프트로 전달.  
   - **적용 스킬**: `/core-solution-frontend`, `/core-solution-unified-modal`, `/core-solution-atomic-design`  
   - **완료 후**: 결과를 기획(core-planner)에게 보고. 체크리스트 기준으로 동작 검증 후 사용자에게 최종 보고.

---

*기획·분배: core-planner. 실제 구현·코드 수정: core-coder.*
