package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.dto.ConsultantRegistrationDto;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 간단한 관리자 테스트용 컨트롤러 (보안 없음)
 */
@Slf4j
@RestController
@RequestMapping("/api/admin-simple")
@RequiredArgsConstructor
public class SimpleAdminController {

    private final AdminService adminService;

    @GetMapping("/hello")
    public String hello() {
        return "Admin Test Controller is working!";
    }

    @PostMapping("/consultants")
    public ResponseEntity<?> registerConsultant(@RequestBody ConsultantRegistrationDto request) {
        try {
            log.info("🔧 상담사 등록 시도: {}", request.getUsername());
            User consultant = adminService.registerConsultant(request);
            log.info("✅ 상담사 등록 성공: {}", consultant.getUsername());
            return ResponseEntity.ok(consultant);
        } catch (Exception e) {
            log.error("❌ 상담사 등록 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("상담사 등록 실패: " + e.getMessage());
        }
    }

    @GetMapping("/consultants")
    public ResponseEntity<?> getConsultants() {
        try {
            log.info("🔍 상담사 목록 조회 시도");
            var consultants = adminService.getAllConsultants();
            log.info("✅ 상담사 목록 조회 성공: {}명", consultants.size());
            return ResponseEntity.ok(consultants);
        } catch (Exception e) {
            log.error("❌ 상담사 목록 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("상담사 목록 조회 실패: " + e.getMessage());
        }
    }
}
