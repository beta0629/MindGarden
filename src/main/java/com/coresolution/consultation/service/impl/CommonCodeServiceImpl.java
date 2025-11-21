package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.coresolution.consultation.dto.CommonCodeDto;
import com.coresolution.consultation.dto.CommonCodeCreateRequest;
import com.coresolution.consultation.dto.CommonCodeUpdateRequest;
import com.coresolution.consultation.dto.CommonCodeResponse;
import com.coresolution.consultation.dto.CommonCodeListResponse;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.CodeGroupMetadata;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.CodeGroupMetadataRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.CommonCodePermissionService;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 공통코드 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CommonCodeServiceImpl implements CommonCodeService {

    private final CommonCodeRepository commonCodeRepository;
    private final CodeGroupMetadataRepository codeGroupMetadataRepository;
    private final CommonCodePermissionService permissionService;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getAllCommonCodes() {
        log.info("🔍 모든 공통코드 조회");
        return commonCodeRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getCommonCodesByGroup(String codeGroup) {
        log.info("🔍 코드 그룹별 공통코드 조회: {}", codeGroup);
        return commonCodeRepository.findByCodeGroupOrderBySortOrderAsc(codeGroup);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getActiveCommonCodesByGroup(String codeGroup) {
        log.info("🔍 활성 코드 그룹별 공통코드 조회: {}", codeGroup);
        return commonCodeRepository.findByCodeGroupAndIsActiveTrueOrderBySortOrderAsc(codeGroup);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getActiveCodesByGroup(String codeGroup) {
        log.info("🔍 활성 코드 그룹별 공통코드 조회 (Map 형태): {}", codeGroup);
        List<CommonCode> codes = commonCodeRepository.findByCodeGroupAndIsActiveTrueOrderBySortOrderAsc(codeGroup);
        
        return codes.stream().map(code -> {
            Map<String, Object> codeMap = new HashMap<>();
            codeMap.put("id", code.getId());
            codeMap.put("codeValue", code.getCodeValue());
            codeMap.put("codeLabel", code.getCodeLabel());
            codeMap.put("codeDescription", code.getCodeDescription());
            codeMap.put("sortOrder", code.getSortOrder());
            codeMap.put("parentCodeGroup", code.getParentCodeGroup());
            codeMap.put("parentCodeValue", code.getParentCodeValue());
            return codeMap;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CommonCode getCommonCodeById(Long id) {
        log.info("🔍 공통코드 ID로 조회: {}", id);
        return commonCodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CommonCode not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public CommonCode getCommonCodeByGroupAndValue(String codeGroup, String codeValue) {
        log.info("🔍 공통코드 그룹과 값으로 조회: {} - {}", codeGroup, codeValue);
        return commonCodeRepository.findByCodeGroupAndCodeValue(codeGroup, codeValue)
                .orElseThrow(() -> new RuntimeException("CommonCode not found: " + codeGroup + " - " + codeValue));
    }

    @Override
    public CommonCode createCommonCode(CommonCodeDto dto) {
        log.info("🔧 공통코드 생성: {} - {}", dto.getCodeGroup(), dto.getCodeValue());
        
        // 중복 체크
        if (commonCodeRepository.findByCodeGroupAndCodeValue(dto.getCodeGroup(), dto.getCodeValue()).isPresent()) {
            throw new RuntimeException("이미 존재하는 코드입니다: " + dto.getCodeGroup() + " - " + dto.getCodeValue());
        }

        // 한글명 필수 검증 (한국 사용 필수)
        String koreanName = dto.getKoreanName();
        if (koreanName == null || koreanName.trim().isEmpty()) {
            // 한글명이 없으면 codeLabel을 한글명으로 사용
            koreanName = dto.getCodeLabel() != null ? dto.getCodeLabel() : dto.getCodeValue();
            log.warn("⚠️ 한글명이 없어 codeLabel을 한글명으로 사용: {} = {}", dto.getCodeValue(), koreanName);
        }

        CommonCode commonCode = CommonCode.builder()
                .codeGroup(dto.getCodeGroup())
                .codeValue(dto.getCodeValue())
                .codeLabel(dto.getCodeLabel())
                .codeDescription(dto.getCodeDescription())
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .parentCodeGroup(dto.getParentCodeGroup())
                .parentCodeValue(dto.getParentCodeValue())
                .extraData(dto.getExtraData())
                .icon(dto.getIcon())
                .colorCode(dto.getColorCode())
                .koreanName(koreanName) // 한글명 필수
                .build();

        return commonCodeRepository.save(commonCode);
    }

    @Override
    public CommonCode updateCommonCode(Long id, CommonCodeDto dto) {
        log.info("🔧 공통코드 수정: {}", id);
        
        CommonCode existingCode = getCommonCodeById(id);
        
        // 코드 그룹과 값이 변경되는 경우 중복 체크
        if (!existingCode.getCodeGroup().equals(dto.getCodeGroup()) || 
            !existingCode.getCodeValue().equals(dto.getCodeValue())) {
            if (commonCodeRepository.findByCodeGroupAndCodeValue(dto.getCodeGroup(), dto.getCodeValue()).isPresent()) {
                throw new RuntimeException("이미 존재하는 코드입니다: " + dto.getCodeGroup() + " - " + dto.getCodeValue());
            }
        }

        existingCode.setCodeGroup(dto.getCodeGroup());
        existingCode.setCodeValue(dto.getCodeValue());
        existingCode.setCodeLabel(dto.getCodeLabel());
        existingCode.setCodeDescription(dto.getCodeDescription());
        existingCode.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : existingCode.getSortOrder());
        existingCode.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : existingCode.getIsActive());
        existingCode.setParentCodeGroup(dto.getParentCodeGroup());
        existingCode.setParentCodeValue(dto.getParentCodeValue());
        existingCode.setExtraData(dto.getExtraData());
        existingCode.setIcon(dto.getIcon());
        existingCode.setColorCode(dto.getColorCode());
        
        // 한글명 필수 검증 (한국 사용 필수)
        String koreanName = dto.getKoreanName();
        if (koreanName == null || koreanName.trim().isEmpty()) {
            // 한글명이 없으면 codeLabel을 한글명으로 사용
            koreanName = dto.getCodeLabel() != null ? dto.getCodeLabel() : existingCode.getKoreanName();
            if (koreanName == null || koreanName.trim().isEmpty()) {
                koreanName = dto.getCodeValue();
            }
            log.warn("⚠️ 한글명이 없어 codeLabel을 한글명으로 사용: {} = {}", dto.getCodeValue(), koreanName);
        }
        existingCode.setKoreanName(koreanName);

        return commonCodeRepository.save(existingCode);
    }

    @Override
    public void deleteCommonCode(Long id) {
        log.info("🗑️ 공통코드 삭제: {}", id);
        
        CommonCode commonCode = getCommonCodeById(id);
        commonCodeRepository.delete(commonCode);
    }

    @Override
    public CommonCode toggleCommonCodeStatus(Long id) {
        log.info("🔄 공통코드 상태 토글: {}", id);
        
        CommonCode commonCode = getCommonCodeById(id);
        commonCode.setIsActive(!commonCode.getIsActive());
        
        return commonCodeRepository.save(commonCode);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAllCodeGroups() {
        log.info("🔍 모든 코드 그룹 조회");
        return commonCodeRepository.findAllActiveCodeGroups();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCodeGroupStatistics(String codeGroup) {
        log.info("📊 코드 그룹 통계 조회: {}", codeGroup);
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("codeGroup", codeGroup);
        statistics.put("totalCount", commonCodeRepository.countByCodeGroup(codeGroup));
        statistics.put("activeCount", commonCodeRepository.countActiveByCodeGroup(codeGroup));
        
        List<CommonCode> codes = commonCodeRepository.findByCodeGroupOrderBySortOrderAsc(codeGroup);
        statistics.put("codes", codes);
        
        return statistics;
    }

    @Override
    public List<CommonCode> createCommonCodesBatch(List<CommonCodeDto> dtos) {
        log.info("🔧 공통코드 일괄 생성: {}개", dtos.size());
        
        List<CommonCode> commonCodes = dtos.stream()
                .map(dto -> {
                    // 한글명 필수 검증 (한국 사용 필수)
                    String koreanName = dto.getKoreanName();
                    if (koreanName == null || koreanName.trim().isEmpty()) {
                        // 한글명이 없으면 codeLabel을 한글명으로 사용
                        koreanName = dto.getCodeLabel() != null ? dto.getCodeLabel() : dto.getCodeValue();
                        log.warn("⚠️ 한글명이 없어 codeLabel을 한글명으로 사용: {} = {}", dto.getCodeValue(), koreanName);
                    }
                    
                    return CommonCode.builder()
                            .codeGroup(dto.getCodeGroup())
                            .codeValue(dto.getCodeValue())
                            .codeLabel(dto.getCodeLabel())
                            .codeDescription(dto.getCodeDescription())
                            .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                            .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                            .parentCodeGroup(dto.getParentCodeGroup())
                            .parentCodeValue(dto.getParentCodeValue())
                            .extraData(dto.getExtraData())
                            .icon(dto.getIcon())
                            .colorCode(dto.getColorCode())
                            .koreanName(koreanName) // 한글명 필수
                            .build();
                })
                .collect(Collectors.toList());

        return commonCodeRepository.saveAll(commonCodes);
    }
    
    @Override
    @Transactional(readOnly = true)
    public String getCodeName(String codeGroup, String codeValue) {
        log.debug("코드명 조회: 그룹={}, 값={}", codeGroup, codeValue);
        
        try {
            return commonCodeRepository.findByCodeGroupAndCodeValueAndIsActiveTrue(codeGroup, codeValue)
                    .map(CommonCode::getCodeLabel)
                    .orElse(codeValue);
            
        } catch (Exception e) {
            log.error("코드명 조회 실패: 그룹={}, 값={}, 오류={}", codeGroup, codeValue, e.getMessage());
            return codeValue; // 오류 시 원본 값 반환
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public String getCodeValue(String codeGroup, String codeValue) {
        log.debug("코드값 조회: 그룹={}, 값={}", codeGroup, codeValue);
        
        try {
            return commonCodeRepository.findByCodeGroupAndCodeValueAndIsActiveTrue(codeGroup, codeValue)
                    .map(CommonCode::getCodeDescription) // description에 실제 설정값 저장
                    .orElse(null);
            
        } catch (Exception e) {
            log.error("코드값 조회 실패: 그룹={}, 값={}, 오류={}", codeGroup, codeValue, e.getMessage());
            return null;
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public String getCodeKoreanName(String codeGroup, String codeValue) {
        log.debug("한글명 조회: 그룹={}, 값={}", codeGroup, codeValue);
        
        try {
            return commonCodeRepository.findByCodeGroupAndCodeValueAndIsActiveTrue(codeGroup, codeValue)
                    .map(CommonCode::getKoreanName)
                    .orElse(codeValue);
            
        } catch (Exception e) {
            log.error("한글명 조회 실패: 그룹={}, 값={}, 오류={}", codeGroup, codeValue, e.getMessage());
            return codeValue;
        }
    }
    
    @Override
    @Transactional
    public void updateCodeExtraData(String codeGroup, String codeValue, String extraData) {
        log.debug("추가 데이터 업데이트: 그룹={}, 값={}, 데이터={}", codeGroup, codeValue, extraData);
        
        try {
            CommonCode code = getCommonCodeByGroupAndValue(codeGroup, codeValue);
            if (code != null) {
                code.setExtraData(extraData);
                commonCodeRepository.save(code);
                log.info("추가 데이터 업데이트 완료: 그룹={}, 값={}", codeGroup, codeValue);
            } else {
                log.warn("공통코드를 찾을 수 없음: 그룹={}, 값={}", codeGroup, codeValue);
            }
        } catch (Exception e) {
            log.error("추가 데이터 업데이트 실패: 그룹={}, 값={}, 오류={}", codeGroup, codeValue, e.getMessage());
            throw new RuntimeException("추가 데이터 업데이트 실패", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public CommonCode getCode(String groupCode, String codeValue) {
        return getCommonCodeByGroupAndValue(groupCode, codeValue);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getCodesByGroup(String codeGroup) {
        return getCommonCodesByGroup(codeGroup);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, List<CommonCode>> getCommonCodesByGroups(String[] groups) {
        log.info("🔍 여러 그룹의 공통코드 조회: {}", String.join(", ", groups));
        
        Map<String, List<CommonCode>> result = new HashMap<>();
        for (String group : groups) {
            List<CommonCode> codes = getCommonCodesByGroup(group);
            result.put(group, codes);
        }
        
        log.info("✅ 여러 그룹 공통코드 조회 완료: {} 그룹", result.size());
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, List<CommonCode>> getActiveCommonCodesByGroups(String[] groups) {
        log.info("🔍 여러 그룹의 활성 공통코드 조회: {}", String.join(", ", groups));
        
        Map<String, List<CommonCode>> result = new HashMap<>();
        for (String group : groups) {
            List<CommonCode> codes = getActiveCommonCodesByGroup(group);
            result.put(group, codes);
        }
        
        log.info("✅ 여러 그룹 활성 공통코드 조회 완료: {} 그룹", result.size());
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getCommonCodeGroups() {
        log.info("🔍 공통코드 그룹 목록 조회");
        
        List<String> groups = commonCodeRepository.findDistinctCodeGroups();
        log.info("✅ 공통코드 그룹 목록 조회 완료: {} 개", groups.size());
        return groups;
    }

    @Override
    @Transactional(readOnly = true)
    public CommonCode getCommonCode(String groupCode, String codeValue) {
        log.info("🔍 공통코드 상세 조회: {}/{}", groupCode, codeValue);
        
        CommonCode code = getCommonCodeByGroupAndValue(groupCode, codeValue);
        if (code != null) {
            log.info("✅ 공통코드 조회 완료: {}", code.getCodeLabel());
        } else {
            log.warn("⚠️ 공통코드를 찾을 수 없음: {}/{}", groupCode, codeValue);
        }
        
        return code;
    }

    @Override
    public int deactivateCommonCodes(List<String> codeValues) {
        log.info("🔧 공통코드 비활성화 시작: {} 개", codeValues.size());
        
        int deactivatedCount = 0;
        
        for (String codeValue : codeValues) {
            try {
                // 해당 코드값을 가진 모든 공통코드 조회
                List<CommonCode> codes = commonCodeRepository.findByCodeValue(codeValue);
                
                for (CommonCode code : codes) {
                    if (code.getIsActive()) {
                        code.setIsActive(false);
                        commonCodeRepository.save(code);
                        deactivatedCount++;
                        log.info("✅ 공통코드 비활성화 완료: {} ({})", code.getCodeLabel(), code.getCodeValue());
                    }
                }
            } catch (Exception e) {
                log.error("❌ 공통코드 비활성화 실패: {} - {}", codeValue, e.getMessage());
            }
        }
        
        log.info("🔧 공통코드 비활성화 완료: {} 개 처리", deactivatedCount);
        return deactivatedCount;
    }
    
    // ==================== 코어솔루션 코드 조회 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getCoreCodesByGroup(String codeGroup) {
        log.info("🔍 코어솔루션 코드 그룹별 조회: {}", codeGroup);
        return commonCodeRepository.findCoreCodesByGroup(codeGroup);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<CommonCode> getCoreCodeByGroupAndValue(String codeGroup, String codeValue) {
        log.info("🔍 코어솔루션 코드 조회: 그룹={}, 값={}", codeGroup, codeValue);
        return commonCodeRepository.findCoreCodeByGroupAndValue(codeGroup, codeValue);
    }
    
    // ==================== 테넌트별 코드 조회 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getTenantCodesByGroup(String tenantId, String codeGroup) {
        log.info("🔍 테넌트별 코드 그룹별 조회: 테넌트={}, 그룹={}", tenantId, codeGroup);
        return commonCodeRepository.findTenantCodesByGroup(tenantId, codeGroup);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getCurrentTenantCodesByGroup(String codeGroup) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("⚠️ 테넌트 컨텍스트가 없어 코어 코드를 조회합니다: {}", codeGroup);
            return getCoreCodesByGroup(codeGroup);
        }
        return getTenantCodesByGroup(tenantId, codeGroup);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<CommonCode> getTenantCodeByGroupAndValue(String tenantId, String codeGroup, String codeValue) {
        log.info("🔍 테넌트별 코드 조회: 테넌트={}, 그룹={}, 값={}", tenantId, codeGroup, codeValue);
        return commonCodeRepository.findTenantCodeByGroupAndValue(tenantId, codeGroup, codeValue);
    }
    
    // ==================== 통합 조회 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getCodesByGroupWithFallback(String tenantId, String codeGroup) {
        log.info("🔍 코드 조회 (테넌트 우선, 폴백): 테넌트={}, 그룹={}", tenantId, codeGroup);
        return commonCodeRepository.findCodesByGroupWithFallback(tenantId, codeGroup);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getCodesByGroupWithCurrentTenant(String codeGroup) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return getCodesByGroupWithFallback(tenantId, codeGroup);
        }
        // 테넌트 컨텍스트가 없으면 코어 코드만
        return getCoreCodesByGroup(codeGroup);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isCoreCodeGroup(String codeGroup) {
        // 공통코드에서 CODE_GROUP_TYPE 조회
        // CodeGroupMetadata에서 code_type 조회 후 공통코드와 비교
        // 하드코딩 금지: 모든 것은 공통코드에서 동적으로 조회
        CodeGroupMetadata metadata = codeGroupMetadataRepository.findByGroupName(codeGroup)
            .orElse(null);
        
        if (metadata == null) {
            return false; // 기본값: 테넌트별로 간주
        }
        
        if (metadata.getCodeType() == null || metadata.getCodeType().isEmpty()) {
            return false; // 기본값: 테넌트별로 간주
        }
        
        // CODE_GROUP_TYPE 공통코드에서 조회
        Optional<CommonCode> codeType = getCoreCodeByGroupAndValue(
            "CODE_GROUP_TYPE",
            metadata.getCodeType()
        );
        
        // 'CORE' 값과 비교
        Optional<CommonCode> coreType = getCoreCodeByGroupAndValue(
            "CODE_GROUP_TYPE",
            "CORE"
        );
        
        return codeType.isPresent() && coreType.isPresent() 
            && codeType.get().getCodeValue().equals(coreType.get().getCodeValue());
    }
    
    // ==================== 표준화된 CRUD 메서드 ====================
    
    @Override
    @Transactional
    public CommonCodeResponse create(CommonCodeCreateRequest request, String createdBy) {
        log.info("🔧 공통코드 생성 (표준화): {} - {}", request.getCodeGroup(), request.getCodeValue());
        
        // 사용자 조회 및 권한 검증
        User user = null;
        if (createdBy != null && !createdBy.trim().isEmpty()) {
            try {
                Long userId = Long.parseLong(createdBy);
                user = userRepository.findById(userId).orElse(null);
            } catch (NumberFormatException e) {
                log.warn("⚠️ createdBy가 유효한 숫자가 아닙니다: {}", createdBy);
            }
        }
        
        // 권한 검증
        String tenantId = request.getTenantId() != null ? request.getTenantId() : TenantContextHolder.getTenantId();
        if (!permissionService.canCreateCode(user, tenantId)) {
            String codeType = tenantId == null || tenantId.isEmpty() ? "코어" : "테넌트";
            String message = String.format("%s 코드 생성 권한이 없습니다.", codeType);
            log.warn("⚠️ 권한 없음: userId={}, codeType={}", createdBy, codeType);
            throw new SecurityException(message);
        }
        
        // 중복 체크 (tenant_id 포함)
        Optional<CommonCode> existing = tenantId != null && !tenantId.isEmpty()
            ? commonCodeRepository.findTenantCodeByGroupAndValue(tenantId, request.getCodeGroup(), request.getCodeValue())
            : commonCodeRepository.findCoreCodeByGroupAndValue(request.getCodeGroup(), request.getCodeValue());
        
        if (existing.isPresent()) {
            throw new RuntimeException("이미 존재하는 코드입니다: " + request.getCodeGroup() + " - " + request.getCodeValue());
        }
        
        // 한글명 필수 검증
        String koreanName = request.getKoreanName();
        if (koreanName == null || koreanName.trim().isEmpty()) {
            koreanName = request.getCodeLabel() != null ? request.getCodeLabel() : request.getCodeValue();
            log.warn("⚠️ 한글명이 없어 codeLabel을 한글명으로 사용: {} = {}", request.getCodeValue(), koreanName);
        }
        
        CommonCode commonCode = CommonCode.builder()
                .codeGroup(request.getCodeGroup())
                .codeValue(request.getCodeValue())
                .codeLabel(request.getCodeLabel())
                .codeDescription(request.getCodeDescription())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .parentCodeGroup(request.getParentCodeGroup())
                .parentCodeValue(request.getParentCodeValue())
                .extraData(request.getExtraData())
                .icon(request.getIcon())
                .colorCode(request.getColorCode())
                .koreanName(koreanName)
                .build();
        
        // tenantId 설정
        if (tenantId != null && !tenantId.isEmpty()) {
            commonCode.setTenantId(tenantId);
        }
        
        CommonCode saved = commonCodeRepository.save(commonCode);
        log.info("✅ 공통코드 생성 완료: id={}", saved.getId());
        
        return CommonCodeResponse.fromEntity(saved);
    }
    
    @Override
    @Transactional
    public CommonCodeResponse update(Long id, CommonCodeUpdateRequest request, String updatedBy) {
        log.info("🔧 공통코드 수정 (표준화): id={}", id);
        
        CommonCode existingCode = getCommonCodeById(id);
        
        // 사용자 조회 및 권한 검증
        User user = null;
        if (updatedBy != null && !updatedBy.trim().isEmpty()) {
            try {
                Long userId = Long.parseLong(updatedBy);
                user = userRepository.findById(userId).orElse(null);
            } catch (NumberFormatException e) {
                log.warn("⚠️ updatedBy가 유효한 숫자가 아닙니다: {}", updatedBy);
            }
        }
        
        // 권한 검증
        if (!permissionService.canUpdateCode(user, existingCode)) {
            String codeType = existingCode.isCoreCode() ? "코어" : "테넌트";
            String message = String.format("%s 코드 수정 권한이 없습니다.", codeType);
            log.warn("⚠️ 권한 없음: userId={}, codeId={}, codeType={}", updatedBy, id, codeType);
            throw new SecurityException(message);
        }
        
        // 한글명 업데이트 (있는 경우만)
        if (request.getKoreanName() != null && !request.getKoreanName().trim().isEmpty()) {
            existingCode.setKoreanName(request.getKoreanName());
        }
        
        // 다른 필드 업데이트
        if (request.getCodeLabel() != null) {
            existingCode.setCodeLabel(request.getCodeLabel());
        }
        if (request.getCodeDescription() != null) {
            existingCode.setCodeDescription(request.getCodeDescription());
        }
        if (request.getSortOrder() != null) {
            existingCode.setSortOrder(request.getSortOrder());
        }
        if (request.getIsActive() != null) {
            existingCode.setIsActive(request.getIsActive());
        }
        if (request.getExtraData() != null) {
            existingCode.setExtraData(request.getExtraData());
        }
        if (request.getIcon() != null) {
            existingCode.setIcon(request.getIcon());
        }
        if (request.getColorCode() != null) {
            existingCode.setColorCode(request.getColorCode());
        }
        
        CommonCode updated = commonCodeRepository.save(existingCode);
        log.info("✅ 공통코드 수정 완료: id={}", updated.getId());
        
        return CommonCodeResponse.fromEntity(updated);
    }
    
    @Override
    @Transactional
    public void delete(Long id, String deletedBy) {
        log.info("🗑️ 공통코드 삭제 (표준화): id={}, deletedBy={}", id, deletedBy);
        
        CommonCode code = getCommonCodeById(id);
        
        // 사용자 조회 및 권한 검증
        User user = null;
        if (deletedBy != null && !deletedBy.trim().isEmpty()) {
            try {
                Long userId = Long.parseLong(deletedBy);
                user = userRepository.findById(userId).orElse(null);
            } catch (NumberFormatException e) {
                log.warn("⚠️ deletedBy가 유효한 숫자가 아닙니다: {}", deletedBy);
            }
        }
        
        // 권한 검증
        if (!permissionService.canDeleteCode(user, code)) {
            String codeType = code.isCoreCode() ? "코어" : "테넌트";
            String message = String.format("%s 코드 삭제 권한이 없습니다.", codeType);
            log.warn("⚠️ 권한 없음: userId={}, codeId={}, codeType={}", deletedBy, id, codeType);
            throw new SecurityException(message);
        }
        
        // 활성 코드는 비활성화 후 삭제
        if (code.getIsActive() != null && code.getIsActive()) {
            log.warn("⚠️ 활성 코드는 먼저 비활성화 후 삭제해야 합니다. 비활성화 처리합니다.");
            code.setIsActive(false);
            commonCodeRepository.save(code);
        }
        
        // 소프트 삭제
        code.delete();
        commonCodeRepository.save(code);
        
        log.info("✅ 공통코드 삭제 완료: id={}", id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public CommonCodeResponse findById(Long id) {
        log.info("🔍 공통코드 상세 조회 (표준화): id={}", id);
        CommonCode code = getCommonCodeById(id);
        return CommonCodeResponse.fromEntity(code);
    }
    
    @Override
    @Transactional(readOnly = true)
    public CommonCodeListResponse findAll(String codeGroup) {
        log.info("🔍 공통코드 목록 조회 (표준화): codeGroup={}", codeGroup);
        
        List<CommonCode> codes;
        if (codeGroup != null && !codeGroup.trim().isEmpty()) {
            codes = getCodesByGroupWithCurrentTenant(codeGroup);
        } else {
            codes = getAllCommonCodes();
        }
        
        List<CommonCodeResponse> responses = codes.stream()
                .map(CommonCodeResponse::fromEntity)
                .collect(Collectors.toList());
        
        return CommonCodeListResponse.of(responses);
    }
}
