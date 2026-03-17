# 부분 환불 클라이언트 오류 분석 (서버 성공·클라이언트 실패)

**작성일**: 2026-03-17  
**분석자**: core-debugger  
**관련**: 개발 서버(beta0629.cafe24.com) 로그, 부분 환불 "처리중 오류 발생" 사용자 보고

---

## 1. 증상 요약

| 항목 | 내용 |
|------|------|
| **사용자 증상** | 부분 환불 실행 시 "처리중 오류 발생"(또는 "부분 환불 처리 중 오류가 발생했습니다." / "부분 환불 처리에 실패했습니다.") 메시지 표시 |
| **서버 상태** | 부분 환불 API는 **정상 처리** (coresolution.log: `✅ 부분 환불 완료: ID=236, ...`), error.log에는 해당 요청 실패 없음 |
| **결론** | **서버는 200 성공인데, 프론트엔드가 응답을 실패로 해석**하는 구조적 불일치 |

---

## 2. 가능한 원인 분석

### 2.1 원인 1: API 응답 body 형식과 프론트 기대 불일치 (근본 원인)

**백엔드 응답 스펙 (성공 시)**

- **Controller**: `AdminController.partialRefundMapping` → `return success(String.format("%d회기 부분 환불이 성공적으로 처리되었습니다", refundSessions));`
- **BaseApiController.success(String message)** → `ApiResponse.success(message)` 호출
- **ApiResponse.success(String message)** (`ApiResponse.java`):  
  `success=true`, `message="1회기 부분 환불이 ..."`, **`data=null`**(필드 미설정), `timestamp` 설정

즉 성공 시 HTTP 200 + body 예시:

```json
{
  "success": true,
  "message": "1회기 부분 환불이 성공적으로 처리되었습니다",
  "data": null,
  "timestamp": "2026-03-17T14:07:52"
}
```

**프론트엔드 apiPost 동작** (`frontend/src/utils/ajax.js` 402~408행)

- 성공 시(`response.ok`) `jsonData`를 파싱한 뒤:
  - **조건**: `jsonData`가 객체이고 `'success' in jsonData` 이고 **`'data' in jsonData`**
  - **동작**: 이 조건이 참이면 **`return jsonData.data`**
- 부분 환불 응답에는 `data` **키가 존재**하고 값이 **null**이므로, 조건을 만족하고 **`jsonData.data` 즉 `null`을 반환**한다.

**PartialRefundModal 처리** (`frontend/src/components/admin/mapping/PartialRefundModal.js` 97~116행)

- `const response = await apiPost(...);` → 성공 시 **response = null**
- `if (response.success)` → `null.success`는 `undefined` → **falsy** → **else 분기**
- else: `showNotification(response.message || '부분 환불 처리에 실패했습니다.', 'error');`  
  → **"부분 환불 처리에 실패했습니다."** 표시 (사용자 표현으로 "처리중 오류 발생"에 해당)

**정리**

- 서버는 200 + `{ success: true, message: "...", data: null }`을 주지만,
- apiPost가 **data만 반환**하고, data가 null이므로 **null**을 넘기고,
- 모달은 **response.success**로 성공 여부를 보므로 **null → 실패 처리**가 됨.

### 2.2 원인 2: 예외 발생 시 catch에서 표시하는 메시지

- **위치**: 동일 파일 119~122행 `catch` 블록  
  `showNotification('부분 환불 처리 중 오류가 발생했습니다.', 'error');`
- **발생 조건**: apiPost가 **예외를 던지는 경우** (네트워크 오류, 4xx/5xx 시 throw, JSON 파싱 실패 등)
- 서버 로그상 해당 요청은 성공했으므로, **이번 사례의 주된 원인은 2.1**이고, 2.2는 동일 문구를 보일 수 있는 다른 경로로만 이해하면 됨.

### 2.3 기타 가능성 (참고)

