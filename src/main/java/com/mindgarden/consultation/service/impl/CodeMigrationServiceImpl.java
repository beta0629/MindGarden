package com.mindgarden.consultation.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.dto.CodeGroupDto;
import com.mindgarden.consultation.dto.CodeValueDto;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.repository.CommonCodeRepository;
import com.mindgarden.consultation.service.CodeManagementService;
import com.mindgarden.consultation.service.CodeMigrationService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 코드 마이그레이션 서비스 구현체
 * code_groups + code_values 테이블의 데이터를 common_codes 테이블로 마이그레이션
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-09
 */
@Slf4j
// @Service  // 마이그레이션 완료로 인해 비활성화
@RequiredArgsConstructor
@Transactional
public class CodeMigrationServiceImpl implements CodeMigrationService {
    
    private final CodeManagementService codeManagementService;
    private final CommonCodeRepository commonCodeRepository;
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> checkMigrationStatus() {
        log.info("🔍 코드 마이그레이션 상태 확인");
        
        Map<String, Object> status = new HashMap<>();
        
        try {
            // code_groups + code_values 테이블 상태 확인
            List<CodeGroupDto> codeGroups = codeManagementService.getAllCodeGroups();
            int totalCodeGroups = codeGroups.size();
            int totalCodeValues = 0;
            
            for (CodeGroupDto group : codeGroups) {
                List<CodeValueDto> values = codeManagementService.getCodeValuesByGroup(group.getCode());
                totalCodeValues += values.size();
            }
            
            // common_codes 테이블 상태 확인
            List<CommonCode> commonCodes = commonCodeRepository.findAll();
            int commonCodeCount = commonCodes.size();
            
            // 코드 그룹별 개수 계산
            Map<String, Long> groupCounts = commonCodes.stream()
                .collect(Collectors.groupingBy(CommonCode::getCodeGroup, Collectors.counting()));
            
            status.put("success", true);
            status.put("codeGroupsCount", totalCodeGroups);
            status.put("codeValuesCount", totalCodeValues);
            status.put("commonCodesCount", commonCodeCount);
            status.put("commonCodeGroups", groupCounts.keySet().size());
            status.put("migrationNeeded", commonCodeCount < totalCodeValues);
            
            log.info("📊 마이그레이션 상태: 코드그룹={}, 코드값={}, 공통코드={}", 
                totalCodeGroups, totalCodeValues, commonCodeCount);
            
        } catch (Exception e) {
            log.error("❌ 마이그레이션 상태 확인 실패", e);
            status.put("success", false);
            status.put("error", e.getMessage());
        }
        
        return status;
    }
    
    @Override
    public Map<String, Object> migrateCodesToCommonCodes() {
        log.info("🚀 코드 마이그레이션 시작");
        
        Map<String, Object> result = new HashMap<>();
        int migratedCount = 0;
        int errorCount = 0;
        List<String> errors = new ArrayList<>();
        
        try {
            // 기존 common_codes 데이터 삭제 (완전 마이그레이션)
            commonCodeRepository.deleteAll();
            log.info("🗑️ 기존 common_codes 데이터 삭제 완료");
            
            // code_groups + code_values 데이터 조회
            List<CodeGroupDto> codeGroups = codeManagementService.getAllCodeGroups();
            log.info("📋 마이그레이션할 코드 그룹 수: {}", codeGroups.size());
            
            List<CommonCode> commonCodesToSave = new ArrayList<>();
            
            for (CodeGroupDto group : codeGroups) {
                try {
                    List<CodeValueDto> values = codeManagementService.getCodeValuesByGroup(group.getCode());
                    log.info("📝 코드 그룹 '{}' 처리 중: {}개 값", group.getCode(), values.size());
                    
                    for (CodeValueDto value : values) {
                        CommonCode commonCode = CommonCode.builder()
                            .codeGroup(value.getCodeGroupCode())
                            .codeValue(value.getCode())
                            .codeLabel(value.getName())
                            .codeDescription(value.getDescription())
                            .sortOrder(value.getSortOrder() != null ? value.getSortOrder() : 0)
                            .isActive(value.getIsActive() != null ? value.getIsActive() : true)
                            .parentCodeGroup(null)  // CodeValueDto에 없는 필드
                            .parentCodeValue(null)  // CodeValueDto에 없는 필드
                            .extraData(null)       // CodeValueDto에 없는 필드
                            .build();
                        
                        commonCodesToSave.add(commonCode);
                        migratedCount++;
                    }
                    
                } catch (Exception e) {
                    log.error("❌ 코드 그룹 '{}' 마이그레이션 실패: {}", group.getCode(), e.getMessage());
                    errors.add("코드 그룹 '" + group.getCode() + "': " + e.getMessage());
                    errorCount++;
                }
            }
            
            // 일괄 저장
            if (!commonCodesToSave.isEmpty()) {
                commonCodeRepository.saveAll(commonCodesToSave);
                log.info("💾 {}개 공통코드 일괄 저장 완료", commonCodesToSave.size());
            }
            
            result.put("success", true);
            result.put("migratedCount", migratedCount);
            result.put("errorCount", errorCount);
            result.put("errors", errors);
            result.put("message", String.format("마이그레이션 완료: 성공 %d개, 실패 %d개", migratedCount, errorCount));
            
            log.info("✅ 코드 마이그레이션 완료: 성공={}, 실패={}", migratedCount, errorCount);
            
        } catch (Exception e) {
            log.error("❌ 코드 마이그레이션 실패", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("migratedCount", migratedCount);
            result.put("errorCount", errorCount);
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> rollbackMigration() {
        log.info("🔄 마이그레이션 롤백 시작");
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            long deletedCount = commonCodeRepository.count();
            commonCodeRepository.deleteAll();
            
            result.put("success", true);
            result.put("deletedCount", deletedCount);
            result.put("message", String.format("%d개 공통코드가 삭제되었습니다.", deletedCount));
            
            log.info("✅ 마이그레이션 롤백 완료: {}개 삭제", deletedCount);
            
        } catch (Exception e) {
            log.error("❌ 마이그레이션 롤백 실패", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
}
