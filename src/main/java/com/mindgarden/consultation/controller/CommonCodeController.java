package com.mindgarden.consultation.controller;

import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.service.CommonCodeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
 * @since 2025-01-17
 */
@Slf4j
@RestController
@RequestMapping("/api/common-codes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CommonCodeController {

    private final CommonCodeService commonCodeService;

    /**
     * 공통코드 그룹별 조회
     * 
     * @param groups 쉼표로 구분된 그룹 목록 (예: "USER_ROLE,BRANCH_STATUS")
     * @return 그룹별 공통코드 맵
     */
    @GetMapping("/groups")
    public ResponseEntity<Map<String, List<CommonCode>>> getCommonCodesByGroups(
            @RequestParam String groups) {
        try {
            log.info("공통코드 그룹별 조회 요청: {}", groups);
            
            String[] groupArray = groups.split(",");
            Map<String, List<CommonCode>> result = commonCodeService.getCommonCodesByGroups(groupArray);
            
            log.info("공통코드 조회 완료: {} 그룹", result.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("공통코드 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 특정 그룹의 공통코드 조회
     * 
     * @param groupCode 그룹 코드
     * @return 공통코드 목록
     */
    @GetMapping("/group/{groupCode}")
    public ResponseEntity<List<CommonCode>> getCommonCodesByGroup(
            @PathVariable String groupCode) {
        try {
            log.info("공통코드 그룹 조회 요청: {}", groupCode);
            
            List<CommonCode> codes = commonCodeService.getCommonCodesByGroup(groupCode);
            
            log.info("공통코드 그룹 조회 완료: {} 개", codes.size());
            return ResponseEntity.ok(codes);
        } catch (Exception e) {
            log.error("공통코드 그룹 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 공통코드 상세 조회
     * 
     * @param groupCode 그룹 코드
     * @param codeValue 코드 값
     * @return 공통코드 상세 정보
     */
    @GetMapping("/{groupCode}/{codeValue}")
    public ResponseEntity<CommonCode> getCommonCode(
            @PathVariable String groupCode,
            @PathVariable String codeValue) {
        try {
            log.info("공통코드 상세 조회 요청: {}/{}", groupCode, codeValue);
            
            CommonCode code = commonCodeService.getCommonCode(groupCode, codeValue);
            
            if (code == null) {
                log.warn("공통코드를 찾을 수 없음: {}/{}", groupCode, codeValue);
                return ResponseEntity.notFound().build();
            }
            
            log.info("공통코드 상세 조회 완료: {}", code.getCodeLabel());
            return ResponseEntity.ok(code);
        } catch (Exception e) {
            log.error("공통코드 상세 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 활성 공통코드만 조회
     * 
     * @param groups 쉼표로 구분된 그룹 목록
     * @return 활성 공통코드 맵
     */
    @GetMapping("/active")
    public ResponseEntity<Map<String, List<CommonCode>>> getActiveCommonCodes(
            @RequestParam String groups) {
        try {
            log.info("활성 공통코드 조회 요청: {}", groups);
            
            String[] groupArray = groups.split(",");
            Map<String, List<CommonCode>> result = commonCodeService.getActiveCommonCodesByGroups(groupArray);
            
            log.info("활성 공통코드 조회 완료: {} 그룹", result.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("활성 공통코드 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 공통코드 그룹 목록 조회
     * 
     * @return 그룹 목록
     */
    @GetMapping("/groups/list")
    public ResponseEntity<List<String>> getCommonCodeGroups() {
        try {
            log.info("공통코드 그룹 목록 조회 요청");
            
            List<String> groups = commonCodeService.getCommonCodeGroups();
            
            log.info("공통코드 그룹 목록 조회 완료: {} 개", groups.size());
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            log.error("공통코드 그룹 목록 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 공통코드 비활성화
     * 
     * @param request 비활성화할 코드값 목록
     * @return 처리 결과
     */
    @PutMapping("/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateCommonCodes(
            @RequestBody Map<String, Object> request) {
        try {
            log.info("공통코드 비활성화 요청: {}", request);
            
            @SuppressWarnings("unchecked")
            List<String> codeValues = (List<String>) request.get("codeValues");
            
            if (codeValues == null || codeValues.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "비활성화할 코드값이 없습니다."
                ));
            }
            
            int deactivatedCount = commonCodeService.deactivateCommonCodes(codeValues);
            
            log.info("공통코드 비활성화 완료: {} 개", deactivatedCount);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "공통코드 비활성화가 완료되었습니다.",
                "deactivatedCount", deactivatedCount
            ));
        } catch (Exception e) {
            log.error("공통코드 비활성화 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "공통코드 비활성화에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}