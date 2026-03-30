# 테넌트 공통코드 분류 (tenant_id 필수 vs 불필요)

**작성일**: 2025-12-03  
**목적**: 시스템 공통코드 vs 테넌트 공통코드 명확한 분류

---

## 🎯 분류 기준

### tenant_id = NULL (시스템 공통코드)
```
특징:
- CoreSolution 플랫폼 전역 표준
- 모든 테넌트 동일한 값 사용
- CoreSolution 관리자만 관리
- 일반적으로 사용되는 코드

예시:
- 성별, 은행, 사용자 상태 등
```

### tenant_id = UUID (테넌트 공통코드)
```
특징:
- 입점사(테넌트) 운영에 필요한 코드
- 테넌트마다 다른 값 사용
- 테넌트 관리자가 관리
- 비즈니스 특화 코드

예시:
- 상담 패키지, 전문 분야, 재무 카테고리 등
```

---

## 📊 시스템 공통코드 (tenant_id = NULL)

### 1. 사용자 관련
```sql
-- USER_STATUS (사용자 상태)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
(NULL, 'USER_STATUS', 'ACTIVE', '활성'),
(NULL, 'USER_STATUS', 'INACTIVE', '비활성'),
(NULL, 'USER_STATUS', 'SUSPENDED', '정지'),
(NULL, 'USER_STATUS', 'WITHDRAWN', '탈퇴');

-- GENDER (성별)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
(NULL, 'GENDER', 'MALE', '남성'),
(NULL, 'GENDER', 'FEMALE', '여성'),
(NULL, 'GENDER', 'OTHER', '기타');

-- AGE_GROUP (연령대)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
(NULL, 'AGE_GROUP', 'CHILD', '아동 (7-12세)'),
(NULL, 'AGE_GROUP', 'TEEN', '청소년 (13-18세)'),
(NULL, 'AGE_GROUP', 'ADULT', '성인 (19-64세)'),
(NULL, 'AGE_GROUP', 'SENIOR', '노인 (65세 이상)');
```

### 2. 시스템 관련
```sql
-- SYSTEM_STATUS (시스템 상태)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
(NULL, 'SYSTEM_STATUS', 'RUNNING', '정상 운영'),
(NULL, 'SYSTEM_STATUS', 'MAINTENANCE', '점검 중'),
(NULL, 'SYSTEM_STATUS', 'ERROR', '오류');

-- NOTIFICATION_TYPE (알림 타입)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
(NULL, 'NOTIFICATION_TYPE', 'EMAIL', '이메일'),
(NULL, 'NOTIFICATION_TYPE', 'SMS', 'SMS'),
(NULL, 'NOTIFICATION_TYPE', 'PUSH', '푸시 알림'),
(NULL, 'NOTIFICATION_TYPE', 'KAKAO', '카카오톡');

-- LOG_LEVEL (로그 레벨)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
(NULL, 'LOG_LEVEL', 'DEBUG', '디버그'),
(NULL, 'LOG_LEVEL', 'INFO', '정보'),
(NULL, 'LOG_LEVEL', 'WARN', '경고'),
(NULL, 'LOG_LEVEL', 'ERROR', '오류');
```

### 3. 금융 관련 (표준)
```sql
-- BANK (은행)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
(NULL, 'BANK', 'KB', 'KB국민은행'),
(NULL, 'BANK', 'SHINHAN', '신한은행'),
(NULL, 'BANK', 'WOORI', '우리은행'),
(NULL, 'BANK', 'HANA', '하나은행'),
(NULL, 'BANK', 'NH', 'NH농협은행'),
(NULL, 'BANK', 'IBK', 'IBK기업은행');

-- PAYMENT_STATUS (결제 상태)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
(NULL, 'PAYMENT_STATUS', 'PENDING', '대기'),
(NULL, 'PAYMENT_STATUS', 'COMPLETED', '완료'),
(NULL, 'PAYMENT_STATUS', 'FAILED', '실패'),
(NULL, 'PAYMENT_STATUS', 'CANCELLED', '취소'),
(NULL, 'PAYMENT_STATUS', 'REFUNDED', '환불');
```

