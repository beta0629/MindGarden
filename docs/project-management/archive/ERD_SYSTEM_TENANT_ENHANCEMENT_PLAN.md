# ERD 시스템 입점사용 고도화 계획

**작성일:** 2025-01-XX  
**목적:** 현재 MindGarden의 초보 수준 ERD 시스템을 고도화하여 입점사(테넌트)들이 사용할 수 있도록 하고, 온보딩 승인 시 자동 생성되도록 구성

## 1. 현재 상태 분석

### 1.1 현재 ERD 시스템 (초보 수준)
- **문서 기반**: `DATA_CORE_AND_PL_SQL.md`에 Mermaid 다이어그램으로 저장
- **버전 관리**: Git을 통한 버전 관리
- **시각화**: Mermaid 다이어그램 (전체 시스템, 업종별 모듈)
- **텍스트 ERD**: 통합 ERD를 텍스트로 표현
- **접근성**: 개발팀만 접근 가능 (문서 기반)
- **자동화**: 없음 (수동으로 문서 수정)

### 1.2 한계점
- ❌ ERD 변경 시 수동으로 문서 수정 필요
- ❌ ERD와 실제 데이터베이스 스키마 간 동기화 어려움
- ❌ ERD 버전 히스토리 추적 어려움
- ❌ ERD 검색 및 필터링 기능 부재
- ❌ ERD 시각화 도구 연동 없음
- ❌ 입점사(테넌트) 접근 불가
- ❌ 온보딩 승인 시 자동 생성 없음
- ❌ 테넌트별 커스텀 ERD 생성 불가

## 2. 고도화 목표 (경쟁력 있는 수준)

### 2.1 입점사용 ERD 시스템
- ✅ 테넌트별 ERD 자동 생성 및 관리
- ✅ 온보딩 승인 시 테넌트 ERD 자동 생성 (PL/SQL 코어 로직)
- ✅ 테넌트 포털에서 ERD 조회 및 시각화
- ✅ 테넌트별 커스텀 ERD 생성 (필요한 테이블만 필터링)
- ✅ ERD 변경 이력 추적 (테넌트별)
- ✅ **데이터 중앙화**: 모든 ERD 데이터는 중앙 DB에 저장

### 2.2 경쟁력 있는 기능 (사람들이 보고 경쟁력 있다고 말할 정도)
- ✅ **실시간 ERD 동기화**: 스키마 변경 시 즉시 ERD 업데이트
- ✅ **인터랙티브 ERD 뷰어**: 3D 시각화, 테이블 클릭, 관계선 하이라이트
- ✅ **ERD 기반 코드 생성**: Entity, Repository, DTO, API 스펙 자동 생성
- ✅ **ERD 성능 분석**: 테이블 크기, 인덱스, 쿼리 성능 예측
- ✅ **ERD 의존성 분석**: 변경 영향도 분석, 마이그레이션 경로 제안
- ✅ **ERD 기반 API 문서 자동 생성**: OpenAPI, GraphQL 스키마 자동 생성
- ✅ **ERD 기반 테스트 케이스 생성**: 단위/통합/E2E 테스트 자동 생성
- ✅ **AI 기반 ERD 분석**: 패턴 분석, 최적화 제안, 보안 취약점 분석
- ✅ **ERD 협업 기능**: 주석, 리뷰, 변경 요청 및 승인
- ✅ **ERD 기반 모니터링**: 변경 알림, 성능 모니터링, 장애 예측

### 2.2 ERD 자동화
- ✅ 데이터베이스 스키마에서 ERD 자동 생성
- ✅ 온보딩 승인 시 자동 ERD 생성 트리거
- ✅ ERD 변경 시 자동 감지 및 업데이트
- ✅ ERD 버전 관리 자동화

### 2.3 ERD 관리 시스템
- ✅ ERD 관리 대시보드 구축 (HQ + 테넌트)
- ✅ ERD 검색 및 필터링 기능
- ✅ ERD 변경 이력 추적
- ✅ ERD 비교 기능 (버전 간 차이점 확인)

