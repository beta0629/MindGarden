# ERD 시스템 경쟁력 있는 기능 설계

**작성일:** 2025-01-XX  
**목적:** 사람들이 보고 경쟁력 있다고 말할 정도의 수준으로 ERD 시스템 고도화

## 1. 경쟁력 있는 기능 목표

### 1.1 핵심 가치 제안
- ✅ **데이터 중앙화**: 모든 ERD 데이터는 중앙 데이터베이스에 저장
- ✅ **실시간 동기화**: 스키마 변경 시 즉시 ERD 업데이트
- ✅ **AI 기반 분석**: ERD 기반 자동 분석 및 추천
- ✅ **코드 생성**: ERD 기반 자동 코드 생성
- ✅ **성능 분석**: ERD 기반 성능 최적화 제안
- ✅ **협업 기능**: ERD 기반 팀 협업 및 리뷰

### 1.2 경쟁력 있는 기능 목록

#### Tier 1: 필수 기능 (경쟁력 기본)
1. **실시간 ERD 동기화**
   - 스키마 변경 시 즉시 ERD 업데이트
   - ERD 변경 이력 실시간 추적
   - ERD 버전 관리 자동화

2. **인터랙티브 ERD 뷰어**
   - 3D ERD 시각화 (선택적)
   - 테이블 클릭 시 상세 정보 모달
   - 관계선 클릭 시 관련 테이블 하이라이트
   - ERD 확대/축소, 필터링, 검색

3. **ERD 기반 코드 생성**
   - ERD에서 Entity 클래스 자동 생성
   - ERD에서 Repository 인터페이스 자동 생성
   - ERD에서 DTO 클래스 자동 생성
   - ERD에서 API 스펙 자동 생성

4. **ERD 성능 분석**
   - 테이블 크기 및 인덱스 분석
   - 쿼리 성능 예측
   - 인덱스 최적화 제안
   - 파티셔닝 제안

#### Tier 2: 고급 기능 (경쟁력 강화)
5. **ERD 의존성 분석**
   - 테이블 간 의존성 그래프
   - 변경 영향도 분석
   - 마이그레이션 경로 제안
   - 롤백 시나리오 생성

6. **ERD 기반 API 문서 자동 생성**
   - ERD에서 OpenAPI 스펙 자동 생성
   - ERD에서 GraphQL 스키마 자동 생성
   - API 문서 자동 업데이트

7. **ERD 기반 테스트 케이스 생성**
   - ERD에서 단위 테스트 자동 생성
   - ERD에서 통합 테스트 자동 생성
   - ERD에서 E2E 테스트 시나리오 생성

8. **AI 기반 ERD 분석**
   - ERD 패턴 분석 및 추천
   - 비정상적인 관계 감지
   - 최적화 제안
   - 보안 취약점 분석

#### Tier 3: 차별화 기능 (경쟁력 극대화)
9. **ERD 협업 기능**
   - ERD 주석 및 리뷰
   - ERD 변경 요청 및 승인
   - ERD 기반 코드 리뷰
   - ERD 기반 문서화

10. **ERD 기반 모니터링**
    - ERD 변경 알림
    - ERD 기반 성능 모니터링
    - ERD 기반 장애 예측
    - ERD 기반 용량 계획

11. **ERD 기반 자동화**
    - ERD 변경 시 자동 마이그레이션 생성
    - ERD 변경 시 자동 테스트 실행
    - ERD 변경 시 자동 배포 검증
    - ERD 변경 시 자동 문서 업데이트

12. **ERD 기반 시각화 고도화**
    - ERD 애니메이션 (변경 이력 재생)
    - ERD 비교 시각화 (Before/After)
    - ERD 통계 대시보드
    - ERD 트렌드 분석

## 2. 데이터 중앙화 원칙

### 2.1 ERD 데이터 중앙화
- **모든 ERD 데이터는 `core_solution` DB에 저장**
- **테넌트별 ERD도 중앙 DB에 저장** (`tenant_id`로 구분)
- **ERD 메타데이터, 변경 이력, 주석 등 모든 데이터 중앙화**
- **ERD 생성 로직도 중앙화** (PL/SQL 프로시저로 구현)

### 2.2 ERD 데이터 구조
```sql
-- ERD 다이어그램 (중앙화)
erd_diagrams (tenant_id로 구분)
erd_diagram_history (tenant_id로 구분)
erd_table_mappings (tenant_id로 구분)
erd_comments (tenant_id로 구분)
erd_reviews (tenant_id로 구분)
erd_analytics (tenant_id로 구분)
```

## 3. 코어 솔루션 PL/SQL 아키텍처

