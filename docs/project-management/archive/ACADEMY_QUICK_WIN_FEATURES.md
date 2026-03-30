# 학원 업종 Quick Win 기능 제안

> **작성일:** 2025-11-17  
> **목적:** 간단하게 구현하면서도 비즈니스 가치가 높은 기능 제안  
> **원칙:** 구현 난이도 낮음 + 사용자 만족도 높음 + 경쟁력 강화

## 1. 개요

학원 업종에서 **간단하게 구현하면서도 실용적이고 차별화 포인트**가 될 수 있는 기능들을 제안합니다.

### 1.1 선택 기준
- ✅ **구현 난이도**: ⭐⭐ (보통) 이하
- ✅ **개발 기간**: 1주 이하
- ✅ **비즈니스 가치**: 높음 (학원 선택 시 메리트)
- ✅ **사용 빈도**: 높음 (일상적으로 사용)
- ✅ **기존 인프라 활용**: 가능 (알림, 파일 업로드 등)

## 2. 제안 기능 목록

### 2.1 공지사항 게시판 ⭐⭐⭐ (우선순위: 높음)

**구현 난이도**: ⭐ (쉬움, 2-3일)  
**비즈니스 가치**: ⭐⭐⭐⭐⭐

#### 기능 설명
- 학원 공지, 수업 변경, 이벤트 등을 게시
- 중요 공지는 상단 고정
- 읽음/안 읽음 표시
- 카테고리별 분류 (공지, 이벤트, 수업 변경 등)

#### 구현 내용
- **백엔드**: 간단한 CRUD API (게시글 작성/수정/삭제/조회)
- **프론트엔드**: 게시판 목록/상세 화면
- **알림 연동**: 중요 공지 발행 시 학부모에게 알림 발송 (기존 알림 시스템 활용)