### 4. 주소 관련
```sql
-- ADDRESS_TYPE (주소 타입)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
(NULL, 'ADDRESS_TYPE', 'HOME', '자택'),
(NULL, 'ADDRESS_TYPE', 'OFFICE', '직장'),
(NULL, 'ADDRESS_TYPE', 'OTHER', '기타');

-- REGION (지역)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
(NULL, 'REGION', 'SEOUL', '서울'),
(NULL, 'REGION', 'BUSAN', '부산'),
(NULL, 'REGION', 'INCHEON', '인천'),
(NULL, 'REGION', 'DAEGU', '대구'),
(NULL, 'REGION', 'GWANGJU', '광주'),
(NULL, 'REGION', 'DAEJEON', '대전'),
(NULL, 'REGION', 'ULSAN', '울산'),
(NULL, 'REGION', 'SEJONG', '세종'),
(NULL, 'REGION', 'GYEONGGI', '경기'),
(NULL, 'REGION', 'GANGWON', '강원');
```

### 5. 날짜/시간 관련
```sql
-- DAY_OF_WEEK (요일)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
(NULL, 'DAY_OF_WEEK', 'MON', '월요일'),
(NULL, 'DAY_OF_WEEK', 'TUE', '화요일'),
(NULL, 'DAY_OF_WEEK', 'WED', '수요일'),
(NULL, 'DAY_OF_WEEK', 'THU', '목요일'),
(NULL, 'DAY_OF_WEEK', 'FRI', '금요일'),
(NULL, 'DAY_OF_WEEK', 'SAT', '토요일'),
(NULL, 'DAY_OF_WEEK', 'SUN', '일요일');

-- TIME_SLOT (시간대)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
(NULL, 'TIME_SLOT', 'MORNING', '오전 (09:00-12:00)'),
(NULL, 'TIME_SLOT', 'AFTERNOON', '오후 (12:00-18:00)'),
(NULL, 'TIME_SLOT', 'EVENING', '저녁 (18:00-21:00)');
```

---

## 📊 테넌트 공통코드 (tenant_id = UUID)

### 1. 상담 패키지 관련 ⭐
```sql
-- CONSULTATION_PACKAGE (상담 패키지)
-- ⭐ 입점사마다 완전히 다름! (금액, 시간, 옵션)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, extra_data) VALUES
('tenant-uuid', 'CONSULTATION_PACKAGE', 'INDIVIDUAL', '개인상담', 
 JSON_OBJECT('price', 80000, 'duration', 50)),
('tenant-uuid', 'CONSULTATION_PACKAGE', 'FAMILY', '가족상담', 
 JSON_OBJECT('price', 150000, 'duration', 60)),
('tenant-uuid', 'CONSULTATION_PACKAGE', 'GROUP', '집단상담', 
 JSON_OBJECT('price', 50000, 'duration', 90));

-- PACKAGE_TYPE (패키지 타입)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'PACKAGE_TYPE', 'SINGLE', '단회'),
('tenant-uuid', 'PACKAGE_TYPE', 'SHORT_TERM', '단기 (5회)'),
('tenant-uuid', 'PACKAGE_TYPE', 'LONG_TERM', '장기 (10회)');
```

### 2. 결제 방법 ⭐
```sql
-- PAYMENT_METHOD (결제 방법)
-- ⭐ 입점사마다 다름! (A 상담소: 현금/카드만, B 상담소: 현금/카드/계좌이체)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'PAYMENT_METHOD', 'CASH', '현금'),
('tenant-uuid', 'PAYMENT_METHOD', 'CARD', '카드'),
('tenant-uuid', 'PAYMENT_METHOD', 'TRANSFER', '계좌이체');
```

