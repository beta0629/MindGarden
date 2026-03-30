# BUG: 급여 프로필 모달 React #31 (Promise as React child)

**문서 유형**: 버그 분석·수정 제안  
**작성**: core-debugger  
**상태**: 검증 완료, 수정 Phase 배정 대기  
**관련 파일**: `frontend/src/components/erp/SalaryProfileFormModal.js`

---

## 1. 증상 요약

| 항목 | 내용 |
|------|------|
| **화면** | 급여 프로필 등록 시 상담사를 선택(클릭)한 직후 |
| **에러 메시지** | `Minified React error #31; args[]=[object Promise]` |
| **의미** | React error #31 = "Objects are not valid as a React child" — **Promise 객체가 React 자식으로 렌더되려 함** |

---

## 2. 코드 기준 검증 결과 (추정 원인 확인)

### 2.1 JSX에서 async 함수 직접 호출 → Promise 렌더

**파일**: `frontend/src/components/erp/SalaryProfileFormModal.js`

- **351행**  
  `{convertGradeToKorean(consultant.grade)}`  
  - `convertGradeToKorean`는 **async** (35~49행). 호출 시 **Promise** 반환.  
  - JSX는 문자열/숫자 등만 자식으로 허용하므로, Promise가 들어가면 React #31 발생. **원인 1.**

- **352행**  
  `{getGradeBaseSalary(formData.grade || consultant.grade).toLocaleString()}원`  
  - `getGradeBaseSalary`는 **async** (52~60행). 호출 시 **Promise** 반환.  
  - `Promise.toLocaleString()`은 Promise 객체의 메서드 호출이라 의도한 “숫자 포맷”이 아니며, 표현식 결과가 React에 전달될 때 Promise가 노출되면 #31 발생. **원인 2.**

### 2.2 초기화·등급 변경 시 await 없이 Promise를 state에 저장

- **204~205행** `initializeFormData()`  
  ```js
  const baseSalary = getGradeBaseSalary(consultant.grade);  // await 없음 → Promise
  setFormData({ ..., baseSalary: baseSalary });            // formData.baseSalary = Promise
  ```  
  - `formData.baseSalary`에 **Promise**가 들어감.  
  - 328행 `value={formData.baseSalary}` 등에서 사용 시 객체(Promise)가 노출될 수 있어 **원인 3.**

- **221~229행** `handleGradeChange(newGrade)`  
  ```js
  const baseSalary = getGradeBaseSalary(newGrade);  // await 없음 → Promise
  setFormData(prev => ({ ...prev, grade: newGrade, baseSalary: baseSalary }));
  ```  
  - 동일하게 `baseSalary`에 Promise가 들어가 **보조 원인.**

### 2.3 근거: 공통 유틸이 async

- `frontend/src/utils/commonCodeUtils.js`  
  - `getGradeSalaryMap` (86행): **async** → 네트워크/캐시 조회.  
  - `getGradeKoreanName` (122행): **async** → `getCodeLabel` 호출.  
- 따라서 `getGradeBaseSalary`, `convertGradeToKorean`를 async로 둔 설계가 맞고, **사용처에서만** await/비동기 결과를 state로 넣고 렌더해야 함.

**결론**: 제시된 추정 원인(JSX에서 async 직접 호출 2곳, initializeFormData/handleGradeChange에서 await 미사용)이 **코드 기준으로 모두 맞음.**

---

## 3. 재현 절차 (1~3문장)

1. 급여(ERP) 화면에서 **급여 프로필 등록**을 연다.  
2. **상담사를 한 명 선택(클릭)**하여 `SalaryProfileFormModal`이 열리면, 모달이 열리는 순간 `initializeFormData()`와 첫 렌더가 실행된다.  
3. 이때 351·352행에서 `convertGradeToKorean`, `getGradeBaseSalary`가 JSX 안에서 호출되어 Promise가 자식으로 들어가고, `formData.baseSalary`에도 Promise가 들어가므로 **React #31**이 발생한다.

---

## 4. 수정 방향 제안 (core-coder용)

- **원칙**: async 결과는 **렌더 경로 밖**에서 처리하고, **state**를 통해 문자열/숫자만 JSX에 전달.

### 4.1 “현재 등급 한글명” 표시

- **방법**: `consultant.grade`에 대응하는 한글명을 보관하는 state 추가 (예: `gradeLabel`, 초기값 `''`).
- **처리**:  
  - `useEffect`에서 `consultant`/`formData.grade` 변경 시 `convertGradeToKorean(grade)`를 **await**한 뒤 `setGradeLabel(한글명)` 호출.  
  - JSX 351행: `{convertGradeToKorean(consultant.grade)}` → **`{gradeLabel}`** 로 교체 (로딩 중이면 `'조회 중...'` 등 처리 가능).

### 4.2 “기본 급여” 표시 (상담사 정보 섹션)

- **방법**: 표시용 기본 급여를 보관하는 state 추가 (예: `displayBaseSalary`, 숫자 또는 null).
- **처리**:  
  - 동일 `useEffect`(또는 동일 의존성의 다른 effect)에서 `getGradeBaseSalary(grade)`를 **await**한 뒤 `setDisplayBaseSalary(숫자)` 호출.  
  - JSX 352행: `{getGradeBaseSalary(...).toLocaleString()}원` → **`{displayBaseSalary != null ? displayBaseSalary.toLocaleString() : '—'}원`** 형태로 교체.

### 4.3 `initializeFormData`

- **변경**: `initializeFormData`를 **async**로 만들고, 내부에서  
  `const baseSalary = await getGradeBaseSalary(consultant.grade);`  
  후 `setFormData({ ..., baseSalary })` 호출.  