#### 데이터베이스
```sql
CREATE TABLE academy_notice (
    notice_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'GENERAL',
    is_important BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    target_audience VARCHAR(50) DEFAULT 'ALL', -- ALL, STUDENT, PARENT, STAFF
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_tenant_branch (tenant_id, branch_id),
    INDEX idx_is_pinned (is_pinned, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 읽음 처리 테이블
CREATE TABLE academy_notice_read (
    read_id VARCHAR(36) PRIMARY KEY,
    notice_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_notice_user (notice_id, user_id),
    FOREIGN KEY (notice_id) REFERENCES academy_notice(notice_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 비즈니스 가치
- 학원-학부모 간 소통 채널 강화
- 수업 변경, 이벤트 등을 효율적으로 전달
- 다른 학원 관리 시스템에는 없는 실시간 공지 기능

---

### 2.2 출석 체크 QR 코드 ⭐⭐⭐ (우선순위: 높음)

**구현 난이도**: ⭐⭐ (보통, 3-4일)  
**비즈니스 가치**: ⭐⭐⭐⭐⭐

#### 기능 설명
- 강사가 수업 시작 시 QR 코드 생성
- 학생이 QR 코드 스캔으로 출석 체크
- 자동으로 출석 기록 및 학부모 알림 발송

#### 구현 내용
- **백엔드**: QR 코드 생성 API (JWT 기반 토큰), QR 코드 검증 API
- **프론트엔드**: 강사용 QR 코드 표시 화면, 학생용 QR 코드 스캔 화면
- **모바일**: 카메라로 QR 코드 스캔 (react-native-qrcode-scanner 활용)

#### 데이터베이스
```sql
-- QR 코드 세션 테이블
CREATE TABLE attendance_qr_session (
    session_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36),
    class_id VARCHAR(36) NOT NULL,
    instructor_id BIGINT NOT NULL,
    qr_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_qr_token (qr_token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 비즈니스 가치
- 출석 체크 자동화로 강사 업무 부담 감소
- 학생이 직접 출석 체크하여 편리함
- 실시간 출석 현황 확인 가능

---

### 2.3 수강권 잔여 횟수 표시 ⭐⭐ (우선순위: 중간)

**구현 난이도**: ⭐ (쉬움, 1-2일)  
**비즈니스 가치**: ⭐⭐⭐⭐

#### 기능 설명
- 학생/학부모가 남은 수강 횟수 실시간 확인
- 수강권 만료 임박 알림 (5회 이하 남았을 때)
- 수강권 연장 안내

#### 구현 내용
- **백엔드**: 수강권 잔여 횟수 계산 로직 (기존 수강권 테이블 활용)
- **프론트엔드**: 마이페이지에 잔여 횟수 표시
- **알림 연동**: 잔여 횟수 부족 시 자동 알림 (기존 알림 시스템 활용)

#### 비즈니스 가치
- 학부모가 수강권 상태를 쉽게 확인
- 수강권 연장 유도로 매출 증대
- 투명한 수강권 관리로 신뢰도 향상

---

### 2.4 학부모 일일 리포트 ⭐⭐⭐ (우선순위: 높음)

**구현 난이도**: ⭐⭐ (보통, 2-3일)  
**비즈니스 가치**: ⭐⭐⭐⭐⭐

#### 기능 설명
- 매일 저녁 자동으로 학부모에게 일일 리포트 발송
- 출석/결석 요약, 오늘의 수업 내용, 과제 안내 등
- 이메일/카카오 알림톡으로 발송

#### 구현 내용
- **백엔드**: 배치 작업으로 매일 저녁 실행 (스케줄러)
- **데이터 수집**: 출석 기록, 수업 일정, 과제 정보 등
- **알림 연동**: 기존 알림 시스템 활용 (이메일 템플릿, 카카오 알림톡 템플릿)

#### 비즈니스 가치
- 학부모 만족도 향상 (자녀의 학원 생활 실시간 파악)
- 학원 신뢰도 향상 (투명한 정보 제공)
- 학부모 참여도 증가

---

### 2.5 과제/숙제 관리 ⭐⭐ (우선순위: 중간)

**구현 난이도**: ⭐⭐ (보통, 3-4일)  
**비즈니스 가치**: ⭐⭐⭐⭐

#### 기능 설명
- 강사가 과제 등록 (제목, 내용, 마감일, 첨부파일)
- 학생이 과제 제출 (텍스트, 파일 업로드)
- 제출 현황 확인 (제출/미제출 학생 목록)

#### 구현 내용
- **백엔드**: 과제 CRUD API, 파일 업로드 API (기존 파일 업로드 시스템 활용)
- **프론트엔드**: 과제 목록/상세 화면, 제출 화면
- **알림 연동**: 과제 등록 시 학생에게 알림, 마감일 전날 리마인더

#### 데이터베이스
```sql
CREATE TABLE academy_homework (
    homework_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36),
    class_id VARCHAR(36) NOT NULL,
    instructor_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    attachment_url VARCHAR(500),
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_class_due_date (class_id, due_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE academy_homework_submission (
    submission_id VARCHAR(36) PRIMARY KEY,
    homework_id VARCHAR(36) NOT NULL,
    student_id BIGINT NOT NULL,
    content TEXT,
    attachment_url VARCHAR(500),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_homework_student (homework_id, student_id),
    FOREIGN KEY (homework_id) REFERENCES academy_homework(homework_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 비즈니스 가치
- 과제 관리 자동화로 강사 업무 부담 감소
- 학생이 과제를 체계적으로 관리
- 제출 현황을 한눈에 확인

---

### 2.6 생일 축하 알림 ⭐ (우선순위: 낮음)

**구현 난이도**: ⭐ (쉬움, 1일)  
**비즈니스 가치**: ⭐⭐⭐

#### 기능 설명
- 학생 생일 당일 자동으로 축하 메시지 발송
- 학부모에게도 자녀 생일 축하 알림 발송
- 간단한 쿠폰/할인 제공 (선택적)

#### 구현 내용
- **백엔드**: 매일 아침 배치 작업으로 생일자 확인
- **알림 연동**: 기존 알림 시스템 활용 (카카오 알림톡 템플릿)

#### 비즈니스 가치
- 학생/학부모 만족도 향상 (인간적인 서비스)
- 학원 브랜드 이미지 향상
- 재등록 유도 효과

---

### 2.7 간단한 설문조사 ⭐⭐ (우선순위: 중간)

**구현 난이도**: ⭐⭐ (보통, 2-3일)  
**비즈니스 가치**: ⭐⭐⭐

#### 기능 설명
- 학원 만족도 조사, 수업 개선 의견 수집 등
- 객관식/주관식 문항 지원
- 결과 통계 자동 생성

#### 구현 내용
- **백엔드**: 설문 CRUD API, 응답 저장 API
- **프론트엔드**: 설문 작성/응답 화면, 결과 통계 화면
- **알림 연동**: 설문 등록 시 대상자에게 알림

#### 비즈니스 가치
- 학원 운영 개선을 위한 피드백 수집
- 학부모 의견을 체계적으로 관리
- 데이터 기반 의사결정 지원

---

## 3. 우선순위 및 구현 순서

### Phase 1: 즉시 구현 가능 (1-2주)
1. **공지사항 게시판** (2-3일) ⭐⭐⭐
2. **수강권 잔여 횟수 표시** (1-2일) ⭐⭐
3. **생일 축하 알림** (1일) ⭐

### Phase 2: 빠른 확장 (2-3주)
4. **출석 체크 QR 코드** (3-4일) ⭐⭐⭐
5. **학부모 일일 리포트** (2-3일) ⭐⭐⭐

### Phase 3: 추가 기능 (3-4주)
6. **과제/숙제 관리** (3-4일) ⭐⭐
7. **간단한 설문조사** (2-3일) ⭐⭐

## 4. 공통 구현 패턴

### 4.1 기존 인프라 활용
- **알림 시스템**: 기존 `NotificationService` 활용
- **파일 업로드**: 기존 파일 업로드 시스템 활용
- **인증/권한**: 기존 `SecurityConfig` 활용
- **멀티테넌시**: 기존 `TenantContext` 활용

### 4.2 공통 컴포넌트
- **게시판 컴포넌트**: 공지사항, 설문조사에서 재사용
- **파일 업로드 컴포넌트**: 과제, 공지사항에서 재사용
- **알림 배지**: 모든 기능에서 재사용

### 4.3 데이터베이스 패턴
- 모든 테이블에 `tenant_id`, `branch_id` 포함
- `created_at`, `updated_at`, `deleted_at` 표준 필드
- 인덱스 최적화 (tenant_id, branch_id 복합 인덱스)

## 5. 비즈니스 가치 요약

| 기능 | 구현 난이도 | 개발 기간 | 비즈니스 가치 | 우선순위 |
|------|------------|----------|--------------|----------|
| 공지사항 게시판 | ⭐ | 2-3일 | ⭐⭐⭐⭐⭐ | 높음 |
| 출석 체크 QR 코드 | ⭐⭐ | 3-4일 | ⭐⭐⭐⭐⭐ | 높음 |
| 수강권 잔여 횟수 | ⭐ | 1-2일 | ⭐⭐⭐⭐ | 중간 |
| 학부모 일일 리포트 | ⭐⭐ | 2-3일 | ⭐⭐⭐⭐⭐ | 높음 |
| 과제/숙제 관리 | ⭐⭐ | 3-4일 | ⭐⭐⭐⭐ | 중간 |
| 생일 축하 알림 | ⭐ | 1일 | ⭐⭐⭐ | 낮음 |
| 간단한 설문조사 | ⭐⭐ | 2-3일 | ⭐⭐⭐ | 중간 |

## 6. 다음 단계

1. **즉시 시작 가능 항목**
   - [ ] 공지사항 게시판 DB 스키마 설계
   - [ ] 수강권 잔여 횟수 계산 로직 구현
   - [ ] 생일 축하 알림 배치 작업 구현

2. **설계 확정 필요 항목**
   - [ ] QR 코드 토큰 만료 시간 정책
   - [ ] 일일 리포트 발송 시간 정책
   - [ ] 과제 파일 크기 제한 정책

3. **협의 필요 항목**
   - [ ] Phase 1 vs Phase 2 범위 확정
   - [ ] 개발 일정 확정
   - [ ] 우선순위 최종 확정

## 7. 관련 문서

- `PHASE1_ACADEMY_MVP_PLAN.md`: 학원 Phase 1 MVP 계획
- `PLATFORM_ROADMAP.md`: 전체 플랫폼 로드맵
- `DM_FEATURE_IMPLEMENTATION_PLAN.md`: DM 기능 구현 계획