### 3. 전문 분야 ⭐
```sql
-- SPECIALTY (전문 분야)
-- ⭐ 입점사마다 다름! (A: 우울증/불안, B: 청소년/진로)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'SPECIALTY', 'DEPRESSION', '우울증'),
('tenant-uuid', 'SPECIALTY', 'ANXIETY', '불안장애'),
('tenant-uuid', 'SPECIALTY', 'FAMILY', '가족상담'),
('tenant-uuid', 'SPECIALTY', 'TRAUMA', '트라우마'),
('tenant-uuid', 'SPECIALTY', 'ADDICTION', '중독');
```

### 4. 상담 유형 ⭐
```sql
-- CONSULTATION_TYPE (상담 유형)
-- ⭐ 입점사마다 다름! (A: 대면/비대면, B: 대면만)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'CONSULTATION_TYPE', 'FACE_TO_FACE', '대면상담'),
('tenant-uuid', 'CONSULTATION_TYPE', 'ONLINE', '비대면상담'),
('tenant-uuid', 'CONSULTATION_TYPE', 'PHONE', '전화상담'),
('tenant-uuid', 'CONSULTATION_TYPE', 'VIDEO', '화상상담');
```

### 5. 재무 카테고리 ⭐
```sql
-- FINANCIAL_CATEGORY (재무 카테고리)
-- ⭐ 입점사마다 다름! (세부 분류가 다름)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'FINANCIAL_CATEGORY', 'INCOME_CONSULTATION', '상담 수입'),
('tenant-uuid', 'FINANCIAL_CATEGORY', 'INCOME_PACKAGE', '패키지 수입'),
('tenant-uuid', 'FINANCIAL_CATEGORY', 'INCOME_TEST', '검사 수입'),
('tenant-uuid', 'FINANCIAL_CATEGORY', 'EXPENSE_SALARY', '급여'),
('tenant-uuid', 'FINANCIAL_CATEGORY', 'EXPENSE_RENT', '임대료'),
('tenant-uuid', 'FINANCIAL_CATEGORY', 'EXPENSE_UTILITY', '공과금'),
('tenant-uuid', 'FINANCIAL_CATEGORY', 'EXPENSE_SUPPLY', '소모품');

-- TAX_CATEGORY (세금 카테고리)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'TAX_CATEGORY', 'INCOME_TAX', '소득세'),
('tenant-uuid', 'TAX_CATEGORY', 'VAT', '부가가치세'),
('tenant-uuid', 'TAX_CATEGORY', 'LOCAL_TAX', '지방세');

-- BUDGET_CATEGORY (예산 카테고리)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'BUDGET_CATEGORY', 'PERSONNEL', '인건비'),
('tenant-uuid', 'BUDGET_CATEGORY', 'FACILITY', '시설비'),
('tenant-uuid', 'BUDGET_CATEGORY', 'MARKETING', '마케팅비'),
('tenant-uuid', 'BUDGET_CATEGORY', 'EDUCATION', '교육비');
```

### 6. 재고/구매 관련 ⭐
```sql
-- ITEM_CATEGORY (품목 카테고리)
-- ⭐ 입점사마다 다름! (구매하는 물품이 다름)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'ITEM_CATEGORY', 'OFFICE_SUPPLY', '사무용품'),
('tenant-uuid', 'ITEM_CATEGORY', 'TEST_TOOL', '검사 도구'),
('tenant-uuid', 'ITEM_CATEGORY', 'BOOK', '도서'),
('tenant-uuid', 'ITEM_CATEGORY', 'FURNITURE', '가구'),
('tenant-uuid', 'ITEM_CATEGORY', 'EQUIPMENT', '장비');

-- SUPPLIER (공급업체)
-- ⭐ 입점사마다 다름!
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'SUPPLIER', 'SUPPLIER_A', 'A 문구점'),
('tenant-uuid', 'SUPPLIER', 'SUPPLIER_B', 'B 심리검사센터'),
('tenant-uuid', 'SUPPLIER', 'SUPPLIER_C', 'C 가구업체');
```

