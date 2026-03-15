# 이메일 폼 행 JSX/DOM 분석 — “중복확인”만 보이는 경우

**역할**: core-debugger  
**전제**: 실제 DOM에서 `div.mg-v2-form-email-row` 내부에 **input·button 요소가 없고** "중복확인" 텍스트만 있음.  
**목적**: (1) 이메일 행을 렌더하는 모든 JSX 위치 정리, (2) DOM에 `__input-wrap`/input/button이 없는 코드 경로 후보, (3) 재현 시 확인 포인트.  
**참고**: `EMAIL_FORM_ROW_BREAKAGE_ROOT_CAUSE_ANALYSIS.md`는 “DOM에 요소는 있다”는 가정의 CSS 가설 위주. 본 문서는 **“DOM 자체에 input/button이 없다”** 시나리오를 전제로 함.

---

## 1. 이메일 행을 렌더하는 파일·라인·구조 요약

### 1.1 ClientModal.js (내담자 모달)

| 항목 | 내용 |
|------|------|
| **파일** | `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` |
| **라인** | 290~319 |
| **호출 경로** | `type !== 'delete'` → `renderFormContent()` → form 내 이메일 `mg-v2-form-group` |
| **구조** | `div.mg-v2-form-email-row` > `div.mg-v2-form-email-row__input-wrap` > `input#email` (항상) + `type === 'create'`일 때만 `button`(중복확인) |
| **조건** | `__input-wrap`·input: **무조건** 렌더. 버튼만 `type === 'create'`일 때 렌더. |

```text
mg-v2-form-group (이메일 *)
  └─ label[for=email]
  └─ div.mg-v2-form-email-row
       ├─ div.mg-v2-form-email-row__input-wrap  ← 항상
       │    └─ input#email (type=email, ...)
       └─ {type === 'create' && <button>중복확인|확인 중...</button>}
  └─ {type === 'edit' && <small>이메일은 변경할 수 없습니다.</small>}
  └─ create 시 상태 메시지들, datalist
```

- **정리**: 현재 소스상 **어떤 type(create/edit)** 이어도 row 안에는 항상 `__input-wrap` + input이 있음. “중복확인”만 나오는 구조의 JSX는 없음.

---

### 1.2 StaffManagement.js (스태프 등록 모달)

| 항목 | 내용 |
|------|------|
| **파일** | `frontend/src/components/admin/StaffManagement.js` |
| **라인** | 755~781 |
| **위치** | 스태프 **등록** 폼 내 (create 전용 모달) |
| **구조** | `div.mg-v2-form-email-row` > `div.mg-v2-form-email-row__input-wrap` > `input#staff-email` (항상) + 버튼(항상) |
| **조건** | `__input-wrap`·input·버튼 모두 **무조건** 렌더. |

```text
mg-v2-form-group (이메일 *)
  └─ label[for=staff-email]
  └─ div.mg-v2-form-email-row
       ├─ div.mg-v2-form-email-row__input-wrap  ← 항상
       │    └─ input#staff-email
       └─ button (중복확인)  ← 항상
```

- **정리**: 여기서도 row에 “중복확인”만 남기는 분기는 없음.

---

### 1.3 ConsultantComprehensiveManagement.js (상담사 모달)

| 항목 | 내용 |
|------|------|
| **파일** | `frontend/src/components/admin/ConsultantComprehensiveManagement.js` |
| **라인** | 1567~1595 |
| **구조** | ClientModal과 동일. `__input-wrap` + input 항상, 버튼만 `modalType === 'create'`일 때 |
| **조건** | `__input-wrap`·input: **무조건**. 버튼: create 시에만. |

- **정리**: 동일하게 row 안에 항상 `__input-wrap` + input이 있음.

---

### 1.4 TabletRegister.js (태블릿 회원가입)

| 항목 | 내용 |
|------|------|
| **파일** | `frontend/src/components/auth/TabletRegister.js` |
| **라인** | 334~396 |
| **구조** | `div.mg-v2-form-email-row` > **인라인 스타일 div**(`__input-wrap` 클래스 없음) > input + 버튼 |
| **비고** | 클래스는 `mg-v2-form-email-row`만 사용. 내부 래퍼는 `className`이 아닌 `style={{ position: 'relative', flex: 1, minWidth: 0 }}`. |

- **정리**: 여기도 input·버튼은 항상 있음. “중복확인”만 있는 마크업은 없음.

---

### 1.5 그 외

- **ClientOverviewTab.js**: `mg-v2-form-email-row` 미사용. 이메일은 카드에서 텍스트로만 표시.
- **공통 컴포넌트**: `EmailRow` / `FormEmailRow` 같은 공통 이메일 행 컴포넌트는 없음. 위 4곳에서 각각 인라인 JSX로 렌더.

---

## 2. DOM에 __input-wrap / input / button이 없는 경우가 나올 수 있는 코드 경로·원인 후보

현재 저장소의 **JSX만 보면**, `mg-v2-form-email-row` 안에 `__input-wrap`·input을 **빼는 조건부 분기는 없음**.  
따라서 “실제 DOM에 input·button이 없다”면 아래는 **가설** 단위로 정리한 것임.

### 2.1 코드 경로 상으로는 “없음”

- ClientModal / StaffManagement / ConsultantComprehensiveManagement / TabletRegister 모두:
  - row 내부 첫 번째 자식은 **항상** 래퍼(div) + input.
  - 그 다음에만 조건부로 버튼(ClientModal·Consultant은 create 시, Staff·Tablet은 항상).
- **조건부로 __input-wrap·input을 아예 렌더하지 않는 분기는 코드상 없음.**
- “중복확인”만 넣는 JSX(예: `<div className="mg-v2-form-email-row">중복확인</div>`)도 **검색 결과 없음**.

