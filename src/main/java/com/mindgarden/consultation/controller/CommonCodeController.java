package com.mindgarden.consultation.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.mindgarden.consultation.dto.CommonCodeDto;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.entity.CodeGroupMetadata;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.repository.CodeGroupMetadataRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 공통코드 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/common-codes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CommonCodeController {

    private final CommonCodeService commonCodeService;
    private final CodeGroupMetadataRepository codeGroupMetadataRepository;

    /**
     * 코드 그룹별 코드 값 조회 (기존 API 호환성)
     */
    @GetMapping("/values")
    public ResponseEntity<?> getCodeValuesByGroup(@RequestParam String groupCode, @RequestParam(required = false) String userRole) {
        try {
            log.info("📋 코드 값 목록 조회: 그룹={}, 요청자 역할={}", groupCode, userRole);
            
            // 관리자 권한 확인 (userRole이 제공된 경우에만)
            if (userRole != null && !"ADMIN".equals(userRole) && !"HQ_MASTER".equals(userRole) && !"BRANCH_HQ_MASTER".equals(userRole) && !"BRANCH_SUPER_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole) && !"HQ_ADMIN".equals(userRole)) {
                log.warn("❌ 관리자 권한 없음: {}", userRole);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            List<CommonCode> commonCodes = commonCodeService.getCommonCodesByGroup(groupCode);
            return ResponseEntity.ok(commonCodes);
        } catch (Exception e) {
            log.error("❌ 코드 값 목록 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 모든 공통코드 조회
     */
    @GetMapping
    public ResponseEntity<?> getAllCommonCodes() {
        try {
            log.info("🔍 모든 공통코드 조회");
            List<CommonCode> commonCodes = commonCodeService.getAllCommonCodes();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", commonCodes,
                "count", commonCodes.size()
            ));
        } catch (Exception e) {
            log.error("❌ 공통코드 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "공통코드 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 코드 그룹별 조회
     */
    @GetMapping("/group/{codeGroup}")
    public ResponseEntity<?> getCommonCodesByGroup(@PathVariable String codeGroup) {
        try {
            log.info("🔍 코드 그룹별 공통코드 조회: {}", codeGroup);
            List<CommonCode> commonCodes = commonCodeService.getCommonCodesByGroup(codeGroup);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", commonCodes,
                "count", commonCodes.size()
            ));
        } catch (Exception e) {
            log.error("❌ 코드 그룹별 공통코드 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "코드 그룹별 공통코드 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 활성 코드만 조회
     */
    @GetMapping("/group/{codeGroup}/active")
    public ResponseEntity<?> getActiveCommonCodesByGroup(@PathVariable String codeGroup) {
        try {
            log.info("🔍 활성 코드 그룹별 공통코드 조회: {}", codeGroup);
            List<CommonCode> commonCodes = commonCodeService.getActiveCommonCodesByGroup(codeGroup);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", commonCodes,
                "count", commonCodes.size()
            ));
        } catch (Exception e) {
            log.error("❌ 활성 코드 그룹별 공통코드 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "활성 코드 그룹별 공통코드 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * ID로 공통코드 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getCommonCodeById(@PathVariable Long id) {
        try {
            log.info("🔍 공통코드 ID로 조회: {}", id);
            CommonCode commonCode = commonCodeService.getCommonCodeById(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", commonCode
            ));
        } catch (Exception e) {
            log.error("❌ 공통코드 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "공통코드 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 공통코드 생성
     */
    @PostMapping
    public ResponseEntity<?> createCommonCode(@RequestBody CommonCodeDto dto) {
        try {
            log.info("🔧 공통코드 생성: {} - {}", dto.getCodeGroup(), dto.getCodeValue());
            CommonCode commonCode = commonCodeService.createCommonCode(dto);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "공통코드가 성공적으로 생성되었습니다",
                "data", commonCode
            ));
        } catch (Exception e) {
            log.error("❌ 공통코드 생성 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "공통코드 생성에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 공통코드 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCommonCode(@PathVariable Long id, @RequestBody CommonCodeDto dto) {
        try {
            log.info("🔧 공통코드 수정: {}", id);
            CommonCode commonCode = commonCodeService.updateCommonCode(id, dto);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "공통코드가 성공적으로 수정되었습니다",
                "data", commonCode
            ));
        } catch (Exception e) {
            log.error("❌ 공통코드 수정 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "공통코드 수정에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 공통코드 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCommonCode(@PathVariable Long id) {
        try {
            log.info("🗑️ 공통코드 삭제: {}", id);
            commonCodeService.deleteCommonCode(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "공통코드가 성공적으로 삭제되었습니다"
            ));
        } catch (Exception e) {
            log.error("❌ 공통코드 삭제 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "공통코드 삭제에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 공통코드 상태 토글
     */
    @PostMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleCommonCodeStatus(@PathVariable Long id) {
        try {
            log.info("🔄 공통코드 상태 토글: {}", id);
            CommonCode commonCode = commonCodeService.toggleCommonCodeStatus(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "공통코드 상태가 변경되었습니다",
                "data", commonCode
            ));
        } catch (Exception e) {
            log.error("❌ 공통코드 상태 토글 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "공통코드 상태 변경에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 모든 코드 그룹 목록 조회
     */
    @GetMapping("/groups")
    public ResponseEntity<?> getAllCodeGroups() {
        try {
            log.info("🔍 모든 코드 그룹 조회");
            List<String> codeGroups = commonCodeService.getAllCodeGroups();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", codeGroups,
                "count", codeGroups.size()
            ));
        } catch (Exception e) {
            log.error("❌ 코드 그룹 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "코드 그룹 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 코드 그룹별 통계 조회
     */
    @GetMapping("/group/{codeGroup}/statistics")
    public ResponseEntity<?> getCodeGroupStatistics(@PathVariable String codeGroup) {
        try {
            log.info("📊 코드 그룹 통계 조회: {}", codeGroup);
            Map<String, Object> statistics = commonCodeService.getCodeGroupStatistics(codeGroup);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", statistics
            ));
        } catch (Exception e) {
            log.error("❌ 코드 그룹 통계 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "코드 그룹 통계 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 공통코드 일괄 생성
     */
    @PostMapping("/batch")
    public ResponseEntity<?> createCommonCodesBatch(@RequestBody List<CommonCodeDto> dtos) {
        try {
            log.info("🔧 공통코드 일괄 생성: {}개", dtos.size());
            List<CommonCode> commonCodes = commonCodeService.createCommonCodesBatch(dtos);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "공통코드가 일괄 생성되었습니다",
                "data", commonCodes,
                "count", commonCodes.size()
            ));
        } catch (Exception e) {
            log.error("❌ 공통코드 일괄 생성 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "공통코드 일괄 생성에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 코드그룹 메타데이터 조회 (한글명, 아이콘, 색상 등)
     */
    @GetMapping("/group-metadata")
    public ResponseEntity<?> getCodeGroupMetadata() {
        try {
            log.info("📋 코드그룹 메타데이터 조회");
            List<CodeGroupMetadata> metadata = codeGroupMetadataRepository.findAllActiveOrderByDisplayOrder();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", metadata,
                "count", metadata.size()
            ));
        } catch (Exception e) {
            log.error("❌ 코드그룹 메타데이터 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "코드그룹 메타데이터 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 특정 코드그룹의 한글명 조회
     */
    @GetMapping("/group/{groupName}/korean-name")
    public ResponseEntity<?> getCodeGroupKoreanName(@PathVariable String groupName) {
        try {
            log.info("📋 코드그룹 한글명 조회: {}", groupName);
            Optional<CodeGroupMetadata> metadata = codeGroupMetadataRepository.findByGroupNameAndIsActiveTrue(groupName);
            
            if (metadata.isPresent()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                        "groupName", groupName,
                        "koreanName", metadata.get().getKoreanName(),
                        "icon", metadata.get().getIcon(),
                        "colorCode", metadata.get().getColorCode(),
                        "description", metadata.get().getDescription()
                    )
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                        "groupName", groupName,
                        "koreanName", groupName // 메타데이터가 없으면 원본 그룹명 반환
                    )
                ));
            }
        } catch (Exception e) {
            log.error("❌ 코드그룹 한글명 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "코드그룹 한글명 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 코드그룹별 표시 옵션 조회 (색상, 아이콘 등)
     */
    @GetMapping("/group/{groupName}/display-options")
    public ResponseEntity<?> getCodeGroupDisplayOptions(@PathVariable String groupName) {
        try {
            log.info("📋 코드그룹 표시 옵션 조회: {}", groupName);
            
            // 코드그룹 메타데이터 조회
            Optional<CodeGroupMetadata> groupMetadata = codeGroupMetadataRepository.findByGroupNameAndIsActiveTrue(groupName);
            
            // 해당 그룹의 모든 코드 조회 (아이콘, 색상 포함)
            List<CommonCode> codes = commonCodeService.getCommonCodesByGroup(groupName);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "groupName", groupName,
                "groupMetadata", groupMetadata.orElse(null),
                "codes", codes.stream().map(code -> Map.of(
                    "codeValue", code.getCodeValue(),
                    "codeLabel", code.getCodeLabel(),
                    "icon", code.getIcon(),
                    "colorCode", code.getColorCode(),
                    "koreanName", code.getKoreanName(),
                    "isActive", code.getIsActive()
                )).toList(),
                "count", codes.size()
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 코드그룹 표시 옵션 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "코드그룹 표시 옵션 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 코드그룹 메타데이터 생성/수정
     */
    @PostMapping("/group-metadata")
    public ResponseEntity<?> createOrUpdateGroupMetadata(@RequestBody CodeGroupMetadata metadata) {
        try {
            log.info("🔧 코드그룹 메타데이터 생성/수정: {}", metadata.getGroupName());
            
            CodeGroupMetadata savedMetadata = codeGroupMetadataRepository.save(metadata);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "코드그룹 메타데이터가 저장되었습니다",
                "data", savedMetadata
            ));
        } catch (Exception e) {
            log.error("❌ 코드그룹 메타데이터 저장 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "코드그룹 메타데이터 저장에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 코드그룹 메타데이터 삭제
     */
    @DeleteMapping("/group-metadata/{groupName}")
    public ResponseEntity<?> deleteGroupMetadata(@PathVariable String groupName) {
        try {
            log.info("🗑️ 코드그룹 메타데이터 삭제: {}", groupName);
            
            Optional<CodeGroupMetadata> metadata = codeGroupMetadataRepository.findByGroupNameAndIsActiveTrue(groupName);
            if (metadata.isPresent()) {
                CodeGroupMetadata toDelete = metadata.get();
                toDelete.setIsActive(false);
                codeGroupMetadataRepository.save(toDelete);
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "코드그룹 메타데이터가 삭제되었습니다"
                ));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("❌ 코드그룹 메타데이터 삭제 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "코드그룹 메타데이터 삭제에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}
