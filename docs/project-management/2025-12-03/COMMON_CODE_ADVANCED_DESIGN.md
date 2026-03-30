# 공통코드 시스템 고급 설계 (확장 고려)

**작성일**: 2025-12-03  
**목적**: 공통코드 시스템의 확장성과 미래 요구사항 대응

---

## 🎯 추가 고려사항

### 1. 현재 설계의 한계

#### 문제점 1: 코드 버전 관리 부재
```
현재: 코드 수정 시 이력 없음
문제: 
- 언제 누가 왜 변경했는지 추적 불가
- 롤백 불가
- 감사 추적(Audit Trail) 불가
```

#### 문제점 2: 코드 간 관계 표현 불가
```
현재: 단순 key-value 구조
문제:
- 계층 구조 표현 불가 (예: 대분류 > 중분류 > 소분류)
- 코드 간 의존성 표현 불가
- 동적 연관 관계 표현 불가
```

#### 문제점 3: 다국어 지원 부족
```
현재: korean_name만 존재
문제:
- 영어, 중국어, 일본어 등 다국어 미지원
- 글로벌 확장 시 재설계 필요
```

#### 문제점 4: 유효기간 관리 부재
```
현재: isActive만으로 관리
문제:
- 특정 기간만 유효한 코드 관리 불가
- 시즌별/이벤트성 코드 관리 불가
```

#### 문제점 5: 테넌트 코드 상속 불가
```
현재: 시스템 코드 or 테넌트 코드 (이분법)
문제:
- 테넌트가 시스템 코드 확장 불가
- 테넌트별 커스터마이징 제한적
```

---

## 📊 개선된 데이터베이스 설계

### 1. common_codes 테이블 (확장)

