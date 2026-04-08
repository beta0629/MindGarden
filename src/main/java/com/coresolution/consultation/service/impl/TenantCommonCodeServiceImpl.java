package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.dto.CommonCodeCreateRequest;
import com.coresolution.consultation.dto.CommonCodeResponse;
import com.coresolution.consultation.dto.CommonCodeUpdateRequest;
import com.coresolution.consultation.entity.CodeGroupMetadata;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CodeGroupMetadataRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.service.TenantCommonCodeService;
import com.coresolution.consultation.util.CommonCodeSubcategoryParents;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 테넌트 공통코드 관리 서비스 구현체
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantCommonCodeServiceImpl implements TenantCommonCodeService {

    /**
     * 테넌트 공통코드 API로 시스템(코어) 코드를 수정하려 할 때 안내 메시지
     */
    private static final String MSG_SYSTEM_CODE_USE_PLATFORM_API =
        "시스템 공통코드는 운영(플랫폼) 공통코드 API에서만 수정할 수 있습니다.";

    private final CommonCodeRepository commonCodeRepository;
    private final CodeGroupMetadataRepository codeGroupMetadataRepository;
    private final ObjectMapper objectMapper;

    @Override
    public List<CodeGroupMetadata> getTenantCodeGroups(String tenantId) {
        log.debug("테넌트 공통코드 그룹 조회: tenantId={}", tenantId);
        return codeGroupMetadataRepository.findTenantCodeGroups();
    }

    @Override
    public List<CommonCodeResponse> getTenantCodesByGroup(String tenantId, String codeGroup) {
        log.debug("테넌트 공통코드 조회: tenantId={}, codeGroup={}", tenantId, codeGroup);
        
        // 테넌트 전용 코드 조회
        List<CommonCode> codes = commonCodeRepository.findTenantCodesByGroup(tenantId, codeGroup);
        
        return codes.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CommonCodeResponse createTenantCode(String tenantId, CommonCodeCreateRequest request) {
        log.info("테넌트 공통코드 생성: tenantId={}, codeGroup={}, codeValue={}", 
            tenantId, request.getCodeGroup(), request.getCodeValue());

        requireNonBlankTenantId(tenantId);
        
        // 코드 그룹이 테넌트 타입인지 검증
        validateTenantCodeGroup(request.getCodeGroup());
        
        // 중복 체크
        commonCodeRepository.findTenantCodeByGroupAndValue(tenantId, request.getCodeGroup(), request.getCodeValue())
            .ifPresent(code -> {
                throw new IllegalArgumentException(
                    String.format("이미 존재하는 코드입니다: %s.%s", request.getCodeGroup(), request.getCodeValue())
                );
            });
        
        String parentGroup = request.getParentCodeGroup();
        String parentValue = request.getParentCodeValue();
        if (CommonCodeSubcategoryParents.isSubcategoryGroup(request.getCodeGroup())) {
            parentGroup = CommonCodeSubcategoryParents.expectedParentGroup(request.getCodeGroup());
            CommonCodeSubcategoryParents.requireValidParent(request.getCodeGroup(), parentGroup, parentValue);
        }

        // 엔티티 생성
        CommonCode code = CommonCode.builder()
            .codeGroup(request.getCodeGroup())
            .codeValue(request.getCodeValue())
            .codeLabel(request.getCodeLabel())
            .koreanName(request.getKoreanName() != null ? request.getKoreanName() : request.getCodeLabel())
            .codeDescription(request.getCodeDescription())
            .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
            .isActive(request.getIsActive() != null ? request.getIsActive() : true)
            .parentCodeGroup(parentGroup)
            .parentCodeValue(parentValue)
            .extraData(request.getExtraData())
            .icon(request.getIcon())
            .colorCode(request.getColorCode())
            .build();
        
        code.setTenantId(tenantId);
        
        CommonCode savedCode = commonCodeRepository.save(code);
        log.info("테넌트 공통코드 생성 완료: id={}", savedCode.getId());
        
        return toResponse(savedCode);
    }

    @Override
    @Transactional
    public CommonCodeResponse updateTenantCode(String tenantId, Long codeId, CommonCodeUpdateRequest request) {
        log.info("테넌트 공통코드 수정: tenantId={}, codeId={}", tenantId, codeId);
        
        CommonCode code = requireTenantCodeRowForMutation(tenantId, codeId);
        
        // 수정
        if (request.getCodeLabel() != null) {
            code.setCodeLabel(request.getCodeLabel());
        }
        if (request.getKoreanName() != null) {
            code.setKoreanName(request.getKoreanName());
        }
        if (request.getCodeDescription() != null) {
            code.setCodeDescription(request.getCodeDescription());
        }
        if (request.getSortOrder() != null) {
            code.setSortOrder(request.getSortOrder());
        }
        if (request.getIsActive() != null) {
            code.setIsActive(request.getIsActive());
        }
        if (request.getExtraData() != null) {
            code.setExtraData(request.getExtraData());
        }
        if (request.getIcon() != null) {
            code.setIcon(request.getIcon());
        }
        if (request.getColorCode() != null) {
            code.setColorCode(request.getColorCode());
        }
        if (request.getParentCodeGroup() != null) {
            code.setParentCodeGroup(trimToNull(request.getParentCodeGroup()));
        }
        if (request.getParentCodeValue() != null) {
            code.setParentCodeValue(trimToNull(request.getParentCodeValue()));
        }
        if (CommonCodeSubcategoryParents.isSubcategoryGroup(code.getCodeGroup())) {
            code.setParentCodeGroup(CommonCodeSubcategoryParents.expectedParentGroup(code.getCodeGroup()));
            CommonCodeSubcategoryParents.requireValidParent(
                code.getCodeGroup(),
                code.getParentCodeGroup(),
                code.getParentCodeValue());
        }

        CommonCode updatedCode = commonCodeRepository.save(code);
        log.info("테넌트 공통코드 수정 완료: id={}", updatedCode.getId());
        
        return toResponse(updatedCode);
    }

    @Override
    @Transactional
    public void deleteTenantCode(String tenantId, Long codeId) {
        log.info("테넌트 공통코드 삭제: tenantId={}, codeId={}", tenantId, codeId);
        
        CommonCode code = requireTenantCodeRowForMutation(tenantId, codeId);
        
        // 소프트 삭제
        code.setIsDeleted(true);
        code.setDeletedAt(java.time.LocalDateTime.now());
        commonCodeRepository.save(code);
        
        log.info("테넌트 공통코드 삭제 완료: id={}", codeId);
    }

    @Override
    @Transactional
    public CommonCodeResponse toggleTenantCodeActive(String tenantId, Long codeId, boolean isActive) {
        log.info("테넌트 공통코드 활성화 토글: tenantId={}, codeId={}, isActive={}", tenantId, codeId, isActive);
        
        CommonCode code = requireTenantCodeRowForMutation(tenantId, codeId);
        
        code.setIsActive(isActive);
        CommonCode updatedCode = commonCodeRepository.save(code);
        
        log.info("테넌트 공통코드 활성화 토글 완료: id={}, isActive={}", codeId, isActive);
        
        return toResponse(updatedCode);
    }

    @Override
    @Transactional
    public CommonCodeResponse updateTenantCodeOrder(String tenantId, Long codeId, int newOrder) {
        log.info("테넌트 공통코드 정렬 순서 변경: tenantId={}, codeId={}, newOrder={}", tenantId, codeId, newOrder);
        
        CommonCode code = requireTenantCodeRowForMutation(tenantId, codeId);
        
        code.setSortOrder(newOrder);
        CommonCode updatedCode = commonCodeRepository.save(code);
        
        log.info("테넌트 공통코드 정렬 순서 변경 완료: id={}, newOrder={}", codeId, newOrder);
        
        return toResponse(updatedCode);
    }

    @Override
    @Transactional
    public CommonCodeResponse createConsultationPackage(
        String tenantId,
        String packageName,
        Integer price,
        Integer duration,
        Integer sessions,
        String description
    ) {
        log.info("상담 패키지 생성: tenantId={}, packageName={}, price={}", tenantId, packageName, price);
        
        // extra_data JSON 생성
        Map<String, Object> extraData = new HashMap<>();
        extraData.put("price", price);
        extraData.put("duration", duration);
        extraData.put("sessions", sessions);
        
        String extraDataJson;
        try {
            extraDataJson = objectMapper.writeValueAsString(extraData);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 변환 실패", e);
        }
        
        // 코드 값 생성 (예: PACKAGE_001)
        String codeValue = generateCodeValue(tenantId, "CONSULTATION_PACKAGE", "PACKAGE");
        
        CommonCodeCreateRequest request = CommonCodeCreateRequest.builder()
            .codeGroup("CONSULTATION_PACKAGE")
            .codeValue(codeValue)
            .codeLabel(packageName)
            .koreanName(packageName)
            .codeDescription(description)
            .extraData(extraDataJson)
            .isActive(true)
            .build();
        
        return createTenantCode(tenantId, request);
    }

    @Override
    @Transactional
    public CommonCodeResponse createAssessmentType(
        String tenantId,
        String assessmentName,
        Integer price,
        Integer duration,
        String description
    ) {
        log.info("평가 유형 생성: tenantId={}, assessmentName={}, price={}", tenantId, assessmentName, price);
        
        // extra_data JSON 생성
        Map<String, Object> extraData = new HashMap<>();
        extraData.put("price", price);
        extraData.put("duration", duration);
        
        String extraDataJson;
        try {
            extraDataJson = objectMapper.writeValueAsString(extraData);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 변환 실패", e);
        }
        
        // 코드 값 생성 (예: ASSESS_001)
        String codeValue = generateCodeValue(tenantId, "ASSESSMENT_TYPE", "ASSESS");
        
        CommonCodeCreateRequest request = CommonCodeCreateRequest.builder()
            .codeGroup("ASSESSMENT_TYPE")
            .codeValue(codeValue)
            .codeLabel(assessmentName)
            .koreanName(assessmentName)
            .codeDescription(description)
            .extraData(extraDataJson)
            .isActive(true)
            .build();
        
        return createTenantCode(tenantId, request);
    }

    @Override
    public boolean validateTenantCodeOwnership(String tenantId, Long codeId) {
        requireNonBlankTenantId(tenantId);
        return commonCodeRepository.findByTenantIdAndId(tenantId, codeId)
            .map(code -> {
                if (code.isCoreCode()) {
                    log.warn("시스템 공통코드 소유 검증 실패(코어 행): codeId={}", codeId);
                    return false;
                }
                if (!tenantId.equals(code.getTenantId())) {
                    log.warn("다른 테넌트의 코드 소유 검증 실패: codeId={}, requestTenantId={}, ownerTenantId={}",
                        codeId, tenantId, code.getTenantId());
                    return false;
                }
                return true;
            })
            .orElseGet(() -> {
                if (commonCodeRepository.findActiveCoreCodeById(codeId).isPresent()) {
                    log.warn("테넌트 API로 시스템 공통코드 소유 검증 시도: codeId={}, tenantId={}", codeId, tenantId);
                    return false;
                }
                throw new IllegalArgumentException("존재하지 않는 코드입니다: " + codeId);
            });
    }

    // ==================== Private Methods ====================

    private void requireNonBlankTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("테넌트 ID가 필요합니다.");
        }
    }

    /**
     * 요청 tenantId와 일치하는 테넌트 공통코드 행만 조회한다. 코어 PK만 존재하면 플랫폼 API 안내 예외.
     */
    private CommonCode requireTenantCodeRowForMutation(String tenantId, Long codeId) {
        requireNonBlankTenantId(tenantId);
        return commonCodeRepository.findByTenantIdAndId(tenantId, codeId)
            .orElseThrow(() -> resolveMissingTenantScopedCode(codeId));
    }

    private IllegalArgumentException resolveMissingTenantScopedCode(Long codeId) {
        if (commonCodeRepository.findActiveCoreCodeById(codeId).isPresent()) {
            return new IllegalArgumentException(MSG_SYSTEM_CODE_USE_PLATFORM_API);
        }
        return new IllegalArgumentException("존재하지 않는 코드입니다: " + codeId);
    }

    /**
     * 코드 그룹이 테넌트 타입인지 검증
     */
    private void validateTenantCodeGroup(String codeGroup) {
        CodeGroupMetadata metadata = codeGroupMetadataRepository.findByGroupName(codeGroup)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 코드 그룹입니다: " + codeGroup));
        
        if (!"TENANT".equals(metadata.getCodeType())) {
            throw new IllegalArgumentException("테넌트 전용 코드 그룹이 아닙니다: " + codeGroup);
        }
    }

    /**
     * 코드 값 자동 생성
     */
    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String generateCodeValue(String tenantId, String codeGroup, String prefix) {
        List<CommonCode> existingCodes = commonCodeRepository.findTenantCodesByGroup(tenantId, codeGroup);
        int nextNumber = existingCodes.size() + 1;
        return String.format("%s_%03d", prefix, nextNumber);
    }

    /**
     * Entity -> Response DTO 변환
     */
    private CommonCodeResponse toResponse(CommonCode code) {
        return CommonCodeResponse.builder()
            .id(code.getId())
            .tenantId(code.getTenantId())
            .codeGroup(code.getCodeGroup())
            .codeValue(code.getCodeValue())
            .codeLabel(code.getCodeLabel())
            .koreanName(code.getKoreanName())
            .codeDescription(code.getCodeDescription())
            .sortOrder(code.getSortOrder())
            .isActive(code.getIsActive())
            .parentCodeGroup(code.getParentCodeGroup())
            .parentCodeValue(code.getParentCodeValue())
            .extraData(code.getExtraData())
            .icon(code.getIcon())
            .colorCode(code.getColorCode())
            .createdAt(code.getCreatedAt())
            .updatedAt(code.getUpdatedAt())
            .build();
    }
}

