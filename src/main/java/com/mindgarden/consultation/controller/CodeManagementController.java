package com.mindgarden.consultation.controller;

import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.dto.CodeGroupDto;
import com.mindgarden.consultation.dto.CodeValueDto;
import com.mindgarden.consultation.service.CodeInitializationService;
import com.mindgarden.consultation.service.CodeManagementService;
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
 * 코드 관리 컨트롤러
 * 관리자가 코드 그룹과 코드 값을 관리할 수 있는 API
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
// @RestController  // 기존 테이블 삭제로 인해 비활성화
@RequestMapping("/api/admin/codes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CodeManagementController {
    
    private final CodeManagementService codeManagementService;
    private final CodeInitializationService codeInitializationService;
    
    // ==================== 코드 그룹 관리 ====================
    
    /**
     * 모든 코드 그룹 조회
     */
    @GetMapping("/groups")
    public ResponseEntity<List<CodeGroupDto>> getAllCodeGroups() {
        try {
            log.info("📋 코드 그룹 목록 조회");
            List<CodeGroupDto> codeGroups = codeManagementService.getAllCodeGroups();
            return ResponseEntity.ok(codeGroups);
        } catch (Exception e) {
            log.error("❌ 코드 그룹 목록 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 코드 그룹 생성
     */
    @PostMapping("/groups")
    public ResponseEntity<CodeGroupDto> createCodeGroup(@RequestBody CodeGroupDto dto) {
        try {
            log.info("➕ 코드 그룹 생성: {}", dto.getCode());
            CodeGroupDto created = codeManagementService.createCodeGroup(dto);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            log.error("❌ 코드 그룹 생성 실패", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 코드 그룹 수정
     */
    @PutMapping("/groups/{id}")
    public ResponseEntity<CodeGroupDto> updateCodeGroup(@PathVariable Long id, @RequestBody CodeGroupDto dto) {
        try {
            log.info("✏️ 코드 그룹 수정: ID={}", id);
            CodeGroupDto updated = codeManagementService.updateCodeGroup(id, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("❌ 코드 그룹 수정 실패", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 코드 그룹 삭제
     */
    @DeleteMapping("/groups/{id}")
    public ResponseEntity<Void> deleteCodeGroup(@PathVariable Long id) {
        try {
            log.info("🗑️ 코드 그룹 삭제: ID={}", id);
            codeManagementService.deleteCodeGroup(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("❌ 코드 그룹 삭제 실패", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    // ==================== 코드 값 관리 ====================
    
    /**
     * 코드 그룹별 코드 값 조회
     */
    @GetMapping("/values")
    public ResponseEntity<List<CodeValueDto>> getCodeValuesByGroup(@RequestParam String groupCode) {
        try {
            log.info("📋 코드 값 목록 조회: 그룹={}", groupCode);
            List<CodeValueDto> codeValues = codeManagementService.getCodeValuesByGroup(groupCode);
            return ResponseEntity.ok(codeValues);
        } catch (Exception e) {
            log.error("❌ 코드 값 목록 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 코드 값 생성
     */
    @PostMapping("/values")
    public ResponseEntity<CodeValueDto> createCodeValue(@RequestBody CodeValueDto dto) {
        try {
            log.info("➕ 코드 값 생성: 그룹={}, 코드={}", dto.getCodeGroupCode(), dto.getCode());
            CodeValueDto created = codeManagementService.createCodeValue(dto);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            log.error("❌ 코드 값 생성 실패", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 코드 값 수정
     */
    @PutMapping("/values/{id}")
    public ResponseEntity<CodeValueDto> updateCodeValue(@PathVariable Long id, @RequestBody CodeValueDto dto) {
        try {
            log.info("✏️ 코드 값 수정: ID={}", id);
            CodeValueDto updated = codeManagementService.updateCodeValue(id, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("❌ 코드 값 수정 실패", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 코드 값 삭제
     */
    @DeleteMapping("/values/{id}")
    public ResponseEntity<Void> deleteCodeValue(@PathVariable Long id) {
        try {
            log.info("🗑️ 코드 값 삭제: ID={}", id);
            codeManagementService.deleteCodeValue(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("❌ 코드 값 삭제 실패", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    // ==================== 코드 조회 API ====================
    
    /**
     * 코드 그룹별 코드 값 맵 조회 (캐시)
     */
    @GetMapping("/map")
    public ResponseEntity<Map<String, String>> getCodeValueMap(@RequestParam String groupCode) {
        try {
            log.info("🗂️ 코드 값 맵 조회: {}", groupCode);
            Map<String, String> codeMap = codeManagementService.getCodeValueMap(groupCode);
            return ResponseEntity.ok(codeMap);
        } catch (Exception e) {
            log.error("❌ 코드 값 맵 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 특정 코드의 한글명 조회
     */
    @GetMapping("/name")
    public ResponseEntity<String> getCodeName(@RequestParam String groupCode, @RequestParam String code) {
        try {
            log.info("🏷️ 코드명 조회: 그룹={}, 코드={}", groupCode, code);
            String name = codeManagementService.getCodeName(groupCode, code);
            return ResponseEntity.ok(name);
        } catch (Exception e) {
            log.error("❌ 코드명 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 상담 유형별 상담 시간 조회
     */
    @GetMapping("/duration")
    public ResponseEntity<Integer> getConsultationDuration(@RequestParam String consultationType) {
        try {
            log.info("⏱️ 상담 시간 조회: {}", consultationType);
            Integer duration = codeManagementService.getConsultationDuration(consultationType);
            return ResponseEntity.ok(duration);
        } catch (Exception e) {
            log.error("❌ 상담 시간 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 기본 코드 초기화
     */
    @PostMapping("/initialize")
    public ResponseEntity<Map<String, Object>> initializeDefaultCodes() {
        try {
            log.info("🚀 기본 코드 초기화 시작");
            codeInitializationService.initializeDefaultCodes();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "기본 코드가 성공적으로 초기화되었습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 코드 초기화 실패", e);
            return ResponseEntity.status(500)
                .body(Map.of(
                    "success", false,
                    "message", "코드 초기화에 실패했습니다: " + e.getMessage()
                ));
        }
    }
}