- **호출처**: `useEffect`에서 `initializeFormData()` 호출 시 **await** (또는 void로 fire-and-forget이어도 되나, 그 경우 `setFormData`가 비동기로 한 번 더 일어나므로 의존성/타이밍 주의).

### 4.4 `handleGradeChange`

- **변경**:  
  `const baseSalary = await getGradeBaseSalary(newGrade);`  
  후 `setFormData(prev => ({ ...prev, grade: newGrade, baseSalary }))` 및 `setSelectedOptions(gradeOptions)` 호출.  
- 이미 `handleGradeChange`는 async이므로 내부에 await만 추가하면 됨.

### 4.5 기타

- `formData.baseSalary`는 **숫자만** 들어가도록 보장 (초기값 0, async 결과만 set).  
- `ConsultationCompletionStatsView.js` 136행의 `convertGradeToKorean(stat.grade)` 사용처도, 해당 함수가 async라면 동일 이슈 가능성 있음 — 필요 시 별도 이슈로 검토 권장.

---

## 5. 수정 체크리스트

- [ ] `SalaryProfileFormModal.js`에 `gradeLabel`, `displayBaseSalary` state 추가 및 초기값 설정.
- [ ] 351행: `{convertGradeToKorean(consultant.grade)}` 제거, `{gradeLabel}`(또는 로딩 처리)로 교체.
- [ ] 352행: `getGradeBaseSalary(...).toLocaleString()` 제거, `displayBaseSalary` 기반 표시로 교체.
- [ ] `useEffect`에서 `consultant`/`formData.grade` 변경 시 `convertGradeToKorean`·`getGradeBaseSalary`를 await 후 위 state 업데이트.
- [ ] `initializeFormData`를 async로 변경하고, `getGradeBaseSalary(consultant.grade)`를 **await** 후 `setFormData`에 숫자만 넣기.
- [ ] `handleGradeChange`에서 `getGradeBaseSalary(newGrade)`를 **await** 후 `setFormData`에 숫자만 넣기.
- [ ] 모달을 연 뒤 상담사 선택 시 React #31 미발생 확인.
- [ ] 등급 변경 시 기본 급여·한글 등급명이 정상 반영되는지 확인.
- [ ] (선택) `ConsultationCompletionStatsView.js`의 `convertGradeToKorean` 사용처 동일 이슈 여부 확인.

---

## 6. Phase 및 담당 (기획 배정)

**결정**: 수정 범위가 `SalaryProfileFormModal.js` 한 파일이며, state 추가 → useEffect → JSX 교체 → initializeFormData/handleGradeChange 수정이 서로 연결되어 있으므로 **1개 Phase**로 처리.

| Phase | 담당 | 목표 | 호출 시 전달할 프롬프트 요약 |
|-------|------|------|-----------------------------|
| **Phase 1** | **core-coder** | React #31 제거 및 async 결과를 state로만 렌더하도록 수정 | 아래 실행 지시문 참조 |

### 실행 지시문 (core-coder 호출용)

다음 프롬프트로 **core-coder**를 한 번 호출하세요.

---

**프롬프트 요약 (core-coder에 전달)**

```
docs/project-management/BUG_SALARY_PROFILE_MODAL_REACT31.md 의 버그를 수정해 주세요.

- 대상: frontend/src/components/erp/SalaryProfileFormModal.js
- 원인: async 함수(convertGradeToKorean, getGradeBaseSalary)를 JSX/동기 로직에서 직접 호출해 Promise가 렌더되거나 formData에 들어감 → React error #31.
- 수정 요청:
  1. gradeLabel, displayBaseSalary state 추가. useEffect에서 consultant/formData.grade 변경 시 convertGradeToKorean·getGradeBaseSalary를 await 후 setState.
  2. JSX 351행: {convertGradeToKorean(consultant.grade)} → {gradeLabel}(로딩 시 처리).
  3. JSX 352행: getGradeBaseSalary(...).toLocaleString() → displayBaseSalary 기반 표시.
  4. initializeFormData를 async로 하고 getGradeBaseSalary(consultant.grade) await 후 setFormData에 숫자만.
  5. handleGradeChange에서 getGradeBaseSalary(newGrade) await 후 setFormData에 숫자만.
- 완료 기준: 문서 §5 체크리스트 충족, 모달에서 상담사 선택·등급 변경 시 React #31 미발생 및 기본급·등급명 정상 표시.
- 참고: 문서 §4 수정 방향, §5 체크리스트; 필요 시 docs/standards/ERROR_HANDLING_STANDARD.md, 프론트엔드 비동기/state 규칙 적용.
```

---

- **core-component-manager**: 본 수정은 단일 컴포넌트 내부 로직 수정이므로 배정하지 않음.
- (선택) 수정 완료 후 `ConsultationCompletionStatsView.js`의 `convertGradeToKorean` 사용처는 별도 이슈로 검토 권장(문서 §4.5).

---

## 7. 코어 플래너 위임 (참고)

**코어 플래너 위임: 수정 Phase 배정 및 core-coder 실행 요청**

- 본 문서의 **수정 방향(§4)**과 **체크리스트(§5)**를 기준으로 Phase를 나누어 core-coder에게 구현을 위임해 주세요.  
- 필요 시 `docs/standards/ERROR_HANDLING_STANDARD.md`, `docs/standards/LOGGING_STANDARD.md` 및 프론트엔드 비동기/state 규칙을 참고해 일관되게 적용하면 됩니다.
