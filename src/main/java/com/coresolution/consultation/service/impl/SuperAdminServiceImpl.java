package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.AdminConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.SuperAdminCreateRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.SuperAdminService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 수퍼어드민 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SuperAdminServiceImpl implements SuperAdminService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    /**
     * 수퍼어드민 계정 생성
     * 
     * @param request 수퍼어드민 생성 요청
     * @return 생성된 수퍼어드민 사용자
     */
    @Override
    @Transactional
    public User createSuperAdmin(SuperAdminCreateRequest request, User currentUser) {
        log.info("수퍼어드민 계정 생성 시작: {}", request.getEmail());
        
        try {
            // 사용자 정보 암호화
            String encryptedName = encryptionUtil.encrypt(request.getName());
            String encryptedNickname = request.getNickname() != null && !request.getNickname().trim().isEmpty() 
                ? encryptionUtil.encrypt(request.getNickname()) : null;
            String encryptedPhone = request.getPhone() != null && !request.getPhone().trim().isEmpty() 
                ? encryptionUtil.encrypt(request.getPhone()) : null;
            
            // 지점코드 결정 (현재 사용자의 지점코드 사용, 없으면 기본값)
            String branchCode = AdminConstants.DEFAULT_BRANCH_CODE; // 기본값
            if (currentUser != null && currentUser.getBranchCode() != null && !currentUser.getBranchCode().trim().isEmpty()) {
                branchCode = currentUser.getBranchCode();
                log.info("🔧 현재 사용자의 지점코드 사용: {}", branchCode);
            } else {
                log.info("🔧 기본 지점코드 사용: {}", branchCode);
            }
            
            // 수퍼어드민 사용자 생성
            User superAdmin = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(encryptedName)
                .nickname(encryptedNickname)
                .phone(encryptedPhone)
                .role(UserRole.HQ_MASTER)
                .branchCode(branchCode)
                .isActive(true)
                .isEmailVerified(true) // 수퍼어드민은 이메일 인증 생략
                .isSocialAccount(false)
                .lastLoginAt(null)
                .memo(request.getMemo())
                .build();
            
            // 사용자 저장
            User savedSuperAdmin = userRepository.save(superAdmin);
            
            log.info("수퍼어드민 계정 생성 완료: ID={}, Email={}", 
                savedSuperAdmin.getId(), savedSuperAdmin.getEmail());
            
            return savedSuperAdmin;
            
        } catch (Exception e) {
            log.error("수퍼어드민 계정 생성 실패: {}", request.getEmail(), e);
            throw new RuntimeException("수퍼어드민 계정 생성에 실패했습니다.", e);
        }
    }
    
    /**
     * 수퍼어드민 목록 조회
     * 
     * @return 수퍼어드민 목록
     */
    @Override
    public ResponseEntity<?> getSuperAdminList() {
        try {
            log.info("수퍼어드민 목록 조회 시작");
            
            List<User> superAdmins = userRepository.findByRole(UserRole.HQ_MASTER)
                .stream()
                .filter(user -> !user.isDeleted())
                .collect(Collectors.toList());
            
            List<Map<String, Object>> superAdminList = superAdmins.stream()
                .map(user -> {
                    Map<String, Object> userInfo = new HashMap<>();
                    userInfo.put("id", user.getId());
                    userInfo.put("email", user.getEmail());
                    userInfo.put("username", user.getUsername());
                    userInfo.put("role", user.getRole());
                    userInfo.put("isActive", user.getIsActive());
                    userInfo.put("createdAt", user.getCreatedAt());
                    userInfo.put("lastLoginAt", user.getLastLoginAt());
                    
                    // 개인정보 복호화
                    try {
                        if (user.getName() != null && !user.getName().trim().isEmpty()) {
                            userInfo.put("name", encryptionUtil.safeDecrypt(user.getName()));
                        }
                        if (user.getNickname() != null && !user.getNickname().trim().isEmpty()) {
                            userInfo.put("nickname", encryptionUtil.safeDecrypt(user.getNickname()));
                        }
                        if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
                            userInfo.put("phone", encryptionUtil.safeDecrypt(user.getPhone()));
                        }
                    } catch (Exception e) {
                        log.warn("개인정보 복호화 실패: User ID={}", user.getId());
                        userInfo.put("name", user.getName());
                        userInfo.put("nickname", user.getNickname());
                        userInfo.put("phone", user.getPhone());
                    }
                    
                    return userInfo;
                })
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", superAdminList);
            response.put("totalCount", superAdminList.size());
            response.put("message", "수퍼어드민 목록을 성공적으로 조회했습니다.");
            
            log.info("수퍼어드민 목록 조회 완료: {}명", superAdminList.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("수퍼어드민 목록 조회 실패", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "수퍼어드민 목록 조회 중 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