### 7. 상담 기록 관련 ⭐
```sql
-- CONSULTATION_STATUS (상담 상태)
-- ⭐ 입점사마다 다를 수 있음
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'CONSULTATION_STATUS', 'SCHEDULED', '예약됨'),
('tenant-uuid', 'CONSULTATION_STATUS', 'IN_PROGRESS', '진행 중'),
('tenant-uuid', 'CONSULTATION_STATUS', 'COMPLETED', '완료'),
('tenant-uuid', 'CONSULTATION_STATUS', 'CANCELLED', '취소'),
('tenant-uuid', 'CONSULTATION_STATUS', 'NO_SHOW', '노쇼');

-- CONSULTATION_OUTCOME (상담 결과)
-- ⭐ 입점사마다 다름!
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'CONSULTATION_OUTCOME', 'IMPROVED', '호전'),
('tenant-uuid', 'CONSULTATION_OUTCOME', 'MAINTAINED', '유지'),
('tenant-uuid', 'CONSULTATION_OUTCOME', 'WORSENED', '악화'),
('tenant-uuid', 'CONSULTATION_OUTCOME', 'TERMINATED', '종결');

-- REFERRAL_SOURCE (의뢰 경로)
-- ⭐ 입점사마다 다름!
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'REFERRAL_SOURCE', 'SELF', '자발적 방문'),
('tenant-uuid', 'REFERRAL_SOURCE', 'FAMILY', '가족 권유'),
('tenant-uuid', 'REFERRAL_SOURCE', 'SCHOOL', '학교 의뢰'),
('tenant-uuid', 'REFERRAL_SOURCE', 'HOSPITAL', '병원 의뢰'),
('tenant-uuid', 'REFERRAL_SOURCE', 'ONLINE', '온라인 검색');
```

### 8. 평가/검사 관련 ⭐
```sql
-- ASSESSMENT_TYPE (평가 유형)
-- ⭐ 입점사마다 보유한 검사 도구가 다름!
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, extra_data) VALUES
('tenant-uuid', 'ASSESSMENT_TYPE', 'MMPI', 'MMPI (다면적 인성검사)', 
 JSON_OBJECT('price', 50000, 'duration', 60)),
('tenant-uuid', 'ASSESSMENT_TYPE', 'BDI', 'BDI (우울증 척도)', 
 JSON_OBJECT('price', 20000, 'duration', 20)),
('tenant-uuid', 'ASSESSMENT_TYPE', 'BAI', 'BAI (불안 척도)', 
 JSON_OBJECT('price', 20000, 'duration', 20));
```

### 9. 직원 관리 관련 ⭐
```sql
-- EMPLOYMENT_TYPE (고용 형태)
-- ⭐ 입점사마다 다를 수 있음
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'EMPLOYMENT_TYPE', 'FULL_TIME', '정규직'),
('tenant-uuid', 'EMPLOYMENT_TYPE', 'PART_TIME', '비정규직'),
('tenant-uuid', 'EMPLOYMENT_TYPE', 'CONTRACT', '계약직'),
('tenant-uuid', 'EMPLOYMENT_TYPE', 'INTERN', '인턴');

-- POSITION (직급)
-- ⭐ 입점사마다 다름!
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'POSITION', 'DIRECTOR', '소장'),
('tenant-uuid', 'POSITION', 'SENIOR_CONSULTANT', '수석상담사'),
('tenant-uuid', 'POSITION', 'CONSULTANT', '상담사'),
('tenant-uuid', 'POSITION', 'STAFF', '사무원');
```

