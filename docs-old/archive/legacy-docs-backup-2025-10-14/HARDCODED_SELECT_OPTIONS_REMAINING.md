# 하드코딩된 셀렉트 박스 옵션 - 남은 작업 목록

## 📊 전체 현황
- **총 작업량**: 31개 항목
- **완료**: 16개 (51.6%)
- **남은 작업**: 15개 (48.4%)

## ✅ 완료된 항목 (16개)
1. **성별 코드** (MALE, FEMALE, OTHER) ✅
2. **상담 상태 코드** (CONFIRMED, BOOKED, COMPLETED, CANCELLED, PENDING 등) ✅
3. **상담 유형 코드** (INDIVIDUAL, FAMILY, INITIAL, COUPLE, GROUP) ✅
4. **휴가 유형 코드** (MORNING, AFTERNOON, ALL_DAY 등) ✅
5. **결제 방법 코드** (CARD, BANK_TRANSFER, CASH 등) ✅
6. **결제 상태 코드** (PENDING, PROCESSING, APPROVED, FAILED 등) ✅
7. **상담 시간 코드** (30분, 60분, 90분, 120분) ✅
8. **주소 유형 코드** (HOME, WORK, OFFICE, BRANCH, EMERGENCY, OTHER) ✅
9. **아이템 카테고리 코드** (OFFICE_SUPPLIES, COUNSELING_TOOLS, ELECTRONICS 등) ✅
10. **메시지 유형 코드** (GENERAL, FOLLOW_UP, HOMEWORK, APPOINTMENT, EMERGENCY) ✅
11. **역할 코드** (ADMIN, CONSULTANT, CLIENT 등) ✅
12. **알림 유형 코드** (SUCCESS, ERROR, WARNING, INFO) ✅
13. **상담료 코드** (STANDARD, PREMIUM, DISCOUNT, FREE) ✅

## ⏳ 남은 작업 목록 (15개)

### 1. 보고서 기간 코드 (month, year)
- **우선순위**: 높음
- **예상 위치**: 통계/리포트 관련 컴포넌트
- **코드 그룹**: `REPORT_PERIOD`
- **예상 값**: `MONTH`, `YEAR`, `QUARTER`, `WEEK`

### 2. 매핑 상태 코드 (HAS_MAPPING, ACTIVE_MAPPING, NO_MAPPING 등)
- **우선순위**: 높음
- **예상 위치**: 매핑 관리 관련 컴포넌트
- **코드 그룹**: `MAPPING_STATUS`
- **예상 값**: `HAS_MAPPING`, `ACTIVE_MAPPING`, `NO_MAPPING`, `PENDING_MAPPING`

### 3. 상담 세션 코드 (ONLINE, OFFLINE, PHONE, VIDEO 등)
- **우선순위**: 중간
- **예상 위치**: 상담 예약/관리 관련 컴포넌트
- **코드 그룹**: `CONSULTATION_SESSION`
- **예상 값**: `ONLINE`, `OFFLINE`, `PHONE`, `VIDEO`, `CHAT`

### 4. 우선순위 코드 (HIGH, MEDIUM, LOW, URGENT 등)
- **우선순위**: 중간
- **예상 위치**: 업무 관리 관련 컴포넌트
- **코드 그룹**: `PRIORITY`
- **예상 값**: `HIGH`, `MEDIUM`, `LOW`, `URGENT`, `CRITICAL`

### 5. 상태 코드 (ACTIVE, INACTIVE, PENDING, SUSPENDED 등)
- **우선순위**: 높음
- **예상 위치**: 전반적인 상태 관리 컴포넌트
- **코드 그룹**: `STATUS`
- **예상 값**: `ACTIVE`, `INACTIVE`, `PENDING`, `SUSPENDED`, `DELETED`

### 6. 시간대 코드 (KST, UTC, EST, PST 등)
- **우선순위**: 낮음
- **예상 위치**: 시간 설정 관련 컴포넌트
- **코드 그룹**: `TIMEZONE`
- **예상 값**: `KST`, `UTC`, `EST`, `PST`, `JST`, `CST`

### 7. 언어 코드 (KO, EN, JA, ZH 등)
- **우선순위**: 낮음
- **예상 위치**: 다국어 지원 관련 컴포넌트
- **코드 그룹**: `LANGUAGE`
- **예상 값**: `KO`, `EN`, `JA`, `ZH`, `ES`, `FR`

