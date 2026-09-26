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

### 화면·API 한 세트 (필수)

같은 기능의 화면(관리자·내담자 UI)과 API는 한 변경 세트다. 호출부만, 또는 엔드포인트만 수정하고 끝내지 않는다.

- 배포도 한 세트다. 화면 커밋과 서버 커밋을 서로 다른 시점에 운영에 올리지 않는다. **한 커밋(또는 같은 SHA)** 에 화면과 서버가 같이 들어가야 한다.
- 프론트 전용 워크플로만 먼저 성공시키고, 같은 SHA의 백엔드 배포가 그 화면을 다른 빌드로 덮어쓰지 않게 한다. 백엔드 워크플로의 **프론트 업로드 스킵 가드**(같은 SHA의 프론트 운영 배포가 이미 success면 업로드하지 않음)를 깨지 말 것.
- 사용자 트래픽이 받는 슬롯은 세트 배포 중 재시작으로 로그인 이탈을 만들지 않는다. **비활성 슬롯 헬스 통과 후**에만 전환한다.
- 분야·테넌트·호스트 하드코딩 금지. 공통코드·env.

## Reference

`docs/standards/API_CALL_STANDARD.md`, `docs/standards/API_INTEGRATION_STANDARD.md`, `docs/standards/API_DESIGN_STANDARD.md`
