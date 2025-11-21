package com.coresolution.core.controller.academy;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.RegisterRequest;
import com.coresolution.consultation.dto.SocialSignupRequest;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSocialAccount;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 학원 시스템 테넌트별 회원가입 컨트롤러
 * 테넌트 컨텍스트를 고려한 회원가입 처리
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-19
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/academy/registration")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AcademyRegistrationController extends BaseApiController {
    
    private final UserService userService;
    private final UserRepository userRepository;
    private final BranchService branchService;
    private final PasswordEncoder passwordEncoder;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final UserSocialAccountRepository userSocialAccountRepository;
    
    /**
     * 테넌트별 브랜치 목록 조회 (회원가입용)
     * GET /api/v1/academy/registration/branches
     */
    @GetMapping("/branches")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBranchesForRegistration(
            @RequestParam(required = false) String tenantId,
            HttpSession session) {
        log.debug("테넌트별 브랜치 목록 조회: tenantId={}", tenantId);
        
        // 테넌트 ID 확인
        String currentTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
        if (currentTenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        // 테넌트별 활성 브랜치 조회
        List<Branch> branches = branchService.findAllActive();
        
        // 테넌트 ID로 필터링 (BaseEntity의 tenantId 필드 사용)
        List<Map<String, Object>> branchList = branches.stream()
            .filter(branch -> currentTenantId.equals(branch.getTenantId()))
            .map(branch -> {
                Map<String, Object> branchInfo = new HashMap<>();
                branchInfo.put("id", branch.getId());
                branchInfo.put("branchCode", branch.getBranchCode());
                branchInfo.put("branchName", branch.getBranchName());
                branchInfo.put("address", branch.getAddress());
                branchInfo.put("phoneNumber", branch.getPhoneNumber());
                return branchInfo;
            })
            .collect(Collectors.toList());
        
        return success(branchList);
    }
    
    /**
     * 테넌트별 회원가입
     * POST /api/v1/academy/registration/register
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(
            @Valid @RequestBody RegisterRequest request,
            @RequestParam(required = false) String tenantId,
            HttpSession session) {
        log.info("테넌트별 회원가입 요청: email={}, tenantId={}", request.getEmail(), tenantId);
        
        // 테넌트 ID 확인
        String currentTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
        if (currentTenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        // 유효성 검사
        if (!StringUtils.hasText(request.getEmail()) ||
            !StringUtils.hasText(request.getPassword()) ||
            !StringUtils.hasText(request.getConfirmPassword()) ||
            !StringUtils.hasText(request.getName()) ||
            !StringUtils.hasText(request.getPhone())) {
            throw new IllegalArgumentException("필수 입력 항목이 누락되었습니다.");
        }
        
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        }
        
        if (!Boolean.TRUE.equals(request.getAgreeTerms()) || !Boolean.TRUE.equals(request.getAgreePrivacy())) {
            throw new IllegalArgumentException("이용약관과 개인정보처리방침에 동의해야 회원가입이 가능합니다.");
        }
        
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailAll(email)) {
            throw new org.springframework.dao.DataIntegrityViolationException("이미 사용 중인 이메일입니다.");
        }
        
            // 사용자 생성
            User user = new User();
            user.setUsername(generateUniqueUsername(email));
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setName(encryptionUtil.safeEncrypt(request.getName().trim()));
            
            if (StringUtils.hasText(request.getNickname())) {
                user.setNickname(encryptionUtil.safeEncrypt(request.getNickname().trim()));
            }
            
            if (StringUtils.hasText(request.getGender())) {
                user.setGender(encryptionUtil.safeEncrypt(request.getGender()));
            }
            
            if (request.getBirthDate() != null) {
                user.setBirthDate(request.getBirthDate());
            }
            
            if (StringUtils.hasText(request.getPhone())) {
                String sanitizedPhone = request.getPhone().replaceAll("[^0-9]", "");
                user.setPhone(encryptionUtil.encrypt(sanitizedPhone));
            }
            
            // 테넌트 ID 설정
            user.setTenantId(currentTenantId);
            
            user.setRole(com.coresolution.consultation.constant.UserRole.CLIENT);
            user.setIsActive(true);
            user.setIsEmailVerified(false);
            user.setIsSocialAccount(false);
            
            // 브랜치 설정 (있는 경우)
            if (StringUtils.hasText(request.getBranchCode())) {
                try {
                    Branch branch = branchService.getBranchByCode(request.getBranchCode().trim());
                    // 테넌트 일치 확인
                    if (!currentTenantId.equals(branch.getTenantId())) {
                        throw new IllegalArgumentException("해당 테넌트의 브랜치가 아닙니다.");
                    }
                    user.setBranch(branch);
                    user.setBranchCode(branch.getBranchCode());
                } catch (Exception e) {
                    log.warn("브랜치 설정 실패: branchCode={}, error={}", request.getBranchCode(), e.getMessage());
                    // 브랜치 설정 실패해도 회원가입은 진행
                }
            }
            
        User registeredUser = userService.registerUser(user);
        
        log.info("테넌트별 회원가입 완료: userId={}, tenantId={}, email={}", 
            registeredUser.getId(), currentTenantId, registeredUser.getEmail());
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("userId", registeredUser.getId());
        responseData.put("tenantId", currentTenantId);
        
        return created("회원가입이 완료되었습니다.", responseData);
    }
    
    /**
     * 고유한 사용자명 생성
     */
    private String generateUniqueUsername(String email) {
        String baseUsername = email.split("@")[0];
        String username = baseUsername;
        int suffix = 1;
        
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + suffix;
            suffix++;
        }
        
        return username;
    }
    
    /**
     * 테넌트별 SNS 회원가입
     * POST /api/v1/academy/registration/social-signup
     */
    @PostMapping("/social-signup")
    public ResponseEntity<ApiResponse<Map<String, Object>>> socialSignup(
            @Valid @RequestBody SocialSignupRequest request,
            @RequestParam(required = false) String tenantId,
            HttpSession session) {
        log.info("테넌트별 SNS 회원가입 요청: email={}, provider={}, tenantId={}", 
                request.getEmail(), request.getProvider(), tenantId);
        
        // 테넌트 ID 확인
        String currentTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
        if (currentTenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        // 유효성 검사
        if (!StringUtils.hasText(request.getEmail()) ||
            !StringUtils.hasText(request.getPassword()) ||
            !StringUtils.hasText(request.getName()) ||
            !StringUtils.hasText(request.getPhone())) {
            throw new IllegalArgumentException("필수 입력 항목이 누락되었습니다.");
        }
        
        if (request.getPassword().length() < 8) {
            throw new IllegalArgumentException("비밀번호는 8자 이상이어야 합니다.");
        }
        
        if (!Boolean.TRUE.equals(request.isPrivacyConsent()) || !Boolean.TRUE.equals(request.isTermsConsent())) {
            throw new IllegalArgumentException("이용약관과 개인정보처리방침에 동의해야 회원가입이 가능합니다.");
        }
        
        String email = request.getEmail().trim().toLowerCase();
        // 테넌트별 이메일 중복 확인
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent() && currentTenantId.equals(existingUser.get().getTenantId())) {
            throw new org.springframework.dao.DataIntegrityViolationException("이미 사용 중인 이메일입니다.");
        }
        
            // 사용자 생성
            User user = new User();
            user.setUsername(generateUniqueUsername(email, currentTenantId));
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setName(encryptionUtil.safeEncrypt(request.getName().trim()));
            
            if (StringUtils.hasText(request.getNickname())) {
                user.setNickname(encryptionUtil.safeEncrypt(request.getNickname().trim()));
            }
            
            // 테넌트 ID 설정
            user.setTenantId(currentTenantId);
            
            user.setRole(UserRole.CLIENT);
            user.setIsActive(true);
            user.setIsEmailVerified(false);
            user.setIsSocialAccount(true);
            
            // 프로필 이미지 설정
            if (StringUtils.hasText(request.getProviderProfileImage())) {
                user.setProfileImageUrl(request.getProviderProfileImage());
            }
            
            // 브랜치 설정 (있는 경우)
            if (StringUtils.hasText(request.getBranchCode())) {
                try {
                    Branch branch = branchService.getBranchByCode(request.getBranchCode().trim());
                    // 테넌트 일치 확인
                    if (!currentTenantId.equals(branch.getTenantId())) {
                        throw new IllegalArgumentException("해당 테넌트의 브랜치가 아닙니다.");
                    }
                    user.setBranch(branch);
                    user.setBranchCode(branch.getBranchCode());
                } catch (Exception e) {
                    log.warn("브랜치 설정 실패: branchCode={}, error={}", request.getBranchCode(), e.getMessage());
                    // 브랜치 설정 실패해도 회원가입은 진행
                }
            }
            
            User registeredUser = userService.registerUser(user);
            
            // 소셜 계정 정보 저장
            if (StringUtils.hasText(request.getProvider()) && StringUtils.hasText(request.getProviderUserId())) {
                UserSocialAccount socialAccount = new UserSocialAccount();
                socialAccount.setUser(registeredUser);
                socialAccount.setProvider(request.getProvider());
                socialAccount.setProviderUserId(request.getProviderUserId());
                if (StringUtils.hasText(request.getProviderUsername())) {
                    socialAccount.setProviderUsername(encryptionUtil.encrypt(request.getProviderUsername()));
                }
                if (StringUtils.hasText(request.getProviderProfileImage())) {
                    socialAccount.setProviderProfileImage(request.getProviderProfileImage());
                }
                socialAccount.setIsActive(true);
                userSocialAccountRepository.save(socialAccount);
                
                log.info("소셜 계정 정보 저장 완료: userId={}, provider={}", 
                        registeredUser.getId(), request.getProvider());
            }
            
        log.info("테넌트별 SNS 회원가입 완료: userId={}, tenantId={}, email={}", 
            registeredUser.getId(), currentTenantId, registeredUser.getEmail());
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("userId", registeredUser.getId());
        responseData.put("tenantId", currentTenantId);
        
        return created("회원가입이 완료되었습니다.", responseData);
    }
    
    /**
     * 테넌트별 고유 사용자명 생성
     */
    private String generateUniqueUsername(String email, String tenantId) {
        String baseUsername = email.split("@")[0];
        String username = baseUsername;
        int suffix = 1;
        
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + "_" + suffix;
            suffix++;
        }
        
        return username;
    }
}

