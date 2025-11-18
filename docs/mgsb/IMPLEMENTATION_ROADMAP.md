# 구현 로드맵 (순차적 실행 가이드)

**작성일:** 2025-01-XX  
**목적:** ERD 시스템 고도화 및 테넌트별 PG사 연계 승인 시스템을 순차적으로 구현하기 위한 로드맵

## 1. 전체 개요

### 1.1 구현 대상
1. **ERD 시스템 고도화** (`ERD_SYSTEM_ENHANCEMENT_PLAN.md`)
2. **테넌트별 PG사 연계 승인 시스템** (`TENANT_PG_APPROVAL_SYSTEM_PLAN.md`)

### 1.2 구현 순서
두 시스템을 병렬로 진행하되, 우선순위는 다음과 같습니다:
1. **테넌트 PG 승인 시스템 Phase 1** (비즈니스 우선순위 높음)
2. **ERD 시스템 Phase 1** (개발 생산성 향상)

## 2. Phase별 구현 계획

### 2.1 Week 1-2: 테넌트 PG 승인 시스템 Phase 1

**목표:** 테넌트 PG 설정 입력 및 승인 기본 기능 구현

**작업 내용:**
- [ ] 데이터베이스 마이그레이션 파일 생성
- [ ] Enum 클래스 생성 (PgProvider, PgConfigurationStatus, ApprovalStatus)
- [ ] 엔티티 클래스 생성 (TenantPgConfiguration)
- [ ] Repository 생성
- [ ] DTO 클래스 생성
- [ ] 서비스 클래스 생성 (TenantPgConfigurationService)
- [ ] 컨트롤러 생성 (TenantPgConfigurationController, OpsPgConfigurationController)
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] API 테스트

**참고 문서:**
- `TENANT_PG_PHASE1_IMPLEMENTATION_GUIDE.md`

**예상 소요 시간:** 2주

### 2.2 Week 3-4: ERD 시스템 Phase 1

**목표:** 데이터베이스 스키마에서 ERD 자동 생성 시스템 구현

**작업 내용:**
- [ ] 엔티티 모델 클래스 생성 (ErdTable, ErdColumn, ErdForeignKey, ErdIndex)
- [ ] 스키마 조회 서비스 생성 (SchemaReaderService)
- [ ] Mermaid ERD 생성 서비스 생성 (MermaidErdGeneratorService)
- [ ] ERD 파일 저장 서비스 생성 (ErdFileService)
- [ ] ERD 생성 컨트롤러 생성
- [ ] 설정 파일 추가
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] ERD 생성 API 테스트

**참고 문서:**
- `ERD_SYSTEM_PHASE1_IMPLEMENTATION_GUIDE.md`

**예상 소요 시간:** 2주

### 2.3 Week 5-6: 테넌트 PG 승인 시스템 Phase 2

**목표:** PG 정보 암호화 및 연결 테스트 기능 구현

**작업 내용:**
- [ ] PG 정보 암호화 구현 (AES-256)
- [ ] PG 연결 테스트 기능 구현
- [ ] 접근 제어 구현
- [ ] 감사 로그 구현
- [ ] 변경 이력 테이블 및 서비스 구현

**참고 문서:**
- `TENANT_PG_APPROVAL_SYSTEM_PLAN.md` (Phase 2)

**예상 소요 시간:** 2주

### 2.4 Week 7-8: ERD 시스템 Phase 2

**목표:** ERD 관리 대시보드 구축

**작업 내용:**
- [ ] ERD 메타데이터 테이블 생성
- [ ] ERD 관리 API 구현
- [ ] ERD 관리 프론트엔드 구현
- [ ] ERD 시각화 개선 (Mermaid.js)

**참고 문서:**
- `ERD_SYSTEM_ENHANCEMENT_PLAN.md` (Phase 2)

**예상 소요 시간:** 2주

### 2.5 Week 9-10: 테넌트 PG 승인 시스템 Phase 3

**목표:** 테넌트 포털 및 운영 포털 UI 구현

**작업 내용:**
- [ ] 테넌트 포털: PG 설정 입력 페이지
- [ ] 운영 포털: PG 설정 승인 페이지
- [ ] PG 설정 목록 및 상세 페이지
- [ ] 알림 연동 (Slack/이메일)

**참고 문서:**
- `TENANT_PG_APPROVAL_SYSTEM_PLAN.md` (Phase 3)

**예상 소요 시간:** 2주

### 2.6 Week 11-12: 통합 및 최종 테스트

**목표:** 결제 시스템과 통합 및 전체 테스트

**작업 내용:**
- [ ] 결제 시스템과 통합 (테넌트별 PG 사용)
- [ ] 통합 테스트
- [ ] 성능 테스트
- [ ] 문서화 완료

**참고 문서:**
- `TENANT_PG_APPROVAL_SYSTEM_PLAN.md` (Phase 4)

**예상 소요 시간:** 2주

## 3. 병렬 작업 가능 항목

### 3.1 동시 진행 가능
- **테넌트 PG Phase 1** + **ERD Phase 1**: 서로 독립적이므로 병렬 진행 가능
- **테넌트 PG Phase 2** + **ERD Phase 2**: 서로 독립적이므로 병렬 진행 가능

### 3.2 순차 진행 필요
- **테넌트 PG Phase 3**: Phase 1, 2 완료 후 진행
- **통합 및 최종 테스트**: 모든 Phase 완료 후 진행

## 4. 체크리스트

### 4.1 테넌트 PG 승인 시스템
- [ ] Phase 1: 기본 기능 구현
- [ ] Phase 2: 보안 및 검증
- [ ] Phase 3: UI 구현
- [ ] Phase 4: 통합 및 테스트

### 4.2 ERD 시스템
- [ ] Phase 1: ERD 자동 생성
- [ ] Phase 2: ERD 관리 대시보드
- [ ] Phase 3: ERD 자동 동기화
- [ ] Phase 4: ERD 고급 기능

## 5. 리스크 관리

### 5.1 기술적 리스크
- **PG 정보 암호화**: 암호화 키 관리 정책 수립 필요
- **ERD 생성 성능**: 대용량 스키마에서 성능 이슈 가능성
- **결제 시스템 통합**: 기존 결제 시스템과의 호환성 확인 필요

### 5.2 일정 리스크
- **예상 소요 시간**: 실제 구현 시 추가 시간 필요할 수 있음
- **의존성**: 외부 라이브러리 또는 서비스 의존성 확인 필요

## 6. 다음 단계

1. **테넌트 PG 승인 시스템 Phase 1 시작**
   - `TENANT_PG_PHASE1_IMPLEMENTATION_GUIDE.md` 참고
   - 데이터베이스 마이그레이션부터 시작

2. **ERD 시스템 Phase 1 시작** (병렬 진행 가능)
   - `ERD_SYSTEM_PHASE1_IMPLEMENTATION_GUIDE.md` 참고
   - 엔티티 모델 클래스부터 시작

## 7. 연계 문서

- `ERD_SYSTEM_ENHANCEMENT_PLAN.md`: ERD 시스템 고도화 계획
- `TENANT_PG_APPROVAL_SYSTEM_PLAN.md`: 테넌트별 PG사 연계 승인 시스템 설계
- `ERD_SYSTEM_PHASE1_IMPLEMENTATION_GUIDE.md`: ERD Phase 1 구현 가이드
- `TENANT_PG_PHASE1_IMPLEMENTATION_GUIDE.md`: 테넌트 PG Phase 1 구현 가이드