### 2.4 ERD 시각화 고도화
- ✅ 인터랙티브 ERD 뷰어 (Mermaid.js)
- ✅ ERD 확대/축소, 필터링 기능
- ✅ ERD에서 테이블 상세 정보 조회
- ✅ ERD에서 관계선 클릭 시 관련 테이블 하이라이트

## 3. 온보딩 승인 연계 설계 (PL/SQL 코어 로직)

### 3.1 온보딩 승인 프로세스 연계

```
온보딩 요청 생성
    ↓
운영 포털에서 승인 검토
    ↓
승인 결정 (APPROVED)
    ↓
[신규] PL/SQL 프로시저 호출: GenerateErdOnOnboardingApproval()
    ↓
PL/SQL 프로시저 내부에서:
    - GenerateFullSystemErd() 호출
    - GenerateModuleErd() 호출 (업종별)
    ↓
테넌트별 ERD 생성 (중앙 DB에 저장)
    - 전체 시스템 ERD (기본)
    - 업종별 모듈 ERD (business_type 기반)
    ↓
ERD 메타데이터 저장 (중앙화)
    ↓
ERD 변경 이력 기록 (중앙화)
    ↓
테넌트 포털에서 ERD 조회 가능
```

### 3.2 ERD 생성 트리거 로직 (PL/SQL 기반)

**OnboardingService.decide() 메서드에서 PL/SQL 프로시저 호출:**

```java
@Transactional
public OnboardingRequest decide(UUID requestId, OnboardingStatus status, String actorId, String note) {
    OnboardingRequest request = repository.findById(requestId)
        .orElseThrow(() -> new IllegalArgumentException("요청을 찾을 수 없습니다."));

    request.setStatus(status);
    request.setDecidedBy(actorId);
    request.setDecisionAt(DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
    request.setDecisionNote(note);
    OnboardingRequest saved = repository.save(request);

    // ✅ 신규: 승인 시 PL/SQL 프로시저로 ERD 자동 생성 (코어 로직)
    if (status == OnboardingStatus.APPROVED) {
        try {
            Map<String, Object> result = jdbcTemplate.call(
                new CallableStatementCreator() {
                    @Override
                    public CallableStatement createCallableStatement(Connection con) throws SQLException {
                        CallableStatement cs = con.prepareCall(
                            "{CALL GenerateErdOnOnboardingApproval(?, ?, ?, ?, ?, ?)}"
                        );
                        cs.setString(1, request.getTenantId());
                        cs.setString(2, request.getTenantName());
                        cs.setString(3, getBusinessType(request));
                        cs.setString(4, actorId);
                        cs.registerOutParameter(5, Types.BOOLEAN);
                        cs.registerOutParameter(6, Types.VARCHAR);
                        return cs;
                    }
                },
                Arrays.asList(
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
                log.info("✅ ERD 자동 생성 완료: {}", message);
            } else {
                log.warn("⚠️ ERD 자동 생성 실패: {}", message);
            }
        } catch (Exception e) {
            log.error("❌ ERD 자동 생성 중 오류 발생", e);
            // ERD 생성 실패해도 온보딩 승인은 진행
        }
    }

    // ... 기존 감사 로그 코드 ...
    
    return saved;
}
```

### 3.3 PL/SQL 프로시저 구조

**핵심 프로시저:**
- `GenerateErdOnOnboardingApproval()`: 온보딩 승인 시 ERD 생성 메인 프로시저
- `GenerateFullSystemErd()`: 전체 시스템 ERD 생성 프로시저
- `GenerateModuleErd()`: 업종별 모듈 ERD 생성 프로시저

**데이터 중앙화:**
- 모든 ERD 데이터는 `core_solution` DB에 저장
- `tenant_id`로 테넌트별 구분
- PL/SQL 프로시저로 중앙화된 로직 관리

### 3.3 테넌트별 ERD 생성 전략

1. **전체 시스템 ERD (기본)**
   - 모든 공통 테이블 포함
   - 테넌트별 테이블 포함 (`tenant_id` 필터링)
   - 기본 ERD로 자동 생성

