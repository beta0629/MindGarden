package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.util.BranchAccountCreator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 테스트용 컨트롤러
 * 작성일: 2025-09-23
 * 설명: 지점별 계정 생성 및 테스트 기능
 */
@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    private BranchAccountCreator branchAccountCreator;

    /**
     * 모든 지점의 계정 생성
     */
    @PostMapping("/create-branch-accounts")
    public ResponseEntity<Map<String, Object>> createAllBranchAccounts() {
        try {
            branchAccountCreator.createAllBranchAccounts();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "모든 지점 계정이 성공적으로 생성되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "계정 생성 중 오류가 발생했습니다: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 특정 지점의 계정 생성
     */
    @PostMapping("/create-branch-account/{branchCode}")
    public ResponseEntity<Map<String, Object>> createBranchAccount(@PathVariable String branchCode) {
        try {
            branchAccountCreator.createBranchAccount(branchCode);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "지점 " + branchCode + " 계정이 성공적으로 생성되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "계정 생성 중 오류가 발생했습니다: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 테스트 상태 확인
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getTestStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "테스트 서버가 정상적으로 작동 중입니다.");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
}