### 3.1 핵심 원칙
- ✅ **모든 핵심 비즈니스 로직은 PL/SQL 프로시저로 구현**
- ✅ **데이터 정확성 보장**: 트랜잭션 내에서 데이터 일관성 유지
- ✅ **동적 처리**: 데이터 기반으로 동적으로 로직 실행
- ✅ **중앙화**: 모든 코어 로직은 중앙 DB에 저장
- ✅ **재사용성**: 공통 로직은 프로시저로 재사용

### 3.2 온보딩 시스템 PL/SQL 코어 로직

#### 3.2.1 온보딩 승인 시 ERD 생성 PL/SQL 프로시저

```sql
DELIMITER //

-- 온보딩 승인 시 ERD 자동 생성 프로시저
CREATE PROCEDURE GenerateErdOnOnboardingApproval(
    IN p_tenant_id VARCHAR(36),
    IN p_tenant_name VARCHAR(255),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_diagram_id VARCHAR(36);
    DECLARE v_mermaid_code TEXT;
    DECLARE v_text_erd TEXT;
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('ERD 생성 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 전체 시스템 ERD 생성
    SET v_diagram_id = UUID();
    CALL GenerateFullSystemErd(p_tenant_id, v_diagram_id, v_mermaid_code, v_text_erd, @gen_success, @gen_message);
    
    IF @gen_success = FALSE THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('전체 시스템 ERD 생성 실패: ', @gen_message);
        ROLLBACK;
    ELSE
        -- ERD 메타데이터 저장
        INSERT INTO erd_diagrams (
            diagram_id, tenant_id, name, description,
            diagram_type, mermaid_code, text_erd,
            version, is_active, is_public,
            created_by, updated_by
        ) VALUES (
            v_diagram_id, p_tenant_id, 
            CONCAT(p_tenant_name, ' - 전체 시스템 ERD'),
            CONCAT('온보딩 승인 시 자동 생성된 전체 시스템 ERD'),
            'FULL', v_mermaid_code, v_text_erd,
            1, TRUE, TRUE,
            p_approved_by, p_approved_by
        );
        
        -- ERD 변경 이력 기록
        INSERT INTO erd_diagram_history (
            diagram_id, tenant_id, version, change_type,
            change_description, mermaid_code,
            changed_by, trigger_source
        ) VALUES (
            v_diagram_id, p_tenant_id, 1, 'CREATED',
            '온보딩 승인 시 자동 생성',
            v_mermaid_code,
            p_approved_by, 'ONBOARDING_APPROVAL'
        );
    END IF;
    
    -- 2. 업종별 모듈 ERD 생성
    IF p_business_type IS NOT NULL THEN
        SET v_diagram_id = UUID();
        CALL GenerateModuleErd(p_tenant_id, p_business_type, v_diagram_id, v_mermaid_code, v_text_erd, @mod_success, @mod_message);
        
        IF @mod_success = TRUE THEN
            INSERT INTO erd_diagrams (
                diagram_id, tenant_id, name, description,
                diagram_type, module_type, mermaid_code, text_erd,
                version, is_active, is_public,
                created_by, updated_by
            ) VALUES (
                v_diagram_id, p_tenant_id,
                CONCAT(p_tenant_name, ' - ', p_business_type, ' 모듈 ERD'),
                CONCAT('온보딩 승인 시 자동 생성된 ', p_business_type, ' 모듈 ERD'),
                'MODULE', p_business_type, v_mermaid_code, v_text_erd,
                1, TRUE, TRUE,
                p_approved_by, p_approved_by
            );
            
            INSERT INTO erd_diagram_history (
                diagram_id, tenant_id, version, change_type,
                change_description, mermaid_code,
                changed_by, trigger_source
            ) VALUES (
                v_diagram_id, p_tenant_id, 1, 'CREATED',
                CONCAT('온보딩 승인 시 자동 생성 (', p_business_type, ' 모듈)'),
                v_mermaid_code,
                p_approved_by, 'ONBOARDING_APPROVAL'
            );
        END IF;
    END IF;
    
    COMMIT;
    SET p_success = TRUE;
    SET p_message = 'ERD 생성이 완료되었습니다.';
    
END //

-- 전체 시스템 ERD 생성 프로시저
CREATE PROCEDURE GenerateFullSystemErd(
    IN p_tenant_id VARCHAR(36),
    IN p_diagram_id VARCHAR(36),
    OUT p_mermaid_code TEXT,
    OUT p_text_erd TEXT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_table_name VARCHAR(255);
    DECLARE v_column_name VARCHAR(255);
    DECLARE v_data_type VARCHAR(100);
    DECLARE v_is_nullable VARCHAR(3);
    DECLARE v_column_key VARCHAR(3);
    DECLARE v_referenced_table VARCHAR(255);
    DECLARE v_referenced_column VARCHAR(255);
    DECLARE v_mermaid TEXT DEFAULT 'erDiagram\n';
    DECLARE v_text TEXT DEFAULT '';
    DECLARE done INT DEFAULT FALSE;
    
    DECLARE cur_tables CURSOR FOR
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_TYPE = 'BASE TABLE'
            AND (TABLE_NAME LIKE CONCAT('%', p_tenant_id, '%') 
                 OR TABLE_NAME NOT LIKE '%_%' 
                 OR TABLE_NAME IN ('tenants', 'branches', 'auth_users', 'staff_accounts', 'consumer_accounts'))
        ORDER BY TABLE_NAME;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- 테이블 정의 생성
    OPEN cur_tables;
    read_loop: LOOP
        FETCH cur_tables INTO v_table_name;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 테이블 속성 추가
        SET v_mermaid = CONCAT(v_mermaid, '    ', UPPER(v_table_name), ' {\n');
        SET v_text = CONCAT(v_text, v_table_name, ' (', v_table_name, '_id PK)\n');
        
        -- 컬럼 정보 추가
        SELECT GROUP_CONCAT(
            CONCAT('        ', COLUMN_NAME, ' ', 
                   CASE 
                       WHEN COLUMN_KEY = 'PRI' THEN 'PK'
                       WHEN COLUMN_KEY = 'MUL' THEN 'FK'
                       ELSE ''
                   END, ' ', DATA_TYPE)
            SEPARATOR '\n'
        ) INTO v_text
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = v_table_name
        ORDER BY ORDINAL_POSITION
        LIMIT 10; -- 주요 컬럼만 표시
        
        SET v_mermaid = CONCAT(v_mermaid, v_text, '\n    }\n');
        
    END LOOP;
    CLOSE cur_tables;
    
    -- 관계 정의 추가
    SELECT GROUP_CONCAT(
        CONCAT('    ', UPPER(REFERENCED_TABLE_NAME), ' ||--o{ ', UPPER(TABLE_NAME), ' : "has"')
        SEPARATOR '\n'
    ) INTO v_text
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL;
    
    SET v_mermaid = CONCAT(v_mermaid, '\n', v_text);
    SET p_mermaid_code = v_mermaid;
    SET p_text_erd = v_text;
    SET p_success = TRUE;
    SET p_message = '전체 시스템 ERD 생성 완료';
    
END //

-- 업종별 모듈 ERD 생성 프로시저
CREATE PROCEDURE GenerateModuleErd(
    IN p_tenant_id VARCHAR(36),
    IN p_business_type VARCHAR(50),
    IN p_diagram_id VARCHAR(36),
    OUT p_mermaid_code TEXT,
    OUT p_text_erd TEXT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    -- 업종별 관련 테이블만 필터링하여 ERD 생성
    -- 예: ACADEMY -> class, class_schedule, class_enrollment, attendance 등
    -- 구현 로직은 GenerateFullSystemErd와 유사하되, 
    -- 업종별 테이블 필터링 로직 추가
    
    SET p_success = TRUE;
    SET p_message = CONCAT(p_business_type, ' 모듈 ERD 생성 완료');
    
END //

DELIMITER ;
```

