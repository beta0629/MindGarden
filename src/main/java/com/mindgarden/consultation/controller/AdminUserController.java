package com.mindgarden.consultation.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.constant.AdminConstants;
import com.mindgarden.consultation.constant.EmailConstants;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.EmailResponse;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.EmailService;
import com.mindgarden.consultation.service.UserProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 관리자용 유저 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    
    private final UserProfileService userProfileService;
    private final com.mindgarden.consultation.service.UserService userService;
    private final EmailService emailService;
    
    /**
     * 전체 사용자 목록 조회 (관리자 전용)
     */
    @GetMapping("")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        try {
            log.info("전체 사용자 목록 조회 요청");
            
            // UserService를 통해 전체 사용자 조회
            List<User> users = userService.findAllActive();
            
            // 사용자 정보를 Map으로 변환
            List<Map<String, Object>> userList = new ArrayList<>();
            for (User user : users) {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", user.getId());
                userInfo.put("email", user.getEmail());
                userInfo.put("name", user.getName());
                userInfo.put("role", user.getRole());
                userInfo.put("isActive", !user.getIsDeleted());
                userInfo.put("createdAt", user.getCreatedAt());
                userInfo.put("updatedAt", user.getUpdatedAt());
                userList.add(userInfo);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put(AdminConstants.RESPONSE_KEY_COUNT, userList.size());
            response.put(AdminConstants.RESPONSE_KEY_DATA, userList);
            response.put(AdminConstants.RESPONSE_KEY_MESSAGE, AdminConstants.SUCCESS_USERS_RETRIEVED);
            response.put(AdminConstants.RESPONSE_KEY_SUCCESS, true);
            
            log.info(AdminConstants.SUCCESS_USERS_RETRIEVED + ": {}명", userList.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("사용자 목록 조회 중 오류 발생: error={}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(AdminConstants.RESPONSE_KEY_MESSAGE, AdminConstants.ERROR_USERS_RETRIEVAL_FAILED);
            errorResponse.put(AdminConstants.RESPONSE_KEY_SUCCESS, false);
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * 상담사 신청자 목록 조회 (역할이 CLIENT인 사용자 중 상담사 자격 요건 충족자)
     */
    @GetMapping("/consultant-applicants")
    public ResponseEntity<Map<String, Object>> getConsultantApplicants() {
        try {
            log.info("상담사 신청자 목록 조회 요청");
            
            // 전체 사용자 조회
            List<User> allUsers = userService.findAllActive();
            
            // 상담사 신청자 필터링 (CLIENT 역할이면서 자격 요건 충족)
            List<Map<String, Object>> applicantList = new ArrayList<>();
            for (User user : allUsers) {
                if (UserRole.CLIENT.equals(user.getRole())) {
                    // 상담사 자격 요건 확인 (실제 구현에서는 더 복잡한 로직 필요)
                    boolean isEligible = checkConsultantEligibility(user);
                    if (isEligible) {
                        Map<String, Object> applicantInfo = new HashMap<>();
                        applicantInfo.put("id", user.getId());
                        applicantInfo.put("email", user.getEmail());
                        applicantInfo.put("name", user.getName());
                        applicantInfo.put("role", user.getRole());
                        applicantInfo.put("experience", getConsultantExperience(user));
                        applicantInfo.put("rating", getConsultantRating(user));
                        applicantInfo.put("sessions", getConsultantSessions(user));
                        applicantInfo.put("certifications", getConsultantCertifications(user));
                        applicantInfo.put("appliedAt", user.getCreatedAt());
                        applicantList.add(applicantInfo);
                    }
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put(AdminConstants.RESPONSE_KEY_COUNT, applicantList.size());
            response.put(AdminConstants.RESPONSE_KEY_DATA, applicantList);
            response.put(AdminConstants.RESPONSE_KEY_MESSAGE, AdminConstants.SUCCESS_CONSULTANT_APPLICANTS_RETRIEVED);
            response.put(AdminConstants.RESPONSE_KEY_SUCCESS, true);
            
            log.info(AdminConstants.SUCCESS_CONSULTANT_APPLICANTS_RETRIEVED + ": {}명", applicantList.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("상담사 신청자 목록 조회 중 오류 발생: error={}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(AdminConstants.RESPONSE_KEY_MESSAGE, AdminConstants.ERROR_CONSULTANT_APPLICANTS_RETRIEVAL_FAILED);
            errorResponse.put(AdminConstants.RESPONSE_KEY_SUCCESS, false);
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * 상담사 승인 (CLIENT → CONSULTANT)
     */
    @PutMapping("/{userId}/approve-consultant")
    public ResponseEntity<Boolean> approveConsultant(@PathVariable Long userId) {
        try {
            log.info("상담사 승인 요청: userId={}", userId);
            
            // 상담사 자격 요건 확인
            boolean eligible = userProfileService.checkConsultantEligibility(userId);
            if (!eligible) {
                return ResponseEntity.badRequest().body(false);
            }
            
            // 역할을 CONSULTANT로 변경
            boolean success = userProfileService.changeUserRole(userId, UserRole.CONSULTANT);
            if (success) {
                log.info("상담사 승인 완료: userId={}", userId);
                
                // 승인 완료 이메일 발송
                sendConsultantApprovalEmail(userId);
                
                return ResponseEntity.ok(true);
            } else {
                return ResponseEntity.badRequest().body(false);
            }
        } catch (Exception e) {
            log.error("상담사 승인 중 오류 발생: userId={}, error={}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(false);
        }
    }
    
    /**
     * 관리자 승인 (CONSULTANT → ADMIN)
     */
    @PutMapping("/{userId}/approve-admin")
    public ResponseEntity<Boolean> approveAdmin(@PathVariable Long userId) {
        try {
            log.info("관리자 승인 요청: userId={}", userId);
            
            // 관리자 자격 요건 확인 (UserProfileService에 메서드 추가 필요)
            // boolean eligible = userProfileService.checkAdminEligibility(userId);
            // if (!eligible) {
            //     return ResponseEntity.badRequest().body(false);
            // }
            
            // 역할을 ADMIN으로 변경
            boolean success = userProfileService.changeUserRole(userId, UserRole.ADMIN);
            if (success) {
                log.info("관리자 승인 완료: userId={}", userId);
                
                // 승인 완료 이메일 발송
                sendAdminApprovalEmail(userId);
                
                return ResponseEntity.ok(true);
            } else {
                return ResponseEntity.badRequest().body(false);
            }
        } catch (Exception e) {
            log.error("관리자 승인 중 오류 발생: userId={}, error={}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(false);
        }
    }
    
    /**
     * 유저 역할 변경 (관리자 전용)
     */
    @PutMapping("/{userId}/role")
    public ResponseEntity<Boolean> changeUserRole(
            @PathVariable Long userId,
            @RequestParam String newRole) {
        try {
            log.info("관리자 권한으로 유저 역할 변경: userId={}, newRole={}", userId, newRole);
            
            // 문자열을 UserRole enum으로 변환
            UserRole role = UserRole.fromString(newRole);
            if (role == null) {
                return ResponseEntity.badRequest().body(false);
            }
            
            boolean success = userProfileService.changeUserRole(userId, role);
            if (success) {
                log.info("유저 역할 변경 완료: userId={}, newRole={}", userId, role.getDisplayName());
                return ResponseEntity.ok(true);
            } else {
                return ResponseEntity.badRequest().body(false);
            }
        } catch (Exception e) {
            log.error("유저 역할 변경 중 오류 발생: userId={}, newRole={}, error={}", 
                    userId, newRole, e.getMessage(), e);
            return ResponseEntity.badRequest().body(false);
        }
    }
    
    /**
     * 사용 가능한 역할 목록 조회
     */
    @GetMapping("/roles")
    public ResponseEntity<UserRole[]> getAvailableRoles() {
        try {
            log.info("사용 가능한 역할 목록 조회");
            return ResponseEntity.ok(UserRole.getAllRoles());
        } catch (Exception e) {
            log.error("역할 목록 조회 중 오류 발생: error={}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    // ==================== Private Helper Methods ====================
    
    /**
     * 상담사 자격 요건 확인
     */
    private boolean checkConsultantEligibility(User user) {
        try {
            // 기본 자격 요건 확인
            int experience = getConsultantExperience(user);
            double rating = getConsultantRating(user);
            int sessions = getConsultantSessions(user);
            List<String> certifications = getConsultantCertifications(user);
            
            // 최소 경력 확인
            if (experience < AdminConstants.MIN_CONSULTANT_EXPERIENCE) {
                log.debug("상담사 자격 미충족 - 경력 부족: userId={}, experience={}", user.getId(), experience);
                return false;
            }
            
            // 최소 평점 확인
            if (rating < AdminConstants.MIN_CONSULTANT_RATING) {
                log.debug("상담사 자격 미충족 - 평점 부족: userId={}, rating={}", user.getId(), rating);
                return false;
            }
            
            // 최소 상담 세션 수 확인
            if (sessions < AdminConstants.MIN_CONSULTANT_SESSIONS) {
                log.debug("상담사 자격 미충족 - 상담 세션 부족: userId={}, sessions={}", user.getId(), sessions);
                return false;
            }
            
            // 필수 자격증 확인
            if (certifications == null || !certifications.contains(AdminConstants.REQUIRED_CERTIFICATION)) {
                log.debug("상담사 자격 미충족 - 자격증 부족: userId={}, certifications={}", user.getId(), certifications);
                return false;
            }
            
            log.debug("상담사 자격 충족: userId={}", user.getId());
            return true;
            
        } catch (Exception e) {
            log.error("상담사 자격 요건 확인 중 오류: userId={}, error={}", user.getId(), e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 상담사 경력 조회 (임시 구현)
     */
    private int getConsultantExperience(User user) {
        // 실제 구현에서는 사용자 프로필이나 별도 테이블에서 조회
        // 현재는 임시로 랜덤 값 반환
        return (int) (Math.random() * 10) + 1; // 1-10년
    }
    
    /**
     * 상담사 평점 조회 (임시 구현)
     */
    private double getConsultantRating(User user) {
        // 실제 구현에서는 리뷰 테이블에서 조회
        // 현재는 임시로 랜덤 값 반환
        return Math.round((Math.random() * 2 + 3) * 10.0) / 10.0; // 3.0-5.0
    }
    
    /**
     * 상담사 상담 세션 수 조회 (임시 구현)
     */
    private int getConsultantSessions(User user) {
        // 실제 구현에서는 상담 테이블에서 조회
        // 현재는 임시로 랜덤 값 반환
        return (int) (Math.random() * 200) + 1; // 1-200회
    }
    
    /**
     * 상담사 자격증 목록 조회 (임시 구현)
     */
    private List<String> getConsultantCertifications(User user) {
        // 실제 구현에서는 자격증 테이블에서 조회
        // 현재는 임시로 기본 자격증 반환
        List<String> certifications = new ArrayList<>();
        certifications.add(AdminConstants.REQUIRED_CERTIFICATION);
        if (Math.random() > 0.5) {
            certifications.add("심리상담사 1급");
        }
        if (Math.random() > 0.7) {
            certifications.add("가족상담사");
        }
        return certifications;
    }
    
    /**
     * 상담사 승인 완료 이메일 발송
     */
    private void sendConsultantApprovalEmail(Long userId) {
        try {
            log.info("상담사 승인 완료 이메일 발송: userId={}", userId);
            
            // 사용자 정보 조회
            User user = userService.findActiveById(userId).orElse(null);
            if (user == null) {
                log.warn("사용자를 찾을 수 없어 이메일 발송을 건너뜁니다: userId={}", userId);
                return;
            }
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, user.getName());
            variables.put(EmailConstants.VAR_USER_EMAIL, user.getEmail());
            variables.put(EmailConstants.VAR_COMPANY_NAME, "마음정원");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            
            // 템플릿 기반 이메일 발송
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_CONSULTANT_APPROVAL,
                    user.getEmail(),
                    user.getName(),
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("상담사 승인 완료 이메일 발송 성공: userId={}, emailId={}", userId, response.getEmailId());
            } else {
                log.error("상담사 승인 완료 이메일 발송 실패: userId={}, error={}", userId, response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("상담사 승인 완료 이메일 발송 중 오류: userId={}, error={}", userId, e.getMessage(), e);
        }
    }
    
    /**
     * 관리자 승인 완료 이메일 발송
     */
    private void sendAdminApprovalEmail(Long userId) {
        try {
            log.info("관리자 승인 완료 이메일 발송: userId={}", userId);
            
            // 사용자 정보 조회
            User user = userService.findActiveById(userId).orElse(null);
            if (user == null) {
                log.warn("사용자를 찾을 수 없어 이메일 발송을 건너뜁니다: userId={}", userId);
                return;
            }
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, user.getName());
            variables.put(EmailConstants.VAR_USER_EMAIL, user.getEmail());
            variables.put(EmailConstants.VAR_COMPANY_NAME, "마음정원");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            
            // 템플릿 기반 이메일 발송
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_ADMIN_APPROVAL,
                    user.getEmail(),
                    user.getName(),
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("관리자 승인 완료 이메일 발송 성공: userId={}, emailId={}", userId, response.getEmailId());
            } else {
                log.error("관리자 승인 완료 이메일 발송 실패: userId={}, error={}", userId, response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("관리자 승인 완료 이메일 발송 중 오류: userId={}, error={}", userId, e.getMessage(), e);
        }
    }
    
    /**
     * 상담사 신청 거부 이메일 발송
     */
    private void sendConsultantRejectionEmail(Long userId, String reason) {
        try {
            log.info("상담사 신청 거부 이메일 발송: userId={}, reason={}", userId, reason);
            
            // 사용자 정보 조회
            User user = userService.findActiveById(userId).orElse(null);
            if (user == null) {
                log.warn("사용자를 찾을 수 없어 이메일 발송을 건너뜁니다: userId={}", userId);
                return;
            }
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, user.getName());
            variables.put(EmailConstants.VAR_USER_EMAIL, user.getEmail());
            variables.put(EmailConstants.VAR_COMPANY_NAME, "마음정원");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put("rejectionReason", reason != null ? reason : "자격 요건을 충족하지 못했습니다.");
            
            // 템플릿 기반 이메일 발송
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_CONSULTANT_REJECTION,
                    user.getEmail(),
                    user.getName(),
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("상담사 신청 거부 이메일 발송 성공: userId={}, emailId={}", userId, response.getEmailId());
            } else {
                log.error("상담사 신청 거부 이메일 발송 실패: userId={}, error={}", userId, response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("상담사 신청 거부 이메일 발송 중 오류: userId={}, error={}", userId, e.getMessage(), e);
        }
    }
    
    /**
     * 시스템 알림 이메일 발송
     */
    private void sendSystemNotificationEmail(String toEmail, String toName, String message) {
        try {
            log.info("시스템 알림 이메일 발송: to={}, message={}", toEmail, message);
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, toName);
            variables.put(EmailConstants.VAR_USER_EMAIL, toEmail);
            variables.put(EmailConstants.VAR_COMPANY_NAME, "마음정원");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put("message", message);
            
            // 템플릿 기반 이메일 발송
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_SYSTEM_NOTIFICATION,
                    toEmail,
                    toName,
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("시스템 알림 이메일 발송 성공: to={}, emailId={}", toEmail, response.getEmailId());
            } else {
                log.error("시스템 알림 이메일 발송 실패: to={}, error={}", toEmail, response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("시스템 알림 이메일 발송 중 오류: to={}, error={}", toEmail, e.getMessage(), e);
        }
    }
}