2. **업종별 모듈 ERD**
   - `business_type` 기반 필터링
   - 학원: `class`, `class_schedule`, `class_enrollment`, `attendance` 등
   - 요식업: `menu`, `order`, `delivery` 등
   - 업종별 관련 테이블만 포함

3. **테넌트 커스텀 ERD (선택적)**
   - 테넌트가 원하는 테이블만 선택하여 생성
   - 테넌트 포털에서 커스텀 ERD 생성 요청 가능

## 4. 데이터베이스 설계

### 4.1 ERD 메타데이터 테이블 (테넌트별 확장)

```sql
-- ERD 다이어그램 정보 (테넌트별)
CREATE TABLE erd_diagrams (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    diagram_id VARCHAR(36) UNIQUE NOT NULL COMMENT 'ERD 다이어그램 UUID',
    tenant_id VARCHAR(36) COMMENT '테넌트 UUID (NULL이면 전체 시스템 ERD)',
    name VARCHAR(255) NOT NULL COMMENT 'ERD 이름',
    description TEXT COMMENT 'ERD 설명',
    diagram_type VARCHAR(50) NOT NULL COMMENT 'ERD 타입: FULL, MODULE, CUSTOM, TENANT',
    module_type VARCHAR(50) COMMENT '모듈 타입 (ACADEMY, FOOD_SERVICE 등)',
    mermaid_code TEXT NOT NULL COMMENT 'Mermaid ERD 코드',
    text_erd TEXT COMMENT '텍스트 ERD',
    version INT NOT NULL DEFAULT 1 COMMENT 'ERD 버전',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    is_public BOOLEAN DEFAULT FALSE COMMENT '공개 여부 (테넌트 포털에서 조회 가능)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    INDEX idx_diagram_id (diagram_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_diagram_type (diagram_type),
    INDEX idx_module_type (module_type),
    INDEX idx_is_active (is_active),
    INDEX idx_is_public (is_public),
    
    CONSTRAINT fk_erd_diagrams_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ERD 다이어그램 정보 테이블 (테넌트별)';

-- ERD 변경 이력
CREATE TABLE erd_diagram_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    diagram_id VARCHAR(36) NOT NULL COMMENT 'ERD 다이어그램 UUID',
    tenant_id VARCHAR(36) COMMENT '테넌트 UUID',
    version INT NOT NULL COMMENT 'ERD 버전',
    change_type VARCHAR(50) NOT NULL COMMENT '변경 타입: CREATED, UPDATED, DELETED, AUTO_GENERATED',
    change_description TEXT COMMENT '변경 설명',
    mermaid_code TEXT COMMENT '변경된 Mermaid ERD 코드',
    diff_summary TEXT COMMENT '변경 사항 요약',
    changed_by VARCHAR(100) NOT NULL COMMENT '변경자',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '변경 시각',
    trigger_source VARCHAR(50) COMMENT '트리거 소스: ONBOARDING_APPROVAL, SCHEMA_CHANGE, MANUAL',
    
    INDEX idx_diagram_id (diagram_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_version (version),
    INDEX idx_changed_at (changed_at),
    INDEX idx_trigger_source (trigger_source),
    
    CONSTRAINT fk_erd_diagram_history_diagram 
    FOREIGN KEY (diagram_id) REFERENCES erd_diagrams(diagram_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ERD 다이어그램 변경 이력 테이블';

-- ERD 테이블 매핑 (ERD에 포함된 테이블 목록)
CREATE TABLE erd_table_mappings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    diagram_id VARCHAR(36) NOT NULL COMMENT 'ERD 다이어그램 UUID',
    table_name VARCHAR(255) NOT NULL COMMENT '테이블명',
    display_name VARCHAR(255) COMMENT '표시명',
    position_x INT COMMENT 'ERD에서 X 위치',
    position_y INT COMMENT 'ERD에서 Y 위치',
    is_visible BOOLEAN DEFAULT TRUE COMMENT '표시 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_diagram_id (diagram_id),
    INDEX idx_table_name (table_name),
    UNIQUE KEY unique_diagram_table (diagram_id, table_name),
    
    CONSTRAINT fk_erd_table_mappings_diagram 
    FOREIGN KEY (diagram_id) REFERENCES erd_diagrams(diagram_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ERD 테이블 매핑 테이블';
```

