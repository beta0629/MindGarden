# 테넌트 공통코드 관리 UI 설계

**작성일**: 2025-12-03  
**목적**: 테넌트 관리자가 공통코드를 등록/수정/삭제할 수 있는 관리 화면

---

## 🎯 요구사항

### 기능
```
1. 공통코드 그룹별 목록 조회
2. 공통코드 등록
3. 공통코드 수정
4. 공통코드 삭제
5. 순서 변경 (드래그 앤 드롭)
6. 활성화/비활성화
```

### 권한
```
접근: 테넌트 관리자 (ADMIN)만
제한: 다른 테넌트의 코드는 조회/수정 불가
보안: tenant_id 자동 설정 (세션에서)
```

---

## 📊 화면 구조

### 1. 메인 화면 (공통코드 관리)

```
┌─────────────────────────────────────────────────────────┐
│  공통코드 관리                                    [+ 새 코드 추가] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [코드 그룹 선택 ▼]                                      │
│  ┌─────────────────────────────────────────────┐        │
│  │ ▶ 상담 관련                                  │        │
│  │   • 상담 패키지 (CONSULTATION_PACKAGE)       │        │
│  │   • 전문 분야 (SPECIALTY)                    │        │
│  │   • 상담 유형 (CONSULTATION_TYPE)            │        │
│  │   • 평가 유형 (ASSESSMENT_TYPE)              │        │
│  │                                              │        │
│  │ ▶ 재무 관련                                  │        │
│  │   • 결제 방법 (PAYMENT_METHOD)               │        │
│  │   • 재무 카테고리 (FINANCIAL_CATEGORY)       │        │
│  │   • 세금 카테고리 (TAX_CATEGORY)             │        │
│  │   • 예산 카테고리 (BUDGET_CATEGORY)          │        │
│  │                                              │        │
│  │ ▶ 구매 관련                                  │        │
│  │   • 품목 카테고리 (ITEM_CATEGORY)            │        │
│  │   • 공급업체 (SUPPLIER)                      │        │
│  │                                              │        │
│  │ ▶ 인사 관련                                  │        │
│  │   • 고용 형태 (EMPLOYMENT_TYPE)              │        │
│  │   • 직급 (POSITION)                          │        │
│  │                                              │        │
│  │ ▶ 마케팅 관련                                │        │
│  │   • 마케팅 채널 (MARKETING_CHANNEL)          │        │
│  └─────────────────────────────────────────────┘        │
│                                                         │
│  선택된 그룹: 상담 패키지 (CONSULTATION_PACKAGE)         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 코드값        │ 한글명      │ 금액    │ 시간 │ 상태 │ 액션 │
│  ├─────────────────────────────────────────────────┤   │
│  │ INDIVIDUAL   │ 개인상담    │ 80,000원│ 50분 │ 활성 │ [수정][삭제] │
│  │ FAMILY       │ 가족상담    │ 150,000원│ 60분│ 활성 │ [수정][삭제] │
│  │ GROUP        │ 집단상담    │ 50,000원│ 90분 │ 활성 │ [수정][삭제] │
│  │ LONG_TERM_10 │ 장기(10회)  │ 800,000원│ 50분 │ 활성 │ [수정][삭제] │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 백엔드 구현

### 1. TenantCommonCodeController.java

```java
@RestController
@RequestMapping("/api/v1/tenant/common-codes")
@RequiredArgsConstructor
public class TenantCommonCodeController {
    
    private final TenantCommonCodeService tenantCommonCodeService;
    
    /**
     * 테넌트 공통코드 그룹 목록 조회
     */
    @GetMapping("/groups")
    public ResponseEntity<List<CodeGroupDTO>> getCodeGroups() {
        String tenantId = SecurityUtils.getCurrentTenantId();
        List<CodeGroupDTO> groups = tenantCommonCodeService.getTenantCodeGroups(tenantId);
        return ResponseEntity.ok(groups);
    }
    
    /**
     * 특정 그룹의 공통코드 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<CommonCodeDTO>> getCommonCodes(
            @RequestParam String codeGroup) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        List<CommonCodeDTO> codes = tenantCommonCodeService
            .getCommonCodesByGroup(tenantId, codeGroup);
        return ResponseEntity.ok(codes);
    }
    
    /**
     * 공통코드 생성
     */
    @PostMapping
    public ResponseEntity<CommonCodeDTO> createCommonCode(
            @RequestBody @Valid CommonCodeCreateRequest request) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        String createdBy = SecurityUtils.getCurrentUsername();
        