```sql
CREATE TABLE common_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 기본 정보
    tenant_id VARCHAR(36) COMMENT '테넌트 ID (NULL=시스템)',
    code_group VARCHAR(50) NOT NULL COMMENT '코드 그룹',
    code_value VARCHAR(50) NOT NULL COMMENT '코드 값',
    
    -- 다국어 지원 (JSON)
    code_labels JSON NOT NULL COMMENT '{"ko":"활성","en":"Active","zh":"激活","ja":"アクティブ"}',
    code_descriptions JSON COMMENT '다국어 설명',
    
    -- 계층 구조
    parent_code_id BIGINT COMMENT '부모 코드 ID (계층 구조)',
    depth INT DEFAULT 0 COMMENT '깊이 (0=최상위)',
    path VARCHAR(500) COMMENT '경로 (예: /1/5/12)',
    
    -- 정렬 및 상태
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- 유효기간
    valid_from DATE COMMENT '유효 시작일',
    valid_to DATE COMMENT '유효 종료일',
    
    -- 확장 데이터
    extra_data JSON COMMENT '추가 데이터',
    
    -- 상속 정보
    inherited_from_id BIGINT COMMENT '상속받은 코드 ID (테넌트가 시스템 코드 확장)',
    is_system_override BOOLEAN DEFAULT false COMMENT '시스템 코드 오버라이드 여부',
    
    -- 버전 관리
    version INT DEFAULT 1 COMMENT '버전',
    
    -- 감사 정보
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_tenant (tenant_id),
    INDEX idx_code_group (code_group),
    INDEX idx_parent (parent_code_id),
    INDEX idx_active (is_active),
    INDEX idx_valid_period (valid_from, valid_to),
    INDEX idx_inherited (inherited_from_id),
    
    -- 유니크 제약
    UNIQUE KEY uk_tenant_code (tenant_id, code_group, code_value),
    
    -- 외래키
    FOREIGN KEY (parent_code_id) REFERENCES common_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (inherited_from_id) REFERENCES common_codes(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. common_code_history 테이블 (버전 관리)

```sql
CREATE TABLE common_code_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 원본 코드 정보
    common_code_id BIGINT NOT NULL COMMENT '공통코드 ID',
    version INT NOT NULL COMMENT '버전',
    
    -- 변경 전 데이터 (JSON)
    previous_data JSON NOT NULL COMMENT '변경 전 전체 데이터',
    
    -- 변경 정보
    change_type VARCHAR(20) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, ACTIVATE, DEACTIVATE',
    change_reason TEXT COMMENT '변경 사유',
    
    -- 변경자
    changed_by VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_common_code (common_code_id),
    INDEX idx_version (version),
    INDEX idx_change_type (change_type),
    INDEX idx_changed_at (changed_at),
    
    FOREIGN KEY (common_code_id) REFERENCES common_codes(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. code_relationships 테이블 (코드 간 관계)

```sql
CREATE TABLE code_relationships (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 관계 정보
    source_code_id BIGINT NOT NULL COMMENT '소스 코드 ID',
    target_code_id BIGINT NOT NULL COMMENT '타겟 코드 ID',
    relationship_type VARCHAR(50) NOT NULL COMMENT 'DEPENDS_ON, CONFLICTS_WITH, RELATED_TO',
    
    -- 메타데이터
    relationship_data JSON COMMENT '관계 추가 정보',
    is_active BOOLEAN DEFAULT true,
    
    -- 감사 정보
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_source (source_code_id),
    INDEX idx_target (target_code_id),
    INDEX idx_type (relationship_type),
    
    UNIQUE KEY uk_relationship (source_code_id, target_code_id, relationship_type),
    
    FOREIGN KEY (source_code_id) REFERENCES common_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_code_id) REFERENCES common_codes(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4. code_group_metadata 테이블 (확장)

```sql
CREATE TABLE code_group_metadata (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 그룹 정보
    code_group VARCHAR(50) NOT NULL UNIQUE COMMENT '코드 그룹',
    
    -- 다국어 지원
    group_names JSON NOT NULL COMMENT '{"ko":"사용자 상태","en":"User Status"}',
    descriptions JSON COMMENT '다국어 설명',
    
    -- 분류
    code_type VARCHAR(20) NOT NULL COMMENT 'CORE, TENANT, HYBRID',
    category VARCHAR(50) COMMENT '카테고리 (SYSTEM, BUSINESS, FINANCE, etc)',
    
    -- 계층 구조 설정
    supports_hierarchy BOOLEAN DEFAULT false COMMENT '계층 구조 지원 여부',
    max_depth INT DEFAULT 0 COMMENT '최대 깊이 (0=무제한)',
    
    -- 상속 설정
    allows_tenant_override BOOLEAN DEFAULT false COMMENT '테넌트 오버라이드 허용',
    
    -- 유효성 검증
    validation_rules JSON COMMENT '유효성 검증 규칙',
    
    -- 메타데이터
    icon VARCHAR(50),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    
    -- 감사 정보
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_code_type (code_type),
    INDEX idx_category (category)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 💻 고급 기능 구현

### 1. 계층 구조 지원

```java
@Service
public class HierarchicalCodeService {
    
    /**
     * 계층 구조 코드 생성
     */
    public CommonCode createHierarchicalCode(CommonCodeCreateRequest request, Long parentId) {
        CommonCode parent = null;
        int depth = 0;
        String path = "";
        
        if (parentId != null) {
            parent = commonCodeRepository.findById(parentId)
                .orElseThrow(() -> new NotFoundException("부모 코드를 찾을 수 없습니다"));
            
            depth = parent.getDepth() + 1;
            path = parent.getPath() + "/" + parent.getId();
            
            // 최대 깊이 검증
            CodeGroupMetadata metadata = codeGroupMetadataRepository
                .findByCodeGroup(request.getCodeGroup())
                .orElseThrow();
            
            if (metadata.getMaxDepth() > 0 && depth > metadata.getMaxDepth()) {
                throw new BusinessException("최대 깊이를 초과했습니다");
            }
        }
        
        CommonCode code = CommonCode.builder()
            .tenantId(request.getTenantId())
            .codeGroup(request.getCodeGroup())
            .codeValue(request.getCodeValue())
            .codeLabels(request.getCodeLabels())
            .parentCodeId(parentId)
            .depth(depth)
            .path(path)
            .sortOrder(request.getSortOrder())
            .isActive(true)
            .version(1)
            .build();
        
        return commonCodeRepository.save(code);
    }
    
    /**
     * 하위 코드 조회 (재귀)
     */
    public List<CommonCodeDTO> getCodeTree(String codeGroup, Long parentId) {
        List<CommonCode> codes = parentId == null
            ? commonCodeRepository.findByCodeGroupAndParentCodeIdIsNull(codeGroup)
            : commonCodeRepository.findByCodeGroupAndParentCodeId(codeGroup, parentId);
        
        return codes.stream()
            .map(code -> {
                CommonCodeDTO dto = toDTO(code);
                // 재귀적으로 자식 조회
                dto.setChildren(getCodeTree(codeGroup, code.getId()));
                return dto;
            })
            .collect(Collectors.toList());
    }
    
    /**
     * 전체 경로 조회
     */
    public List<CommonCode> getCodePath(Long codeId) {
        CommonCode code = commonCodeRepository.findById(codeId)
            .orElseThrow(() -> new NotFoundException("코드를 찾을 수 없습니다"));
        
        List<CommonCode> path = new ArrayList<>();
        
        // 경로 문자열 파싱 (/1/5/12)
        if (code.getPath() != null && !code.getPath().isEmpty()) {
            String[] ids = code.getPath().split("/");
            for (String id : ids) {
                if (!id.isEmpty()) {
                    commonCodeRepository.findById(Long.parseLong(id))
                        .ifPresent(path::add);
                }
            }
        }
        
        path.add(code);
        return path;
    }
}
```

### 2. 다국어 지원

```java
@Service
public class MultilingualCodeService {
    
    /**
     * 다국어 코드 레이블 조회
     */
    public String getCodeLabel(String codeGroup, String codeValue, String locale) {
        CommonCode code = commonCodeRepository
            .findByCodeGroupAndCodeValue(codeGroup, codeValue)
            .orElseThrow(() -> new NotFoundException("코드를 찾을 수 없습니다"));
        
        // JSON에서 해당 언어 추출
        ObjectMapper mapper = new ObjectMapper();
        try {
            JsonNode labels = mapper.readTree(code.getCodeLabels());
            
            // 요청 언어 조회
            if (labels.has(locale)) {
                return labels.get(locale).asText();
            }
            
            // 기본 언어(한국어) 조회
            if (labels.has("ko")) {
                return labels.get("ko").asText();
            }
            
            // 첫 번째 언어 반환
            return labels.fields().next().getValue().asText();
            
        } catch (Exception e) {
            log.error("다국어 레이블 파싱 실패", e);
            return code.getCodeValue();
        }
    }
    
    /**
     * 다국어 코드 레이블 설정
     */
    public void setCodeLabel(Long codeId, String locale, String label) {
        CommonCode code = commonCodeRepository.findById(codeId)
            .orElseThrow(() -> new NotFoundException("코드를 찾을 수 없습니다"));
        
        ObjectMapper mapper = new ObjectMapper();
        try {
            JsonNode labels = mapper.readTree(code.getCodeLabels());
            ((ObjectNode) labels).put(locale, label);
            
            code.setCodeLabels(labels.toString());
            code.setVersion(code.getVersion() + 1);
            
            commonCodeRepository.save(code);
            
            // 이력 저장
            saveHistory(code, "UPDATE", "다국어 레이블 변경: " + locale);
            
        } catch (Exception e) {
            throw new BusinessException("다국어 레이블 설정 실패", e);
        }
    }
}
```

### 3. 버전 관리 및 이력 추적

```java
@Service
public class CodeVersionService {
    
    /**
     * 코드 변경 이력 저장
     */
    @Transactional
    public void saveHistory(CommonCode code, String changeType, String reason) {
        ObjectMapper mapper = new ObjectMapper();
        
        try {
            // 현재 상태를 JSON으로 저장
            String previousData = mapper.writeValueAsString(code);
            
            CommonCodeHistory history = CommonCodeHistory.builder()
                .commonCodeId(code.getId())
                .version(code.getVersion())
                .previousData(previousData)
                .changeType(changeType)
                .changeReason(reason)
                .changedBy(SecurityUtils.getCurrentUsername())
                .build();
            
            commonCodeHistoryRepository.save(history);
            
        } catch (Exception e) {
            log.error("이력 저장 실패", e);
        }
    }
    
    /**
     * 특정 버전으로 롤백
     */
    @Transactional
    public CommonCode rollbackToVersion(Long codeId, int version) {
        CommonCode currentCode = commonCodeRepository.findById(codeId)
            .orElseThrow(() -> new NotFoundException("코드를 찾을 수 없습니다"));
        
        CommonCodeHistory history = commonCodeHistoryRepository
            .findByCommonCodeIdAndVersion(codeId, version)
            .orElseThrow(() -> new NotFoundException("해당 버전을 찾을 수 없습니다"));
        
        ObjectMapper mapper = new ObjectMapper();
        try {
            // 이전 데이터 복원
            CommonCode previousCode = mapper.readValue(
                history.getPreviousData(), 
                CommonCode.class
            );
            
            // 현재 상태 이력 저장
            saveHistory(currentCode, "ROLLBACK", "버전 " + version + "으로 롤백");
            
            // 데이터 복원
            currentCode.setCodeLabels(previousCode.getCodeLabels());
            currentCode.setCodeDescriptions(previousCode.getCodeDescriptions());
            currentCode.setExtraData(previousCode.getExtraData());
            currentCode.setIsActive(previousCode.getIsActive());
            currentCode.setVersion(currentCode.getVersion() + 1);
            
            return commonCodeRepository.save(currentCode);
            
        } catch (Exception e) {
            throw new BusinessException("롤백 실패", e);
        }
    }
    
    /**
     * 변경 이력 조회
     */
    public List<CommonCodeHistoryDTO> getHistory(Long codeId) {
        List<CommonCodeHistory> histories = commonCodeHistoryRepository
            .findByCommonCodeIdOrderByChangedAtDesc(codeId);
        
        return histories.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
}
```

### 4. 테넌트 코드 상속 (오버라이드)

```java
@Service
public class CodeInheritanceService {
    
    /**
     * 시스템 코드를 테넌트가 오버라이드
     */
    @Transactional
    public CommonCode overrideSystemCode(String tenantId, Long systemCodeId, 
                                         Map<String, String> overrideLabels) {
        // 1. 시스템 코드 조회
        CommonCode systemCode = commonCodeRepository.findById(systemCodeId)
            .orElseThrow(() -> new NotFoundException("시스템 코드를 찾을 수 없습니다"));
        
        if (systemCode.getTenantId() != null) {
            throw new BusinessException("시스템 코드만 오버라이드 가능합니다");
        }
        
        // 2. 코드 그룹 메타데이터 확인
        CodeGroupMetadata metadata = codeGroupMetadataRepository
            .findByCodeGroup(systemCode.getCodeGroup())
            .orElseThrow();
        
        if (!metadata.getAllowsTenantOverride()) {
            throw new BusinessException("이 코드 그룹은 오버라이드를 허용하지 않습니다");
        }
        
        // 3. 이미 오버라이드된 코드가 있는지 확인
        Optional<CommonCode> existing = commonCodeRepository
            .findByTenantIdAndInheritedFromId(tenantId, systemCodeId);
        
        if (existing.isPresent()) {
            throw new BusinessException("이미 오버라이드된 코드입니다");
        }
        
        // 4. 오버라이드 코드 생성
        ObjectMapper mapper = new ObjectMapper();
        try {
            JsonNode systemLabels = mapper.readTree(systemCode.getCodeLabels());
            ObjectNode newLabels = systemLabels.deepCopy();
            
            // 오버라이드 레이블 적용
            overrideLabels.forEach(newLabels::put);
            
            CommonCode overrideCode = CommonCode.builder()
                .tenantId(tenantId)
                .codeGroup(systemCode.getCodeGroup())
                .codeValue(systemCode.getCodeValue())
                .codeLabels(newLabels.toString())
                .codeDescriptions(systemCode.getCodeDescriptions())
                .parentCodeId(systemCode.getParentCodeId())
                .depth(systemCode.getDepth())
                .path(systemCode.getPath())
                .sortOrder(systemCode.getSortOrder())
                .isActive(true)
                .extraData(systemCode.getExtraData())
                .inheritedFromId(systemCodeId)
                .isSystemOverride(true)
                .version(1)
                .build();
            
            return commonCodeRepository.save(overrideCode);
            
        } catch (Exception e) {
            throw new BusinessException("오버라이드 생성 실패", e);
        }
    }
    
    /**
     * 테넌트 코드 조회 (상속 고려)
     */
    public List<CommonCode> getCodesWithInheritance(String tenantId, String codeGroup) {
        // 1. 테넌트 코드 조회
        List<CommonCode> tenantCodes = commonCodeRepository
            .findByTenantIdAndCodeGroupAndIsActiveTrue(tenantId, codeGroup);
        
        // 2. 시스템 코드 조회
        List<CommonCode> systemCodes = commonCodeRepository
            .findByTenantIdIsNullAndCodeGroupAndIsActiveTrue(codeGroup);
        
        // 3. 오버라이드된 시스템 코드 제외
        Set<Long> overriddenSystemCodeIds = tenantCodes.stream()
            .filter(code -> code.getInheritedFromId() != null)
            .map(CommonCode::getInheritedFromId)
            .collect(Collectors.toSet());
        
        List<CommonCode> filteredSystemCodes = systemCodes.stream()
            .filter(code -> !overriddenSystemCodeIds.contains(code.getId()))
            .collect(Collectors.toList());
        
        // 4. 병합
        List<CommonCode> result = new ArrayList<>();
        result.addAll(tenantCodes);
        result.addAll(filteredSystemCodes);
        
        return result.stream()
            .sorted(Comparator.comparing(CommonCode::getSortOrder))
            .collect(Collectors.toList());
    }
}
```

### 5. 유효기간 관리

```java
@Service
public class CodeValidityService {
    
    /**
     * 유효한 코드만 조회
     */
    public List<CommonCode> getValidCodes(String codeGroup, LocalDate asOfDate) {
        if (asOfDate == null) {
            asOfDate = LocalDate.now();
        }
        
        return commonCodeRepository.findValidCodes(codeGroup, asOfDate);
    }
    
    /**
     * 만료 예정 코드 조회
     */
    public List<CommonCode> getExpiringCodes(int daysAhead) {
        LocalDate today = LocalDate.now();
        LocalDate futureDate = today.plusDays(daysAhead);
        
        return commonCodeRepository
            .findByValidToBetweenAndIsActiveTrue(today, futureDate);
    }
    
    /**
     * 자동 만료 처리 (배치)
     */
    @Scheduled(cron = "0 0 1 * * *")  // 매일 새벽 1시
    @Transactional
    public void autoExpireCodes() {
        LocalDate today = LocalDate.now();
        
        List<CommonCode> expiredCodes = commonCodeRepository
            .findByValidToBeforeAndIsActiveTrue(today);
        
        for (CommonCode code : expiredCodes) {
            code.setIsActive(false);
            code.setVersion(code.getVersion() + 1);
            commonCodeRepository.save(code);
            
            saveHistory(code, "AUTO_EXPIRE", "유효기간 만료");
            
            log.info("코드 자동 만료: codeGroup={}, codeValue={}", 
                code.getCodeGroup(), code.getCodeValue());
        }
    }
}
```

---

## 📋 마이그레이션 전략

### Phase 1: 테이블 확장 (1일)
```sql
-- 1. 기존 테이블 백업
CREATE TABLE common_codes_backup AS SELECT * FROM common_codes;

-- 2. 새 컬럼 추가
ALTER TABLE common_codes
ADD COLUMN code_labels JSON AFTER code_value,
ADD COLUMN code_descriptions JSON AFTER code_labels,
ADD COLUMN parent_code_id BIGINT AFTER code_descriptions,
ADD COLUMN depth INT DEFAULT 0 AFTER parent_code_id,
ADD COLUMN path VARCHAR(500) AFTER depth,
ADD COLUMN valid_from DATE AFTER is_active,
ADD COLUMN valid_to DATE AFTER valid_from,
ADD COLUMN inherited_from_id BIGINT AFTER extra_data,
ADD COLUMN is_system_override BOOLEAN DEFAULT false AFTER inherited_from_id,
ADD COLUMN version INT DEFAULT 1 AFTER is_system_override;

-- 3. 기존 데이터 마이그레이션
UPDATE common_codes
SET code_labels = JSON_OBJECT('ko', korean_name)
WHERE code_labels IS NULL;

-- 4. 인덱스 추가
CREATE INDEX idx_parent ON common_codes(parent_code_id);
CREATE INDEX idx_valid_period ON common_codes(valid_from, valid_to);
CREATE INDEX idx_inherited ON common_codes(inherited_from_id);

-- 5. 외래키 추가
ALTER TABLE common_codes
ADD CONSTRAINT fk_parent_code 
    FOREIGN KEY (parent_code_id) REFERENCES common_codes(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_inherited_code 
    FOREIGN KEY (inherited_from_id) REFERENCES common_codes(id) ON DELETE SET NULL;
```

### Phase 2: 새 테이블 생성 (1일)
```sql
-- 이력 테이블
CREATE TABLE common_code_history (...);

-- 관계 테이블
CREATE TABLE code_relationships (...);
```

### Phase 3: 코드 배포 (2일)
- Service 구현
- Controller 구현
- 테스트

### Phase 4: 데이터 검증 (1일)
- 마이그레이션 검증
- 롤백 테스트

---

## ✅ 체크리스트

### 확장성 고려사항
- [x] 계층 구조 지원
- [x] 다국어 지원
- [x] 버전 관리
- [x] 이력 추적
- [x] 유효기간 관리
- [x] 테넌트 상속
- [x] 코드 간 관계
- [ ] 캐싱 전략
- [ ] 성능 최적화
- [ ] 검색 기능

### 미래 요구사항
- [ ] GraphQL API 지원
- [ ] 실시간 동기화
- [ ] 코드 승인 워크플로우
- [ ] 코드 충돌 감지
- [ ] AI 기반 코드 추천

---

**작성 완료**: 2025-12-03  
**핵심**: 단순 key-value → 엔터프라이즈급 코드 관리 시스템!