### 10. 마케팅 관련 ⭐
```sql
-- MARKETING_CHANNEL (마케팅 채널)
-- ⭐ 입점사마다 사용하는 채널이 다름!
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name) VALUES
('tenant-uuid', 'MARKETING_CHANNEL', 'NAVER_BLOG', '네이버 블로그'),
('tenant-uuid', 'MARKETING_CHANNEL', 'INSTAGRAM', '인스타그램'),
('tenant-uuid', 'MARKETING_CHANNEL', 'FACEBOOK', '페이스북'),
('tenant-uuid', 'MARKETING_CHANNEL', 'KAKAO', '카카오톡'),
('tenant-uuid', 'MARKETING_CHANNEL', 'FLYER', '전단지');
```

---

## 📋 최종 분류표

### 시스템 공통코드 (tenant_id = NULL)
```
✅ USER_STATUS (사용자 상태)
✅ GENDER (성별)
✅ AGE_GROUP (연령대)
✅ SYSTEM_STATUS (시스템 상태)
✅ NOTIFICATION_TYPE (알림 타입)
✅ LOG_LEVEL (로그 레벨)
✅ BANK (은행)
✅ PAYMENT_STATUS (결제 상태)
✅ ADDRESS_TYPE (주소 타입)
✅ REGION (지역)
✅ DAY_OF_WEEK (요일)
✅ TIME_SLOT (시간대)

특징: 모든 테넌트 동일, 표준화된 값
```

### 테넌트 공통코드 (tenant_id = UUID)
```
⭐ CONSULTATION_PACKAGE (상담 패키지) - 금액, 시간 포함!
⭐ PACKAGE_TYPE (패키지 타입)
⭐ PAYMENT_METHOD (결제 방법)
⭐ SPECIALTY (전문 분야)
⭐ CONSULTATION_TYPE (상담 유형)
⭐ FINANCIAL_CATEGORY (재무 카테고리)
⭐ TAX_CATEGORY (세금 카테고리)
⭐ BUDGET_CATEGORY (예산 카테고리)
⭐ ITEM_CATEGORY (품목 카테고리)
⭐ SUPPLIER (공급업체)
⭐ CONSULTATION_STATUS (상담 상태)
⭐ CONSULTATION_OUTCOME (상담 결과)
⭐ REFERRAL_SOURCE (의뢰 경로)
⭐ ASSESSMENT_TYPE (평가 유형) - 금액 포함!
⭐ EMPLOYMENT_TYPE (고용 형태)
⭐ POSITION (직급)
⭐ MARKETING_CHANNEL (마케팅 채널)

특징: 입점사마다 다름, 비즈니스 특화
```

---

## 🎯 판단 기준

### tenant_id = NULL (시스템 공통코드)
```
질문: "모든 상담소가 동일한 값을 사용하는가?"
답변: YES → 시스템 공통코드

예시:
- 성별: 남성/여성/기타 (모든 상담소 동일)
- 은행: KB/신한/우리 (모든 상담소 동일)
- 요일: 월/화/수/목/금/토/일 (모든 상담소 동일)
```

### tenant_id = UUID (테넌트 공통코드)
```
질문: "입점사마다 다른 값을 사용하는가?"
답변: YES → 테넌트 공통코드

예시:
- 상담 패키지: A 상담소는 80,000원, B 상담소는 100,000원 (다름!)
- 전문 분야: A는 우울증/불안, B는 청소년/진로 (다름!)
- 재무 카테고리: A는 10개, B는 5개 (다름!)
```

---

## ✅ 결론

### 테넌트 공통코드 = 입점사 운영에 필요한 모든 것!
```
1. 상담 관련
   - 패키지 (금액 포함!)
   - 전문 분야
   - 상담 유형
   - 평가 도구

2. 재무 관련
   - 재무 카테고리
   - 세금 카테고리
   - 예산 카테고리

3. 구매 관련
   - 품목 카테고리
   - 공급업체

4. 인사 관련
   - 고용 형태
   - 직급

5. 마케팅 관련
   - 마케팅 채널
```

---

**작성 완료**: 2025-12-03  
**핵심**: 입점사마다 다르면 tenant_id 필수!

