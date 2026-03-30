# 상담 패키지 시스템 설계

**작성일**: 2025-12-03  
**목적**: 입점사별 상담 패키지 자유 관리 (금액, 시간, 옵션 포함)

---

## 🎯 핵심 요구사항

### 문제 정의
```
❌ 잘못된 가정:
- 모든 상담소가 동일한 패키지 사용
- 금액이 표준화되어 있음

✅ 실제 요구사항:
- 입점사(테넌트)마다 패키지 완전히 다름
- 금액, 시간, 옵션 모두 다름
- 자유롭게 추가/수정/삭제 가능
```

---

## 📊 데이터 구조

### 1. common_codes 테이블 활용

```sql
CREATE TABLE common_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 테넌트 구분
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    
    -- 코드 정보
    code_group VARCHAR(50) NOT NULL COMMENT 'CONSULTATION_PACKAGE',
    code_value VARCHAR(50) NOT NULL COMMENT '패키지 코드',
    korean_name VARCHAR(100) NOT NULL COMMENT '패키지명',
    code_description TEXT COMMENT '패키지 설명',
    
    -- ⭐ 확장 데이터 (JSON)
    extra_data JSON COMMENT '금액, 시간, 옵션 등',
    
    -- 메타데이터
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- 감사
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_tenant_code (tenant_id, code_group, code_value)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. extra_data JSON 구조

```json
{
  "price": 80000,              // 기본 금액
  "duration": 50,              // 상담 시간 (분)
  "unit": "회",                // 단위
  "sessions": 1,               // 회차 수
  "discountRate": 0,           // 할인율 (%)
  "finalPrice": 80000,         // 최종 금액
  "features": [                // 포함 내용
    "심리검사 1회",
    "상담 보고서 제공"
  ],
  "targetAge": "성인",         // 대상 연령
  "consultantLevel": "전문",   // 상담사 레벨
  "isPopular": true,           // 인기 패키지 여부
  "color": "#3b82f6",          // 표시 색상
  "icon": "user"               // 아이콘
}
```

---

## 💡 실제 사용 예시

### A 상담소 (일반 심리상담)
```sql
-- 테넌트 ID: tenant-a-uuid

-- 1. 개인상담 (기본)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, extra_data, sort_order)
VALUES (
  'tenant-a-uuid',
  'CONSULTATION_PACKAGE',
  'INDIVIDUAL_BASIC',
  '개인상담 (기본)',
  JSON_OBJECT(
    'price', 80000,
    'duration', 50,
    'unit', '회',
    'sessions', 1,
    'features', JSON_ARRAY('심리상담 50분'),
    'targetAge', '성인',
    'consultantLevel', '일반',
    'isPopular', false
  ),
  1
);

-- 2. 개인상담 (전문)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, extra_data, sort_order)
VALUES (
  'tenant-a-uuid',
  'CONSULTATION_PACKAGE',
  'INDIVIDUAL_PRO',
  '개인상담 (전문)',
  JSON_OBJECT(
    'price', 120000,
    'duration', 50,
    'unit', '회',
    'sessions', 1,
    'features', JSON_ARRAY('심리상담 50분', '전문상담사 배정'),
    'targetAge', '성인',
    'consultantLevel', '전문',
    'isPopular', true
  ),
  2
);

-- 3. 가족상담
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, extra_data, sort_order)
VALUES (
  'tenant-a-uuid',
  'CONSULTATION_PACKAGE',
  'FAMILY',
  '가족상담',
  JSON_OBJECT(
    'price', 150000,
    'duration', 60,
    'unit', '회',
    'sessions', 1,
    'features', JSON_ARRAY('가족상담 60분', '가족 구성원 전체 참여'),
    'targetAge', '전체',
    'consultantLevel', '전문',
    'isPopular', false
  ),
  3
);

