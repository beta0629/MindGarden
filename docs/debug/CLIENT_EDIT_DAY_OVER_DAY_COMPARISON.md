# 내담자 수정 “어제까지 됐는데 오늘 안 됨” 비교

## 최근 2일 이내 내담자/상담사·ajax 관련 커밋

| 커밋 | 날짜 | 변경 파일 | 요약 |
|------|------|-----------|------|
| **002dbe68e** | 3/17 23:27 | ClientComprehensiveManagement.js | **dataToUse = data 우선** (모달 제출 시점 폼 데이터 사용) |
| **02976606f** | 3/17 23:20 | ClientComprehensiveManagement.js, **ajax.js** | 부분 환불용 **apiPut 등 data가 null일 때 전체 객체 반환** + 내담자 저장 알림 보강 |
| **999ecffa2** | 3/17 22:22 | ClientComprehensiveManagement.js, ClientModal.js | payload를 **dataToUse**로 통일, **formDataRef 우선** 사용, return handleSave(), 모달 버튼 return/type=button |

---

## 원인 추정: 999ecffa2에서 도입된 “ref 우선” 로직

- **999ecffa2**에서:
  - payload를 모두 **dataToUse** 기준으로 바꿈.
  - 당시 **dataToUse = formDataRef.current != null ? formDataRef.current : data** (ref 우선).
- **formDataRef**는 `useEffect([formData])`에서만 갱신되므로, 입력 직후 저장하면 **한 템포 늦은(이전) 값**이 API로 갈 수 있음.
- 그 결과 “수정해도 반영이 안 된다”처럼 보일 수 있음.

이후 **002dbe68e**에서 다음으로 수정됨:

```js
// 수정 후 (현재)
const dataToUse = data ?? formDataRef.current ?? formData;
```

즉, **모달이 넘기는 data(제출 시점 최신값)를 우선** 쓰도록 바뀜.  
그래서 **지금 코드만 보면** “어제까지 됐는데 오늘 안 됨”의 직접 원인은 **999ecffa2 시점의 ref 우선 로직**이고, **002dbe68e가 그걸 고친 상태**다.

---

## 상담사 vs 내담자 비교 (현재 기준)

| 항목 | 상담사 (정상) | 내담자 (현재 코드) |
|------|----------------|---------------------|
| 저장 시 사용 데이터 | **formData** (부모 state, 직접 전달) | **data ?? formDataRef ?? formData** (모달 인자 우선) |
| API | apiPut(`/api/v1/admin/consultants/${id}`, requestPayload) | apiPut(`/api/v1/admin/clients/${editingClient.id}`, payload) |
| 성공 조건 | response != null && (response.success === true \|\| response.id != null) | 동일 |
| 모달 구조 | 폼이 같은 컴포넌트 안에 있음 (formData가 곧 최신) | ClientModal로 분리, onSave(formData)로 전달 |

현재 내담자 쪽은 “모달이 넘기는 data 우선”으로 상담사와 동일한 의미의 “제출 시점 최신값”을 쓰도록 맞춰져 있음.

---

## “오늘도 안 된다”면 확인할 것

1. **실제 배포/빌드 버전**
   - 002dbe68e, 02976606f가 포함된 브랜치로 빌드·배포했는지 확인.
2. **브라우저 동작**
   - 수정 버튼 클릭 시 콘솔에 `🔧 내담자 수정 요청:`, `✅ 내담자 수정 응답:` 로그가 나오는지.
   - 네트워크 탭에서 `PUT /api/v1/admin/clients/{id}` 의 **상태 코드**와 **응답 body** (200인데 data 형태가 다른지, 400/500인지).
3. **에러 메시지**
   - catch에서 `error?.message` 또는 서버 메시지가 알림/콘솔에 어떻게 나오는지 (400 검증 실패 시 메시지가 원인 단서).
4. **editingClient.id**
   - 수정 모달을 열 때 `editingClient.id`가 설정되는지 (다른 행 클릭 직후 등으로 id가 비어 있으면 API 경로가 잘못될 수 있음).

---

## 정리

- **어제까지 됐는데 오늘 안 됨**의 코드상 원인은 **999ecffa2에서 payload를 formDataRef 우선의 dataToUse로 바꾼 것**으로 보는 것이 타당함.
- 그 부분은 **002dbe68e에서 data 우선으로 수정**되어, 현재 소스는 “모달 제출 시점의 최신 폼 데이터”를 쓰는 상태임.
- 그래서 **지금도 수정이 안 되면** 위 “확인할 것” 순서대로 배포 버전·콘솔/네트워크·에러 메시지·editingClient.id를 보면 다음 원인(배포 누락, API 에러, id 미설정 등)을 좁힐 수 있음.