### 3.3 온보딩 승인 전체 프로세스 PL/SQL 프로시저

**메인 프로시저: `ProcessOnboardingApproval()`**
- 온보딩 승인 시 전체 프로세스를 한 번에 처리
- 테넌트 생성/활성화
- 카테고리 매핑 자동 설정
- 기본 컴포넌트 자동 활성화
- 기본 요금제 구독 생성
- 기본 역할 템플릿 적용
- ERD 자동 생성
- 알림 발송
- 감사 로그 기록

**모든 로직이 PL/SQL 프로시저로 구현되어 데이터 정확성과 일관성 보장**

### 3.4 온보딩 서비스에서 PL/SQL 프로시저 호출

```java
@Service
@RequiredArgsConstructor
public class OnboardingService {
    
    private final OnboardingRequestRepository repository;
    private final JdbcTemplate jdbcTemplate;
    private final AuditService auditService;
    
    @Transactional
    public OnboardingRequest decide(UUID requestId, OnboardingStatus status, String actorId, String note) {
        OnboardingRequest request = repository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("요청을 찾을 수 없습니다."));

        // ✅ PL/SQL 프로시저로 전체 온보딩 승인 프로세스 처리 (코어 로직)
        if (status == OnboardingStatus.APPROVED) {
            try {
                Map<String, Object> result = jdbcTemplate.call(
                    new CallableStatementCreator() {
                        @Override
                        public CallableStatement createCallableStatement(Connection con) throws SQLException {
                            CallableStatement cs = con.prepareCall(
                                "{CALL ProcessOnboardingApproval(?, ?, ?, ?, ?, ?, ?, ?)}"
                            );
                            cs.setLong(1, requestId);
                            cs.setString(2, request.getTenantId());
                            cs.setString(3, request.getTenantName());
                            cs.setString(4, getBusinessType(request));
                            cs.setString(5, actorId);
                            cs.setString(6, note);
                            cs.registerOutParameter(7, Types.BOOLEAN);
                            cs.registerOutParameter(8, Types.VARCHAR);
                            return cs;
                        }
                    },
                    Arrays.asList(
                        new SqlParameter(Types.BIGINT),
                        new SqlParameter(Types.VARCHAR),
                        new SqlParameter(Types.VARCHAR),
                        new SqlParameter(Types.VARCHAR),
                        new SqlParameter(Types.VARCHAR),
                        new SqlParameter(Types.VARCHAR),
                        new SqlOutParameter("p_success", Types.BOOLEAN),
                        new SqlOutParameter("p_message", Types.VARCHAR)
                    )
                );
                
                Boolean success = (Boolean) result.get("p_success");
                String message = (String) result.get("p_message");
                
                if (Boolean.TRUE.equals(success)) {
                    // PL/SQL 프로시저에서 이미 모든 처리가 완료됨
                    request.setStatus(status);
                    request.setDecidedBy(actorId);
                    request.setDecisionAt(DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
                    request.setDecisionNote(note);
                    log.info("✅ 온보딩 승인 완료 (PL/SQL): {}", message);
                } else {
                    log.error("❌ 온보딩 승인 실패 (PL/SQL): {}", message);
                    throw new RuntimeException("온보딩 승인 처리 실패: " + message);
                }
            } catch (Exception e) {
                log.error("❌ 온보딩 승인 처리 중 오류 발생", e);
                throw new RuntimeException("온보딩 승인 처리 중 오류 발생", e);
            }
        } else {
            // 거부 또는 보류
            request.setStatus(status);
            request.setDecidedBy(actorId);
            request.setDecisionAt(DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
            request.setDecisionNote(note);
        }
        
        OnboardingRequest saved = repository.save(request);
        return saved;
    }
    
    private String getBusinessType(OnboardingRequest request) {
        // 온보딩 요청에서 business_type 추출 로직
        return request.getBusinessType(); // 예시
    }
}
```

