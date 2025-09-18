package com.mindgarden.consultation.service.impl;

import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.SocialSignupRequest;
import com.mindgarden.consultation.dto.SocialSignupResponse;
import com.mindgarden.consultation.entity.Branch;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserSocialAccount;
import com.mindgarden.consultation.repository.ClientRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.repository.UserSocialAccountRepository;
import com.mindgarden.consultation.service.SocialAuthService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 소셜 인증 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SocialAuthServiceImpl implements SocialAuthService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final UserSocialAccountRepository userSocialAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    @Value("${frontend.base-url:${FRONTEND_BASE_URL:http://localhost:3000}}")
    private String frontendBaseUrl;
    
    /**
     * 프론트엔드 기본 URL 반환
     */
    private String getFrontendBaseUrl() {
        // 환경변수 우선 확인
        String envUrl = System.getenv("FRONTEND_BASE_URL");
        if (envUrl != null && !envUrl.trim().isEmpty()) {
            return envUrl;
        }
        
        // 프로퍼티 값 사용
        if (frontendBaseUrl != null && !frontendBaseUrl.trim().isEmpty()) {
            return frontendBaseUrl;
        }
        
        // 기본값
        return "http://localhost:3000";
    }

    @Override
    @Transactional
    public SocialSignupResponse createUserFromSocial(SocialSignupRequest request) {
        try {
            log.info("소셜 회원가입 시작: email={}, provider={}", request.getEmail(), request.getProvider());
            
            // 이메일 중복 확인
            if (userRepository.existsByEmail(request.getEmail())) {
                log.warn("이미 가입된 이메일: {}", request.getEmail());
                return SocialSignupResponse.builder()
                    .success(false)
                    .message("이미 가입된 이메일입니다.")
                    .build();
            }
            
            // 비밀번호 검증
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                log.warn("비밀번호가 입력되지 않음");
                return SocialSignupResponse.builder()
                    .success(false)
                    .message("비밀번호를 입력해주세요.")
                    .build();
            }
            
            if (request.getPassword().length() < 8) {
                log.warn("비밀번호가 너무 짧음: {}", request.getPassword().length());
                return SocialSignupResponse.builder()
                    .success(false)
                    .message("비밀번호는 8자 이상이어야 합니다.")
                    .build();
            }
            
            // 비밀번호 확인 검증은 프론트엔드에서 처리
            
            // 휴대폰번호 형식 검증
            String phone = request.getPhone();
            if (phone != null) {
                // 하이픈 제거 후 숫자만 추출
                phone = phone.replaceAll("[^0-9]", "");
                if (phone.length() != 11 || !phone.startsWith("01")) {
                    log.warn("올바르지 않은 휴대폰 번호 형식: {}", request.getPhone());
                    return SocialSignupResponse.builder()
                        .success(false)
                        .message("올바른 휴대폰 번호 형식이 아닙니다. (11자리 숫자, 01로 시작)")
                        .build();
                }
            }
            
            // User 엔티티 먼저 생성 (기본 사용자 정보)
            log.info("User 엔티티 생성 시작");
            
            // username 생성 (이메일 기반)
            String username = generateUsernameFromEmail(request.getEmail());
            
            // 지점 정보 검증 (BranchCode enum 사용)
            Branch branch = null;
            String validatedBranchCode = request.getBranchCode();
            if (validatedBranchCode != null && !validatedBranchCode.trim().isEmpty()) {
                // BranchCode enum으로 유효성 검사
           if (com.mindgarden.consultation.enums.BranchCode.isValidCode(validatedBranchCode)) {
               log.info("유효한 지점 코드 설정: branchCode={}", validatedBranchCode);
           } else {
               log.warn("유효하지 않은 지점 코드, 기본값(MAIN001)으로 설정: branchCode={}", validatedBranchCode);
               validatedBranchCode = com.mindgarden.consultation.enums.BranchCode.MAIN001.getCode();
           }
            } else {
                // 기본값 설정
                validatedBranchCode = com.mindgarden.consultation.enums.BranchCode.MAIN001.getCode();
                log.info("지점 코드 없음, 기본값(MAIN001)으로 설정");
            }
            
            User user = User.builder()
                    .username(username)
                    .password(passwordEncoder.encode(request.getPassword())) // 사용자 입력 비밀번호 암호화
                    .name(request.getName())
                    .email(request.getEmail())
                    .phone(phone)
                    .role(UserRole.CLIENT)
                    .branchCode(validatedBranchCode) // 검증된 지점코드 추가
                    .branch(branch) // 지점 객체 추가
                    .profileImageUrl(request.getProviderProfileImage()) // 소셜 계정 프로필 이미지 설정
                    .build();
            
            log.info("User 엔티티 생성 완료: email={}, name={}, phone={}, branchCode={}, branch={}", 
                user.getEmail(), request.getName(), request.getPhone(), 
                user.getBranchCode(), branch != null ? branch.getId() : "null");
            
            log.info("User 엔티티 저장 시작");
            user = userRepository.save(user);
            log.info("User 엔티티 저장 완료: userId={}, branchId={}, branchCode={}", 
                user.getId(), user.getBranch() != null ? user.getBranch().getId() : "null", user.getBranchCode());
            
            // Client 엔티티 생성 (독립적인 엔티티)
            log.info("Client 엔티티 생성 시작");
            Client client = Client.builder()
                    .name(user.getName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .branchCode(user.getBranchCode())
                    .build();
            
            log.info("Client 엔티티 생성 완료: clientId={}", client.getId());
            
            log.info("Client 엔티티 저장 시작");
            client = clientRepository.save(client);
            log.info("Client 엔티티 저장 완료: clientId={}", client.getId());
            
            // 소셜 계정 정보 저장 (개인정보 암호화)
            if (request.getProvider() != null && !request.getProvider().trim().isEmpty()) {
                log.info("소셜 계정 정보 저장 시작: provider={}, providerUserId={}, providerUsername={}", 
                        request.getProvider(), request.getProviderUserId(), request.getProviderUsername());
                
                // 이미 생성된 User 객체 사용
                
                UserSocialAccount socialAccount = UserSocialAccount.builder()
                    .user(user)
                    .provider(request.getProvider()) // 제공자명은 암호화하지 않음
                    .providerUserId(request.getProviderUserId()) // 소셜 사용자 ID는 암호화하지 않음 (조회용)
                    .providerUsername(encryptionUtil.encrypt(request.getProviderUsername())) // 소셜 사용자명 암호화
                    .providerProfileImage(request.getProviderProfileImage()) // 프로필 이미지 URL은 암호화하지 않음
                    .isActive(true)
                    .build();
                
                userSocialAccountRepository.save(socialAccount);
                log.info("소셜 계정 정보 저장 완료: userId={}, provider={}, providerUserId={}", 
                        client.getId(), request.getProvider(), socialAccount.getProviderUserId());
                
                log.info("소셜 회원가입 완료 (세션 생성 대기): userId={}", client.getId());
            } else {
                // 소셜 계정 정보가 없는 경우
                log.info("소셜 회원가입 완료 (소셜 계정 정보 없음, 세션 생성 대기): userId={}", client.getId());
            }
            
            log.info("소셜 회원가입 성공: userId={}, email={}", client.getId(), client.getEmail());
            
                        // 상담사 신청 가능 여부 및 안내 메시지 생성
            boolean canApplyConsultant = true; // 기본적으로 상담사 신청 가능
            String consultantApplicationMessage = "상담사로 활동하고 싶으시다면 프로필을 완성한 후 관리자에게 신청해주세요.";
            // 프로필 완성도 계산 (Client 엔티티에 맞게 수정)
            int profileCompletionRate = calculateProfileCompletionRate(client);
            
            return SocialSignupResponse.builder()
                .success(true)
                .message("🎉 소셜 계정으로 간편 회원가입이 완료되었습니다! 이제 다시 로그인해주세요.")
                .userId(client.getId())
                .email(client.getEmail())
                .name(encryptionUtil.safeDecrypt(client.getName()))
                .nickname(null) // Client 엔티티에는 nickname 필드가 없음
                .redirectUrl(getFrontendBaseUrl() + "/login?signup=success&email=" + client.getEmail())
                .canApplyConsultant(canApplyConsultant)
                .consultantApplicationMessage(consultantApplicationMessage)
                .profileCompletionRate(profileCompletionRate)
                .build();
                
        } catch (Exception e) {
            log.error("소셜 회원가입 처리 중 오류 발생: {}", e.getMessage(), e);
            
            // 더 구체적인 오류 메시지 제공
            String errorMessage = "회원가입 처리 중 오류가 발생했습니다.";
            if (e.getCause() != null) {
                errorMessage += " 원인: " + e.getCause().getMessage();
            }
            
            return SocialSignupResponse.builder()
                .success(false)
                .message(errorMessage)
                .build();
        }
    }
    
    /**
     * SNS 이름 기반으로 username 생성
     */
    private String generateUsernameFromName(String name, String email) {
        if (name != null && !name.trim().isEmpty()) {
            // SNS에서 받은 이름 사용
            String username = name.trim();
            
            // 특수문자 제거 및 영문/숫자/언더스코어만 허용
            username = username.replaceAll("[^a-zA-Z0-9_가-힣]", "");
            
            // 길이가 3자 미만이면 보완
            if (username.length() < 3) {
                username = "user_" + username;
            }
            
            // 최대 50자로 제한
            if (username.length() > 50) {
                username = username.substring(0, 50);
            }
            
            return username;
        } else {
            // 이름이 없으면 이메일 기반으로 생성
            return generateUsernameFromEmail(email);
        }
    }
    
    /**
     * 이메일 기반으로 username 생성 (fallback)
     */
    private String generateUsernameFromEmail(String email) {
        if (email == null || email.isEmpty()) {
            return "user_" + System.currentTimeMillis();
        }
        
        // 이메일에서 @ 앞부분 추출
        String username = email.split("@")[0];
        
        // 특수문자 제거 및 길이 제한
        username = username.replaceAll("[^a-zA-Z0-9_]", "");
        
        // 길이가 3자 미만이면 보완
        if (username.length() < 3) {
            username = "user_" + username;
        }
        
        // 최대 50자로 제한
        if (username.length() > 50) {
            username = username.substring(0, 50);
        }
        
        return username;
    }
    
    /**
     * 임시 비밀번호 생성
     */
    private String generateTempPassword() {
        return "SOCIAL_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000);
    }
    
    /**
     * 프로필 완성도 계산
     */
    private int calculateProfileCompletionRate(Client client) {
        int completedFields = 0;
        int totalFields = 5; // 기본 필드 수 (이메일, 이름, 닉네임, 비밀번호, 휴대폰번호)
        
        // 필수 필드 확인 (Client 엔티티에 맞게 수정)
        if (client.getEmail() != null) completedFields++;
        if (client.getName() != null) completedFields++;
        if (client.getPhone() != null) completedFields++;
        if (client.getBirthDate() != null) completedFields++;
        if (client.getGender() != null) completedFields++;
        
        return (int) Math.round((double) completedFields / totalFields * 100);
    }
}
