-- ============================================
-- 학원 시스템 테이블 생성 (컴포넌트 기반)
-- ============================================
-- 목적: 학원 시스템 핵심 테이블 생성 (테넌트/브랜치 기반 멀티테넌시)
-- 작성일: 2025-11-18
-- 참고: 컴포넌트 카탈로그에 'ACADEMY' 컴포넌트가 등록되어 있어야 함
-- ============================================

-- ============================================
-- 1. courses 테이블 (강좌)
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id VARCHAR(36) UNIQUE NOT NULL COMMENT '강좌 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    branch_id BIGINT COMMENT '지점 ID (NULL이면 전체 지점 공통)',
    
    -- 강좌 정보
    name VARCHAR(255) NOT NULL COMMENT '강좌명',
    name_ko VARCHAR(255) COMMENT '강좌명 (한글)',
    name_en VARCHAR(255) COMMENT '강좌명 (영문)',
    description TEXT COMMENT '강좌 설명',
    description_ko TEXT COMMENT '강좌 설명 (한글)',
    description_en TEXT COMMENT '강좌 설명 (영문)',
    
    -- 카테고리 및 분류
    category VARCHAR(50) COMMENT '카테고리 코드',
    level VARCHAR(50) COMMENT '레벨 (초급, 중급, 고급 등)',
    subject VARCHAR(100) COMMENT '과목 (수학, 영어, 과학 등)',
    
    -- 가격 정책
    pricing_policy VARCHAR(50) DEFAULT 'FIXED' COMMENT '가격 정책: FIXED, PER_SESSION, PACKAGE',
    base_price DECIMAL(15, 2) DEFAULT 0 COMMENT '기본 가격',
    currency VARCHAR(10) DEFAULT 'KRW' COMMENT '통화',
    pricing_details_json JSON COMMENT '가격 상세 정보 (JSON)',
    
    -- 수강 정보
    duration_months INT COMMENT '수강 기간 (월)',
    total_sessions INT COMMENT '총 수업 횟수',
    session_duration_minutes INT COMMENT '수업 시간 (분)',
    
    -- 상태 정보
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    
    -- 메타데이터
    metadata_json JSON COMMENT '추가 메타데이터 (JSON)',
    settings_json JSON COMMENT '강좌별 설정 (JSON)',
    
    -- 공통 필드 (BaseEntity)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_course_id (course_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_branch_id (branch_id),
    INDEX idx_tenant_branch (tenant_id, branch_id),
    INDEX idx_category (category),
    INDEX idx_subject (subject),
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_courses_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_courses_branches 
    FOREIGN KEY (branch_id) REFERENCES branches(id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_courses_pricing_policy CHECK (pricing_policy IN ('FIXED', 'PER_SESSION', 'PACKAGE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='강좌 테이블 (학원 시스템)';

-- ============================================
-- 2. classes 테이블 (반)
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    class_id VARCHAR(36) UNIQUE NOT NULL COMMENT '반 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    branch_id BIGINT NOT NULL COMMENT '지점 ID',
    course_id VARCHAR(36) NOT NULL COMMENT '강좌 ID',
    
    -- 반 정보
    name VARCHAR(255) NOT NULL COMMENT '반명',
    name_ko VARCHAR(255) COMMENT '반명 (한글)',
    name_en VARCHAR(255) COMMENT '반명 (영문)',
    description TEXT COMMENT '반 설명',
    
    -- 강사 정보
    teacher_id BIGINT COMMENT '담당 강사 ID (staff_account.staff_id 또는 user.id)',
    teacher_name VARCHAR(100) COMMENT '담당 강사명',
    
    -- 수용 인원
    capacity INT NOT NULL DEFAULT 10 COMMENT '정원',
    current_enrollment INT DEFAULT 0 COMMENT '현재 등록 인원',
    
    -- 수업 정보
    start_date DATE COMMENT '수업 시작일',
    end_date DATE COMMENT '수업 종료일',
    room VARCHAR(100) COMMENT '강의실',
    
    -- 상태 정보
    status VARCHAR(20) DEFAULT 'DRAFT' COMMENT '상태: DRAFT, RECRUITING, ACTIVE, COMPLETED, CANCELLED',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    
    -- 설정 정보
    options_json JSON COMMENT '반별 옵션 설정 (JSON)',
    settings_json JSON COMMENT '반별 설정 (JSON)',
    
    -- 공통 필드 (BaseEntity)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_class_id (class_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_branch_id (branch_id),
    INDEX idx_course_id (course_id),
    INDEX idx_tenant_branch (tenant_id, branch_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_status (status),
    INDEX idx_is_active (is_active),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_classes_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_classes_branches 
    FOREIGN KEY (branch_id) REFERENCES branches(id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_classes_courses 
    FOREIGN KEY (course_id) REFERENCES courses(course_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_classes_status CHECK (status IN ('DRAFT', 'RECRUITING', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_classes_capacity CHECK (capacity > 0),
    CONSTRAINT chk_classes_enrollment CHECK (current_enrollment >= 0 AND current_enrollment <= capacity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='반 테이블 (학원 시스템)';

-- ============================================
-- 3. class_schedules 테이블 (시간표)
-- ============================================
CREATE TABLE IF NOT EXISTS class_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    schedule_id VARCHAR(36) UNIQUE NOT NULL COMMENT '시간표 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    branch_id BIGINT NOT NULL COMMENT '지점 ID',
    class_id VARCHAR(36) NOT NULL COMMENT '반 ID',
    
    -- 시간표 정보
    day_of_week INT NOT NULL COMMENT '요일 (0=일요일, 1=월요일, ..., 6=토요일)',
    start_time TIME NOT NULL COMMENT '시작 시간',
    end_time TIME NOT NULL COMMENT '종료 시간',
    room VARCHAR(100) COMMENT '강의실',
    
    -- 수업 정보
    session_number INT COMMENT '회차 번호',
    session_date DATE COMMENT '특정 날짜 (정기 수업이 아닌 경우)',
    is_regular BOOLEAN DEFAULT TRUE COMMENT '정기 수업 여부',
    
    -- 상태 정보
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    
    -- 공통 필드 (BaseEntity)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_schedule_id (schedule_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_branch_id (branch_id),
    INDEX idx_class_id (class_id),
    INDEX idx_tenant_branch (tenant_id, branch_id),
    INDEX idx_day_of_week (day_of_week),
    INDEX idx_session_date (session_date),
    INDEX idx_is_regular (is_regular),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_class_schedules_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_class_schedules_branches 
    FOREIGN KEY (branch_id) REFERENCES branches(id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_class_schedules_classes 
    FOREIGN KEY (class_id) REFERENCES classes(class_id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_class_schedules_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6),
    CONSTRAINT chk_class_schedules_time CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='시간표 테이블 (학원 시스템)';

-- ============================================
-- 4. class_enrollments 테이블 (수강 등록)
-- ============================================
CREATE TABLE IF NOT EXISTS class_enrollments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id VARCHAR(36) UNIQUE NOT NULL COMMENT '수강 등록 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    branch_id BIGINT NOT NULL COMMENT '지점 ID',
    class_id VARCHAR(36) NOT NULL COMMENT '반 ID',
    consumer_id BIGINT COMMENT '수강생 ID (consumer_account.consumer_id 또는 user.id)',
    
    -- 수강 정보
    enrollment_date DATE NOT NULL COMMENT '등록일',
    start_date DATE COMMENT '수강 시작일',
    end_date DATE COMMENT '수강 종료일',
    
    -- 수강료 정보
    tuition_plan_id VARCHAR(36) COMMENT '수강료 플랜 ID',
    tuition_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '수강료 금액',
    payment_status VARCHAR(20) DEFAULT 'PENDING' COMMENT '결제 상태: PENDING, PAID, PARTIAL, OVERDUE, CANCELLED',
    
    -- 상태 정보
    status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '상태: DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED, TRANSFERRED',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    
    -- 메모 및 설정
    notes TEXT COMMENT '비고',
    settings_json JSON COMMENT '수강별 설정 (JSON)',
    
    -- 공통 필드 (BaseEntity)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_enrollment_id (enrollment_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_branch_id (branch_id),
    INDEX idx_class_id (class_id),
    INDEX idx_consumer_id (consumer_id),
    INDEX idx_tenant_branch (tenant_id, branch_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_enrollment_date (enrollment_date),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_class_enrollments_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_class_enrollments_branches 
    FOREIGN KEY (branch_id) REFERENCES branches(id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_class_enrollments_classes 
    FOREIGN KEY (class_id) REFERENCES classes(class_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_class_enrollments_status CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'TRANSFERRED')),
    CONSTRAINT chk_class_enrollments_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED')),
    CONSTRAINT chk_class_enrollments_dates CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='수강 등록 테이블 (학원 시스템)';

-- ============================================
-- 5. attendances 테이블 (출결)
-- ============================================
CREATE TABLE IF NOT EXISTS attendances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    attendance_id VARCHAR(36) UNIQUE NOT NULL COMMENT '출결 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    branch_id BIGINT NOT NULL COMMENT '지점 ID',
    enrollment_id VARCHAR(36) NOT NULL COMMENT '수강 등록 ID',
    schedule_id VARCHAR(36) COMMENT '시간표 ID (정기 수업인 경우)',
    
    -- 출결 정보
    attendance_date DATE NOT NULL COMMENT '출결 날짜',
    attendance_time TIME COMMENT '출결 시간',
    status VARCHAR(20) NOT NULL COMMENT '출결 상태: PRESENT, ABSENT, LATE, EARLY_LEAVE, EXCUSED',
    
    -- 기록 정보
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '기록 일시',
    recorded_by VARCHAR(100) COMMENT '기록한 사용자',
    recording_method VARCHAR(50) COMMENT '기록 방법: MANUAL, QR_CODE, BIOMETRIC, AUTO',
    
    -- 메모
    notes TEXT COMMENT '비고',
    excuse_reason TEXT COMMENT '사유 (결석/지각/조퇴인 경우)',
    
    -- 공통 필드 (BaseEntity)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_attendance_id (attendance_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_branch_id (branch_id),
    INDEX idx_enrollment_id (enrollment_id),
    INDEX idx_schedule_id (schedule_id),
    INDEX idx_tenant_branch (tenant_id, branch_id),
    INDEX idx_attendance_date (attendance_date),
    INDEX idx_status (status),
    INDEX idx_recorded_at (recorded_at),
    INDEX idx_is_deleted (is_deleted),
    UNIQUE KEY uk_enrollment_schedule_date (enrollment_id, schedule_id, attendance_date),
    
    -- 외래키
    CONSTRAINT fk_attendances_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_attendances_branches 
    FOREIGN KEY (branch_id) REFERENCES branches(id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_attendances_enrollments 
    FOREIGN KEY (enrollment_id) REFERENCES class_enrollments(enrollment_id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT fk_attendances_schedules 
    FOREIGN KEY (schedule_id) REFERENCES class_schedules(schedule_id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_attendances_status CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EARLY_LEAVE', 'EXCUSED')),
    CONSTRAINT chk_attendances_recording_method CHECK (recording_method IN ('MANUAL', 'QR_CODE', 'BIOMETRIC', 'AUTO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='출결 테이블 (학원 시스템)';

-- ============================================
-- 6. 컴포넌트 카탈로그에 학원 컴포넌트 등록 (초기 데이터)
-- ============================================
-- 참고: V9__insert_initial_data.sql에 이미 'ACADEMY' 컴포넌트가 등록되어 있을 수 있음
-- 중복 방지를 위해 INSERT IGNORE 사용

INSERT IGNORE INTO component_catalog (
    component_id, component_code, name, name_ko, name_en,
    category, description, description_ko, description_en,
    is_core, is_active, component_version, display_order,
    created_by, updated_by
) VALUES (
    UUID(), 'ACADEMY', '학원 시스템', '학원 시스템', 'Academy System',
    'ADDON', '학원 운영 관리 시스템 (강좌, 반, 수강, 출결)', 
    '학원 운영 관리 시스템 (강좌, 반, 수강, 출결)', 
    'Academy operation management system (courses, classes, enrollments, attendance)',
    FALSE, TRUE, '1.0.0', 9, 'system', 'system'
);

-- ============================================
-- 완료 메시지
-- ============================================
-- 학원 시스템 테이블 생성 완료
-- 다음 단계: 엔티티 클래스 생성 및 Repository 구현

