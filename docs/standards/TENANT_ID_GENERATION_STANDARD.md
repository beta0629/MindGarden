# 테넌트 ID 생성 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 테넌트 ID 생성 규칙 및 전략을 정의합니다.

### 참조 문서
- [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md)
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)

### 구현 위치
- `TenantIdGenerator.java` - 인터페이스
- `TenantIdGeneratorImpl.java` - 구현체

---

## 🎯 생성 전략

### 전략 1: 업종 + 지역 기반 (권장) ⭐
```
형식: tenant-{지역코드}-{업종코드}-{순번}
```

**예시**:
```
tenant-seoul-consultation-001
tenant-busan-academy-002
tenant-gyeonggi-hospital-003
tenant-unknown-consultation-001  (지역 정보 없음)
```

**사용 시기**:
- ✅ 온보딩 시 업종(businessType)이 제공된 경우
- ✅ 지역 정보가 있는 경우 (선택적)

---

### 전략 2: 테넌트명 기반 (레거시)
```
형식: {해시8자리}-{UUID}
```

**예시**:
```
a1b2c3d4-550e8400-e29b-41d4-a716-446655440000
```

**사용 시기**:
- ⚠️ 업종 정보가 없고 테넌트명만 있는 경우
- ⚠️ 하위 호환성 유지

---

### 전략 3: 순수 UUID (기본)
```
형식: {UUID}
```

**예시**:
```
550e8400-e29b-41d4-a716-446655440000
```

**사용 시기**:
- ⚠️ 테넌트명과 업종 정보가 모두 없는 경우
- ⚠️ 에러 발생 시 폴백

---

## 📋 상세 규칙

### 업종 코드 정규화

#### 지원 업종
| 업종 타입 | 정규화 코드 | 설명 |
|----------|-----------|------|
| CONSULTATION | consultation | 상담소 |
| ACADEMY | academy | 학원 |
| HOSPITAL | hospital | 병원 |
| FOOD_SERVICE | food-service | 음식점 |
| RETAIL | retail | 소매업 |

#### 정규화 규칙
```java
// 대문자 → 소문자
"ACADEMY" → "academy"

// 언더스코어 → 하이픈
"FOOD_SERVICE" → "food-service"

// 공백 → 하이픈
"BEAUTY SALON" → "beauty-salon"
```

---

### 지역 코드 정규화

#### 지원 지역 (대한민국)
| 지역명 | 정규화 코드 | 영문 |
|-------|-----------|------|
| 서울특별시 | seoul | Seoul |
| 부산광역시 | busan | Busan |
| 인천광역시 | incheon | Incheon |
| 대구광역시 | daegu | Daegu |
| 대전광역시 | daejeon | Daejeon |
| 광주광역시 | gwangju | Gwangju |
| 울산광역시 | ulsan | Ulsan |
| 세종특별자치시 | sejong | Sejong |
| 경기도 | gyeonggi | Gyeonggi |
| 강원도 | gangwon | Gangwon |
| 충청북도 | chungbuk | Chungbuk |
| 충청남도 | chungnam | Chungnam |
| 전라북도 | jeonbuk | Jeonbuk |
| 전라남도 | jeonnam | Jeonnam |
| 경상북도 | gyeongbuk | Gyeongbuk |
| 경상남도 | gyeongnam | Gyeongnam |
| 제주특별자치도 | jeju | Jeju |

#### 정규화 규칙
```java
// 한글 → 영문 소문자
"서울특별시" → "seoul"
"경기도 수원시" → "gyeonggi"

// 지역 정보 없음
null → "unknown"
"" → "unknown"

// 알 수 없는 지역
"기타 지역" → "unknown"
```

---

### 순번 생성 규칙

#### 순번 결정
```java
// 같은 지역 + 업종의 기존 테넌트 수 조회
long existingCount = countTenantsByBusinessTypeAndRegion(businessType, region);
int sequenceNumber = (int) (existingCount + 1);

// 3자리 숫자로 포맷팅
String formattedSequence = String.format("%03d", sequenceNumber);
// 결과: "001", "002", "003", ...
```

#### 중복 체크
```java
// 생성된 ID가 이미 존재하는 경우 순번 증가
while (tenantRepository.existsByTenantId(tenantId)) {
    sequenceNumber++;
    formattedSequence = String.format("%03d", sequenceNumber);
    tenantId = "tenant-" + region + "-" + businessType + "-" + formattedSequence;
}
```