- **다른 요청이 실패한 경우**: 동일 세션에서 다른 부분 환불 요청이 실패했고, 그 요청은 로그에 안 남았을 수 있음. 다만 사용자 보고와 서버 로그(매핑 236 성공)를 연결하면, **동일 요청이 서버에서는 성공·클라이언트에서만 실패**로 보는 것이 타당함.
- **CSRF/세션**: apiPost는 CSRF 토큰을 사용하며, 실패 시 throw. 이번에는 서버가 정상 처리했으므로 200이 왔을 가능성이 높고, **응답 body 처리(2.1)**가 주원인으로 보는 것이 맞음.

---

## 3. 프론트엔드 점검 요약

### 3.1 부분 환불 API 호출 및 응답 처리

| 항목 | 내용 |
|------|------|
| **호출 위치** | `frontend/src/components/admin/mapping/PartialRefundModal.js` |
| **호출 방식** | `apiPost(\`/api/v1/admin/mappings/${mapping.id}/partial-refund\`, { refundSessions, reason })` |
| **성공 판단** | `if (response.success)` (97행) |
| **성공 시** | 성공 알림, `onSuccess()`, `onClose()`, `partialRefundProcessed` 이벤트 발송 |
| **실패 시 (else)** | `showNotification(response.message \|\| '부분 환불 처리에 실패했습니다.', 'error');` (115행) |
| **예외 시 (catch)** | `showNotification('부분 환불 처리 중 오류가 발생했습니다.', 'error');` (121행) |

### 3.2 apiPost 반환값 (ajax.js)

- **ApiResponse 형태** (`success`·`data` 키 존재)일 때: **`jsonData.data`** 반환.
- 부분 환불은 **data=null** 이므로 → **null 반환** → 모달에서는 항상 실패 분기.

### 3.3 동일 패턴 사용처

- `MappingDepositModal.js`: `if (response)` 로만 판단. **response가 null이면** "입금 확인에 실패했습니다." 표시 → 동일 이슈 가능.
- `MappingPaymentModal.js`: 주석에 "apiPost는 ApiResponse의 data만 반환하므로, response가 존재하면 성공" → **data가 null인 성공 응답**이면 동일 문제 가능.

---

## 4. API 응답 스펙 vs 프론트 기대

| 구분 | 서버 (현재) | 프론트 기대 (PartialRefundModal) |
|------|-------------|-----------------------------------|
| 성공 시 body | `{ success: true, message: "...", data: null, timestamp }` | `response` 객체에 **success** 필드가 있어야 함 (또는 truthy) |
| apiPost 반환 | `data`만 반환 → **null** | **response.success**로 성공 여부 판단 → null이면 실패로 처리 |

**불일치**: 서버는 `success: true`를 주지만, apiPost가 **data만** 넘기고 data가 null이라, 모달이 받는 값은 null이라 **success를 볼 수 없음**.

**맞출 방향 제안**

- **권장**: **프론트엔드(ajax.js) 수정**. ApiResponse 형태의 성공 응답에서 **data가 null/undefined인 경우**에는 **전체 객체(jsonData)를 반환**하거나, 최소한 `{ success: true, message: jsonData.message }`를 반환하도록 하여, `response.success`로 성공 여부를 판단하는 컴포넌트가 그대로 동작하도록 한다.
- 대안: 백엔드에서 부분 환불 성공 시 `data: {}` 등 non-null을 주면 apiPost가 null이 아닌 값을 넘기지만, 현재 `ApiResponse<Void>` 계약과 다른 API들의 일관성을 고려하면 **프론트에서 null-data 성공 응답을 일관되게 처리**하는 쪽이 유지보수에 유리함.

---

## 5. 재현 시 확인 사항

1. **브라우저 개발자 도구 → Network**:  
   `POST /api/v1/admin/mappings/{id}/partial-refund` 요청이 **200**이고, 응답 body에 `"success": true`, `"data": null` 인지 확인.
