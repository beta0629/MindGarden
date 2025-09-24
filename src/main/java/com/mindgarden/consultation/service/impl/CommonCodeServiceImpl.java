package com.mindgarden.consultation.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.dto.CommonCodeDto;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.repository.CommonCodeRepository;
import com.mindgarden.consultation.service.CommonCodeService;
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
        existingCode.setKoreanName(dto.getKoreanName());

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
                .map(dto -> CommonCode.builder()
                        .codeGroup(dto.getCodeGroup())
                        .codeValue(dto.getCodeValue())
                        .codeLabel(dto.getCodeLabel())
                        .codeDescription(dto.getCodeDescription())
                        .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                        .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                        .parentCodeGroup(dto.getParentCodeGroup())
                        .parentCodeValue(dto.getParentCodeValue())
                        .extraData(dto.getExtraData())
                        .build())
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
}