---

## 💻 구현 예시

### 사용법

#### 1. 업종 + 지역 기반 생성 (권장)
```java
@Autowired
private TenantIdGenerator tenantIdGenerator;

// 업종 + 지역
String tenantId = tenantIdGenerator.generateTenantId(
    "마음상담소",           // tenantName
    "CONSULTATION",        // businessType
    "서울특별시 강남구"     // regionCode
);
// 결과: "tenant-seoul-consultation-001"
```

#### 2. 업종만 사용
```java
String tenantId = tenantIdGenerator.generateTenantId(
    "행복학원",            // tenantName
    "ACADEMY"             // businessType
);
// 결과: "tenant-unknown-academy-001"
```

#### 3. 테넌트명만 사용 (레거시)
```java
String tenantId = tenantIdGenerator.generateTenantId("테스트상담소");
// 결과: "a1b2c3d4-550e8400-e29b-41d4-a716-446655440000"
```

#### 4. 기본 UUID
```java
String tenantId = tenantIdGenerator.generateTenantId();
// 결과: "550e8400-e29b-41d4-a716-446655440000"
```

---

## 🔍 생성 예시

### 상담소
```
tenant-seoul-consultation-001       // 서울 1번째
tenant-seoul-consultation-002       // 서울 2번째
tenant-busan-consultation-001       // 부산 1번째
tenant-gyeonggi-consultation-001    // 경기 1번째
```

### 학원
```
tenant-seoul-academy-001            // 서울 1번째
tenant-seoul-academy-002            // 서울 2번째
tenant-gangnam-academy-001          // 강남 1번째 (상세 지역)
```

### 병원
```
tenant-seoul-hospital-001           // 서울 1번째
tenant-busan-hospital-001           // 부산 1번째
```

### 지역 정보 없음
```
tenant-unknown-consultation-001     // 지역 미상 상담소 1번째
tenant-unknown-academy-001          // 지역 미상 학원 1번째
```

---

## ✅ 검증 규칙

### 형식 검증
```java
// 업종 + 지역 기반 형식
Pattern pattern = Pattern.compile("^tenant-[a-z]+-[a-z-]+-\\d{3}$");

// 유효한 예시
"tenant-seoul-consultation-001"     // ✅
"tenant-busan-academy-002"          // ✅
"tenant-unknown-hospital-001"       // ✅

// 유효하지 않은 예시
"tenant-Seoul-consultation-001"     // ❌ 대문자
"tenant-seoul-consultation-1"       // ❌ 순번 2자리
"tenant-seoul-consultation"         // ❌ 순번 없음
```

### 중복 검증
```java
// 데이터베이스에서 중복 체크
boolean exists = tenantRepository.existsByTenantId(tenantId);
if (exists) {
    throw new IllegalStateException("이미 존재하는 테넌트 ID입니다: " + tenantId);
}
```

### 길이 제한
```
최소 길이: 36자 (UUID)
최대 길이: 100자
권장 길이: 30-40자 (업종 + 지역 기반)
```

---

## 🔄 마이그레이션

### 기존 테넌트 ID 변경 불가
```
⚠️ 중요: 테넌트 ID는 생성 후 변경할 수 없습니다.
```

**이유**:
- 외래키 참조
- 세션 관리
- 로그 추적
- 데이터 무결성

### 레거시 ID 유지
```java
// 기존 UUID 형식 테넌트는 그대로 유지
550e8400-e29b-41d4-a716-446655440000  // ✅ 유지

// 새로 생성되는 테넌트만 새 형식 사용
tenant-seoul-consultation-001         // ✅ 신규
```

---

## 📊 통계 및 분석

### 지역별 테넌트 수 조회
```sql
SELECT 
    SUBSTRING_INDEX(SUBSTRING_INDEX(tenant_id, '-', 2), '-', -1) as region,
    COUNT(*) as count
FROM tenants
WHERE tenant_id LIKE 'tenant-%-%-%'
  AND is_deleted = FALSE
GROUP BY region
ORDER BY count DESC;

-- 결과:
-- seoul: 45
-- busan: 23
-- gyeonggi: 18
-- unknown: 12
```

