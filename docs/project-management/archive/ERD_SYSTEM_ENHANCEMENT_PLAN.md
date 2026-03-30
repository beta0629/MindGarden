# ERD 시스템 고도화 계획

**작성일:** 2025-01-XX  
**목적:** ERD 시스템을 고도화하여 데이터베이스 설계를 더욱 체계적으로 관리하고 시각화

## 1. 현재 상태

### 1.1 현재 ERD 관리 방식
- **문서 기반**: `DATA_CORE_AND_PL_SQL.md`에 Mermaid 다이어그램으로 저장
- **버전 관리**: Git을 통한 버전 관리
- **시각화**: Mermaid 다이어그램 (전체 시스템, 업종별 모듈)
- **텍스트 ERD**: 통합 ERD를 텍스트로 표현

### 1.2 한계점
- ERD 변경 시 수동으로 문서 수정 필요
- ERD와 실제 데이터베이스 스키마 간 동기화 어려움
- ERD 버전 히스토리 추적 어려움
- ERD 검색 및 필터링 기능 부재
- ERD 시각화 도구 연동 없음

## 2. 고도화 목표

### 2.1 ERD 자동화
- 데이터베이스 스키마에서 ERD 자동 생성
- ERD 변경 시 자동 감지 및 문서 업데이트
- ERD 버전 관리 자동화

### 2.2 ERD 관리 시스템
- ERD 관리 대시보드 구축
- ERD 검색 및 필터링 기능
- ERD 변경 이력 추적
- ERD 비교 기능 (버전 간 차이점 확인)

### 2.3 ERD 시각화 고도화
- 인터랙티브 ERD 뷰어
- ERD 확대/축소, 필터링 기능
- ERD에서 테이블 상세 정보 조회
- ERD에서 관계선 클릭 시 관련 테이블 하이라이트

### 2.4 ERD 문서화 자동화
- ERD 변경 시 자동으로 문서 업데이트
- ERD 변경 로그 자동 생성
- ERD 변경 알림 (Slack/이메일)

## 3. 구현 계획

### 3.1 Phase 1: ERD 자동 생성 시스템 (2주)

**목표:** 데이터베이스 스키마에서 ERD 자동 생성

**작업 내용:**
1. **ERD 생성 스크립트 개발**
   - 데이터베이스 스키마 정보 조회 (MySQL `INFORMATION_SCHEMA`)
   - 테이블, 컬럼, 인덱스, 외래키 정보 추출
   - Mermaid ERD 다이어그램 자동 생성
   - 텍스트 ERD 자동 생성

2. **ERD 생성 도구**
   - Java 기반 ERD 생성 유틸리티 클래스
   - Maven/Gradle 플러그인으로 통합
   - CI/CD 파이프라인에 통합 (스키마 변경 시 자동 ERD 생성)

3. **ERD 파일 관리**
   - `docs/mgsb/erd/` 디렉토리 생성
   - ERD 파일 자동 저장 및 버전 관리
   - ERD 변경 이력 자동 기록

**기술 스택:**
- Java (Spring Boot)
- MySQL `INFORMATION_SCHEMA`
- Mermaid 다이어그램 생성 라이브러리
- Git (버전 관리)

### 3.2 Phase 2: ERD 관리 대시보드 (3주)

**목표:** ERD 관리 및 시각화 대시보드 구축

**작업 내용:**
1. **ERD 관리 API**
   - `GET /api/v1/erd/diagrams`: ERD 목록 조회
   - `GET /api/v1/erd/diagrams/{id}`: 특정 ERD 조회
   - `GET /api/v1/erd/diagrams/{id}/history`: ERD 변경 이력 조회
   - `POST /api/v1/erd/diagrams/{id}/compare`: ERD 버전 비교
   - `GET /api/v1/erd/tables`: 테이블 목록 조회
   - `GET /api/v1/erd/tables/{name}`: 테이블 상세 정보 조회

2. **ERD 관리 프론트엔드**
   - ERD 목록 페이지
   - ERD 상세 페이지 (Mermaid 다이어그램 렌더링)
   - ERD 변경 이력 페이지
   - ERD 비교 페이지

3. **ERD 시각화 개선**
   - Mermaid.js를 사용한 인터랙티브 ERD 뷰어
   - 테이블 클릭 시 상세 정보 모달 표시
   - 관계선 클릭 시 관련 테이블 하이라이트
   - ERD 확대/축소, 필터링 기능

**기술 스택:**
- Backend: Spring Boot, JPA
- Frontend: React, Mermaid.js
- Database: MySQL (ERD 메타데이터 저장)

### 3.3 Phase 3: ERD 자동 동기화 (2주)

**목표:** 데이터베이스 스키마 변경 시 ERD 자동 업데이트

**작업 내용:**
1. **스키마 변경 감지**
   - Flyway 마이그레이션 실행 시 ERD 자동 생성
   - 데이터베이스 스키마 변경 감지 (트리거 또는 폴링)
   - ERD 변경 감지 및 알림

2. **ERD 자동 업데이트**
   - 스키마 변경 시 ERD 자동 재생성
   - ERD 변경 이력 자동 기록
   - ERD 문서 자동 업데이트

3. **ERD 검증**
   - ERD와 실제 스키마 간 일치 여부 검증
   - 불일치 시 알림 발송
   - ERD 검증 리포트 생성

**기술 스택:**
- Flyway (마이그레이션 관리)
- Spring Boot Scheduler (주기적 스키마 변경 감지)
- Slack/이메일 알림

