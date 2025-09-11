package com.mindgarden.consultation.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.dto.CodeGroupDto;
import com.mindgarden.consultation.dto.CodeValueDto;
import com.mindgarden.consultation.entity.CodeGroup;
import com.mindgarden.consultation.entity.CodeValue;
import com.mindgarden.consultation.repository.CodeGroupRepository;
import com.mindgarden.consultation.repository.CodeValueRepository;
import com.mindgarden.consultation.service.CodeManagementService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 코드 관리 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
// @Service  // 기존 테이블 삭제로 인해 비활성화
@RequiredArgsConstructor
@Transactional
public class CodeManagementServiceImpl implements CodeManagementService {
    
    private final CodeGroupRepository codeGroupRepository;
    private final CodeValueRepository codeValueRepository;
    
    // ==================== 코드 그룹 관리 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<CodeGroupDto> getAllCodeGroups() {
        log.info("📋 모든 코드 그룹 조회");
        
        List<CodeGroup> codeGroups = codeGroupRepository.findByIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc();
        
        return codeGroups.stream()
            .map(this::convertToCodeGroupDto)
            .collect(Collectors.toList());
    }
    
    @Override
    public CodeGroupDto createCodeGroup(CodeGroupDto dto) {
        log.info("➕ 코드 그룹 생성: {}", dto.getCode());
        
        // 중복 확인
        if (codeGroupRepository.existsByCodeAndIsDeletedFalse(dto.getCode())) {
            throw new RuntimeException("이미 존재하는 코드 그룹입니다: " + dto.getCode());
        }
        
        CodeGroup codeGroup = CodeGroup.builder()
            .code(dto.getCode())
            .name(dto.getName())
            .description(dto.getDescription())
            .sortOrder(dto.getSortOrder())
            .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
            .build();
        
        CodeGroup saved = codeGroupRepository.save(codeGroup);
        log.info("✅ 코드 그룹 생성 완료: ID={}", saved.getId());
        
        return convertToCodeGroupDto(saved);
    }
    
    @Override
    public CodeGroupDto updateCodeGroup(Long id, CodeGroupDto dto) {
        log.info("✏️ 코드 그룹 수정: ID={}", id);
        
        CodeGroup codeGroup = codeGroupRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("코드 그룹을 찾을 수 없습니다: " + id));
        
        codeGroup.setName(dto.getName());
        codeGroup.setDescription(dto.getDescription());
        codeGroup.setSortOrder(dto.getSortOrder());
        codeGroup.setIsActive(dto.getIsActive());
        
        CodeGroup saved = codeGroupRepository.save(codeGroup);
        log.info("✅ 코드 그룹 수정 완료: ID={}", saved.getId());
        
        return convertToCodeGroupDto(saved);
    }
    
    @Override
    public void deleteCodeGroup(Long id) {
        log.info("🗑️ 코드 그룹 삭제: ID={}", id);
        
        CodeGroup codeGroup = codeGroupRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("코드 그룹을 찾을 수 없습니다: " + id));
        
        // 관련 코드 값이 있는지 확인
        long codeValueCount = codeGroupRepository.countCodeValuesByGroupId(id);
        if (codeValueCount > 0) {
            throw new RuntimeException("관련된 코드 값이 있어 삭제할 수 없습니다. 먼저 코드 값들을 삭제해주세요.");
        }
        
        codeGroup.setIsDeleted(true);
        codeGroupRepository.save(codeGroup);
        log.info("✅ 코드 그룹 삭제 완료: ID={}", id);
    }
    
    // ==================== 코드 값 관리 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<CodeValueDto> getCodeValuesByGroup(String groupCode) {
        log.info("📋 코드 그룹별 코드 값 조회: {}", groupCode);
        
        List<CodeValue> codeValues = codeValueRepository.findByGroupCodeAndIsDeletedFalseOrderBySortOrderAsc(groupCode);
        
        return codeValues.stream()
            .map(this::convertToCodeValueDto)
            .collect(Collectors.toList());
    }
    
    @Override
    public CodeValueDto createCodeValue(CodeValueDto dto) {
        log.info("➕ 코드 값 생성: 그룹={}, 코드={}", dto.getCodeGroupCode(), dto.getCode());
        
        // 코드 그룹 조회
        CodeGroup codeGroup = codeGroupRepository.findByCodeAndIsDeletedFalse(dto.getCodeGroupCode())
            .orElseThrow(() -> new RuntimeException("코드 그룹을 찾을 수 없습니다: " + dto.getCodeGroupCode()));
        
        // 중복 확인
        if (codeValueRepository.existsByGroupCodeAndCodeAndIsDeletedFalse(dto.getCodeGroupCode(), dto.getCode())) {
            throw new RuntimeException("이미 존재하는 코드 값입니다: " + dto.getCode());
        }
        
        CodeValue codeValue = CodeValue.builder()
            .codeGroup(codeGroup)
            .code(dto.getCode())
            .name(dto.getName())
            .description(dto.getDescription())
            .sortOrder(dto.getSortOrder())
            .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
            .colorCode(dto.getColorCode())
            .icon(dto.getIcon())
            .durationMinutes(dto.getDurationMinutes())
            .build();
        
        CodeValue saved = codeValueRepository.save(codeValue);
        log.info("✅ 코드 값 생성 완료: ID={}", saved.getId());
        
        return convertToCodeValueDto(saved);
    }
    
    @Override
    public CodeValueDto updateCodeValue(Long id, CodeValueDto dto) {
        log.info("✏️ 코드 값 수정: ID={}", id);
        
        CodeValue codeValue = codeValueRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("코드 값을 찾을 수 없습니다: " + id));
        
        codeValue.setName(dto.getName());
        codeValue.setDescription(dto.getDescription());
        codeValue.setSortOrder(dto.getSortOrder());
        codeValue.setIsActive(dto.getIsActive());
        codeValue.setColorCode(dto.getColorCode());
        codeValue.setIcon(dto.getIcon());
        codeValue.setDurationMinutes(dto.getDurationMinutes());
        
        CodeValue saved = codeValueRepository.save(codeValue);
        log.info("✅ 코드 값 수정 완료: ID={}", saved.getId());
        
        return convertToCodeValueDto(saved);
    }
    
    @Override
    public void deleteCodeValue(Long id) {
        log.info("🗑️ 코드 값 삭제: ID={}", id);
        
        CodeValue codeValue = codeValueRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("코드 값을 찾을 수 없습니다: " + id));
        
        codeValue.setIsDeleted(true);
        codeValueRepository.save(codeValue);
        log.info("✅ 코드 값 삭제 완료: ID={}", id);
    }
    
    // ==================== 코드 조회 (캐시) ====================
    
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "codeValues", key = "#groupCode")
    public Map<String, String> getCodeValueMap(String groupCode) {
        log.info("🗂️ 코드 값 맵 조회: {}", groupCode);
        
        List<CodeValue> codeValues = codeValueRepository.findActiveByGroupCodeAndIsDeletedFalseOrderBySortOrderAsc(groupCode);
        
        return codeValues.stream()
            .collect(Collectors.toMap(
                CodeValue::getCode,
                CodeValue::getName,
                (existing, replacement) -> existing,
                HashMap::new
            ));
    }
    
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "codeNames", key = "#groupCode + '_' + #code")
    public String getCodeName(String groupCode, String code) {
        log.info("🏷️ 코드명 조회: 그룹={}, 코드={}", groupCode, code);
        
        return codeValueRepository.findByGroupCodeAndCodeAndIsDeletedFalse(groupCode, code)
            .map(CodeValue::getName)
            .orElse(code); // 찾지 못하면 원본 코드 반환
    }
    
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "consultationDurations", key = "#consultationType")
    public Integer getConsultationDuration(String consultationType) {
        log.info("⏱️ 상담 시간 조회: {}", consultationType);
        
        return codeValueRepository.findByGroupCodeAndCodeAndIsDeletedFalse("CONSULTATION_TYPE", consultationType)
            .map(CodeValue::getDurationMinutes)
            .orElse(50); // 기본값 50분
    }
    
    @Override
    @Transactional(readOnly = true)
    public CodeValueDto getCodeValue(String groupCode, String code) {
        log.info("📋 코드 값 상세 조회: 그룹={}, 코드={}", groupCode, code);
        
        return codeValueRepository.findByGroupCodeAndCodeAndIsDeletedFalse(groupCode, code)
            .map(this::convertToCodeValueDto)
            .orElse(null);
    }
    
    // ==================== 변환 메서드 ====================
    
    private CodeGroupDto convertToCodeGroupDto(CodeGroup codeGroup) {
        return CodeGroupDto.builder()
            .id(codeGroup.getId())
            .code(codeGroup.getCode())
            .name(codeGroup.getName())
            .description(codeGroup.getDescription())
            .sortOrder(codeGroup.getSortOrder())
            .isActive(codeGroup.getIsActive())
            .codeValueCount(codeGroupRepository.countCodeValuesByGroupId(codeGroup.getId()))
            .build();
    }
    
    private CodeValueDto convertToCodeValueDto(CodeValue codeValue) {
        return CodeValueDto.builder()
            .id(codeValue.getId())
            .codeGroupId(codeValue.getCodeGroup().getId())
            .codeGroupCode(codeValue.getCodeGroup().getCode())
            .codeGroupName(codeValue.getCodeGroup().getName())
            .code(codeValue.getCode())
            .name(codeValue.getName())
            .description(codeValue.getDescription())
            .sortOrder(codeValue.getSortOrder())
            .isActive(codeValue.getIsActive())
            .colorCode(codeValue.getColorCode())
            .icon(codeValue.getIcon())
            .durationMinutes(codeValue.getDurationMinutes())
            .build();
    }
}