### 업종별 테넌트 수 조회
```sql
SELECT 
    SUBSTRING_INDEX(SUBSTRING_INDEX(tenant_id, '-', 3), '-', -1) as business_type,
    COUNT(*) as count
FROM tenants
WHERE tenant_id LIKE 'tenant-%-%-%'
  AND is_deleted = FALSE
GROUP BY business_type
ORDER BY count DESC;

-- 결과:
-- consultation: 60
-- academy: 30
-- hospital: 8
```

### 지역 + 업종별 테넌트 수 조회
```sql
SELECT 
    SUBSTRING_INDEX(SUBSTRING_INDEX(tenant_id, '-', 2), '-', -1) as region,
    SUBSTRING_INDEX(SUBSTRING_INDEX(tenant_id, '-', 3), '-', -1) as business_type,
    COUNT(*) as count
FROM tenants
WHERE tenant_id LIKE 'tenant-%-%-%'
  AND is_deleted = FALSE
GROUP BY region, business_type
ORDER BY region, count DESC;
```

---

## 🚫 금지 사항

### 수동 생성 금지
```java
// ❌ 수동으로 테넌트 ID 생성 금지
String tenantId = "tenant-custom-001";
tenant.setTenantId(tenantId);

// ✅ 생성기 사용 필수
String tenantId = tenantIdGenerator.generateTenantId(name, businessType, region);
tenant.setTenantId(tenantId);
```

### 하드코딩 금지
```java
// ❌ 하드코딩 금지
if (tenantId.equals("tenant-seoul-consultation-001")) {
    // 특정 테넌트만 처리
}

// ✅ 동적 조회
Tenant tenant = tenantRepository.findByTenantId(tenantId);
if (tenant.getBusinessType().equals("CONSULTATION")) {
    // 업종별 처리
}
```

### 변경 금지
```java
// ❌ 테넌트 ID 변경 금지
tenant.setTenantId("new-tenant-id");

// ✅ 새 테넌트 생성
Tenant newTenant = createNewTenant();
```

---

## 🔧 유틸리티 메서드

### 테넌트 ID 파싱
```java
public class TenantIdUtils {
    
    /**
     * 테넌트 ID에서 지역 코드 추출
     */
    public static String extractRegion(String tenantId) {
        if (tenantId.startsWith("tenant-") && tenantId.split("-").length >= 4) {
            return tenantId.split("-")[1];
        }
        return "unknown";
    }
    
    /**
     * 테넌트 ID에서 업종 코드 추출
     */
    public static String extractBusinessType(String tenantId) {
        if (tenantId.startsWith("tenant-") && tenantId.split("-").length >= 4) {
            return tenantId.split("-")[2];
        }
        return "unknown";
    }
    
    /**
     * 테넌트 ID에서 순번 추출
     */
    public static int extractSequence(String tenantId) {
        if (tenantId.startsWith("tenant-") && tenantId.split("-").length >= 4) {
            try {
                return Integer.parseInt(tenantId.split("-")[3]);
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        return 0;
    }
    
    /**
     * 테넌트 ID 형식 검증
     */
    public static boolean isValidFormat(String tenantId) {
        // 업종 + 지역 기반 형식
        if (tenantId.matches("^tenant-[a-z]+-[a-z-]+-\\d{3}$")) {
            return true;
        }
        // UUID 형식
        if (tenantId.matches("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")) {
            return true;
        }
        // 해시 + UUID 형식
        if (tenantId.matches("^[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")) {
            return true;
        }
        return false;
    }
}
```

---

## ✅ 체크리스트

### 테넌트 생성 시
- [ ] `TenantIdGenerator` 사용
- [ ] 업종 정보 제공 (권장)
- [ ] 지역 정보 제공 (선택)
- [ ] 생성된 ID 검증
- [ ] 중복 체크
- [ ] 로그 기록

### 테넌트 조회 시
- [ ] 테넌트 ID로 조회
- [ ] 소프트 삭제 확인 (`is_deleted = FALSE`)
- [ ] 테넌트 상태 확인 (`status = 'ACTIVE'`)

---

## 📞 문의

테넌트 ID 생성 관련 문의:
- 아키텍처 팀
- 백엔드 팀

**최종 업데이트**: 2025-12-02