## 4. 경쟁력 있는 기능 구현 계획

### 4.1 Phase 1: 기본 경쟁력 (Week 3-4)
- ✅ 실시간 ERD 동기화
- ✅ 인터랙티브 ERD 뷰어
- ✅ ERD 기반 코드 생성 (Entity, Repository, DTO)
- ✅ ERD 성능 분석

### 4.2 Phase 2: 고급 경쟁력 (Week 7-8)
- ✅ ERD 의존성 분석
- ✅ ERD 기반 API 문서 자동 생성
- ✅ ERD 기반 테스트 케이스 생성
- ✅ AI 기반 ERD 분석

### 4.3 Phase 3: 차별화 경쟁력 (Week 11-12)
- ✅ ERD 협업 기능
- ✅ ERD 기반 모니터링
- ✅ ERD 기반 자동화
- ✅ ERD 기반 시각화 고도화

## 5. 데이터 중앙화 체크리스트

- [ ] 모든 ERD 데이터는 `core_solution` DB에 저장
- [ ] 테넌트별 ERD도 `tenant_id`로 구분하여 중앙 DB에 저장
- [ ] ERD 생성 로직은 PL/SQL 프로시저로 중앙화
- [ ] ERD 변경 이력은 중앙 DB에 기록
- [ ] ERD 주석 및 리뷰는 중앙 DB에 저장
- [ ] ERD 분석 결과는 중앙 DB에 저장
- [ ] ERD 통계 및 모니터링 데이터는 중앙 DB에 저장

## 6. 연계 문서

- `ERD_SYSTEM_TENANT_ENHANCEMENT_PLAN.md`: ERD 시스템 입점사용 고도화 계획
- `DATA_CORE_AND_PL_SQL.md`: 데이터 중앙화 및 PL/SQL 전략
- `MASTER_IMPLEMENTATION_SCHEDULE.md`: 전체 구현 일정

