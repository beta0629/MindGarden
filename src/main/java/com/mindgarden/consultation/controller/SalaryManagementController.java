package com.mindgarden.consultation.controller;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.ConsultantSalaryOption;
import com.mindgarden.consultation.entity.ConsultantSalaryProfile;
import com.mindgarden.consultation.entity.SalaryCalculation;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.AdminService;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.EmailService;
import com.mindgarden.consultation.service.SalaryCalculationService;
import com.mindgarden.consultation.service.TaxCalculationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 급여 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/salary")
@RequiredArgsConstructor
public class SalaryManagementController {
    
    private final SalaryCalculationService salaryCalculationService;
    private final CommonCodeService commonCodeService;
    private final AdminService adminService;
    private final TaxCalculationService taxCalculationService;
    private final EmailService emailService;
    
    // ==================== 상담사 관리 ====================
    
    /**
     * 상담사 목록 조회 (급여 관리용)
     */
    @GetMapping("/consultants")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> getConsultants() {
        try {
            log.info("🔍 상담사 목록 조회 (급여 관리용)");
            
            List<User> consultants = adminService.getAllConsultants();
            
            // Hibernate 프록시 객체 직렬화 문제를 피하기 위해 필요한 필드만 추출
            List<Map<String, Object>> consultantData = consultants.stream()
                .map(consultant -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("id", consultant.getId());
                    data.put("name", consultant.getName());
                    data.put("email", consultant.getEmail());
                    data.put("phone", consultant.getPhone());
                    data.put("role", consultant.getRole());
                    data.put("grade", consultant.getGrade());
                    data.put("isActive", consultant.getIsActive());
                    data.put("branchCode", consultant.getBranchCode());
                    data.put("specialization", consultant.getSpecialization());
                    data.put("createdAt", consultant.getCreatedAt());
                    data.put("updatedAt", consultant.getUpdatedAt());
                    // branch 객체는 제외하여 직렬화 문제 방지
                    return data;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", consultantData,
                "totalCount", consultantData.size()
            ));
        } catch (Exception e) {
            log.error("❌ 상담사 목록 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "상담사 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 상담사 등급 목록 조회
     */
    @GetMapping("/grades")
    public ResponseEntity<List<Map<String, Object>>> getGrades() {
        try {
            log.info("🔍 상담사 등급 목록 조회");
            List<com.mindgarden.consultation.entity.CommonCode> commonCodes = commonCodeService.getCommonCodesByGroup("CONSULTANT_GRADE");
            List<Map<String, Object>> grades = commonCodes.stream()
                .map(code -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", code.getId());
                    map.put("codeValue", code.getCodeValue());
                    map.put("codeLabel", code.getCodeLabel());
                    map.put("codeDescription", code.getCodeDescription());
                    map.put("extraData", code.getExtraData());
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(grades);
        } catch (Exception e) {
            log.error("❌ 상담사 등급 조회 실패", e);
            return ResponseEntity.internalServerError().body(new ArrayList<>());
        }
    }
    
    /**
     * 급여 옵션 유형 목록 조회
     */
    @GetMapping("/option-types")
    public ResponseEntity<List<Map<String, Object>>> getOptionTypes() {
        try {
            log.info("🔍 급여 옵션 유형 목록 조회");
            List<com.mindgarden.consultation.entity.CommonCode> commonCodes = commonCodeService.getCommonCodesByGroup("SALARY_OPTION_TYPE");
            List<Map<String, Object>> optionTypes = commonCodes.stream()
                .map(code -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", code.getId());
                    map.put("codeValue", code.getCodeValue());
                    map.put("codeLabel", code.getCodeLabel());
                    map.put("codeDescription", code.getCodeDescription());
                    map.put("extraData", code.getExtraData());
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(optionTypes);
        } catch (Exception e) {
            log.error("❌ 급여 옵션 유형 조회 실패", e);
            return ResponseEntity.internalServerError().body(new ArrayList<>());
        }
    }
    
    /**
     * 상담사 상세 정보 조회 (급여 관리용)
     */
    @GetMapping("/consultants/{consultantId}")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> getConsultant(@PathVariable Long consultantId) {
        try {
            log.info("🔍 상담사 상세 정보 조회: 상담사ID={}", consultantId);
            
            List<User> consultants = adminService.getAllConsultants();
            User consultant = consultants.stream()
                    .filter(c -> c.getId().equals(consultantId))
                    .findFirst()
                    .orElse(null);
            
            if (consultant == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", consultant
            ));
        } catch (Exception e) {
            log.error("❌ 상담사 상세 정보 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "상담사 상세 정보 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    // ==================== 급여 프로필 관리 ====================
    
    /**
     * 급여 프로필 목록 조회
     */
    @GetMapping("/profiles")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> getSalaryProfiles() {
        try {
            log.info("🔍 급여 프로필 목록 조회");
            
            // 모든 급여 프로필 조회
            List<ConsultantSalaryProfile> profiles = salaryCalculationService.getAllSalaryProfiles();
            
            // 상담사 정보와 함께 응답 구성
            List<Map<String, Object>> profileList = new ArrayList<>();
            for (ConsultantSalaryProfile profile : profiles) {
                // 상담사 정보 조회
                List<User> consultants = adminService.getAllConsultants();
                User consultant = consultants.stream()
                        .filter(c -> c.getId().equals(profile.getConsultantId()))
                        .findFirst()
                        .orElse(null);
                
                Map<String, Object> profileData = new HashMap<>();
                profileData.put("id", profile.getId());
                profileData.put("consultantId", profile.getConsultantId());
                profileData.put("salaryType", profile.getSalaryType());
                profileData.put("baseSalary", profile.getBaseSalary());
                profileData.put("contractTerms", profile.getContractTerms());
                profileData.put("isBusinessRegistered", profile.getIsBusinessRegistered());
                profileData.put("businessRegistrationNumber", profile.getBusinessRegistrationNumber());
                profileData.put("businessName", profile.getBusinessName());
                profileData.put("isActive", profile.getIsActive());
                profileData.put("createdAt", profile.getCreatedAt());
                profileData.put("updatedAt", profile.getUpdatedAt());
                
                if (consultant != null) {
                    Map<String, Object> consultantInfo = new HashMap<>();
                    consultantInfo.put("id", consultant.getId());
                    consultantInfo.put("name", consultant.getName());
                    consultantInfo.put("email", consultant.getEmail());
                    consultantInfo.put("grade", consultant.getGrade());
                    profileData.put("consultant", consultantInfo);
                }
                
                profileList.add(profileData);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", profileList);
            response.put("message", "급여 프로필 목록 조회 완료");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 급여 프로필 목록 조회 실패", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "급여 프로필 목록 조회에 실패했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 상담사 급여 프로필 생성
     */
    @PostMapping("/profiles")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> createSalaryProfile(@RequestBody Map<String, Object> request) {
        try {
            Long consultantId = Long.valueOf(request.get("consultantId").toString());
            String salaryType = request.get("salaryType").toString();
            BigDecimal baseSalary = new BigDecimal(request.get("baseSalary").toString());
            String contractTerms = request.get("contractTerms").toString();
            Boolean isBusinessRegistered = Boolean.valueOf(request.getOrDefault("isBusinessRegistered", "false").toString());
            String businessRegistrationNumber = request.getOrDefault("businessRegistrationNumber", "").toString();
            String businessName = request.getOrDefault("businessName", "").toString();
            
            log.info("🔧 급여 프로필 생성 요청: 상담사ID={}, 급여유형={}", consultantId, salaryType);
            
            // 상담사 유효성 검증
            List<User> consultants = adminService.getAllConsultants();
            User consultant = consultants.stream()
                    .filter(c -> c.getId().equals(consultantId))
                    .findFirst()
                    .orElse(null);
            
            if (consultant == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "존재하지 않는 상담사입니다: " + consultantId
                ));
            }
            
            ConsultantSalaryProfile profile = salaryCalculationService.createSalaryProfile(
                consultantId, salaryType, baseSalary, contractTerms, isBusinessRegistered, businessRegistrationNumber, businessName);
            
            // 옵션들은 상담 완료 시 자동으로 추가되므로 여기서는 처리하지 않음
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "급여 프로필이 성공적으로 생성되었습니다.");
            
            Map<String, Object> data = new HashMap<>();
            data.put("profileId", profile.getId());
            data.put("consultantId", consultantId);
            data.put("salaryType", salaryType);
            data.put("baseSalary", baseSalary);
            data.put("contractTerms", contractTerms);
            data.put("createdAt", profile.getCreatedAt());
            response.put("data", data);
            
            Map<String, Object> consultantInfo = new HashMap<>();
            consultantInfo.put("id", consultant.getId());
            consultantInfo.put("name", consultant.getName());
            consultantInfo.put("email", consultant.getEmail());
            consultantInfo.put("grade", consultant.getGrade());
            response.put("consultant", consultantInfo);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 급여 프로필 생성 실패", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "급여 프로필 생성에 실패했습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * 상담사 급여 프로필 조회
     */
    @GetMapping("/profiles/{consultantId}")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> getSalaryProfile(@PathVariable Long consultantId) {
        try {
            log.info("🔍 급여 프로필 조회: 상담사ID={}", consultantId);
            
            // 상담사 정보 조회
            List<User> consultants = adminService.getAllConsultants();
            User consultant = consultants.stream()
                    .filter(c -> c.getId().equals(consultantId))
                    .findFirst()
                    .orElse(null);
            
            if (consultant == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "존재하지 않는 상담사입니다: " + consultantId
                ));
            }
            
            ConsultantSalaryProfile profile = salaryCalculationService.getSalaryProfile(consultantId);
            if (profile == null) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "급여 프로필이 없습니다.",
                    "consultant", Map.of(
                        "id", consultant.getId(),
                        "name", consultant.getName(),
                        "email", consultant.getEmail(),
                        "grade", consultant.getGrade()
                    ),
                    "data", null
                ));
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", profile,
                "consultant", Map.of(
                    "id", consultant.getId(),
                    "name", consultant.getName(),
                    "email", consultant.getEmail(),
                    "grade", consultant.getGrade()
                )
            ));
        } catch (Exception e) {
            log.error("❌ 급여 프로필 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "급여 프로필 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 옵션 추가
     */
    @PostMapping("/options")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> addSalaryOption(@RequestBody Map<String, Object> request) {
        try {
            Long salaryProfileId = Long.valueOf(request.get("salaryProfileId").toString());
            String optionType = request.get("optionType").toString();
            BigDecimal optionAmount = new BigDecimal(request.get("optionAmount").toString());
            String description = request.get("description").toString();
            
            log.info("🔧 급여 옵션 추가: 프로필ID={}, 옵션타입={}", salaryProfileId, optionType);
            
            ConsultantSalaryOption option = salaryCalculationService.addSalaryOption(
                salaryProfileId, optionType, optionAmount, description);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "급여 옵션이 추가되었습니다.",
                "data", option
            ));
        } catch (Exception e) {
            log.error("❌ 급여 옵션 추가 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "급여 옵션 추가에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 옵션 조회
     */
    @GetMapping("/options/{salaryProfileId}")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> getSalaryOptions(@PathVariable Long salaryProfileId) {
        try {
            log.info("🔍 급여 옵션 조회: 프로필ID={}", salaryProfileId);
            
            List<ConsultantSalaryOption> options = salaryCalculationService.getSalaryOptions(salaryProfileId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", options
            ));
        } catch (Exception e) {
            log.error("❌ 급여 옵션 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "급여 옵션 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    // ==================== 급여 계산 ====================
    
    /**
     * 프리랜서 급여 계산
     */
    @PostMapping("/calculate/freelance")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> calculateFreelanceSalary(@RequestBody Map<String, Object> request) {
        try {
            Long consultantId = Long.valueOf(request.get("consultantId").toString());
            String period = request.get("period").toString();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> consultations = (List<Map<String, Object>>) request.get("consultations");
            
            log.info("💰 프리랜서 급여 계산 요청: 상담사ID={}, 기간={}", consultantId, period);
            
            SalaryCalculation calculation = salaryCalculationService.calculateFreelanceSalary(
                consultantId, period, consultations);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "프리랜서 급여가 계산되었습니다.",
                "data", calculation
            ));
        } catch (Exception e) {
            log.error("❌ 프리랜서 급여 계산 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "프리랜서 급여 계산에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 정규직 급여 계산
     */
    @PostMapping("/calculate/regular")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> calculateRegularSalary(@RequestBody Map<String, Object> request) {
        try {
            Long consultantId = Long.valueOf(request.get("consultantId").toString());
            String period = request.get("period").toString();
            BigDecimal baseSalary = new BigDecimal(request.get("baseSalary").toString());
            
            log.info("💰 정규직 급여 계산 요청: 상담사ID={}, 기간={}", consultantId, period);
            
            SalaryCalculation calculation = salaryCalculationService.calculateRegularSalary(
                consultantId, period, baseSalary);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "정규직 급여가 계산되었습니다.",
                "data", calculation
            ));
        } catch (Exception e) {
            log.error("❌ 정규직 급여 계산 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "정규직 급여 계산에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 계산 실행
     */
    @PostMapping("/calculate")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> calculateSalary(@RequestBody Map<String, Object> request) {
        try {
            log.info("💰 급여 계산 실행: {}", request);
            
            Long consultantId = Long.valueOf(request.get("consultantId").toString());
            String period = request.get("period").toString();
            String payDayCode = request.getOrDefault("payDayCode", "TENTH").toString();
            
            // 상담사 급여 프로필 조회
            ConsultantSalaryProfile profile = salaryCalculationService.getSalaryProfile(consultantId);
            if (profile == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "상담사 급여 프로필을 찾을 수 없습니다."));
            }
            
            // 급여 계산 실행
            SalaryCalculation calculation;
            if (profile.isFreelance()) {
                // 프리랜서 급여 계산
                calculation = salaryCalculationService.calculateFreelanceSalary(
                    consultantId, period, List.of(), payDayCode
                );
            } else {
                // 정규직 급여 계산
                calculation = salaryCalculationService.calculateRegularSalary(
                    consultantId, period, profile.getBaseSalary(), payDayCode
                );
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "급여 계산이 완료되었습니다.");
            
            Map<String, Object> data = new HashMap<>();
            data.put("calculationId", calculation.getId());
            data.put("consultantId", consultantId);
            data.put("period", period);
            data.put("payDayCode", payDayCode);
            data.put("baseSalary", calculation.getBaseSalary());
            data.put("optionSalary", calculation.getOptionSalary());
            data.put("totalSalary", calculation.getTotalSalary());
            data.put("taxAmount", calculation.getTaxAmount());
            data.put("consultationCount", calculation.getConsultationCount());
            data.put("status", calculation.getStatus());
            data.put("createdAt", calculation.getCreatedAt());
            
            response.put("data", data);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("급여 계산 실행 실패", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "급여 계산 실행에 실패했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * 급여 계산 내역 조회
     */
    @GetMapping("/calculations/{consultantId}")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> getSalaryCalculations(@PathVariable Long consultantId) {
        try {
            log.info("🔍 급여 계산 내역 조회: 상담사ID={}", consultantId);
            
            // 상담사 정보 조회
            List<User> consultants = adminService.getAllConsultants();
            User consultant = consultants.stream()
                    .filter(c -> c.getId().equals(consultantId))
                    .findFirst()
                    .orElse(null);
            
            if (consultant == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "존재하지 않는 상담사입니다: " + consultantId
                ));
            }
            
            List<SalaryCalculation> calculations = salaryCalculationService.getSalaryCalculations(consultantId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", calculations,
                "consultant", Map.of(
                    "id", consultant.getId(),
                    "name", consultant.getName(),
                    "email", consultant.getEmail(),
                    "grade", consultant.getGrade()
                )
            ));
        } catch (Exception e) {
            log.error("❌ 급여 계산 내역 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "급여 계산 내역 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 계산 승인
     */
    @PostMapping("/approve/{calculationId}")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> approveSalaryCalculation(@PathVariable Long calculationId) {
        try {
            log.info("✅ 급여 계산 승인: 계산ID={}", calculationId);
            
            boolean success = salaryCalculationService.approveSalaryCalculation(calculationId);
            
            return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "급여 계산이 승인되었습니다." : "급여 계산 승인에 실패했습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 급여 계산 승인 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "급여 계산 승인에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 지급 완료 처리
     */
    @PostMapping("/pay/{calculationId}")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> markSalaryAsPaid(@PathVariable Long calculationId) {
        try {
            log.info("💰 급여 지급 완료: 계산ID={}", calculationId);
            
            boolean success = salaryCalculationService.markSalaryAsPaid(calculationId);
            
            return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "급여 지급이 완료되었습니다." : "급여 지급 처리에 실패했습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 급여 지급 처리 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "급여 지급 처리에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    // ==================== 급여 통계 ====================
    
    /**
     * 급여 통계 조회
     */
    @GetMapping("/statistics")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> getSalaryStatistics(@RequestParam(required = false) String period) {
        try {
            log.info("📊 급여 통계 조회: 기간={}", period);
            
            Map<String, Object> statistics = new HashMap<>();
            
            if (period != null) {
                statistics.put("monthly", salaryCalculationService.getMonthlySalaryStatistics(period));
            }
            
            statistics.put("typeStatistics", salaryCalculationService.getSalaryTypeStatistics());
            statistics.put("pendingApproval", salaryCalculationService.getPendingApprovalSalaries());
            statistics.put("pendingPayment", salaryCalculationService.getPendingPaymentSalaries());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", statistics
            ));
        } catch (Exception e) {
            log.error("❌ 급여 통계 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "급여 통계 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    // ==================== 세금 계산 관리 ====================
    
    /**
     * 급여 계산별 세금 내역 조회
     */
    @GetMapping("/tax/{calculationId}")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> getTaxCalculations(@PathVariable Long calculationId) {
        try {
            log.info("🔍 세금 계산 내역 조회: 계산ID={}", calculationId);
            
            List<com.mindgarden.consultation.entity.SalaryTaxCalculation> taxCalculations = 
                taxCalculationService.getTaxCalculationsByCalculationId(calculationId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", taxCalculations,
                "totalCount", taxCalculations.size()
            ));
        } catch (Exception e) {
            log.error("❌ 세금 계산 내역 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "세금 계산 내역 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 세금 유형별 내역 조회
     */
    @GetMapping("/tax/type/{taxType}")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> getTaxCalculationsByType(@PathVariable String taxType) {
        try {
            log.info("🔍 세금 유형별 내역 조회: 세금유형={}", taxType);
            
            List<com.mindgarden.consultation.entity.SalaryTaxCalculation> taxCalculations = 
                taxCalculationService.getTaxCalculationsByType(taxType);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", taxCalculations,
                "totalCount", taxCalculations.size()
            ));
        } catch (Exception e) {
            log.error("❌ 세금 유형별 내역 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "세금 유형별 내역 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 세금 통계 조회
     */
    @GetMapping("/tax/statistics")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> getTaxStatistics(@RequestParam(required = false) String period) {
        try {
            log.info("📊 세금 통계 조회: 기간={}", period);
            
            Map<String, Object> statistics = taxCalculationService.getTaxStatistics(period);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", statistics
            ));
        } catch (Exception e) {
            log.error("❌ 세금 통계 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "세금 통계 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 추가 세금 계산
     */
    @PostMapping("/tax/calculate")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> calculateAdditionalTax(@RequestBody Map<String, Object> request) {
        try {
            Long calculationId = Long.valueOf(request.get("calculationId").toString());
            BigDecimal grossAmount = new BigDecimal(request.get("grossAmount").toString());
            String taxType = request.get("taxType").toString();
            BigDecimal taxRate = new BigDecimal(request.get("taxRate").toString());
            
            log.info("💰 추가 세금 계산: 계산ID={}, 총액={}, 세금유형={}, 세율={}", 
                    calculationId, grossAmount, taxType, taxRate);
            
            List<com.mindgarden.consultation.entity.SalaryTaxCalculation> taxCalculations = 
                taxCalculationService.calculateAdditionalTax(calculationId, grossAmount, taxType, taxRate);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "추가 세금이 계산되었습니다.",
                "data", taxCalculations
            ));
        } catch (Exception e) {
            log.error("❌ 추가 세금 계산 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "추가 세금 계산에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    // ==================== 데이터 정리 ====================
    
    /**
     * 중복된 급여 계산 기록 정리
     */
    @PostMapping("/cleanup")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> cleanupDuplicateCalculations() {
        try {
            log.info("🧹 중복 급여 계산 기록 정리 요청");
            
            int cleanedCount = salaryCalculationService.cleanupDuplicateCalculations();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", String.format("중복 급여 계산 기록 %d개가 정리되었습니다.", cleanedCount),
                "cleanedCount", cleanedCount
            ));
        } catch (Exception e) {
            log.error("❌ 중복 급여 계산 기록 정리 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "중복 급여 계산 기록 정리에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    // ==================== 출력 기능 ====================
    
    /**
     * 급여 계산서 PDF 출력
     */
    @PostMapping("/export/pdf")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> exportSalaryToPdf(@RequestBody Map<String, Object> request) {
        try {
            Long calculationId = Long.valueOf(request.get("calculationId").toString());
            String consultantName = request.get("consultantName").toString();
            String period = request.get("period").toString();
            @SuppressWarnings("unused")
            boolean includeTaxDetails = (Boolean) request.getOrDefault("includeTaxDetails", true);
            @SuppressWarnings("unused")
            boolean includeCalculationDetails = (Boolean) request.getOrDefault("includeCalculationDetails", true);
            
            log.info("📄 급여 계산서 PDF 출력: 계산ID={}, 상담사={}, 기간={}", calculationId, consultantName, period);
            
            // TODO: PDF 생성 로직 구현
            String filename = String.format("급여계산서_%s_%s.pdf", consultantName, period);
            String downloadUrl = "/api/admin/salary/download/" + filename;
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "PDF 파일이 생성되었습니다.",
                "data", Map.of(
                    "filename", filename,
                    "downloadUrl", downloadUrl,
                    "format", "PDF"
                )
            ));
        } catch (Exception e) {
            log.error("❌ PDF 출력 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "PDF 출력에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 계산서 Excel 출력
     */
    @PostMapping("/export/excel")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> exportSalaryToExcel(@RequestBody Map<String, Object> request) {
        try {
            Long calculationId = Long.valueOf(request.get("calculationId").toString());
            String consultantName = request.get("consultantName").toString();
            String period = request.get("period").toString();
            @SuppressWarnings("unused")
            boolean includeTaxDetails = (Boolean) request.getOrDefault("includeTaxDetails", true);
            @SuppressWarnings("unused")
            boolean includeCalculationDetails = (Boolean) request.getOrDefault("includeCalculationDetails", true);
            
            log.info("📊 급여 계산서 Excel 출력: 계산ID={}, 상담사={}, 기간={}", calculationId, consultantName, period);
            
            // TODO: Excel 생성 로직 구현
            String filename = String.format("급여계산서_%s_%s.xlsx", consultantName, period);
            String downloadUrl = "/api/admin/salary/download/" + filename;
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Excel 파일이 생성되었습니다.",
                "data", Map.of(
                    "filename", filename,
                    "downloadUrl", downloadUrl,
                    "format", "EXCEL"
                )
            ));
        } catch (Exception e) {
            log.error("❌ Excel 출력 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Excel 출력에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 급여 계산서 CSV 출력
     */
    @PostMapping("/export/csv")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> exportSalaryToCsv(@RequestBody Map<String, Object> request) {
        try {
            Long calculationId = Long.valueOf(request.get("calculationId").toString());
            String consultantName = request.get("consultantName").toString();
            String period = request.get("period").toString();
            @SuppressWarnings("unused")
            boolean includeTaxDetails = (Boolean) request.getOrDefault("includeTaxDetails", true);
            @SuppressWarnings("unused")
            boolean includeCalculationDetails = (Boolean) request.getOrDefault("includeCalculationDetails", true);
            
            log.info("📋 급여 계산서 CSV 출력: 계산ID={}, 상담사={}, 기간={}", calculationId, consultantName, period);
            
            // TODO: CSV 생성 로직 구현
            String filename = String.format("급여계산서_%s_%s.csv", consultantName, period);
            String downloadUrl = "/api/admin/salary/download/" + filename;
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "CSV 파일이 생성되었습니다.",
                "data", Map.of(
                    "filename", filename,
                    "downloadUrl", downloadUrl,
                    "format", "CSV"
                )
            ));
        } catch (Exception e) {
            log.error("❌ CSV 출력 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "CSV 출력에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    // ==================== 이메일 전송 ====================
    
    /**
     * 급여 계산서 이메일 전송
     */
    @PostMapping("/email/send")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> sendSalaryEmail(@RequestBody Map<String, Object> request) {
        try {
            String toEmail = request.get("toEmail").toString();
            String consultantName = request.get("consultantName").toString();
            String period = request.get("period").toString();
            String emailType = request.getOrDefault("emailType", "SALARY_CALCULATION").toString();
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) request.getOrDefault("data", new HashMap<>());
            String attachmentPath = (String) request.getOrDefault("attachmentPath", null);
            
            log.info("📧 급여 이메일 전송: to={}, 상담사={}, 기간={}, 유형={}", toEmail, consultantName, period, emailType);
            
            boolean success = false;
            String message = "";
            
            switch (emailType) {
                case "SALARY_CALCULATION" -> {
                    success = emailService.sendSalaryCalculationEmail(toEmail, consultantName, period, data, attachmentPath);
                    message = success ? "급여 계산서가 이메일로 발송되었습니다." : "급여 계산서 이메일 발송에 실패했습니다.";
                }
                case "SALARY_APPROVAL" -> {
                    String approvedAmount = data.getOrDefault("approvedAmount", "0").toString();
                    success = emailService.sendSalaryApprovalEmail(toEmail, consultantName, period, approvedAmount);
                    message = success ? "급여 승인 알림이 이메일로 발송되었습니다." : "급여 승인 알림 이메일 발송에 실패했습니다.";
                }
                case "SALARY_PAYMENT" -> {
                    String paidAmount = data.getOrDefault("paidAmount", "0").toString();
                    String payDate = data.getOrDefault("payDate", "").toString();
                    success = emailService.sendSalaryPaymentEmail(toEmail, consultantName, period, paidAmount, payDate);
                    message = success ? "급여 지급 완료 알림이 이메일로 발송되었습니다." : "급여 지급 완료 알림 이메일 발송에 실패했습니다.";
                }
                case "TAX_REPORT" -> {
                    success = emailService.sendTaxReportEmail(toEmail, consultantName, period, data, attachmentPath);
                    message = success ? "세금 내역서가 이메일로 발송되었습니다." : "세금 내역서 이메일 발송에 실패했습니다.";
                }
                default -> {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "지원하지 않는 이메일 유형입니다: " + emailType
                    ));
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "success", success,
                "message", message,
                "data", Map.of(
                    "toEmail", toEmail,
                    "consultantName", consultantName,
                    "period", period,
                    "emailType", emailType
                )
            ));
        } catch (Exception e) {
            log.error("❌ 이메일 전송 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "이메일 전송에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 이메일 템플릿 조회
     */
    @GetMapping("/email/templates")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> getEmailTemplates(@RequestParam(required = false) String templateType) {
        try {
            log.info("📧 이메일 템플릿 조회: 유형={}", templateType);
            
            if (templateType != null) {
                String template = emailService.getEmailTemplate(templateType);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                        "templateType", templateType,
                        "content", template
                    )
                ));
            } else {
                Map<String, String> templates = new HashMap<>();
                templates.put("SALARY_CALCULATION", emailService.getEmailTemplate("SALARY_CALCULATION"));
                templates.put("SALARY_APPROVAL", emailService.getEmailTemplate("SALARY_APPROVAL"));
                templates.put("SALARY_PAYMENT", emailService.getEmailTemplate("SALARY_PAYMENT"));
                templates.put("TAX_REPORT", emailService.getEmailTemplate("TAX_REPORT"));
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", templates
                ));
            }
        } catch (Exception e) {
            log.error("❌ 이메일 템플릿 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "이메일 템플릿 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    // ==================== 공통코드 조회 ====================
    
    /**
     * 급여 관련 공통코드 조회
     */
    @GetMapping("/codes")
    // @PreAuthorize("hasRole('ROLE_HQ_MASTER')") // 개발 환경에서 임시 비활성화
    public ResponseEntity<?> getSalaryCodes() {
        try {
            log.info("🔍 급여 관련 공통코드 조회");
            
            Map<String, Object> codes = new HashMap<>();
            codes.put("salaryTypes", commonCodeService.getCommonCodesByGroup("SALARY_TYPE"));
            codes.put("optionTypes", commonCodeService.getCommonCodesByGroup("SALARY_OPTION_TYPE"));
            codes.put("paymentCycles", commonCodeService.getCommonCodesByGroup("SALARY_PAYMENT_CYCLE"));
            codes.put("salaryStatuses", commonCodeService.getCommonCodesByGroup("SALARY_STATUS"));
            codes.put("baseRates", commonCodeService.getCommonCodesByGroup("FREELANCE_BASE_RATE"));
            codes.put("optionAmounts", commonCodeService.getCommonCodesByGroup("SALARY_OPTION_AMOUNT"));
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", codes
            ));
        } catch (Exception e) {
            log.error("❌ 급여 관련 공통코드 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "급여 관련 공통코드 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}
