# 급여 관리 상담사 카드 → ConsultantCard 통일 검토·제안

**목표**: SalaryManagement.js "급여 프로필" 탭의 salary-profile-card를 공통 `ConsultantCard` 기반으로 전환.

**검토일**: 2025-03-19  
**역할**: core-component-manager (검토·제안만, 코드 수정 없음)

---

## 1. 현재 급여 탭 카드 구조 (SalaryManagement.js)

| 구분 | 위치 | 클래스 | 표시 필드 | 액션 |
|------|------|--------|-----------|------|
| **컴팩트 그리드** | `profileViewMode === 'smallCard'` → `SmallCardGrid` 내부 (라인 651~714) | `mg-v2-ad-b0kla__card salary-profile-card salary-profile-card--compact` | 이름(`salary-profile-card__name`), 이메일(`__meta`), 등급(`__grade`: "등급: {grade}"), 기본급(`__base`: label + formatCurrency) | 카드 전체 클릭 → `openModal(consultant)`; 하단 "편집" 버튼 → `handleCreateProfile(consultant)` (zIndex:2로 버튼만 클릭 가능) |
| **일반 그리드** | `profileViewMode` 기본(카드 뷰) → `salary-profile-block__grid` 내부 (라인 706~752) | `mg-v2-ad-b0kla__card salary-profile-card` | 동일: 이름, 이메일, 등급, 기본급 | "프로필 조회" → `openModal(consultant)`; "편집" → `handleCreateProfile(consultant)` |

- **데이터**: `consultants` 순회, `salaryProfiles.find(p => p.consultantId === consultant.id)` 로 기본급 매핑.
- **접근성**: compact는 `aria-labelledby={profile-name-sm-{id}}`, 일반은 `profile-name-{id}`. 전체 클릭용 버튼에 `aria-label`.

---

## 2. ConsultantCard 재사용 시 제안

### 2.1 variant: `salary-profile` 신규 추가 권장

- **권고**: **`variant="salary-profile"` 를 ConsultantCard에 새로 두는 것이 적절**합니다.
- **이유**:  
  - 기존 `compact`는 평점/슬롯 개수 등 스케줄·상담 맥락 메타를 쓰고, 급여 탭은 등급·기본급이라는 **도메인·표시 필드가 다름**.  
  - `compact`를 확장하면 "등급/기본급이 있을 때만 표시" 같은 분기로 **variant 의미가 흐려지고** 다른 사용처(예: ConsultantSelectionStep)에 영향 줄 수 있음.  
  - `schedule-select`처럼 **용도별 variant**를 두는 현재 패턴과 맞고, CSS도 `.mg-consultant-card--salary-profile` 로 명확히 분리 가능.

### 2.2 등급·기본급 노출용 props 제안

- **제안**: **전용 props** 로 넘기는 방식 권장.
  - `grade?: string` — 없으면 "—" 또는 미표시.
  - `baseSalary?: number | null` — 있으면 ConsultantCard 내부에서 `formatCurrency` 적용 (또는 `formattedBaseSalary?: string` 으로 포맷된 문자열만 넘기면 포맷터 의존성은 SalaryManagement에 유지).
- **대안**: `extraMeta?: ReactNode` 한 개로 "등급: A / 기본급: 3,000,000원" 같은 블록을 통째로 주입. 유연하지만 스타일·접근성 일관성을 카드 내부에서 맞추기 어렵고, 포맷이 화면마다 달라질 수 있음.
- **정리**: **`grade` + `baseSalary`(또는 `formattedBaseSalary`) 전용 props** 로 메타/서브타이틀 영역에 표시하는 쪽을 권장. (포맷터 위치는 팀 정책에 따라 `formatCurrency`를 공통 유틸로 쓸지 여부만 결정하면 됨.)

### 2.3 편집/프로필 조회 버튼 주입 방식 제안