### 3.4 Phase 4: ERD 고급 기능 (3주)

**목표:** ERD 고급 기능 추가

**작업 내용:**
1. **ERD 필터링 및 검색**
   - 테이블명, 컬럼명으로 ERD 필터링
   - 업종별 ERD 필터링
   - 테이블 관계 그래프 탐색

2. **ERD 분석 기능**
   - 테이블 의존성 분석
   - 외래키 관계 분석
   - 인덱스 사용 분석
   - 테이블 크기 및 성능 분석

3. **ERD 내보내기/가져오기**
   - ERD를 다양한 형식으로 내보내기 (PNG, SVG, PDF)
   - ERD를 다른 도구로 가져오기 (dbdiagram.io, draw.io 등)
   - ERD 템플릿 관리

**기술 스택:**
- GraphQL (복잡한 쿼리)
- 이미지 생성 라이브러리 (Puppeteer, Playwright)
- 다양한 ERD 형식 변환 라이브러리

## 4. 데이터베이스 설계

### 4.1 ERD 메타데이터 테이블

```sql
-- ERD 다이어그램 정보
CREATE TABLE erd_diagrams (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    diagram_id VARCHAR(36) UNIQUE NOT NULL COMMENT 'ERD 다이어그램 UUID',
    name VARCHAR(255) NOT NULL COMMENT 'ERD 이름',
    description TEXT COMMENT 'ERD 설명',
    diagram_type VARCHAR(50) NOT NULL COMMENT 'ERD 타입: FULL, MODULE, CUSTOM',
    module_type VARCHAR(50) COMMENT '모듈 타입 (ACADEMY, FOOD_SERVICE 등)',
    mermaid_code TEXT NOT NULL COMMENT 'Mermaid ERD 코드',
    text_erd TEXT COMMENT '텍스트 ERD',
    version INT NOT NULL DEFAULT 1 COMMENT 'ERD 버전',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    INDEX idx_diagram_id (diagram_id),
    INDEX idx_diagram_type (diagram_type),
    INDEX idx_module_type (module_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ERD 다이어그램 정보 테이블';

-- ERD 변경 이력
CREATE TABLE erd_diagram_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    diagram_id VARCHAR(36) NOT NULL COMMENT 'ERD 다이어그램 UUID',
    version INT NOT NULL COMMENT 'ERD 버전',
    change_type VARCHAR(50) NOT NULL COMMENT '변경 타입: CREATED, UPDATED, DELETED',
    change_description TEXT COMMENT '변경 설명',
    mermaid_code TEXT COMMENT '변경된 Mermaid ERD 코드',
    diff_summary TEXT COMMENT '변경 사항 요약',
    changed_by VARCHAR(100) NOT NULL COMMENT '변경자',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '변경 시각',
    
    INDEX idx_diagram_id (diagram_id),
    INDEX idx_version (version),
    INDEX idx_changed_at (changed_at),
    
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

## 5. API 설계

### 5.1 ERD 관리 API

```yaml
# ERD 목록 조회
GET /api/v1/erd/diagrams
Query Parameters:
  - diagram_type: FULL | MODULE | CUSTOM
  - module_type: ACADEMY | FOOD_SERVICE | ...
  - is_active: true | false
Response: List<ErdDiagramResponse>

# ERD 상세 조회
GET /api/v1/erd/diagrams/{diagramId}
Response: ErdDiagramDetailResponse

# ERD 생성 (자동)
POST /api/v1/erd/diagrams/generate
Request Body:
  - diagram_type: FULL | MODULE
  - module_type: ACADEMY | FOOD_SERVICE | ...
Response: ErdDiagramResponse

# ERD 변경 이력 조회
GET /api/v1/erd/diagrams/{diagramId}/history
Query Parameters:
  - from_version: int
  - to_version: int
Response: List<ErdDiagramHistoryResponse>

# ERD 버전 비교
POST /api/v1/erd/diagrams/{diagramId}/compare
Request Body:
  - from_version: int
  - to_version: int
Response: ErdDiagramDiffResponse

# 테이블 목록 조회
GET /api/v1/erd/tables
Query Parameters:
  - search: string (테이블명 검색)
  - module_type: ACADEMY | FOOD_SERVICE | ...
Response: List<TableInfoResponse>

# 테이블 상세 정보 조회
GET /api/v1/erd/tables/{tableName}
Response: TableDetailResponse
```

## 6. 구현 우선순위

1. **Phase 1 (우선순위: 높음)**: ERD 자동 생성 시스템
   - 데이터베이스 스키마에서 ERD 자동 생성
   - ERD 파일 자동 저장 및 버전 관리

2. **Phase 2 (우선순위: 중간)**: ERD 관리 대시보드
   - ERD 관리 API 및 프론트엔드
   - ERD 시각화 개선

3. **Phase 3 (우선순위: 중간)**: ERD 자동 동기화
   - 스키마 변경 시 ERD 자동 업데이트
   - ERD 검증

4. **Phase 4 (우선순위: 낮음)**: ERD 고급 기능
   - ERD 필터링 및 검색
   - ERD 분석 기능
   - ERD 내보내기/가져오기

## 7. 연계 문서

- `DATA_CORE_AND_PL_SQL.md`: 현재 ERD 문서
- `DATABASE_DESIGN_SPEC.md`: 데이터베이스 설계 사양
- `DETAILED_MIGRATION_PLAN.md`: 마이그레이션 계획