-- 4. 장기 패키지 (10회)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, extra_data, sort_order)
VALUES (
  'tenant-a-uuid',
  'CONSULTATION_PACKAGE',
  'LONG_TERM_10',
  '장기 패키지 (10회)',
  JSON_OBJECT(
    'price', 1000000,
    'duration', 50,
    'unit', '패키지',
    'sessions', 10,
    'discountRate', 20,
    'finalPrice', 800000,
    'features', JSON_ARRAY('개인상담 10회', '심리검사 1회 무료', '20% 할인'),
    'targetAge', '성인',
    'consultantLevel', '전문',
    'isPopular', true
  ),
  4
);
```

### B 상담소 (청소년 전문)
```sql
-- 테넌트 ID: tenant-b-uuid

-- 1. 청소년 단기상담
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, extra_data, sort_order)
VALUES (
  'tenant-b-uuid',
  'CONSULTATION_PACKAGE',
  'YOUTH_SHORT',
  '청소년 단기상담',
  JSON_OBJECT(
    'price', 60000,
    'duration', 40,
    'unit', '회',
    'sessions', 1,
    'features', JSON_ARRAY('청소년 상담 40분', '학부모 상담 10분'),
    'targetAge', '청소년',
    'consultantLevel', '일반',
    'isPopular', true
  ),
  1
);

-- 2. 진로상담
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, extra_data, sort_order)
VALUES (
  'tenant-b-uuid',
  'CONSULTATION_PACKAGE',
  'CAREER',
  '진로상담',
  JSON_OBJECT(
    'price', 100000,
    'duration', 60,
    'unit', '회',
    'sessions', 1,
    'features', JSON_ARRAY('진로적성검사', '진로상담 60분', '진로 보고서'),
    'targetAge', '청소년',
    'consultantLevel', '전문',
    'isPopular', true
  ),
  2
);

-- 3. 학습상담 패키지 (5회)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, extra_data, sort_order)
VALUES (
  'tenant-b-uuid',
  'CONSULTATION_PACKAGE',
  'STUDY_5',
  '학습상담 패키지 (5회)',
  JSON_OBJECT(
    'price', 350000,
    'duration', 50,
    'unit', '패키지',
    'sessions', 5,
    'discountRate', 10,
    'finalPrice', 315000,
    'features', JSON_ARRAY('학습상담 5회', '학습 계획표 작성', '10% 할인'),
    'targetAge', '청소년',
    'consultantLevel', '전문',
    'isPopular', false
  ),
  3
);
```

### C 상담소 (부부/가족 전문)
```sql
-- 테넌트 ID: tenant-c-uuid

-- 1. 부부상담
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, extra_data, sort_order)
VALUES (
  'tenant-c-uuid',
  'CONSULTATION_PACKAGE',
  'COUPLE',
  '부부상담',
  JSON_OBJECT(
    'price', 180000,
    'duration', 80,
    'unit', '회',
    'sessions', 1,
    'features', JSON_ARRAY('부부상담 80분', '부부 심리검사'),
    'targetAge', '성인',
    'consultantLevel', '전문',
    'isPopular', true
  ),
  1
);

-- 2. 부부상담 집중 패키지 (8회)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, extra_data, sort_order)
VALUES (
  'tenant-c-uuid',
  'CONSULTATION_PACKAGE',
  'COUPLE_INTENSIVE_8',
  '부부상담 집중 패키지 (8회)',
  JSON_OBJECT(
    'price', 1800000,
    'duration', 80,
    'unit', '패키지',
    'sessions', 8,
    'discountRate', 25,
    'finalPrice', 1350000,
    'features', JSON_ARRAY('부부상담 8회', '부부 심리검사', '사후 관리 2회', '25% 할인'),
    'targetAge', '성인',
    'consultantLevel', '전문',
    'isPopular', true
  ),
  2
);

