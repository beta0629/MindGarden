package com.mindgarden.consultation.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.repository.CommonCodeRepository;
import com.mindgarden.consultation.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 지점 코드 초기화 컨트롤러
 * HQ 본사 코드 추가를 위한 임시 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/branch-init")
@RequiredArgsConstructor
public class BranchCodeInitController {
    
    private final CommonCodeRepository commonCodeRepository;
    private final UserRepository userRepository;
    
    /**
     * HQ 본사 코드 추가
     */
    @PostMapping("/add-hq-code")
    public ResponseEntity<Map<String, Object>> addHQBranchCode() {
        try {
            log.info("HQ 본사 코드 추가 시작");
            
            // 1. 기존 HQ 코드가 있는지 확인
            var existingHQ = commonCodeRepository.findByCodeGroupAndCodeValue("BRANCH", "HQ");
            boolean hqExists = existingHQ.isPresent();
            
            if (!hqExists) {
                // 2. HQ 본사 코드 생성
                CommonCode hqCode = new CommonCode();
                hqCode.setCodeGroup("BRANCH");
                hqCode.setCodeValue("HQ");
                hqCode.setCodeLabel("본사");
                hqCode.setCodeDescription("마인드가든 본사");
                hqCode.setSortOrder(1);
                hqCode.setIsActive(true);
                hqCode.setIsDeleted(false);
                hqCode.setCreatedAt(LocalDateTime.now());
                hqCode.setUpdatedAt(LocalDateTime.now());
                hqCode.setVersion(0L);
                hqCode.setExtraData("{\"type\": \"headquarters\", \"address\": \"서울특별시 강남구 테헤란로 456\", \"phone\": \"02-1234-5678\", \"email\": \"hq@mindgarden.com\"}");
                
                commonCodeRepository.save(hqCode);
                log.info("HQ 본사 코드 추가 완료");
            } else {
                log.info("HQ 본사 코드가 이미 존재함");
            }
            
            // 3. 본사 관리자 계정의 지점 코드를 HQ로 업데이트
            var hqAdmin = userRepository.findByEmail("super_hq_admin@mindgarden.com");
            int updatedUsers = 0;
            
            if (hqAdmin.isPresent()) {
                var admin = hqAdmin.get();
                admin.setBranchCode("HQ");
                admin.setUpdatedAt(LocalDateTime.now());
                userRepository.save(admin);
                updatedUsers++;
                log.info("본사 관리자 계정 지점 코드 업데이트: {} -> HQ", admin.getEmail());
            }
            
            // 4. 본사 역할의 모든 사용자 업데이트
            var hqUsers = userRepository.findByRoleIn(List.of("HQ_ADMIN", "SUPER_HQ_ADMIN", "HQ_MASTER"));
            for (var user : hqUsers) {
                if (!"HQ".equals(user.getBranchCode())) {
                    user.setBranchCode("HQ");
                    user.setUpdatedAt(LocalDateTime.now());
                    userRepository.save(user);
                    updatedUsers++;
                    log.info("본사 사용자 지점 코드 업데이트: {} -> HQ", user.getEmail());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "HQ 본사 코드가 성공적으로 추가되었습니다.");
            response.put("hqCodeExists", hqExists);
            response.put("updatedUsers", updatedUsers);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("HQ 본사 코드 추가 중 오류 발생: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "HQ 본사 코드 추가 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 현재 지점 코드 목록 조회
     */
    @PostMapping("/list-branch-codes")
    public ResponseEntity<Map<String, Object>> listBranchCodes() {
        try {
            log.info("지점 코드 목록 조회");
            
            var branchCodes = commonCodeRepository.findByCodeGroupAndIsActiveTrueOrderBySortOrderAsc("BRANCH");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("branchCodes", branchCodes);
            response.put("totalCount", branchCodes.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("지점 코드 목록 조회 중 오류 발생: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "지점 코드 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