### 8. 통화 코드 (KRW, USD, EUR, JPY 등)
- **우선순위**: 중간
- **예상 위치**: 결제/금융 관련 컴포넌트
- **코드 그룹**: `CURRENCY`
- **예상 값**: `KRW`, `USD`, `EUR`, `JPY`, `CNY`, `GBP`

### 9. 파일 유형 코드 (PDF, DOC, IMAGE, VIDEO 등)
- **우선순위**: 중간
- **예상 위치**: 파일 업로드/관리 관련 컴포넌트
- **코드 그룹**: `FILE_TYPE`
- **예상 값**: `PDF`, `DOC`, `IMAGE`, `VIDEO`, `AUDIO`, `TEXT`

### 10. 승인 상태 코드 (PENDING, APPROVED, REJECTED, CANCELLED 등)
- **우선순위**: 높음
- **예상 위치**: 승인/검토 관련 컴포넌트
- **코드 그룹**: `APPROVAL_STATUS`
- **예상 값**: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `REVIEWING`

### 11. 알림 채널 코드 (EMAIL, SMS, PUSH, IN_APP 등)
- **우선순위**: 중간
- **예상 위치**: 알림 설정 관련 컴포넌트
- **코드 그룹**: `NOTIFICATION_CHANNEL`
- **예상 값**: `EMAIL`, `SMS`, `PUSH`, `IN_APP`, `WEBHOOK`

### 12. 사용자 상태 코드 (ACTIVE, INACTIVE, SUSPENDED, DELETED 등)
- **우선순위**: 높음
- **예상 위치**: 사용자 관리 관련 컴포넌트
- **코드 그룹**: `USER_STATUS`
- **예상 값**: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `DELETED`, `PENDING`

### 13. 상담 모드 코드 (REAL_TIME, ASYNC, CHAT, VOICE 등)
- **우선순위**: 중간
- **예상 위치**: 상담 예약/진행 관련 컴포넌트
- **코드 그룹**: `CONSULTATION_MODE`
- **예상 값**: `REAL_TIME`, `ASYNC`, `CHAT`, `VOICE`, `VIDEO`

### 14. 결제 게이트웨이 코드 (KAKAO_PAY, NAVER_PAY, TOSS, PAYPAL 등)
- **우선순위**: 중간
- **예상 위치**: 결제 관련 컴포넌트
- **코드 그룹**: `PAYMENT_GATEWAY`
- **예상 값**: `KAKAO_PAY`, `NAVER_PAY`, `TOSS`, `PAYPAL`, `STRIPE`

### 15. 일정 상태 코드 (AVAILABLE, BOOKED, BLOCKED, MAINTENANCE 등)
- **우선순위**: 높음
- **예상 위치**: 일정 관리 관련 컴포넌트
- **코드 그룹**: `SCHEDULE_STATUS`
- **예상 값**: `AVAILABLE`, `BOOKED`, `BLOCKED`, `MAINTENANCE`, `CANCELLED`

## 📝 작업 진행 방법

각 항목에 대해 다음 순서로 진행:

1. **하드코딩된 옵션 검색**: `grep` 명령어로 관련 파일 찾기
2. **DB 코드 그룹 생성**: `CodeInitializationServiceImpl.java`에 초기화 메서드 추가
3. **서버 재시작**: 코드 그룹이 DB에 생성되도록 서버 재시작
4. **API 테스트**: 생성된 코드 그룹이 정상적으로 조회되는지 확인
5. **프론트엔드 수정**: 하드코딩된 옵션을 동적 로드로 변경
6. **TODO 업데이트**: 완료된 항목을 `completed`로 표시

## 🎯 다음 작업 우선순위

1. **보고서 기간 코드** (통계/리포트 관련)
2. **매핑 상태 코드** (매핑 관리 관련)
3. **상태 코드** (전반적인 상태 관리)
4. **승인 상태 코드** (승인/검토 관련)
5. **사용자 상태 코드** (사용자 관리 관련)
6. **일정 상태 코드** (일정 관리 관련)

## 📅 작업 일정

- **시작일**: 2025-01-10
- **완료 목표**: 2025-01-11
- **현재 진행률**: 51.6% (16/31 완료)
- **남은 작업**: 15개 항목

---

**참고**: 모든 공통 코드에는 코드와 한글명이 모두 포함되어야 하며, 아이콘과 색상 정보도 함께 관리됩니다.
