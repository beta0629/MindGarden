package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.dto.CommonCodeCreateRequest;
import com.coresolution.consultation.dto.CommonCodeResponse;
import com.coresolution.consultation.dto.CommonCodeUpdateRequest;
import com.coresolution.consultation.entity.CodeGroupMetadata;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CodeGroupMetadataRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.service.TenantCommonCodeService;
import com.coresolution.core.context.TenantContextHolder;
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
        
        // 코드 그룹이 테넌트 타입인지 검증
        validateTenantCodeGroup(request.getCodeGroup());
        
        // 중복 체크
        commonCodeRepository.findTenantCodeByGroupAndValue(tenantId, request.getCodeGroup(), request.getCodeValue())
            .ifPresent(code -> {
                throw new IllegalArgumentException(
                    String.format("이미 존재하는 코드입니다: %s.%s", request.getCodeGroup(), request.getCodeValue())
                );
            });
        
        // 엔티티 생성
        CommonCode code = CommonCode.builder()
            .codeGroup(request.getCodeGroup())
            .codeValue(request.getCodeValue())
            .codeLabel(request.getCodeLabel())
            .koreanName(request.getKoreanName() != null ? request.getKoreanName() : request.getCodeLabel())
            .codeDescription(request.getCodeDescription())
            .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
            .isActive(request.getIsActive() != null ? request.getIsActive() : true)
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
        
        CommonCode code = commonCodeRepository.findByTenantIdAndId(TenantContextHolder.getRequiredTenantId(), codeId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 코드입니다: " + codeId));
        
        // 소유권 검증
        if (!validateTenantCodeOwnership(tenantId, codeId)) {
            throw new IllegalArgumentException("해당 코드를 수정할 권한이 없습니다.");
        }
        
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
        
        CommonCode updatedCode = commonCodeRepository.save(code);
        log.info("테넌트 공통코드 수정 완료: id={}", updatedCode.getId());
        
        return toResponse(updatedCode);
    }

    @Override
    @Transactional
    public void deleteTenantCode(String tenantId, Long codeId) {
        log.info("테넌트 공통코드 삭제: tenantId={}, codeId={}", tenantId, codeId);
        
        CommonCode code = commonCodeRepository.findByTenantIdAndId(TenantContextHolder.getRequiredTenantId(), codeId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 코드입니다: " + codeId));
        
        // 소유권 검증
        if (!validateTenantCodeOwnership(tenantId, codeId)) {
            throw new IllegalArgumentException("해당 코드를 삭제할 권한이 없습니다.");
        }
        
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
        
        CommonCode code = commonCodeRepository.findByTenantIdAndId(TenantContextHolder.getRequiredTenantId(), codeId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 코드입니다: " + codeId));
        
        // 소유권 검증
        if (!validateTenantCodeOwnership(tenantId, codeId)) {
            throw new IllegalArgumentException("해당 코드를 수정할 권한이 없습니다.");
        }
        
        code.setIsActive(isActive);
        CommonCode updatedCode = commonCodeRepository.save(code);
        
        log.info("테넌트 공통코드 활성화 토글 완료: id={}, isActive={}", codeId, isActive);
        
        return toResponse(updatedCode);
    }

    @Override
    @Transactional
    public CommonCodeResponse updateTenantCodeOrder(String tenantId, Long codeId, int newOrder) {
        log.info("테넌트 공통코드 정렬 순서 변경: tenantId={}, codeId={}, newOrder={}", tenantId, codeId, newOrder);
        
        CommonCode code = commonCodeRepository.findByTenantIdAndId(TenantContextHolder.getRequiredTenantId(), codeId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 코드입니다: " + codeId));
        
        // 소유권 검증
        if (!validateTenantCodeOwnership(tenantId, codeId)) {
            throw new IllegalArgumentException("해당 코드를 수정할 권한이 없습니다.");
        }
        
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
        CommonCode code = commonCodeRepository.findByTenantIdAndId(TenantContextHolder.getRequiredTenantId(), codeId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 코드입니다: " + codeId));
        
        // 시스템 코드는 수정 불가
        if (code.isCoreCode()) {
            log.warn("시스템 공통코드 수정 시도: codeId={}", codeId);
            return false;
        }
        
        // 테넌트 소유권 확인
        if (!tenantId.equals(code.getTenantId())) {
            log.warn("다른 테넌트의 코드 수정 시도: codeId={}, requestTenantId={}, ownerTenantId={}", 
                codeId, tenantId, code.getTenantId());
            return false;
        }
        
        return true;
    }

    // ==================== Private Methods ====================

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
            .extraData(code.getExtraData())
            .icon(code.getIcon())
            .colorCode(code.getColorCode())
            .createdAt(code.getCreatedAt())
            .updatedAt(code.getUpdatedAt())
            .build();
    }
}