- **제안**: **`renderActions?: (consultant) => ReactNode`** 한 가지로 통일 권장.
  - 이유:  
    - compact 뷰는 "편집"만, 일반 뷰는 "프로필 조회" + "편집"으로 **액션 구성이 뷰마다 다름**.  
    - `actionButtons` 배열 prop은 버튼 종류·순서·핸들러를 객체 배열로 넘기게 되면 스키마가 복잡해지고, "카드 전체 클릭" 같은 동작은 여전히 별도 prop이 필요.  
  - **renderActions** 로 하면 SalaryManagement에서 `openModal`/`handleCreateProfile` 를 그대로 닫힌 변수로 사용해 버튼을 만들 수 있고, compact일 때는 "편집"만, 일반일 때는 "프로필 조회"+"편집"을 넣으면 됨.
  - ConsultantCard 내부: `variant="salary-profile"` 일 때 `showActions === true` 이면 기본 "선택하기/상세보기" 대신 **renderActions(consultant) 결과**를 액션 영역에 렌더. (상세보기 모달은 "프로필 조회"가 곧 상세이면 renderActions 쪽에서 모달 트리거 가능하므로, ConsultantCard의 기본 상세 모달은 salary-profile에서는 사용 안 하거나 optional로 둠.)

- **요약**: **`renderActions(consultant) => ReactNode`** 사용.  
  - optional: 카드 전체 클릭 동작이 필요할 때(compact)는 **`onCardClick?: (consultant) => void`** 같은 prop을 추가해, salary-profile compact에서만 `onCardClick={openModal}` 로 설정.

---

## 3. 중복·적재적소 및 제거 범위

- **다른 파일 사용 여부**:  
  - **`salary-profile-card`** 클래스는 **SalaryManagement.js**와 **SalaryManagement.css** 에만 사용됨.  
  - ConsultantProfileModal / SalaryProfileFormModal 의 `salary-profile-form`, `salary-profile-modal-content` 등은 **폼/모달용**으로 카드와 무관.
- **통일 후 제거할 마크업·스타일 범위 (한 줄 정리)**  
  - **JS**: `SalaryManagement.js` 내 `SmallCardGrid` 및 일반 그리드에서 사용하는 `<article className="... salary-profile-card ...">` 블록 전체(라인 656~711, 710~750 부근)와 그 안의 `salary-profile-card__*` div들, 전체 클릭용 `<button className="salary-profile-card__open-btn">`.  
  - **CSS**: `SalaryManagement.css` 에서 `.salary-profile-card`, `.salary-profile-card:hover`, `.salary-profile-card__accent`, `__name`, `__meta`, `__grade`, `__base`, `__base .salary-management__stat-value`, `__actions` 블록 제거. (`.salary-profile-block__grid` 등 블록 단위 클래스는 그리드 레이아웃용이므로 유지.)

---

## 4. core-coder 구현 체크리스트 (요약)

1. **ConsultantCard.js**  
   - `variant="salary-profile"` 분기 추가.  
   - props: `grade?`, `baseSalary?`(또는 `formattedBaseSalary?`), `renderActions?(consultant) => ReactNode`, 필요 시 `onCardClick?(consultant) => void`.  
   - salary-profile 뷰: 메타/서브타이틀 영역에 등급·기본급 표시; 액션 영역은 `renderActions` 있으면 그대로 렌더, 없으면 비움 또는 기본 숨김.  
   - (선택) salary-profile 에서는 ConsultantDetailModal 자동 노출 안 하도록 플래그 또는 renderActions 사용 시 상세는 호출처에서만 담당.

2. **SalaryManagement.js**  
   - 급여 프로필 탭의 두 뷰(smallCard / 기본 카드)에서 `<ConsultantCard variant="salary-profile" consultant={...} grade={...} baseSalary={profile?.baseSalary} renderActions={...} onCardClick={smallCard 시에만 openModal} />` 형태로 교체.  
   - `SmallCardGrid` / `salary-profile-block__grid` 구조는 유지, 그 안만 ConsultantCard로 교체.

3. **SalaryManagement.css**  
   - `.salary-profile-card` 및 `.salary-profile-card__*` 관련 규칙 전부 삭제.  
   - ConsultantCard 쪽에 `.mg-consultant-card--salary-profile` 스타일이 필요하면 `ConsultantCard` 관련 CSS 파일 또는 디자인 시스템 쪽에 추가.

4. **인벤토리**  
   - 통일 적용 후 `docs/project-management/COMPONENT_INVENTORY.md`(또는 동일 목적 문서)에 ConsultantCard variant `salary-profile` 사용처: SalaryManagement 급여 프로필 탭 으로 반영.

---

*문서 끝. 실제 코드 변경은 core-coder가 수행.*
