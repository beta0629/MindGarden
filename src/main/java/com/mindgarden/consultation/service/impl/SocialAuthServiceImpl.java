package com.mindgarden.consultation.service.impl;

import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.SocialSignupRequest;
import com.mindgarden.consultation.dto.SocialSignupResponse;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserSocialAccount;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.repository.UserSocialAccountRepository;
import com.mindgarden.consultation.service.SocialAuthService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
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
    private final UserSocialAccountRepository userSocialAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final PersonalDataEncryptionUtil encryptionUtil;


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
            
            // 휴대폰번호 형식 검증
            String phone = request.getPhone();
            if (phone != null) {
                // 하이픈 제거 후 숫자만 추출
                phone = phone.replaceAll("[^0-9]", "");
                if (phone.length() != 11 || !phone.startsWith("01")) {
                    throw new IllegalArgumentException("올바른 휴대폰 번호 형식이 아닙니다. (11자리 숫자, 01로 시작)");
                }
            }
            
            // 사용자 생성 (개인정보 암호화) - 필수값만
            log.info("사용자 엔티티 생성 시작");
            User user = new User();
            user.setEmail(request.getEmail()); // 이메일은 암호화하지 않음 (로그인용)
            user.setName(encryptionUtil.encrypt(request.getName())); // 이름 암호화
            user.setNickname(encryptionUtil.encrypt(request.getNickname() != null ? request.getNickname() : request.getName())); // 닉네임 암호화
            user.setPhone(encryptionUtil.encrypt(phone)); // 검증된 휴대폰 번호 암호화
            user.setRole(UserRole.CLIENT); // 기본 역할: 내담자
            user.setIsEmailVerified(true); // 소셜 계정은 이메일 인증 완료로 간주
            user.setIsActive(true);
            log.info("사용자 엔티티 생성 완료: email={}, name={}, phone={}", user.getEmail(), request.getName(), request.getPhone());
            
            // 사용자가 입력한 비밀번호 사용
            if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                log.info("사용자 비밀번호 설정 완료 (사용자 입력)");
            } else {
                // 비밀번호가 없으면 임시 비밀번호 생성
                String tempPassword = generateTempPassword();
                user.setPassword(passwordEncoder.encode(tempPassword));
                log.info("사용자 비밀번호 설정 완료 (임시 비밀번호 생성)");
            }
            
            log.info("User 엔티티 저장 시작");
            user = userRepository.save(user);
            log.info("User 엔티티 저장 완료: userId={}", user.getId());
            
            // Client 엔티티는 User를 상속받으므로 별도 저장 불필요
            // 상속 관계에서는 User만 저장하면 됨
            log.info("Client 엔티티는 User 상속 관계로 자동 처리됨");
            
            // 소셜 계정 정보 저장 (개인정보 암호화)
            if (request.getProvider() != null && !request.getProvider().trim().isEmpty()) {
                log.info("소셜 계정 정보 저장 시작: provider={}, providerUserId={}, providerUsername={}", 
                        request.getProvider(), request.getProviderUserId(), request.getProviderUsername());
                
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
                        user.getId(), request.getProvider(), socialAccount.getProviderUserId());
                
                log.info("소셜 회원가입 완료 (세션 생성 대기): userId={}", user.getId());
            } else {
                // 소셜 계정 정보가 없는 경우
                log.info("소셜 회원가입 완료 (소셜 계정 정보 없음, 세션 생성 대기): userId={}", user.getId());
            }
            
            log.info("소셜 회원가입 성공: userId={}, email={}", user.getId(), user.getEmail());
            
                        // 상담사 신청 가능 여부 및 안내 메시지 생성
            boolean canApplyConsultant = true; // 기본적으로 상담사 신청 가능
            String consultantApplicationMessage = "상담사로 활동하고 싶으시다면 프로필을 완성한 후 관리자에게 신청해주세요.";
            int profileCompletionRate = calculateProfileCompletionRate(user);
            
            return SocialSignupResponse.builder()
                .success(true)
                .message("🎉 소셜 계정으로 간편 회원가입이 완료되었습니다! 이제 다시 로그인해주세요.")
                .userId(user.getId())
                .email(user.getEmail())
                .name(encryptionUtil.safeDecrypt(user.getName()))
                .nickname(encryptionUtil.safeDecrypt(user.getNickname()))
                .redirectUrl("/tablet/login?signup=success&email=" + user.getEmail())
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
     * 임시 비밀번호 생성
     */
    private String generateTempPassword() {
        return "SOCIAL_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000);
    }
    
    /**
     * 프로필 완성도 계산
     */
    private int calculateProfileCompletionRate(User user) {
        int completedFields = 0;
        int totalFields = 5; // 기본 필드 수 (이메일, 이름, 닉네임, 비밀번호, 휴대폰번호)
        
        // 필수 필드 확인
        if (user.getEmail() != null) completedFields++;
        if (user.getName() != null) completedFields++;
        if (user.getNickname() != null) completedFields++;
        if (user.getPassword() != null) completedFields++;
        if (user.getPhone() != null) completedFields++;
        
        return (int) Math.round((double) completedFields / totalFields * 100);
    }
}