### 2.2 원인 후보 (환경·런타임)

| 후보 | 설명 | 확인 방법 |
|------|------|-----------|
| **A. 빌드/캐시** | 이전 번들 또는 캐시된 JS가 로드되어, 예전 버전(래퍼/input 없던 시절)이 실행됨 | 하드 리프레시, 빌드 재실행, 브라우저 캐시 비우기 후 DOM 재확인 |
| **B. 코드 스플리팅** | 해당 모달이 lazy chunk인 경우, chunk 불일치나 로드 실패로 부분만 렌더될 가능성 | Network 탭에서 해당 청크 로드 여부·에러, 콘솔 에러 확인 |
| **C. React 트리 손상** | 에러 바운더리·예외로 인해 자식이 언마운트되고 fallback만 남는 경우 | 콘솔 에러, React DevTools에서 해당 row의 자식 개수·구조 확인 |
| **D. 개발 도구/확장** | Cursor 등에서 보여주는 DOM이 “요소 요약”이거나 다른 노드일 가능성 | 브라우저 개발자 도구 **Elements** 탭에서 동일 모달의 `mg-v2-form-email-row`를 직접 열어 자식 노드 개수·태그 확인 |
| **E. 중복 마운트** | 같은 클래스를 쓰는 다른 모달/패널이 동시에 있어, 사용자가 본 것이 “전체 폼이 있는 모달”이 아닐 가능성 | 어느 페이지·어느 버튼으로 연 모달인지, 모달이 하나만 떠 있는지 확인 |

### 2.3 React children·키 관련

- 현재 이메일 row JSX는 **조건부가 한 개**뿐: `{type === 'create' && <button>...</button>}`.
- `__input-wrap`은 조건 없이 항상 첫 번째 자식이므로, 배열/조각/키 누락으로 “한쪽만 사라지는” 패턴은 **해당 코드에선 보이지 않음**.

---

## 3. 재현 시 확인할 포인트

아래를 정리해 두면 원인 좁히는 데 도움이 됨.

### 3.1 어떤 모달·탭인지

- **모달**: 내담자(ClientModal) / 스태프(StaffManagement) / 상담사(ConsultantComprehensiveManagement) / 태블릿(TabletRegister) 중 무엇인지.
- **탭**: ClientModal은 탭이 없고, type으로 create/edit/delete만 구분. “Overview” 등은 ClientOverviewTab이며, 여기에는 `mg-v2-form-email-row`가 없음.
- **모드**: create / edit. (edit여도 ClientModal·Consultant에서는 row 안에 input은 그대로 있음.)

### 3.2 DOM에서 직접 확인할 것

- **Elements 탭**에서 `div.mg-v2-form-email-row` 선택 후:
  - 자식 개수: 0개(텍스트만) / 1개(div만 등) / 2개(래퍼+버튼) 등.
  - `div.mg-v2-form-email-row__input-wrap` 존재 여부.
  - `input` (type=email) 존재 여부.
  - `button` 또는 “중복확인” 텍스트를 포함한 요소 존재 여부.
- **같은 페이지에서** `mg-v2-form-email-row`가 여러 개인지(다른 모달/폼이 열려 있는지) 확인.

### 3.3 재현 체크리스트 (요약)

1. [ ] 재현한 **URL·페이지** (내담자 종합관리 / 스태프 관리 / 상담사 종합관리 / 태블릿 가입 등).
2. [ ] 모달을 연 **동작** (예: “새 내담자 등록”, “스태프 추가”).
3. [ ] 모달 **type** (create / edit).
4. [ ] Elements에서 **해당** `mg-v2-form-email-row`의 **직계 자식** 목록 (태그명·클래스·개수).
5. [ ] 콘솔 **에러** 유무.
6. [ ] 하드 리프레시·캐시 비우기 후에도 동일한지.

---

## 4. 수정 제안 방향 (core-coder용)

- **현재 소스 기준**: JSX만으로는 “row 안에 input/button이 없고 텍스트만 있게 만드는” 경로가 없으므로, **먼저 위 3절대로 재현 환경·DOM 스냅샷을 확정**하는 것이 좋음.
- 재현이 **특정 모달·create/edit**에서만 난다면:
  - 해당 파일의 `renderFormContent`(또는 해당 폼)가 **실제로 호출되는지**, `type`/`modalType` 값이 기대와 같은지 로그로 확인.
- 재현이 **캐시/빌드** 의심이면:
  - 프로덕션 빌드·다른 브라우저에서 동일 여부 확인.
- **회귀 방지**: `ClientModal.emailForm.test.js`처럼 “row 내부에 `__input-wrap`·input이 반드시 있다”는 테스트를 Staff/Consultant 모달에도 두면, 앞으로 JSX가 실수로 깨질 때 잡기 쉬움.

---

## 5. 요약 표

| 파일 | 라인 | row 내부 구조 | __input-wrap/input 조건 |
|------|------|----------------|--------------------------|
| ClientModal.js | 292~318 | __input-wrap > input, + 버튼(create 시) | 항상 |
| StaffManagement.js | 757~780 | __input-wrap > input, + 버튼 | 항상 |
| ConsultantComprehensiveManagement.js | 1569~1593 | __input-wrap > input, + 버튼(create 시) | 항상 |
| TabletRegister.js | 336~395 | div(인라인 스타일) > input, + 버튼 | 항상 |

**결론**: 현재 코드상 `mg-v2-form-email-row` 안에 **input·button 없이 “중복확인” 텍스트만 나오는 JSX 경로는 없음**.  
실제 DOM에서 그렇게 보인다면, 빌드/캐시·chunk·에러·또는 확인한 노드가 다른 인스턴스일 가능성을 2절·3절대로 점검하는 것을 권장함.