        CommonCodeDTO created = tenantCommonCodeService
            .createCommonCode(tenantId, request, createdBy);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    /**
     * 공통코드 수정
     */
    @PutMapping("/{codeId}")
    public ResponseEntity<CommonCodeDTO> updateCommonCode(
            @PathVariable Long codeId,
            @RequestBody @Valid CommonCodeUpdateRequest request) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        String updatedBy = SecurityUtils.getCurrentUsername();
        
        CommonCodeDTO updated = tenantCommonCodeService
            .updateCommonCode(tenantId, codeId, request, updatedBy);
        
        return ResponseEntity.ok(updated);
    }
    
    /**
     * 공통코드 삭제
     */
    @DeleteMapping("/{codeId}")
    public ResponseEntity<Void> deleteCommonCode(@PathVariable Long codeId) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        String deletedBy = SecurityUtils.getCurrentUsername();
        
        tenantCommonCodeService.deleteCommonCode(tenantId, codeId, deletedBy);
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 순서 변경
     */
    @PutMapping("/reorder")
    public ResponseEntity<Void> reorderCommonCodes(
            @RequestBody @Valid ReorderRequest request) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        
        tenantCommonCodeService.reorderCommonCodes(tenantId, request);
        
        return ResponseEntity.ok().build();
    }
    
    /**
     * 활성화/비활성화
     */
    @PutMapping("/{codeId}/toggle-active")
    public ResponseEntity<Void> toggleActive(@PathVariable Long codeId) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        
        tenantCommonCodeService.toggleActive(tenantId, codeId);
        
        return ResponseEntity.ok().build();
    }
}
```

### 2. TenantCommonCodeService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class TenantCommonCodeService {
    
    private final CommonCodeRepository commonCodeRepository;
    private final CodeGroupMetadataRepository codeGroupMetadataRepository;
    
    /**
     * 테넌트 공통코드 그룹 목록 조회
     */
    public List<CodeGroupDTO> getTenantCodeGroups(String tenantId) {
        // code_group_metadata에서 TENANT 타입만 조회
        List<CodeGroupMetadata> metadata = codeGroupMetadataRepository
            .findByCodeTypeAndIsActiveTrue("TENANT");
        
        return metadata.stream()
            .map(meta -> {
                // 각 그룹의 코드 개수 조회
                long count = commonCodeRepository.countByTenantIdAndCodeGroupAndIsActiveTrue(
                    tenantId, meta.getCodeGroup()
                );
                
                return CodeGroupDTO.builder()
                    .codeGroup(meta.getCodeGroup())
                    .groupName(meta.getGroupName())
                    .category(meta.getCategory())
                    .icon(meta.getIcon())
                    .codeCount(count)
                    .build();
            })
            .collect(Collectors.toList());
    }
    
    /**
     * 특정 그룹의 공통코드 목록 조회
     */
    public List<CommonCodeDTO> getCommonCodesByGroup(String tenantId, String codeGroup) {
        List<CommonCode> codes = commonCodeRepository
            .findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrder(
                tenantId, codeGroup
            );
        
        return codes.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * 공통코드 생성
     */
    @Transactional
    public CommonCodeDTO createCommonCode(String tenantId, 
                                          CommonCodeCreateRequest request, 
                                          String createdBy) {
        // 1. 중복 확인
        boolean exists = commonCodeRepository.existsByTenantIdAndCodeGroupAndCodeValue(
            tenantId, request.getCodeGroup(), request.getCodeValue()
        );
        
        if (exists) {
            throw new BusinessException("이미 존재하는 코드입니다");
        }
        
        // 2. 코드 그룹 검증 (TENANT 타입만 허용)
        CodeGroupMetadata metadata = codeGroupMetadataRepository
            .findByCodeGroup(request.getCodeGroup())
            .orElseThrow(() -> new NotFoundException("코드 그룹을 찾을 수 없습니다"));
        
        if (!"TENANT".equals(metadata.getCodeType())) {
            throw new BusinessException("시스템 공통코드는 생성할 수 없습니다");
        }
        
        // 3. extra_data JSON 생성
        String extraData = null;
        if (request.getExtraData() != null && !request.getExtraData().isEmpty()) {
            ObjectMapper mapper = new ObjectMapper();
            try {
                extraData = mapper.writeValueAsString(request.getExtraData());
            } catch (Exception e) {
                throw new BusinessException("추가 데이터 변환 실패", e);
            }
        }
        
        // 4. 순서 자동 설정 (마지막 + 1)
        Integer maxSortOrder = commonCodeRepository
            .findMaxSortOrderByTenantIdAndCodeGroup(tenantId, request.getCodeGroup())
            .orElse(0);
        
        // 5. CommonCode 생성
        CommonCode code = CommonCode.builder()
            .tenantId(tenantId)
            .codeGroup(request.getCodeGroup())
            .codeValue(request.getCodeValue())
            .koreanName(request.getKoreanName())
            .codeDescription(request.getCodeDescription())
            .extraData(extraData)
            .sortOrder(maxSortOrder + 1)
            .isActive(true)
            .createdBy(createdBy)
            .build();
        
        CommonCode saved = commonCodeRepository.save(code);
        
        log.info("테넌트 공통코드 생성: tenantId={}, codeGroup={}, codeValue={}", 
            tenantId, request.getCodeGroup(), request.getCodeValue());
        
        return toDTO(saved);
    }
    
    /**
     * 공통코드 수정
     */
    @Transactional
    public CommonCodeDTO updateCommonCode(String tenantId, 
                                          Long codeId, 
                                          CommonCodeUpdateRequest request, 
                                          String updatedBy) {
        // 1. 코드 조회
        CommonCode code = commonCodeRepository.findById(codeId)
            .orElseThrow(() -> new NotFoundException("공통코드를 찾을 수 없습니다"));
        
        // 2. 권한 확인
        if (!code.getTenantId().equals(tenantId)) {
            throw new ForbiddenException("다른 테넌트의 코드는 수정할 수 없습니다");
        }
        
        // 3. 시스템 코드 확인
        if (code.getTenantId() == null) {
            throw new BusinessException("시스템 공통코드는 수정할 수 없습니다");
        }
        
        // 4. 필드 업데이트
        if (request.getKoreanName() != null) {
            code.setKoreanName(request.getKoreanName());
        }
        if (request.getCodeDescription() != null) {
            code.setCodeDescription(request.getCodeDescription());
        }
        if (request.getExtraData() != null) {
            ObjectMapper mapper = new ObjectMapper();
            try {
                code.setExtraData(mapper.writeValueAsString(request.getExtraData()));
            } catch (Exception e) {
                throw new BusinessException("추가 데이터 변환 실패", e);
            }
        }
        
        code.setUpdatedBy(updatedBy);
        
        CommonCode updated = commonCodeRepository.save(code);
        
        log.info("테넌트 공통코드 수정: tenantId={}, codeId={}", tenantId, codeId);
        
        return toDTO(updated);
    }
    
    /**
     * 공통코드 삭제 (Soft Delete)
     */
    @Transactional
    public void deleteCommonCode(String tenantId, Long codeId, String deletedBy) {
        // 1. 코드 조회
        CommonCode code = commonCodeRepository.findById(codeId)
            .orElseThrow(() -> new NotFoundException("공통코드를 찾을 수 없습니다"));
        
        // 2. 권한 확인
        if (!code.getTenantId().equals(tenantId)) {
            throw new ForbiddenException("다른 테넌트의 코드는 삭제할 수 없습니다");
        }
        
        // 3. 시스템 코드 확인
        if (code.getTenantId() == null) {
            throw new BusinessException("시스템 공통코드는 삭제할 수 없습니다");
        }
        
        // 4. Soft Delete
        code.setIsActive(false);
        code.setUpdatedBy(deletedBy);
        commonCodeRepository.save(code);
        
        log.info("테넌트 공통코드 삭제: tenantId={}, codeId={}", tenantId, codeId);
    }
    
    /**
     * 순서 변경
     */
    @Transactional
    public void reorderCommonCodes(String tenantId, ReorderRequest request) {
        for (ReorderItem item : request.getItems()) {
            CommonCode code = commonCodeRepository.findById(item.getCodeId())
                .orElseThrow(() -> new NotFoundException("공통코드를 찾을 수 없습니다"));
            
            // 권한 확인
            if (!code.getTenantId().equals(tenantId)) {
                throw new ForbiddenException("다른 테넌트의 코드는 수정할 수 없습니다");
            }
            
            code.setSortOrder(item.getSortOrder());
            commonCodeRepository.save(code);
        }
        
        log.info("테넌트 공통코드 순서 변경: tenantId={}, count={}", 
            tenantId, request.getItems().size());
    }
    
    /**
     * 활성화/비활성화
     */
    @Transactional
    public void toggleActive(String tenantId, Long codeId) {
        CommonCode code = commonCodeRepository.findById(codeId)
            .orElseThrow(() -> new NotFoundException("공통코드를 찾을 수 없습니다"));
        
        // 권한 확인
        if (!code.getTenantId().equals(tenantId)) {
            throw new ForbiddenException("다른 테넌트의 코드는 수정할 수 없습니다");
        }
        
        code.setIsActive(!code.getIsActive());
        commonCodeRepository.save(code);
        
        log.info("테넌트 공통코드 활성화 토글: tenantId={}, codeId={}, isActive={}", 
            tenantId, codeId, code.getIsActive());
    }
    
    /**
     * CommonCode → DTO 변환
     */
    private CommonCodeDTO toDTO(CommonCode code) {
        Map<String, Object> extraData = null;
        if (code.getExtraData() != null) {
            ObjectMapper mapper = new ObjectMapper();
            try {
                extraData = mapper.readValue(code.getExtraData(), 
                    new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.error("extra_data 파싱 실패", e);
            }
        }
        
        return CommonCodeDTO.builder()
            .id(code.getId())
            .codeGroup(code.getCodeGroup())
            .codeValue(code.getCodeValue())
            .koreanName(code.getKoreanName())
            .codeDescription(code.getCodeDescription())
            .extraData(extraData)
            .sortOrder(code.getSortOrder())
            .isActive(code.getIsActive())
            .createdBy(code.getCreatedBy())
            .createdAt(code.getCreatedAt())
            .updatedBy(code.getUpdatedBy())
            .updatedAt(code.getUpdatedAt())
            .build();
    }
}
```