## 5. 구현 계획

### 5.1 Phase 1: ERD 자동 생성 시스템 + 온보딩 연계 (2주)

**목표:** 데이터베이스 스키마에서 ERD 자동 생성 및 온보딩 승인 시 자동 생성

**작업 내용:**
1. **ERD 생성 서비스 개발**
   - 데이터베이스 스키마 정보 조회 (MySQL `INFORMATION_SCHEMA`)
   - 테이블, 컬럼, 인덱스, 외래키 정보 추출
   - Mermaid ERD 다이어그램 자동 생성
   - 텍스트 ERD 자동 생성

2. **테넌트별 ERD 생성 로직**
   - 테넌트 ID 기반 테이블 필터링
   - 업종별 모듈 ERD 생성
   - 테넌트 커스텀 ERD 생성

3. **온보딩 승인 연계**
   - `OnboardingService.decide()` 메서드 확장
   - 승인 시 ERD 자동 생성 트리거
   - ERD 생성 결과 메타데이터 저장

4. **ERD 메타데이터 저장**
   - `erd_diagrams` 테이블에 ERD 정보 저장
   - `erd_diagram_history` 테이블에 생성 이력 기록
   - `trigger_source='ONBOARDING_APPROVAL'`로 기록

**기술 스택:**
- Java (Spring Boot)
- MySQL `INFORMATION_SCHEMA`
- Mermaid 다이어그램 생성 라이브러리
- Spring Event Listener (온보딩 승인 이벤트)

### 5.2 Phase 2: 테넌트 포털 ERD 뷰어 (2주)

**목표:** 테넌트 포털에서 ERD 조회 및 시각화

**작업 내용:**
1. **테넌트 ERD 조회 API**
   - `GET /api/v1/tenants/{tenantId}/erd/diagrams`: 테넌트 ERD 목록 조회
   - `GET /api/v1/tenants/{tenantId}/erd/diagrams/{diagramId}`: 특정 ERD 조회
   - `GET /api/v1/tenants/{tenantId}/erd/diagrams/{diagramId}/history`: ERD 변경 이력 조회

2. **테넌트 포털 ERD 뷰어 UI**
   - ERD 목록 페이지
   - ERD 상세 페이지 (Mermaid.js 렌더링)
   - ERD 변경 이력 페이지
   - 테이블 상세 정보 모달

3. **ERD 시각화 개선**
   - Mermaid.js를 사용한 인터랙티브 ERD 뷰어
   - 테이블 클릭 시 상세 정보 모달 표시
   - 관계선 클릭 시 관련 테이블 하이라이트
   - ERD 확대/축소, 필터링 기능

**기술 스택:**
- Backend: Spring Boot, JPA
- Frontend: React, Mermaid.js
- Database: MySQL (ERD 메타데이터 저장)

### 5.3 Phase 3: ERD 자동 동기화 (2주)

**목표:** 데이터베이스 스키마 변경 시 ERD 자동 업데이트

**작업 내용:**
1. **스키마 변경 감지**
   - Flyway 마이그레이션 실행 시 ERD 자동 생성
   - 데이터베이스 스키마 변경 감지 (트리거 또는 폴링)
   - ERD 변경 감지 및 알림

2. **ERD 자동 업데이트**
   - 스키마 변경 시 관련 테넌트 ERD 자동 재생성
   - ERD 변경 이력 자동 기록
   - 테넌트 알림 (ERD 변경 시)

3. **ERD 검증**
   - ERD와 실제 스키마 간 일치 여부 검증
   - 불일치 시 알림 발송
   - ERD 검증 리포트 생성

**기술 스택:**
- Flyway (마이그레이션 관리)
- Spring Boot Scheduler (주기적 스키마 변경 감지)
- Slack/이메일 알림

### 5.4 Phase 4: ERD 고급 기능 (2주)

**목표:** ERD 고급 기능 추가

