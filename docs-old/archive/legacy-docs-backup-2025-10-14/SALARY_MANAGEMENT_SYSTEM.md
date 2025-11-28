# 급여 관리 시스템

## 개요

MindGarden 상담 관리 시스템의 급여 관리 모듈은 상담사들의 급여 계산, 세금 처리, 급여 프로필 관리를 담당합니다. PL/SQL과 연동하여 실시간 통계 업데이트 및 ERP 시스템 연동을 지원합니다.

## 주요 기능

### 1. 급여 프로필 관리
- **상담사별 급여 프로필 생성 및 관리**
  - 급여 유형 설정 (프리랜서/정규직)
  - 기본급여 및 시급 설정
  - 계약 기간 및 조건 관리
  - 사업자 등록 정보 관리
- **등급별 자동 급여 계산**
  - 공통코드 기반 등급별 기본급여
  - 성과에 따른 급여 조정
  - 지점별 급여 관리

### 2. PL/SQL 연동 급여 계산
- **통합 급여 계산 시스템**
  - `ProcessIntegratedSalaryCalculation` 프로시저
  - 프리랜서/정규직 구분 자동 계산
  - 세금 자동 계산 및 적용
- **실시간 성과 기반 계산**
  - 상담 완료 건수 기반
  - 고객 만족도 반영
  - 보너스 및 인센티브 자동 계산

### 3. 세금 및 공제 시스템
- **세금 자동 계산**
  - 소득세 (원천징수)
  - 지방소득세
  - 부가가치세 (사업자 등록 시)
  - 4대보험 (국민연금, 건강보험, 장기요양, 고용보험)
- **공제 항목 관리**
  - 법정 공제
  - 기타 공제 항목

### 4. ERP 시스템 연동
- **자동 ERP 동기화**
  - `ProcessSalaryPaymentWithErpSync` 프로시저
  - 급여 지급 시 ERP 자동 업데이트
  - 회계 시스템 연동
- **재무 거래 자동 생성**
  - 급여 지급 시 자동 회계 처리
  - 세금 납부 내역 생성

### 5. 통계 및 분석
- **실시간 급여 통계**
  - 지점별 급여 현황
  - 상담사별 급여 분석
  - 세금 납부 현황
- **성과 분석**
  - 급여 대비 성과 분석
  - 상위 성과자 조회
  - 급여 증감 추이

## 기술 스택

### 백엔드
- **Spring Boot 3.2.0**
- **JPA/Hibernate 6.4.0** - 데이터 영속성
- **MySQL 8.0** - 데이터베이스
- **PL/SQL 프로시저** - 복잡한 급여 계산 로직
- **Jackson** - JSON 처리
- **Spring Security** - 보안 및 인증

### 프론트엔드
- **React 18.x**
- **JavaScript ES6+**
- **CSS3** - 스타일링
- **Axios** - HTTP 클라이언트

### 데이터베이스
- **MySQL 8.0**
- **PL/SQL 프로시저** - 급여, 통계, 할인, 매핑 동기화
- **실시간 통계 업데이트**
- **ERP 시스템 연동**

## 데이터베이스 스키마

### 주요 엔티티
- `ConsultantSalaryProfile` - 상담사 급여 프로필
  - `businessRegistrationNumber` - 사업자 등록번호
  - `businessName` - 사업자명
  - `isBusinessRegistered` - 사업자 등록 여부
- `ConsultantSalaryOption` - 급여 옵션
- `SalaryCalculation` - 급여 계산 내역
- `SalaryTaxCalculation` - 세금 계산 내역

### 공통코드
- `SALARY_TYPE` - 급여 유형 (FREELANCE, REGULAR)
- `CONSULTANT_GRADE` - 상담사 등급
- `SALARY_OPTION_TYPE` - 급여 옵션 유형
- `SALARY_PAY_DAY` - 급여 지급일

## API 엔드포인트

