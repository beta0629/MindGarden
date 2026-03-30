---
name: core-solution-api
description: Core Solution(MindGarden) API 호출·연동 룰. 프론트엔드 StandardizedApi 필수, 엔드포인트 /api/v1/, 에러·tenantId 처리.
---

# Core Solution API 룰

API 호출·연동 코드를 작성·수정할 때 이 스킬을 적용하세요.

## When to Use

- 프론트엔드에서 백엔드 API 호출 추가·수정
- 새 API 엔드포인트 연동
- API 유틸리티·인터셉터 수정

## Rules (필수 준수)

### 프론트엔드 API 호출

1. **StandardizedApi만 사용**
   - `frontend/src/utils/standardizedApi.js` import
   - `StandardizedApi.get(url)`, `StandardizedApi.post(url, body)` 등 사용
   - `ajax.js`의 `apiGet`/`apiPost` 직접 사용 금지

2. **엔드포인트**
   - 반드시 `/api/v1/`로 시작
   - 예: `StandardizedApi.get('/api/v1/admin/consultants/with-stats')`

3. **tenantId (필수)**
   - 모든 API 요청에 `X-Tenant-Id` 필요. tenantId 없음 절대 허용 안 됨
   - 수동 설정 금지. StandardizedApi가 세션 갱신 후 자동 추가

4. **쿼리/바디**
   - GET 쿼리: 두 번째 인자 객체로 전달
   - POST/PUT: body 객체 전달

```javascript
// ✅
const list = await StandardizedApi.get('/api/v1/schedules', { startDate, endDate });
const created = await StandardizedApi.post('/api/v1/clients', body);

// ❌
const list = await apiGet('/api/v1/schedules', { startDate, endDate });
```

### 백엔드 API 설계

- 경로: `/api/v1/{resource}`. 버전 포함
- Controller는 `BaseApiController` 상속, `success()`/`created()`/`noContent()` 사용
- 에러는 예외 throw 후 GlobalExceptionHandler에서 일괄 처리

## Reference

`docs/standards/API_CALL_STANDARD.md`, `docs/standards/API_INTEGRATION_STANDARD.md`, `docs/standards/API_DESIGN_STANDARD.md`
