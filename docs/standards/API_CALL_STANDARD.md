# API 호출 표준 (강제 적용)

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-06  
**상태**: 공식 표준 (강제)

---

## 📌 개요

모든 API 호출은 **반드시** `StandardizedApi` 유틸리티를 사용해야 합니다.  
이 표준을 위반하면 코드 리뷰에서 거부됩니다.

### 구현 위치
- **표준화 API 유틸리티**: `frontend/src/utils/standardizedApi.js`
- **기존 API 유틸리티**: `frontend/src/utils/ajax.js` (내부 사용 전용)

---

## 🚨 필수 규칙

### 1. StandardizedApi 사용 필수

```javascript
// ✅ 올바른 사용
import StandardizedApi from '../../utils/standardizedApi';

const consultants = await StandardizedApi.get('/api/v1/admin/consultants/with-stats');

// ❌ 금지: 직접 apiGet 사용
import { apiGet } from '../../utils/ajax';
const consultants = await apiGet('/api/v1/admin/consultants/with-stats');
```

### 2. 자동 tenantId 헤더 추가

`StandardizedApi`는 자동으로:
- 세션 갱신 (`checkSession(true)`)
- `X-Tenant-Id` 헤더 추가
- 에러 핸들링

따라서 **수동으로 tenantId를 설정할 필요가 없습니다**.

```javascript
// ✅ 올바른 사용 (tenantId 자동 추가됨)
const consultants = await StandardizedApi.get('/api/v1/admin/consultants/with-stats');

// ❌ 금지: 수동으로 tenantId 설정
const options = { headers: { 'X-Tenant-Id': user.tenantId } };
const consultants = await apiGet('/api/v1/admin/consultants/with-stats', {}, options);
```

### 3. 엔드포인트 검증

모든 엔드포인트는 `/api/v1/`로 시작해야 합니다.

```javascript
// ✅ 올바른 사용
StandardizedApi.get('/api/v1/admin/consultants/with-stats');

// ❌ 금지: 버전 없음
StandardizedApi.get('/api/admin/consultants/with-stats');
```

---

## 📋 사용 예시

### GET 요청

```javascript
import StandardizedApi from '../../utils/standardizedApi';

// 기본 사용
const consultants = await StandardizedApi.get('/api/v1/admin/consultants/with-stats');

// 쿼리 파라미터 포함
const schedules = await StandardizedApi.get('/api/v1/schedules', { 
    startDate: '2025-12-01',
    endDate: '2025-12-31'
});
```

### POST 요청

```javascript
import StandardizedApi from '../../utils/standardizedApi';

const newConsultant = await StandardizedApi.post('/api/v1/admin/consultants', {
    name: '홍길동',
    email: 'hong@example.com',
    // ...
});
```

### PUT 요청

```javascript
import StandardizedApi from '../../utils/standardizedApi';

const updated = await StandardizedApi.put(`/api/v1/admin/consultants/${id}`, {
    name: '홍길동',
    // ...
});
```

### DELETE 요청

```javascript
import StandardizedApi from '../../utils/standardizedApi';

await StandardizedApi.delete(`/api/v1/admin/consultants/${id}`);
```

---

## 🔍 마이그레이션 가이드

### 기존 코드 수정

**Before:**
```javascript
import { apiGet } from '../../utils/ajax';

const loadConsultants = async () => {
    const response = await apiGet('/api/v1/admin/consultants/with-stats');
    // ...
};
```

**After:**
```javascript
import StandardizedApi from '../../utils/standardizedApi';

const loadConsultants = async () => {
    const consultants = await StandardizedApi.get('/api/v1/admin/consultants/with-stats');
    // ...
};
```

---

## ✅ 체크리스트

새로운 API 호출 코드를 작성할 때 다음을 확인하세요:

- [ ] `StandardizedApi`를 import 했는가?
- [ ] `apiGet`, `apiPost` 등을 직접 사용하지 않았는가?
- [ ] 엔드포인트가 `/api/v1/`로 시작하는가?
- [ ] 수동으로 `X-Tenant-Id` 헤더를 설정하지 않았는가?
- [ ] 에러 핸들링이 적절한가?

---

## 🚫 금지 사항

1. **직접 apiGet/apiPost 사용 금지**
   ```javascript
   // ❌ 금지
   import { apiGet } from '../../utils/ajax';
   ```

2. **수동 tenantId 헤더 설정 금지**
   ```javascript
   // ❌ 금지
   const options = { headers: { 'X-Tenant-Id': user.tenantId } };
   ```

3. **버전 없는 엔드포인트 금지**
   ```javascript
   // ❌ 금지
   StandardizedApi.get('/api/admin/consultants');
   ```

---

## 📚 참조 문서

- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [API 연동 표준](./API_INTEGRATION_STANDARD.md)
- [에러 처리 표준](./ERROR_HANDLING_STANDARD.md)