### 급여 프로필 관리
- `GET /api/admin/salary/profiles/{consultantId}` - 급여 프로필 조회
- `POST /api/admin/salary/profiles` - 급여 프로필 생성
- `PUT /api/admin/salary/profiles/{id}` - 급여 프로필 수정

### 급여 계산
- `POST /api/admin/salary/calculate/freelance` - 프리랜서 급여 계산
- `POST /api/admin/salary/calculate/regular` - 정규직 급여 계산
- `GET /api/admin/salary/calculations/{consultantId}` - 급여 계산 내역 조회

### 급여 출력
- `GET /api/admin/salary/export/pdf/{calculationId}` - PDF 급여 계산서 다운로드
- `GET /api/admin/salary/export/excel/{calculationId}` - Excel 급여 계산서 다운로드
- `POST /api/admin/salary/send-email/{calculationId}` - 급여 계산서 이메일 전송

## 사용법

### 1. 급여 프로필 생성
1. ERP 대시보드 → 급여 관리 메뉴 접근
2. 상담사 선택 → "프로필 조회" 클릭
3. 급여 프로필 정보 입력:
   - 급여 유형 선택 (프리랜서/정규직)
   - 상담사 등급 선택 (자동으로 기본급여 계산됨)
   - 사업자 등록 여부 선택
   - 사업자 등록 시 필수 입력:
     - 사업자 등록번호 (123-45-67890 형식)
     - 사업자명
   - 계약 조건 입력
4. "생성" 버튼 클릭

### 2. 급여 계산
1. 급여 관리 → "급여 계산" 탭
2. 계산할 상담사 및 기간 선택
3. "계산" 버튼 클릭
4. 계산 결과 확인 및 승인

### 3. 급여 출력
1. 급여 계산 내역에서 "출력" 버튼 클릭
2. 출력 형식 선택 (PDF/Excel)
3. 다운로드 또는 이메일 전송

## 설정 및 커스터마이징

### 등급별 기본급여 변경
`frontend/src/components/erp/ConsultantProfileModal.js`의 `calculateBaseSalaryByGrade` 함수에서 수정:

```javascript
const gradeSalaryMap = {
    'CONSULTANT_JUNIOR': 30000,    // 주니어: 30,000원
    'CONSULTANT_SENIOR': 35000,    // 시니어: 35,000원
    'CONSULTANT_EXPERT': 40000,    // 엑스퍼트: 40,000원
    'CONSULTANT_MASTER': 45000     // 마스터: 45,000원
};
```

### 세금 계산 로직 변경
`src/main/java/com/mindgarden/consultation/service/impl/TaxCalculationServiceImpl.java`에서 수정

### 급여 출력 템플릿 변경
`frontend/src/components/common/SalaryPrintComponent.js`에서 수정

## 트러블슈팅

### 1. 등급이 "미설정"으로 표시되는 경우
- 상담사 등급이 제대로 로드되지 않음
- `loadSalaryProfile` 함수에서 `response.consultant.grade` 확인
- 등급 목록이 제대로 로드되었는지 확인

### 2. 수정 버튼이 표시되지 않는 경우
- `salaryProfile` 상태가 제대로 설정되었는지 확인
- `showSalaryForm` 상태 확인

### 3. 급여 계산 오류
- 상담 완료 스케줄 데이터 확인
- 급여 프로필 설정 확인
- 세금 계산 로직 확인

## 개발 가이드

### 새로운 급여 옵션 추가
1. `ConsultantSalaryOption` 엔티티에 필드 추가
2. 공통코드에 옵션 유형 추가
3. 급여 계산 로직에 옵션 처리 추가

### 새로운 세금 유형 추가
1. `SalaryTaxCalculation` 엔티티에 필드 추가
2. `TaxCalculationService`에 계산 로직 추가
3. 세금 출력 템플릿 업데이트

## 버전 히스토리

### v1.0.0 (2025-01-11)
- 급여 관리 시스템 초기 구현
- 프리랜서/정규직 급여 계산
- 세금 계산 및 출력 기능
- 이메일 전송 기능
- 상담사 등급별 기본급여 자동 계산

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
