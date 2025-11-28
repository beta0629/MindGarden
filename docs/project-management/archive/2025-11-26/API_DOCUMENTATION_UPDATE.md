# API 문서화 업데이트

**작성일**: 2025-11-26  
**목표**: 새로운 API 구조 및 캐시 관리 API 문서화  

---

## 🔄 업데이트된 API 엔드포인트

### 1. 테넌트 코드 관리 API

#### 1.1 테넌트별 공통코드 조회
```http
GET /api/v1/common-codes/tenant?codeGroup={codeGroup}
```

**설명**: 현재 테넌트의 특정 코드 그룹 조회 (캐시 적용)

**파라미터**:
- `codeGroup` (required): 코드 그룹명

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codeGroup": "CONSULTATION_PACKAGE",
      "codeValue": "BASIC",
      "codeLabel": "기본 패키지",
      "koreanName": "기본 패키지",
      "tenantId": "TENANT-001"
    }
  ]
}
```

#### 1.2 코어 공통코드 조회
```http
GET /api/v1/common-codes/core?codeGroup={codeGroup}
```

**설명**: 시스템 전체 공통코드 조회 (캐시 적용)

---

### 2. 캐시 관리 API (신규)

#### 2.1 전체 캐시 통계 조회
```http
GET /api/admin/cache/stats
```

**설명**: 모든 캐시의 사용 통계 조회

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "tenantCodes": {
      "name": "tenantCodes",
      "size": 15,
      "isEmpty": false,
      "keys": ["TENANT-001:USER_STATUS", "TENANT-001:ROLE"]
    },
    "coreCodes": {
      "name": "coreCodes", 
      "size": 8,
      "isEmpty": false,
      "keys": ["ROLE", "USER_STATUS"]
    }
  }
}
```

#### 2.2 특정 캐시 통계 조회
```http
GET /api/admin/cache/stats/{cacheName}
```

#### 2.3 캐시 클리어
```http
DELETE /api/admin/cache/{cacheName}
DELETE /api/admin/cache/all
```

#### 2.4 캐시 워밍업
```http
POST /api/admin/cache/warmup
```

---

### 3. 대시보드 관리 API

#### 3.1 테넌트 역할 조회
```http
GET /api/v1/tenant/roles
```

**설명**: 현재 테넌트의 모든 역할 조회

#### 3.2 테넌트 대시보드 조회
```http
GET /api/v1/tenant/dashboards
```

**설명**: 현재 테넌트의 모든 대시보드 조회

#### 3.3 대시보드 생성
```http
POST /api/v1/tenant/dashboards
```

**요청 본문**:
```json
{
  "tenantRoleId": "role-uuid",
  "dashboardName": "dashboard-name",
  "dashboardNameKo": "대시보드 이름",
  "dashboardNameEn": "Dashboard Name",
  "description": "설명",
  "isActive": true,
  "widgets": []
}
```

---

## 📊 성능 특성

### 캐시 적용 API
- **테넌트 코드 조회**: 평균 10-20ms (캐시 히트 시)
- **코어 코드 조회**: 평균 5-15ms (캐시 히트 시)
- **캐시 미스**: 기존과 동일한 성능 (50-100ms)

### 캐시 키 전략
- 테넌트 코드: `{tenantId}:{codeGroup}`
- 코어 코드: `{codeGroup}`

---

## 🔧 개발자 가이드

### 1. 캐시 사용 권장사항

#### 자주 조회되는 코드 그룹
```java
// 높은 캐시 효율성 기대
- USER_STATUS (사용자 상태)
- ROLE (역할)
- CONSULTATION_PACKAGE (상담 패키지)
- PAYMENT_METHOD (결제 방법)
```

#### 캐시 무효화 시점
```java
// 자동 캐시 무효화
- 공통코드 생성 시
- 공통코드 수정 시  
- 공통코드 삭제 시

// 수동 캐시 클리어
- 데이터 불일치 발생 시
- 시스템 업데이트 후
```

### 2. 에러 처리

#### 캐시 장애 시
- 자동으로 데이터베이스 직접 조회로 폴백
- 사용자에게는 투명하게 처리
- 로그에 캐시 장애 기록

#### 테넌트 컨텍스트 누락 시
```json
{
  "success": false,
  "message": "테넌트 정보가 없습니다.",
  "errorCode": "TENANT_CONTEXT_MISSING"
}
```

---

## 🚀 마이그레이션 가이드

### 기존 API에서 새 API로 전환

#### Before (기존)
```javascript
// 기존 API 호출
fetch('/api/common-codes/USER_STATUS')
```

#### After (신규)
```javascript
// 새로운 API 호출 (캐시 적용)
fetch('/api/v1/common-codes/tenant?codeGroup=USER_STATUS')
```

### 프론트엔드 업데이트 사항
1. API 경로 변경: `/api/common-codes/` → `/api/v1/common-codes/tenant`
2. 쿼리 파라미터 사용: `?codeGroup={group}`
3. 응답 구조 동일 (호환성 유지)

---

## 📈 모니터링 및 알림

### 성능 지표
- **캐시 히트율**: 90% 이상 유지 목표
- **API 응답 시간**: 평균 20ms 이하
- **에러율**: 1% 이하

### 알림 설정
- 캐시 히트율 80% 이하 시 알림
- API 응답 시간 100ms 초과 시 알림
- 캐시 메모리 사용량 90% 초과 시 알림

---

## ✅ 체크리스트

### API 문서화 완료 항목
- [x] 테넌트 코드 API 문서화
- [x] 캐시 관리 API 문서화  
- [x] 대시보드 API 문서화
- [x] 성능 특성 문서화
- [x] 개발자 가이드 작성
- [x] 마이그레이션 가이드 작성
- [x] 모니터링 가이드 작성

### 다음 단계
- [ ] Swagger/OpenAPI 스펙 업데이트
- [ ] Postman 컬렉션 업데이트
- [ ] 개발팀 공유 및 교육
- [ ] 프론트엔드 API 호출 코드 업데이트

---

**문서 작성 완료**: 2025-11-26 10:55  
**상태**: ✅ 완료
