# 온보딩 프로세스 종합 진단 가이드

## 개요
온보딩 프로세스가 실패할 때 체계적으로 문제를 진단하는 방법입니다.

## 진단 방법

### 방법 1: GitHub Actions 워크플로우 실행 (권장)
1. GitHub 저장소로 이동: https://github.com/beta0629/MindGarden/actions
2. "🔍 온보딩 프로세스 종합 진단" 워크플로우 선택
3. "Run workflow" 버튼 클릭
4. 실행 결과 확인

### 방법 2: 서버에 직접 접속하여 진단 스크립트 실행
```bash
# 서버 접속
ssh root@beta0629.cafe24.com

# 진단 스크립트 실행
bash /var/www/mindgarden-dev/scripts/development/testing/diagnose-onboarding-comprehensive.sh
```

## 진단 항목

### 1. 데이터베이스 상태 확인
- Flyway 마이그레이션 상태
- role_templates 테이블 상태
- COUNSELING 업종 템플릿 존재 여부
- 최근 온보딩 요청 상태
- 프로시저 존재 확인

### 2. 프로시저 정의 확인
- ProcessOnboardingApproval 프로시저 정의 확인
- 프로시저가 올바르게 정의되어 있는지 확인

### 3. 최근 온보딩 프로세스 로그
- 온보딩 관련 로그 필터링
- 프로시저 실행/결과 로그
- 메타데이터 검증 로그
- 오류 메시지 확인

### 4. 에러 로그 상세 확인
- ERROR 레벨 로그만 필터링
- 온보딩 관련 에러만 추출

### 5. 애플리케이션 상태 확인
- 서비스 상태 확인
- 서비스가 정상 실행 중인지 확인

## 일반적인 문제 및 해결 방법

### 문제 1: COUNSELING 업종 템플릿이 없음
**증상:**
```
[메타데이터 검증 실패] 업종 'COUNSELING'에 대한 역할 템플릿이 없습니다.
```

**해결 방법:**
1. Flyway 마이그레이션 상태 확인
2. `V20251225_002__add_counseling_role_templates.sql` 마이그레이션이 실행되었는지 확인
3. 실행되지 않았다면 수동으로 실행:
```sql
-- role_templates 테이블에 COUNSELING 템플릿 추가
INSERT IGNORE INTO role_templates (
    role_template_id, template_code, name, name_ko, name_en,
    business_type, description, description_ko, description_en,
    is_active, display_order, is_system_template,
    created_at, updated_at, created_by, updated_by, is_deleted, version, lang_code
) VALUES
(UUID(), 'COUNSELING_DIRECTOR', '원장', '원장', 'Director',
 'COUNSELING', '상담소 원장 역할', '상담소 원장 역할', 'Counseling center director role',
 TRUE, 1, TRUE, NOW(), NOW(), 'system', 'system', FALSE, 0, 'ko'),
(UUID(), 'COUNSELING_COUNSELOR', '상담사', '상담사', 'Counselor',
 'COUNSELING', '상담소 상담사 역할', '상담소 상담사 역할', 'Counseling center counselor role',
 TRUE, 2, TRUE, NOW(), NOW(), 'system', 'system', FALSE, 0, 'ko'),
(UUID(), 'COUNSELING_CLIENT', '내담자', '내담자', 'Client',
 'COUNSELING', '상담소 내담자 역할', '상담소 내담자 역할', 'Counseling center client role',
 TRUE, 3, TRUE, NOW(), NOW(), 'system', 'system', FALSE, 0, 'ko'),
(UUID(), 'COUNSELING_STAFF', '사무원', '사무원', 'Staff',
 'COUNSELING', '상담소 사무원 역할', '상담소 사무원 역할', 'Counseling center staff role',
 TRUE, 4, TRUE, NOW(), NOW(), 'system', 'system', FALSE, 0, 'ko');
```

### 문제 2: 프로시저가 NULL이거나 정의되지 않음
**증상:**
```
프로시저 실행 실패: 알 수 없는 오류
```

**해결 방법:**
1. 프로시저 존재 확인:
```sql
SELECT ROUTINE_NAME, ROUTINE_DEFINITION IS NOT NULL as has_definition
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
AND ROUTINE_NAME = 'ProcessOnboardingApproval';
```

2. 프로시저가 NULL이면 마이그레이션 재실행:
```bash
# 서버에서 애플리케이션 재시작
sudo systemctl restart mindgarden-dev.service
```

### 문제 3: 프로시저 실행 실패
**증상:**
```
프로시저 실행 실패: 프로세스가 false를 반환했습니다.
```

**해결 방법:**
1. 프로시저 내부 오류 확인:
   - 로그에서 "프로시저 실행 실패" 메시지 확인
   - SQL 오류 코드 확인
   - 프로시저 파라미터 확인

2. Java fallback 로그 확인:
   - "Java 재시도" 로그 확인
   - "관리자 계정 생성 실패" 메시지 확인

### 문제 4: Transaction silently rolled back
**증상:**
```
Transaction silently rolled back because it has been marked as rollback-only
```

**해결 방법:**
1. 로그에서 원인 확인
2. 일반적인 원인:
   - 중복 키 오류
   - 외래 키 제약 조건 위반
   - NULL 제약 조건 위반
   - Lock timeout

## 체계적 진단 체크리스트

- [ ] 데이터베이스 연결 확인
- [ ] Flyway 마이그레이션 상태 확인
- [ ] role_templates 테이블에 COUNSELING 템플릿 존재 확인
- [ ] 프로시저 존재 및 정의 확인
- [ ] 최근 온보딩 요청 상태 확인
- [ ] 서비스 로그에서 오류 메시지 확인
- [ ] 프로시저 실행 파라미터 확인
- [ ] Java fallback 로그 확인

## 다음 단계

진단 결과를 바탕으로:
1. 근본 원인 파악
2. 문제 해결 방안 수립
3. 수정 사항 적용
4. 재테스트

