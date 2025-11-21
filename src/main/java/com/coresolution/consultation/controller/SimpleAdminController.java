package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.ConsultantRegistrationDto;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
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
public class SimpleAdminController extends BaseApiController {

    private final AdminService adminService;

    @GetMapping("/hello")
    public String hello() {
        return "Admin Test Controller is working!";
    }

    @PostMapping("/consultants")
    public ResponseEntity<ApiResponse<User>> registerConsultant(@RequestBody ConsultantRegistrationDto request) {
        log.info("🔧 상담사 등록 시도: {}", request.getUsername());
        User consultant = adminService.registerConsultant(request);
        log.info("✅ 상담사 등록 성공: {}", consultant.getUsername());
        return created("상담사가 등록되었습니다.", consultant);
    }

    @GetMapping("/consultants")
    public ResponseEntity<ApiResponse<java.util.List<User>>> getConsultants() {
        log.info("🔍 상담사 목록 조회 시도");
        var consultants = adminService.getAllConsultants();
        log.info("✅ 상담사 목록 조회 성공: {}명", consultants.size());
        return success(consultants);
    }
}