-- 3. 가족치료
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, extra_data, sort_order)
VALUES (
  'tenant-c-uuid',
  'CONSULTATION_PACKAGE',
  'FAMILY_THERAPY',
  '가족치료',
  JSON_OBJECT(
    'price', 200000,
    'duration', 90,
    'unit', '회',
    'sessions', 1,
    'features', JSON_ARRAY('가족치료 90분', '가족 구성원 전체 참여', '치료 계획서'),
    'targetAge', '전체',
    'consultantLevel', '전문',
    'isPopular', false
  ),
  3
);
```

---

## 💻 백엔드 구현

### 1. PackageService.java

```java
@Service
@RequiredArgsConstructor
public class PackageService {
    
    private final CommonCodeRepository commonCodeRepository;
    
    /**
     * 테넌트의 상담 패키지 목록 조회
     */
    public List<PackageDTO> getTenantPackages(String tenantId) {
        List<CommonCode> codes = commonCodeRepository
            .findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrder(
                tenantId, 
                "CONSULTATION_PACKAGE"
            );
        
        return codes.stream()
            .map(this::toPackageDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * CommonCode → PackageDTO 변환
     */
    private PackageDTO toPackageDTO(CommonCode code) {
        ObjectMapper mapper = new ObjectMapper();
        
        try {
            JsonNode extraData = mapper.readTree(code.getExtraData());
            
            return PackageDTO.builder()
                .id(code.getId())
                .packageCode(code.getCodeValue())
                .packageName(code.getKoreanName())
                .description(code.getCodeDescription())
                .price(extraData.get("price").asLong())
                .duration(extraData.get("duration").asInt())
                .unit(extraData.get("unit").asText())
                .sessions(extraData.has("sessions") ? extraData.get("sessions").asInt() : 1)
                .discountRate(extraData.has("discountRate") ? extraData.get("discountRate").asInt() : 0)
                .finalPrice(extraData.has("finalPrice") ? extraData.get("finalPrice").asLong() : extraData.get("price").asLong())
                .features(parseFeatures(extraData))
                .targetAge(extraData.has("targetAge") ? extraData.get("targetAge").asText() : null)
                .consultantLevel(extraData.has("consultantLevel") ? extraData.get("consultantLevel").asText() : null)
                .isPopular(extraData.has("isPopular") ? extraData.get("isPopular").asBoolean() : false)
                .sortOrder(code.getSortOrder())
                .build();
                
        } catch (Exception e) {
            log.error("패키지 데이터 파싱 실패", e);
            throw new BusinessException("패키지 데이터 파싱 실패");
        }
    }
    
    /**
     * 패키지 생성
     */
    @Transactional
    public PackageDTO createPackage(String tenantId, PackageCreateRequest request) {
        // 1. 중복 확인
        boolean exists = commonCodeRepository.existsByTenantIdAndCodeGroupAndCodeValue(
            tenantId, 
            "CONSULTATION_PACKAGE", 
            request.getPackageCode()
        );
        
        if (exists) {
            throw new BusinessException("이미 존재하는 패키지 코드입니다");
        }
        
        // 2. extra_data JSON 생성
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode extraData = mapper.createObjectNode();
        extraData.put("price", request.getPrice());
        extraData.put("duration", request.getDuration());
        extraData.put("unit", request.getUnit());
        extraData.put("sessions", request.getSessions());
        extraData.put("discountRate", request.getDiscountRate());
        extraData.put("finalPrice", calculateFinalPrice(request));
        extraData.set("features", mapper.valueToTree(request.getFeatures()));
        extraData.put("targetAge", request.getTargetAge());
        extraData.put("consultantLevel", request.getConsultantLevel());
        extraData.put("isPopular", request.getIsPopular());
        
        // 3. CommonCode 생성
        CommonCode code = CommonCode.builder()
            .tenantId(tenantId)
            .codeGroup("CONSULTATION_PACKAGE")
            .codeValue(request.getPackageCode())
            .koreanName(request.getPackageName())
            .codeDescription(request.getDescription())
            .extraData(extraData.toString())
            .sortOrder(request.getSortOrder())
            .isActive(true)
            .build();
        
        CommonCode saved = commonCodeRepository.save(code);
        
        return toPackageDTO(saved);
    }
    
    /**
     * 패키지 수정
     */
    @Transactional
    public PackageDTO updatePackage(String tenantId, Long packageId, PackageUpdateRequest request) {
        CommonCode code = commonCodeRepository.findById(packageId)
            .orElseThrow(() -> new NotFoundException("패키지를 찾을 수 없습니다"));
        
        // 권한 확인
        if (!code.getTenantId().equals(tenantId)) {
            throw new ForbiddenException("다른 테넌트의 패키지는 수정할 수 없습니다");
        }
        
        // extra_data 업데이트
        ObjectMapper mapper = new ObjectMapper();
        try {
            ObjectNode extraData = (ObjectNode) mapper.readTree(code.getExtraData());
            
            if (request.getPrice() != null) {
                extraData.put("price", request.getPrice());
            }
            if (request.getDuration() != null) {
                extraData.put("duration", request.getDuration());
            }
            if (request.getFeatures() != null) {
                extraData.set("features", mapper.valueToTree(request.getFeatures()));
            }
            // ... 기타 필드 업데이트
            
            code.setExtraData(extraData.toString());
            
        } catch (Exception e) {
            throw new BusinessException("패키지 데이터 업데이트 실패", e);
        }
        
        // 기본 필드 업데이트
        if (request.getPackageName() != null) {
            code.setKoreanName(request.getPackageName());
        }
        if (request.getDescription() != null) {
            code.setCodeDescription(request.getDescription());
        }
        
        CommonCode updated = commonCodeRepository.save(code);
        
        return toPackageDTO(updated);
    }
    
    /**
     * 패키지 삭제
     */
    @Transactional
    public void deletePackage(String tenantId, Long packageId) {
        CommonCode code = commonCodeRepository.findById(packageId)
            .orElseThrow(() -> new NotFoundException("패키지를 찾을 수 없습니다"));
        
        // 권한 확인
        if (!code.getTenantId().equals(tenantId)) {
            throw new ForbiddenException("다른 테넌트의 패키지는 삭제할 수 없습니다");
        }
        
        // Soft Delete
        code.setIsActive(false);
        commonCodeRepository.save(code);
    }
    
    /**
     * 최종 금액 계산
     */
    private long calculateFinalPrice(PackageCreateRequest request) {
        long price = request.getPrice() * request.getSessions();
        if (request.getDiscountRate() > 0) {
            price = price * (100 - request.getDiscountRate()) / 100;
        }
        return price;
    }
}
```

### 2. PackageController.java

```java
@RestController
@RequestMapping("/api/v1/tenant/packages")
@RequiredArgsConstructor
public class PackageController {
    
    private final PackageService packageService;
    
    /**
     * 패키지 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<PackageDTO>> getPackages() {
        String tenantId = SecurityUtils.getCurrentTenantId();
        List<PackageDTO> packages = packageService.getTenantPackages(tenantId);
        return ResponseEntity.ok(packages);
    }
    
    /**
     * 패키지 생성
     */
    @PostMapping
    public ResponseEntity<PackageDTO> createPackage(@RequestBody @Valid PackageCreateRequest request) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        PackageDTO created = packageService.createPackage(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    /**
     * 패키지 수정
     */
    @PutMapping("/{packageId}")
    public ResponseEntity<PackageDTO> updatePackage(
            @PathVariable Long packageId,
            @RequestBody @Valid PackageUpdateRequest request) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        PackageDTO updated = packageService.updatePackage(tenantId, packageId, request);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * 패키지 삭제
     */
    @DeleteMapping("/{packageId}")
    public ResponseEntity<Void> deletePackage(@PathVariable Long packageId) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        packageService.deletePackage(tenantId, packageId);
        return ResponseEntity.noContent().build();
    }
}
```

---

## 🌐 프론트엔드 구현

### 1. PackageManagement.js

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PackageManagement = () => {
    const [packages, setPackages] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await axios.get('/api/v1/tenant/packages');
            setPackages(response.data);
        } catch (error) {
            console.error('패키지 조회 실패:', error);
        }
    };

    const handleCreate = async (data) => {
        try {
            await axios.post('/api/v1/tenant/packages', data);
            alert('패키지가 생성되었습니다');
            fetchPackages();
            setIsModalOpen(false);
        } catch (error) {
            alert('생성 실패: ' + error.response?.data?.message);
        }
    };

    const handleUpdate = async (packageId, data) => {
        try {
            await axios.put(`/api/v1/tenant/packages/${packageId}`, data);
            alert('패키지가 수정되었습니다');
            fetchPackages();
            setEditingPackage(null);
        } catch (error) {
            alert('수정 실패: ' + error.response?.data?.message);
        }
    };

    const handleDelete = async (packageId) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        
        try {
            await axios.delete(`/api/v1/tenant/packages/${packageId}`);
            alert('패키지가 삭제되었습니다');
            fetchPackages();
        } catch (error) {
            alert('삭제 실패: ' + error.response?.data?.message);
        }
    };

    return (
        <div className="package-management">
            <div className="header">
                <h2>상담 패키지 관리</h2>
                <button onClick={() => setIsModalOpen(true)}>
                    + 새 패키지 추가
                </button>
            </div>

            <div className="package-list">
                {packages.map(pkg => (
                    <div key={pkg.id} className="package-card">
                        <div className="package-header">
                            <h3>{pkg.packageName}</h3>
                            {pkg.isPopular && <span className="badge">인기</span>}
                        </div>
                        
                        <div className="package-info">
                            <p className="price">
                                {pkg.finalPrice.toLocaleString()}원
                                {pkg.discountRate > 0 && (
                                    <span className="discount">
                                        ({pkg.discountRate}% 할인)
                                    </span>
                                )}
                            </p>
                            <p className="duration">{pkg.duration}분 / {pkg.sessions}회</p>
                            <p className="description">{pkg.description}</p>
                            
                            <ul className="features">
                                {pkg.features.map((feature, idx) => (
                                    <li key={idx}>✓ {feature}</li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="package-actions">
                            <button onClick={() => setEditingPackage(pkg)}>
                                수정
                            </button>
                            <button onClick={() => handleDelete(pkg.id)}>
                                삭제
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 패키지 생성/수정 모달 */}
            {(isModalOpen || editingPackage) && (
                <PackageModal
                    package={editingPackage}
                    onSave={editingPackage ? handleUpdate : handleCreate}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingPackage(null);
                    }}
                />
            )}
        </div>
    );
};

export default PackageManagement;
```

---

## ✅ 핵심 정리

### 상담 패키지 = 테넌트 공통코드
```
저장: common_codes 테이블
구분: tenant_id로 테넌트별 격리
관리: 테넌트 관리자만 추가/수정/삭제
사용: 해당 테넌트의 모든 역할 공통 사용

특징:
- 금액, 시간, 옵션 모두 extra_data JSON에 저장
- 입점사마다 완전히 다른 패키지 구성
- 자유롭게 커스터마이징 가능
```

### A 상담소 vs B 상담소
```
A 상담소:
- 개인상담: 80,000원 / 50분
- 가족상담: 150,000원 / 60분
- 장기 패키지: 800,000원 / 10회

B 상담소:
- 청소년 상담: 60,000원 / 40분
- 진로상담: 100,000원 / 60분
- 학습상담 패키지: 315,000원 / 5회

→ 완전히 다른 패키지!
```

---

**작성 완료**: 2025-12-03  
**핵심**: 상담 패키지는 금액 포함, 테넌트마다 완전히 다름!