---

## 🌐 프론트엔드 구현

### 1. TenantCommonCodeManagement.js

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TenantCommonCodeManagement.css';

const TenantCommonCodeManagement = () => {
    const [codeGroups, setCodeGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [codes, setCodes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCode, setEditingCode] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCodeGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            fetchCodes(selectedGroup.codeGroup);
        }
    }, [selectedGroup]);

    const fetchCodeGroups = async () => {
        try {
            const response = await axios.get('/api/v1/tenant/common-codes/groups');
            setCodeGroups(response.data);
            
            // 카테고리별로 그룹화
            const grouped = response.data.reduce((acc, group) => {
                if (!acc[group.category]) {
                    acc[group.category] = [];
                }
                acc[group.category].push(group);
                return acc;
            }, {});
            
            setCodeGroups(grouped);
            setLoading(false);
        } catch (error) {
            console.error('코드 그룹 조회 실패:', error);
            setLoading(false);
        }
    };

    const fetchCodes = async (codeGroup) => {
        try {
            const response = await axios.get('/api/v1/tenant/common-codes', {
                params: { codeGroup }
            });
            setCodes(response.data);
        } catch (error) {
            console.error('공통코드 조회 실패:', error);
        }
    };

    const handleCreate = async (data) => {
        try {
            await axios.post('/api/v1/tenant/common-codes', {
                ...data,
                codeGroup: selectedGroup.codeGroup
            });
            alert('공통코드가 생성되었습니다');
            fetchCodes(selectedGroup.codeGroup);
            setIsModalOpen(false);
        } catch (error) {
            alert('생성 실패: ' + error.response?.data?.message);
        }
    };

    const handleUpdate = async (codeId, data) => {
        try {
            await axios.put(`/api/v1/tenant/common-codes/${codeId}`, data);
            alert('공통코드가 수정되었습니다');
            fetchCodes(selectedGroup.codeGroup);
            setEditingCode(null);
        } catch (error) {
            alert('수정 실패: ' + error.response?.data?.message);
        }
    };

    const handleDelete = async (codeId) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        
        try {
            await axios.delete(`/api/v1/tenant/common-codes/${codeId}`);
            alert('공통코드가 삭제되었습니다');
            fetchCodes(selectedGroup.codeGroup);
        } catch (error) {
            alert('삭제 실패: ' + error.response?.data?.message);
        }
    };

    const handleToggleActive = async (codeId) => {
        try {
            await axios.put(`/api/v1/tenant/common-codes/${codeId}/toggle-active`);
            fetchCodes(selectedGroup.codeGroup);
        } catch (error) {
            alert('상태 변경 실패: ' + error.response?.data?.message);
        }
    };

    if (loading) return <div>로딩 중...</div>;

    return (
        <div className="tenant-common-code-management">
            <div className="header">
                <h2>공통코드 관리</h2>
                {selectedGroup && (
                    <button onClick={() => setIsModalOpen(true)}>
                        + 새 코드 추가
                    </button>
                )}
            </div>

            <div className="content">
                {/* 좌측: 코드 그룹 목록 */}
                <div className="sidebar">
                    <h3>코드 그룹</h3>
                    
                    {Object.entries(codeGroups).map(([category, groups]) => (
                        <div key={category} className="category-section">
                            <h4>
                                <i className="bi-chevron-down"></i>
                                {getCategoryName(category)}
                            </h4>
                            <ul>
                                {groups.map(group => (
                                    <li 
                                        key={group.codeGroup}
                                        className={selectedGroup?.codeGroup === group.codeGroup ? 'active' : ''}
                                        onClick={() => setSelectedGroup(group)}
                                    >
                                        <i className={`bi ${group.icon}`}></i>
                                        <span>{group.groupName}</span>
                                        <span className="count">({group.codeCount})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* 우측: 공통코드 목록 */}
                <div className="main-content">
                    {selectedGroup ? (
                        <>
                            <div className="group-header">
                                <h3>{selectedGroup.groupName}</h3>
                                <span className="code-group">({selectedGroup.codeGroup})</span>
                            </div>

                            <table className="code-table">
                                <thead>
                                    <tr>
                                        <th>코드값</th>
                                        <th>한글명</th>
                                        {hasExtraData(selectedGroup.codeGroup) && (
                                            <>
                                                <th>금액</th>
                                                <th>시간</th>
                                            </>
                                        )}
                                        <th>설명</th>
                                        <th>순서</th>
                                        <th>상태</th>
                                        <th>액션</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {codes.map(code => (
                                        <tr key={code.id}>
                                            <td><code>{code.codeValue}</code></td>
                                            <td>{code.koreanName}</td>
                                            {hasExtraData(selectedGroup.codeGroup) && (
                                                <>
                                                    <td>{code.extraData?.price?.toLocaleString()}원</td>
                                                    <td>{code.extraData?.duration}분</td>
                                                </>
                                            )}
                                            <td>{code.codeDescription}</td>
                                            <td>{code.sortOrder}</td>
                                            <td>
                                                <span className={`badge ${code.isActive ? 'active' : 'inactive'}`}>
                                                    {code.isActive ? '활성' : '비활성'}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="btn-sm"
                                                    onClick={() => setEditingCode(code)}
                                                >
                                                    수정
                                                </button>
                                                <button 
                                                    className="btn-sm"
                                                    onClick={() => handleToggleActive(code.id)}
                                                >
                                                    {code.isActive ? '비활성화' : '활성화'}
                                                </button>
                                                <button 
                                                    className="btn-sm btn-danger"
                                                    onClick={() => handleDelete(code.id)}
                                                >
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <div className="empty-state">
                            <i className="bi-inbox"></i>
                            <p>좌측에서 코드 그룹을 선택하세요</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 공통코드 생성/수정 모달 */}
            {(isModalOpen || editingCode) && (
                <CommonCodeModal
                    codeGroup={selectedGroup.codeGroup}
                    code={editingCode}
                    onSave={editingCode ? handleUpdate : handleCreate}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingCode(null);
                    }}
                />
            )}
        </div>
    );
};

// 카테고리명 한글 변환
const getCategoryName = (category) => {
    const names = {
        'CONSULTATION': '상담 관련',
        'FINANCE': '재무 관련',
        'PURCHASE': '구매 관련',
        'HR': '인사 관련',
        'MARKETING': '마케팅 관련'
    };
    return names[category] || category;
};

// 추가 데이터 필요 여부 확인
const hasExtraData = (codeGroup) => {
    return ['CONSULTATION_PACKAGE', 'ASSESSMENT_TYPE'].includes(codeGroup);
};

export default TenantCommonCodeManagement;
```

### 2. CommonCodeModal.js

```javascript
import React, { useState, useEffect } from 'react';

const CommonCodeModal = ({ codeGroup, code, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        codeValue: '',
        koreanName: '',
        codeDescription: '',
        extraData: {}
    });

    useEffect(() => {
        if (code) {
            setFormData({
                codeValue: code.codeValue,
                koreanName: code.koreanName,
                codeDescription: code.codeDescription || '',
                extraData: code.extraData || {}
            });
        }
    }, [code]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (code) {
            onSave(code.id, formData);
        } else {
            onSave(formData);
        }
    };

    const needsExtraData = ['CONSULTATION_PACKAGE', 'ASSESSMENT_TYPE'].includes(codeGroup);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{code ? '공통코드 수정' : '공통코드 추가'}</h3>
                    <button onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>코드값 *</label>
                        <input
                            type="text"
                            value={formData.codeValue}
                            onChange={e => setFormData({...formData, codeValue: e.target.value})}
                            disabled={!!code}
                            required
                        />
                        <small>영문 대문자와 언더스코어만 사용 (예: INDIVIDUAL)</small>
                    </div>

                    <div className="form-group">
                        <label>한글명 *</label>
                        <input
                            type="text"
                            value={formData.koreanName}
                            onChange={e => setFormData({...formData, koreanName: e.target.value})}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>설명</label>
                        <textarea
                            value={formData.codeDescription}
                            onChange={e => setFormData({...formData, codeDescription: e.target.value})}
                            rows={3}
                        />
                    </div>

                    {needsExtraData && (
                        <>
                            <div className="form-group">
                                <label>금액 (원) *</label>
                                <input
                                    type="number"
                                    value={formData.extraData.price || ''}
                                    onChange={e => setFormData({
                                        ...formData,
                                        extraData: {...formData.extraData, price: parseInt(e.target.value)}
                                    })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>시간 (분) *</label>
                                <input
                                    type="number"
                                    value={formData.extraData.duration || ''}
                                    onChange={e => setFormData({
                                        ...formData,
                                        extraData: {...formData.extraData, duration: parseInt(e.target.value)}
                                    })}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>취소</button>
                        <button type="submit" className="btn-primary">
                            {code ? '수정' : '생성'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommonCodeModal;
```

---

## 🎨 CSS 스타일

```css
.tenant-common-code-management {
    padding: 20px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.content {
    display: flex;
    gap: 20px;
    height: calc(100vh - 150px);
}

.sidebar {
    width: 300px;
    background: white;
    border-radius: 8px;
    padding: 20px;
    overflow-y: auto;
}

.category-section {
    margin-bottom: 20px;
}

.category-section h4 {
    font-size: 14px;
    color: #666;
    margin-bottom: 10px;
    cursor: pointer;
}

.category-section ul {
    list-style: none;
    padding: 0;
}

.category-section li {
    padding: 10px;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.category-section li:hover {
    background: #f5f5f5;
}

.category-section li.active {
    background: #e3f2fd;
    color: #1976d2;
}

.count {
    margin-left: auto;
    font-size: 12px;
    color: #999;
}

.main-content {
    flex: 1;
    background: white;
    border-radius: 8px;
    padding: 20px;
    overflow-y: auto;
}

.group-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
}

.code-group {
    font-size: 14px;
    color: #999;
}

.code-table {
    width: 100%;
    border-collapse: collapse;
}

.code-table th,
.code-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
}

.code-table th {
    background: #f5f5f5;
    font-weight: 600;
}

.badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.badge.active {
    background: #e8f5e9;
    color: #2e7d32;
}

.badge.inactive {
    background: #ffebee;
    color: #c62828;
}

.btn-sm {
    padding: 4px 8px;
    font-size: 12px;
    margin-right: 4px;
}

.btn-danger {
    background: #f44336;
    color: white;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #999;
}

.empty-state i {
    font-size: 48px;
    margin-bottom: 16px;
}
```

---

## ✅ 핵심 기능

### 1. 코드 그룹 관리
```
- 카테고리별 그룹화 (상담/재무/구매/인사/마케팅)
- 그룹별 코드 개수 표시
- 아이콘 표시
```

### 2. 공통코드 CRUD
```
- 생성: 코드값, 한글명, 설명, 추가 데이터
- 수정: 한글명, 설명, 추가 데이터 (코드값은 수정 불가)
- 삭제: Soft Delete (is_active = false)
- 활성화/비활성화 토글
```

### 3. 보안
```
- tenant_id 자동 설정 (세션에서)
- 다른 테넌트 코드 접근 차단
- 시스템 공통코드 수정/삭제 차단
```

---

**작성 완료**: 2025-12-03  
**핵심**: 테넌트 관리자가 공통코드를 자유롭게 관리!

