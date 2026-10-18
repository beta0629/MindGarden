package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;
import com.coresolution.consultation.dto.CommonCodeDto;
import com.coresolution.consultation.dto.CommonCodeCreateRequest;
import com.coresolution.consultation.dto.CommonCodeUpdateRequest;
import com.coresolution.consultation.dto.CommonCodeResponse;
import com.coresolution.consultation.dto.CommonCodeListResponse;
import java.util.Collections;
import com.coresolution.consultation.constant.ExpenseCommonCodeSsotConstants;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.CodeGroupMetadata;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.CodeGroupMetadataRepository;
import com.coresolution.consultation.service.CommonCodeDeletionGuard;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.CommonCodePermissionService;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.util.CommonCodeFieldNormalizer;
import com.coresolution.consultation.util.CommonCodeSubcategoryParents;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
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
    private final CommonCodeDeletionGuard commonCodeDeletionGuard;

    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getAllCommonCodes() {
        log.info("🔍 모든 공통코드 조회");
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return commonCodeRepository.findByTenantId(tenantId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getCommonCodesByGroup(String codeGroup) {
        log.info("🔍 코드 그룹별 공통코드 조회 (테넌트+코어 폴백, 활성): {}", codeGroup);
        return getCodesByGroupWithCurrentTenant(codeGroup);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getActiveCommonCodesByGroup(String codeGroup) {
        log.info("🔍 활성 코드 그룹별 공통코드 조회 (테넌트+코어 폴백): {}", codeGroup);
        return getCodesByGroupWithCurrentTenant(codeGroup);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getActiveCodesByGroup(String codeGroup) {
        log.info("🔍 활성 코드 그룹별 공통코드 조회 (Map 형태, 테넌트+코어 폴백): {}", codeGroup);
        return toActiveCodeMapList(getCodesByGroupWithCurrentTenant(codeGroup));
    }

    /**
     * 활성 공통코드 엔티티 목록을 ERP·통계 등에서 쓰는 Map 스키마로 변환한다.
     * codeValue/parentCodeGroup/parentCodeValue 는 응답 시 공백 trim (레거시 DB 패딩 방어).
     * codeLabel/codeDescription 등 라벨·본문은 원문 그대로.
     */
    private List<Map<String, Object>> toActiveCodeMapList(List<CommonCode> codes) {
        return codes.stream().map(code -> {
            Map<String, Object> codeMap = new HashMap<>();
            codeMap.put("id", code.getId());
            codeMap.put("codeValue", CommonCodeFieldNormalizer.normalizeCodeValue(code.getCodeValue()));
            codeMap.put("codeLabel", code.getCodeLabel());
            codeMap.put("codeDescription", code.getCodeDescription());
            codeMap.put("sortOrder", code.getSortOrder());
            codeMap.put("parentCodeGroup", CommonCodeFieldNormalizer.normalizeCodeGroup(code.getParentCodeGroup()));
            codeMap.put("parentCodeValue", CommonCodeFieldNormalizer.normalizeCodeValue(code.getParentCodeValue()));
            return codeMap;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CommonCode getCommonCodeById(Long id) {
        log.info("🔍 공통코드 ID로 조회: {}", id);
        String tenantId = TenantContextHolder.getTenantId();
        // 1) 테넌트 컨텍스트가 있으면 해당 테넌트 행 우선, 2) 없으면 코어(글로벌) PK 폴백 — getCommonCodeByGroupAndValue와 동일한 혼합 정책
        if (tenantId != null && !tenantId.isEmpty()) {
            Optional<CommonCode> tenantRow = commonCodeRepository.findByTenantIdAndId(tenantId, id);
            if (tenantRow.isPresent()) {
                return tenantRow.get();
            }
            return commonCodeRepository.findActiveCoreCodeById(id)
                    .orElseThrow(() -> new RuntimeException("CommonCode not found with id: " + id));
        }
        // 테넌트 미설정: 테넌트 전용 행은 PK만으로 노출하지 않음(격리). 코어 코드만 허용.
        return commonCodeRepository.findActiveCoreCodeById(id)
                .orElseThrow(() -> new RuntimeException("CommonCode not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public CommonCode getCommonCodeByGroupAndValue(String codeGroup, String codeValue) {
        log.info("🔍 공통코드 그룹과 값으로 조회: {} - {}", codeGroup, codeValue);
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            List<CommonCode> tenantCandidates =
                commonCodeRepository.findTenantCodeCandidatesByGroupAndValue(tenantId, codeGroup, codeValue);
            if (!tenantCandidates.isEmpty()) {
                if (tenantCandidates.size() > 1) {
                    log.warn(
                        "공통코드 중복 감지(테넌트): tenantId={}, group={}, value={}, count={} -> 결정적 첫 행 선택(id={})",
                        tenantId,
                        codeGroup,
                        codeValue,
                        tenantCandidates.size(),
                        tenantCandidates.get(0).getId()
                    );
                }
                return tenantCandidates.get(0);
            }
        }
        List<CommonCode> coreCandidates =
            commonCodeRepository.findCoreCodeCandidatesByGroupAndValue(codeGroup, codeValue);
        if (!coreCandidates.isEmpty()) {
            if (coreCandidates.size() > 1) {
                log.warn(
                    "공통코드 중복 감지(코어): group={}, value={}, count={} -> 결정적 첫 행 선택(id={})",
                    codeGroup,
                    codeValue,
                    coreCandidates.size(),
                    coreCandidates.get(0).getId()
                );
            }
            return coreCandidates.get(0);
        }
        throw new RuntimeException("CommonCode not found: " + codeGroup + " - " + codeValue);
    }

    @Override
    @CacheEvict(value = {"tenantCodes", "coreCodes"}, allEntries = true)
    public CommonCode createCommonCode(CommonCodeDto dto) {
        String codeGroup = CommonCodeFieldNormalizer.normalizeCodeGroup(dto.getCodeGroup());
        String codeValue = CommonCodeFieldNormalizer.normalizeCodeValue(dto.getCodeValue());
        String codeLabel = dto.getCodeLabel();
        log.info("🔧 공통코드 생성 (캐시 무효화): {} - {}", codeGroup, codeValue);
        
        // 중복 체크
        if (commonCodeRepository.findByCodeGroupAndCodeValue(codeGroup, codeValue).isPresent()) {
            throw new RuntimeException("이미 존재하는 코드입니다: " + codeGroup + " - " + codeValue);
        }

        // 한글명 필수 검증 (한국 사용 필수)
        String koreanName = dto.getKoreanName();
        if (koreanName == null || koreanName.trim().isEmpty()) {
            // 한글명이 없으면 codeLabel을 한글명으로 사용
            koreanName = codeLabel != null ? codeLabel : codeValue;
            log.warn("⚠️ 한글명이 없어 codeLabel을 한글명으로 사용: {} = {}", codeValue, koreanName);
        }

        CommonCode commonCode = CommonCode.builder()
                .codeGroup(codeGroup)
                .codeValue(codeValue)
                .codeLabel(codeLabel)
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
        String codeGroup = CommonCodeFieldNormalizer.normalizeCodeGroup(dto.getCodeGroup());
        String codeValue = CommonCodeFieldNormalizer.normalizeCodeValue(dto.getCodeValue());
        String codeLabel = dto.getCodeLabel();
        
        // 코드 그룹과 값이 변경되는 경우 중복 체크
        if (!existingCode.getCodeGroup().equals(codeGroup) || 
            !existingCode.getCodeValue().equals(codeValue)) {
            if (commonCodeRepository.findByCodeGroupAndCodeValue(codeGroup, codeValue).isPresent()) {
                throw new RuntimeException("이미 존재하는 코드입니다: " + codeGroup + " - " + codeValue);
            }
        }

        existingCode.setCodeGroup(codeGroup);
        existingCode.setCodeValue(codeValue);
        existingCode.setCodeLabel(codeLabel);
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
            koreanName = codeLabel != null ? codeLabel : existingCode.getKoreanName();
            if (koreanName == null || koreanName.trim().isEmpty()) {
                koreanName = codeValue;
            }
            log.warn("⚠️ 한글명이 없어 codeLabel을 한글명으로 사용: {} = {}", codeValue, koreanName);
        }
        existingCode.setKoreanName(koreanName);

        return commonCodeRepository.save(existingCode);
    }

    @Override
    public void deleteCommonCode(Long id) {
        log.info("🗑️ 공통코드 삭제: {}", id);
        
        CommonCode commonCode = getCommonCodeById(id);
        commonCodeDeletionGuard.assertDeletable(commonCode);
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
                    String codeGroup = CommonCodeFieldNormalizer.normalizeCodeGroup(dto.getCodeGroup());
                    String codeValue = CommonCodeFieldNormalizer.normalizeCodeValue(dto.getCodeValue());
                    String codeLabel = dto.getCodeLabel();
                    // 한글명 필수 검증 (한국 사용 필수)
                    String koreanName = dto.getKoreanName();
                    if (koreanName == null || koreanName.trim().isEmpty()) {
                        // 한글명이 없으면 codeLabel을 한글명으로 사용
                        koreanName = codeLabel != null ? codeLabel : codeValue;
                        log.warn("⚠️ 한글명이 없어 codeLabel을 한글명으로 사용: {} = {}", codeValue, koreanName);
                    }
                    
                    return CommonCode.builder()
                            .codeGroup(codeGroup)
                            .codeValue(codeValue)
                            .codeLabel(codeLabel)
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
            return findActiveCommonCodeSafely(codeGroup, codeValue)
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
            return findActiveCommonCodeSafely(codeGroup, codeValue)
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
            return findActiveCommonCodeSafely(codeGroup, codeValue)
                    .map(CommonCode::getKoreanName)
                    .orElse(codeValue);
            
        } catch (Exception e) {
            log.error("한글명 조회 실패: 그룹={}, 값={}, 오류={}", codeGroup, codeValue, e.getMessage());
            return codeValue;
        }
    }

    /**
     * 공통코드 활성 row 안전망 lookup. 중복 row 가 발견되면 id ASC fallback 후 첫 row 반환.
     *
     * <p>현장 사례(SOLAPI_NOTIFICATION_MISS_DEBUG.md 결함 #4): 동일 tenant 에서
     * (ROLE,CONSULTANT)/(ROLE,CLIENT) 가 2건씩 발견되어 권한·매핑·알림 회귀 발생.
     * V73 마이그레이션이 데이터 중복을 정리하지만, 추후 재발 시에도 NPE 없이 첫 row 를
     * 반환하도록 코드 측 안전망을 둔다. fallback 진입은 WARN 로그로 가시화한다.
     *
     * @param codeGroup 코드 그룹
     * @param codeValue 코드 값
     * @return 활성 row 1건 (없으면 empty)
     * @since 2026-05-22
     */
    private Optional<CommonCode> findActiveCommonCodeSafely(String codeGroup, String codeValue) {
        try {
            return commonCodeRepository.findByCodeGroupAndCodeValueAndIsActiveTrue(codeGroup, codeValue);
        } catch (IncorrectResultSizeDataAccessException ex) {
            List<CommonCode> rows = commonCodeRepository
                    .findByCodeGroupAndCodeValueAndIsActiveTrueOrderByIdAsc(codeGroup, codeValue);
            log.warn("⚠️ 공통코드 중복 감지 (안전망 폴백): 그룹={}, 값={}, count={}, 첫 row id={}",
                    codeGroup, codeValue, rows.size(),
                    rows.isEmpty() ? null : rows.get(0).getId());
            return rows.stream().findFirst();
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
        if (groups == null || groups.length == 0) {
            log.warn("⚠️ 그룹 배열이 비어 있어 빈 결과를 반환합니다.");
            return new HashMap<>();
        }

        Set<String> normalizedGroups = new LinkedHashSet<>();
        for (String group : groups) {
            if (group == null) {
                continue;
            }
            String cleaned = group.trim();
            if (!cleaned.isEmpty()) {
                normalizedGroups.add(cleaned);
            }
        }

        if (normalizedGroups.isEmpty()) {
            log.warn("⚠️ 정제 후 유효한 그룹이 없어 빈 결과를 반환합니다.");
            return new HashMap<>();
        }

        log.info("🔍 여러 그룹의 공통코드 조회: {}", String.join(", ", normalizedGroups));

        Map<String, List<CommonCode>> result = new HashMap<>();
        for (String group : normalizedGroups) {
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
    public int deactivateCommonCodes(String tenantId, List<String> codeValues) {
        if (tenantId == null || tenantId.isEmpty()) {
            throw new IllegalArgumentException("테넌트 정보가 없어 공통코드를 비활성화할 수 없습니다.");
        }
        log.info("🔧 공통코드 비활성화 시작: tenantId={}, {} 개", tenantId, codeValues.size());
        
        int deactivatedCount = 0;
        
        for (String codeValue : codeValues) {
            try {
                // 해당 테넌트의 같은 코드값만 조회 (코어·타 테넌트 제외)
                List<CommonCode> codes = commonCodeRepository.findByTenantIdAndCodeValue(tenantId, codeValue);
                
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
    @Cacheable(value = "coreCodes", key = "#codeGroup", unless = "#result.isEmpty()")
    public List<CommonCode> getCoreCodesByGroup(String codeGroup) {
        log.info("🔍 코어솔루션 코드 그룹별 조회 (캐시 적용): {}", codeGroup);
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
    @Cacheable(value = "tenantCodes", key = "#tenantId + ':' + #codeGroup", unless = "#result.isEmpty()")
    public List<CommonCode> getTenantCodesByGroup(String tenantId, String codeGroup) {
        log.info("🔍 테넌트별 코드 그룹별 조회 (캐시 적용): 테넌트={}, 그룹={}", tenantId, codeGroup);
        return commonCodeRepository.findTenantCodesByGroup(tenantId, codeGroup);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getCurrentTenantCodesByGroup(String codeGroup) {
        return getCurrentTenantCodesByGroup(codeGroup, false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommonCode> getCurrentTenantCodesByGroup(String codeGroup, boolean includeInactive) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            // 테넌트 독립성 보장: 테넌트 컨텍스트가 없으면 빈 리스트 반환 (코어 코드 폴백 없음)
            log.warn("⚠️ 테넌트 컨텍스트가 없어 빈 리스트를 반환합니다 (독립성 보장): {}", codeGroup);
            return Collections.emptyList();
        }
        if (includeInactive) {
            return commonCodeRepository.findTenantCodesByGroupIncludingInactive(tenantId, codeGroup);
        }
        return getTenantCodesByGroup(tenantId, codeGroup);
    }
    
    @Override
    @Transactional(readOnly = true)
    public CommonCodeListResponse findAllTenantCodes() {
        return findAllTenantCodes(false);
    }

    @Override
    @Transactional(readOnly = true)
    public CommonCodeListResponse findAllTenantCodes(boolean includeInactive) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            // 테넌트 독립성 보장: 테넌트 컨텍스트가 없으면 빈 리스트 반환
            log.warn("⚠️ 테넌트 컨텍스트가 없어 빈 리스트를 반환합니다 (독립성 보장)");
            return CommonCodeListResponse.builder()
                    .codes(Collections.emptyList())
                    .totalCount(0L)
                    .activeCount(0L)
                    .inactiveCount(0L)
                    .build();
        }
        
        List<CommonCode> codes = includeInactive
                ? commonCodeRepository.findAllTenantCodesIncludingInactive(tenantId)
                : commonCodeRepository.findAllTenantCodes(tenantId);
        List<CommonCodeResponse> responses = codes.stream()
                .map(CommonCodeResponse::fromEntity)
                .collect(Collectors.toList());
        
        return CommonCodeListResponse.of(responses);
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
        if (tenantId == null || tenantId.isEmpty()) {
            return getCoreCodesByGroup(codeGroup);
        }
        // EXPENSE_/INCOME_ : 테넌트 행이 있으면 tenant-only (hybrid 동시 노출 금지)
        if (ExpenseCommonCodeSsotConstants.isTenantOperationalSsotGroup(codeGroup)) {
            long tenantCount = commonCodeRepository
                    .countByTenantIdAndCodeGroupAndIsDeletedFalse(tenantId, codeGroup);
            if (tenantCount > 0) {
                return commonCodeRepository.findTenantCodesByGroup(tenantId, codeGroup);
            }
            log.info("테넌트 EXPENSE/INCOME 시드 없음 → core 읽기 전용 폴백: tenantId={}, group={}",
                    tenantId, codeGroup);
            return getCoreCodesByGroup(codeGroup);
        }
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

    /**
     * {@link #getCodesByGroupWithCurrentTenant(String)}와 같은 테넌트 우선·코어 폴백 규칙으로 조회하되
     * 비활성 코드도 포함한다(관리자 목록용, 소거 제외).
     */
    private List<CommonCode> getCodesByGroupWithCurrentTenantIncludingInactive(String codeGroup) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            return commonCodeRepository.findCoreCodesByGroupIncludingInactive(codeGroup);
        }
        if (ExpenseCommonCodeSsotConstants.isTenantOperationalSsotGroup(codeGroup)) {
            long tenantCount = commonCodeRepository
                    .countByTenantIdAndCodeGroupAndIsDeletedFalse(tenantId, codeGroup);
            if (tenantCount > 0) {
                return commonCodeRepository.findTenantCodesByGroupIncludingInactive(tenantId, codeGroup);
            }
            return commonCodeRepository.findCoreCodesByGroupIncludingInactive(codeGroup);
        }
        return commonCodeRepository.findCodesByGroupWithFallbackIncludingInactive(tenantId, codeGroup);
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
        String codeGroup = CommonCodeFieldNormalizer.normalizeCodeGroup(request.getCodeGroup());
        String codeLabel = request.getCodeLabel();
        log.info("🔧 공통코드 생성 (표준화): {} - {}", codeGroup, request.getCodeValue());
        
        String tenantId = request.getTenantId() != null ? request.getTenantId() : TenantContextHolder.getTenantId();
        
        User user = null;
        if (createdBy != null && !createdBy.trim().isEmpty()) {
            try {
                Long userId = Long.parseLong(createdBy);
                String codeScopeTenant = tenantId != null && !tenantId.isEmpty() ? tenantId : null;
                user = findUserForCommonCodePermissionCheck(userId, codeScopeTenant).orElse(null);
            } catch (NumberFormatException e) {
                log.warn("⚠️ createdBy가 유효한 숫자가 아닙니다: {}", createdBy);
            }
        }
        
        if (!permissionService.canCreateCode(user, tenantId)) {
            String codeType = tenantId == null || tenantId.isEmpty() ? "코어" : "테넌트";
            String message = String.format("%s 코드 생성 권한이 없습니다.", codeType);
            log.warn("⚠️ 권한 없음: userId={}, codeType={}", createdBy, codeType);
            throw new SecurityException(message);
        }

        String normalizedCodeValue = CommonCodeFieldNormalizer.normalizeCodeValue(request.getCodeValue());
        if (normalizedCodeValue == null) {
            throw new IllegalArgumentException("코드 값은 필수입니다.");
        }
        
        // 중복 체크 (tenant_id 포함)
        Optional<CommonCode> existing = tenantId != null && !tenantId.isEmpty()
            ? commonCodeRepository.findTenantCodeByGroupAndValue(tenantId, codeGroup, normalizedCodeValue)
            : commonCodeRepository.findCoreCodeByGroupAndValue(codeGroup, normalizedCodeValue);
        
        if (existing.isPresent()) {
            throw new RuntimeException("이미 존재하는 코드입니다: " + codeGroup + " - " + normalizedCodeValue);
        }
        
        // 한글명 필수 검증
        String koreanName = request.getKoreanName();
        if (koreanName == null || koreanName.trim().isEmpty()) {
            koreanName = codeLabel != null ? codeLabel : normalizedCodeValue;
            log.warn("⚠️ 한글명이 없어 codeLabel을 한글명으로 사용: {} = {}", normalizedCodeValue, koreanName);
        }

        String parentGroup = request.getParentCodeGroup();
        String parentValue = request.getParentCodeValue();
        if (CommonCodeSubcategoryParents.isSubcategoryGroup(codeGroup)) {
            parentGroup = CommonCodeSubcategoryParents.expectedParentGroup(codeGroup);
            CommonCodeSubcategoryParents.requireValidParent(
                codeGroup,
                parentGroup,
                parentValue,
                (pg, pv) -> parentCategoryExists(tenantId, pg, pv));
        }
        
        CommonCode commonCode = CommonCode.builder()
                .codeGroup(codeGroup)
                .codeValue(normalizedCodeValue)
                .codeLabel(codeLabel)
                .codeDescription(request.getCodeDescription())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .parentCodeGroup(parentGroup)
                .parentCodeValue(parentValue)
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
                String codeScopeTenant = existingCode.getTenantId() != null && !existingCode.getTenantId().isEmpty()
                    ? existingCode.getTenantId()
                    : null;
                user = findUserForCommonCodePermissionCheck(userId, codeScopeTenant).orElse(null);
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
        
        // 다른 필드 업데이트 (codeLabel·본문은 trim 하지 않음)
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
        if (request.getParentCodeGroup() != null) {
            existingCode.setParentCodeGroup(trimToNull(request.getParentCodeGroup()));
        }
        if (request.getParentCodeValue() != null) {
            existingCode.setParentCodeValue(trimToNull(request.getParentCodeValue()));
        }
        if (CommonCodeSubcategoryParents.isSubcategoryGroup(existingCode.getCodeGroup())) {
            existingCode.setParentCodeGroup(CommonCodeSubcategoryParents.expectedParentGroup(existingCode.getCodeGroup()));
            String scopeTenant = existingCode.getTenantId();
            CommonCodeSubcategoryParents.requireValidParent(
                existingCode.getCodeGroup(),
                existingCode.getParentCodeGroup(),
                existingCode.getParentCodeValue(),
                (pg, pv) -> parentCategoryExists(scopeTenant, pg, pv));
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
                String codeScopeTenant = code.getTenantId() != null && !code.getTenantId().isEmpty()
                    ? code.getTenantId()
                    : null;
                user = findUserForCommonCodePermissionCheck(userId, codeScopeTenant).orElse(null);
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
        
        commonCodeDeletionGuard.assertDeletable(code);

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
        return findAll(codeGroup, false);
    }

    @Override
    @Transactional(readOnly = true)
    public CommonCodeListResponse findAll(String codeGroup, boolean includeInactive) {
        log.info("🔍 공통코드 목록 조회 (표준화): codeGroup={}, includeInactive={}", codeGroup, includeInactive);
        
        List<CommonCode> codes;
        if (codeGroup != null && !codeGroup.trim().isEmpty()) {
            codes = includeInactive
                    ? getCodesByGroupWithCurrentTenantIncludingInactive(codeGroup)
                    : getCodesByGroupWithCurrentTenant(codeGroup);
        } else {
            codes = getAllCommonCodes();
        }
        
        List<CommonCodeResponse> responses = codes.stream()
                .map(CommonCodeResponse::fromEntity)
                .collect(Collectors.toList());
        
        return CommonCodeListResponse.of(responses);
    }
    
    /**
     * 공통코드 CUD 권한 검증용 사용자 조회. 테넌트 코드는 해당 {@code tenantId}로만 조회한다.
     * 코어 코드({@code codeTenantId} 없음)는 {@link TenantContextHolder} 후, 둘 다 없으면 슈퍼관리 예외 경로로 활성 사용자만 조회한다.
     *
     * @param userId 사용자 PK
     * @param codeTenantId 테넌트 전용 코드의 tenantId (코어는 null)
     * @return 조회된 사용자
     * @author CoreSolution
     * @since 2026-03-29
     */
    private Optional<User> findUserForCommonCodePermissionCheck(Long userId, String codeTenantId) {
        if (userId == null) {
            return Optional.empty();
        }
        if (codeTenantId != null && !codeTenantId.isEmpty()) {
            return userRepository.findByTenantIdAndId(codeTenantId, userId);
        }
        String contextTenant = TenantContextHolder.getTenantId();
        if (contextTenant != null && !contextTenant.isEmpty()) {
            return userRepository.findByTenantIdAndId(contextTenant, userId);
        }
        log.warn(
            "코어/슈퍼관리 경로: 테넌트를 특정할 수 없어 사용자 PK 기준 활성 조회만 수행합니다. userId={}",
            userId
        );
        return userRepository.findActiveById(userId);
    }

    private static String trimToNull(String value) {
        return CommonCodeFieldNormalizer.trimToNull(value);
    }

    /**
     * 상위 카테고리 코드가 tenant(또는 core 폴백)에 활성으로 존재하는지 확인.
     *
     * @param tenantId    테넌트 ID (null/blank 이면 core 만)
     * @param parentGroup 상위 코드 그룹
     * @param parentValue 상위 코드값
     * @return 존재하면 true
     */
    private boolean parentCategoryExists(String tenantId, String parentGroup, String parentValue) {
        if (parentGroup == null || parentGroup.isBlank() || parentValue == null || parentValue.isBlank()) {
            return false;
        }
        if (tenantId != null && !tenantId.isBlank()) {
            if (commonCodeRepository.findTenantCodeByGroupAndValue(tenantId, parentGroup, parentValue).isPresent()) {
                return true;
            }
        }
        return commonCodeRepository.findCoreCodeByGroupAndValue(parentGroup, parentValue).isPresent();
    }
}