2. **Console**: 부분 환불 버튼 클릭 후 `apiPost` 반환값을 로그로 찍어 **null**이 반환되는지 확인.
3. **동작**: 서버는 정상 처리되는데, 화면에만 "부분 환불 처리에 실패했습니다." 또는 "부분 환불 처리 중 오류가 발생했습니다."가 뜨는지 확인.

---

## 6. 수정 제안 (체크리스트·core-coder용)

코드 직접 수정은 하지 않고, 적용할 파일·위치·방향만 기술.

### 6.1 ajax.js – apiPost 성공 시 반환값 (권장)

- **파일**: `frontend/src/utils/ajax.js`
- **위치**: 401~408행 부근 (성공 분기)
- **변경 방향**:
  - ApiResponse 래퍼 처리 시, **`jsonData.data`가 null 또는 undefined**이면 **전체 `jsonData`를 반환**하도록 분기 추가.
  - 이렇게 하면 `{ success: true, message: "..." }`가 그대로 전달되어, `if (response.success)`로 성공 처리하는 모든 컴포넌트(PartialRefundModal 포함)가 수정 없이 동작할 수 있음.
- **주의**: `apiGet` 등 다른 메서드에서 동일한 “data만 추출” 로직을 쓰는지 확인하고, 필요 시 동일한 null-data 처리 적용 검토.

### 6.2 (선택) PartialRefundModal – 방어 로직

- **파일**: `frontend/src/components/admin/mapping/PartialRefundModal.js`
- **위치**: 97행 부근
- **변경 방향** (6.1 적용 시 불필요할 수 있음):  
  apiPost가 예외를 던지지 않고 돌아왔을 때 **response가 null이어도** 성공으로 볼지는, **6.1에서 null을 반환하지 않도록** 하는 쪽을 우선하고, 모달은 기존대로 `response.success`만 보는 것을 권장.  
  만약 6.1을 하지 않고 모달만 고치려면, “apiPost가 null을 반환한 경우에도 성공으로 간주”하는 방식은 다른 API와의 일관성이 떨어지므로 비권장.

### 6.3 다른 모달 점검 (MappingDepositModal, MappingPaymentModal)

- **동일 이슈**: 백엔드가 `data: null`로 성공 응답을 주면 apiPost가 null을 반환하여, “실패”로 표시될 수 있음.
- **조치**: 6.1 적용 후, 입금 확인·결제 확인 등 **data가 null인 성공 API**에 대해 한 번씩 동작 확인 권장.

---

## 7. 수정 후 확인 체크리스트

- [ ] 부분 환불 실행 시 서버 200 + `success: true` 응답에서, 화면에 **성공 알림**이 뜨는지 확인.
- [ ] 모달이 닫히고, 목록/상세가 갱신되는지(onSuccess 등) 확인.
- [ ] `partialRefundProcessed` 이벤트가 기대대로 발생하는지 확인.
- [ ] 입금 확인·결제 확인 등 동일 패턴 API에서도 성공 시 실패 메시지가 나오지 않는지 확인.
- [ ] 4xx/5xx 등 실제 실패 시에는 기존처럼 에러 메시지가 표시되는지 확인.

---

## 8. 참조

- **StaleState 수정 이력**: `docs/debug/PARTIAL_REFUND_STALE_STATE_ANALYSIS_20260317.md` (recordAmountChange 제거 등 적용 후, 서버는 정상 완료 상태).
- **백엔드**: `AdminController.partialRefundMapping`, `BaseApiController.success(String)`, `ApiResponse.success(String)`.
- **프론트**: `frontend/src/utils/ajax.js` (apiPost), `frontend/src/components/admin/mapping/PartialRefundModal.js`.
- **스킬**: `.cursor/skills/core-solution-debug/SKILL.md`, `docs/standards/API_INTEGRATION_STANDARD.md`.

---

**산출물**: 원인 분석·재현 시 확인 사항·수정 제안·체크리스트. 실제 코드 수정은 **core-coder** 서브에이전트에 위임.