**작업 내용:**
1. **ERD 필터링 및 검색**
   - 테이블명, 컬럼명으로 ERD 필터링
   - 업종별 ERD 필터링
   - 테이블 관계 그래프 탐색

2. **테넌트 커스텀 ERD 생성**
   - 테넌트가 원하는 테이블만 선택하여 ERD 생성
   - 커스텀 ERD 저장 및 관리

3. **ERD 내보내기/가져오기**
   - ERD를 다양한 형식으로 내보내기 (PNG, SVG, PDF)
   - ERD를 다른 도구로 가져오기 (dbdiagram.io, draw.io 등)

**기술 스택:**
- GraphQL (복잡한 쿼리)
- 이미지 생성 라이브러리 (Puppeteer, Playwright)
- 다양한 ERD 형식 변환 라이브러리

## 6. API 설계

### 6.1 테넌트 ERD 조회 API

```yaml
# 테넌트 ERD 목록 조회
GET /api/v1/tenants/{tenantId}/erd/diagrams
Query Parameters:
  - diagram_type: FULL | MODULE | CUSTOM
  - module_type: ACADEMY | FOOD_SERVICE | ...
  - is_active: true | false
Response: List<ErdDiagramResponse>

# 테넌트 ERD 상세 조회
GET /api/v1/tenants/{tenantId}/erd/diagrams/{diagramId}
Response: ErdDiagramDetailResponse

# 테넌트 커스텀 ERD 생성
POST /api/v1/tenants/{tenantId}/erd/diagrams/custom
Request Body:
  - name: string
  - description: string
  - table_names: string[] (선택할 테이블 목록)
Response: ErdDiagramResponse

# 테넌트 ERD 변경 이력 조회
GET /api/v1/tenants/{tenantId}/erd/diagrams/{diagramId}/history
Query Parameters:
  - from_version: int
  - to_version: int
Response: List<ErdDiagramHistoryResponse>
```

### 6.2 HQ 운영 포털 ERD 관리 API

```yaml
# 전체 ERD 목록 조회 (HQ 전용)
GET /api/v1/ops/erd/diagrams
Query Parameters:
  - tenant_id: string
  - diagram_type: FULL | MODULE | CUSTOM | TENANT
  - is_active: true | false
Response: List<ErdDiagramResponse>

# ERD 수동 생성 (HQ 전용)
POST /api/v1/ops/erd/diagrams/generate
Request Body:
  - tenant_id: string (optional)
  - diagram_type: FULL | MODULE
  - module_type: ACADEMY | FOOD_SERVICE | ...
Response: ErdDiagramResponse

# ERD 버전 비교
POST /api/v1/ops/erd/diagrams/{diagramId}/compare
Request Body:
  - from_version: int
  - to_version: int
Response: ErdDiagramDiffResponse
```

## 7. 구현 우선순위

1. **Phase 1 (우선순위: 매우 높음)**: ERD 자동 생성 시스템 + 온보딩 연계
   - 데이터베이스 스키마에서 ERD 자동 생성
   - 온보딩 승인 시 ERD 자동 생성
   - ERD 메타데이터 저장

2. **Phase 2 (우선순위: 높음)**: 테넌트 포털 ERD 뷰어
   - 테넌트 ERD 조회 API
   - 테넌트 포털 ERD 뷰어 UI
   - ERD 시각화 개선

3. **Phase 3 (우선순위: 중간)**: ERD 자동 동기화
   - 스키마 변경 시 ERD 자동 업데이트
   - ERD 검증

4. **Phase 4 (우선순위: 낮음)**: ERD 고급 기능
   - ERD 필터링 및 검색
   - 테넌트 커스텀 ERD 생성
   - ERD 내보내기/가져오기

## 8. 연계 문서

- `DATA_CORE_AND_PL_SQL.md`: 현재 ERD 문서
- `DATABASE_DESIGN_SPEC.md`: 데이터베이스 설계 사양
- `TENANT_PG_APPROVAL_SYSTEM_PLAN.md`: 테넌트 PG 승인 시스템 (온보딩 승인 프로세스 참고)
- `MASTER_IMPLEMENTATION_SCHEDULE.md`: 전체 구현 일정

