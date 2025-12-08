package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserPasskey;
import com.coresolution.consultation.repository.UserPasskeyRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.PasskeyService;
import com.coresolution.core.context.TenantContextHolder;
import com.webauthn4j.util.Base64UrlUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Passkey 서비스 구현체
 * Week 17-18: Passkey 인증 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasskeyServiceImpl implements PasskeyService {
    
    private final UserRepository userRepository;
    private final UserPasskeyRepository passkeyRepository;
    private final JwtService jwtService;
    
    @Value("${webauthn.rp.name:MindGarden}")
    private String rpName;
    
    @Value("${webauthn.rp.id:localhost}")
    private String rpId;
    
    @Value("${webauthn.challenge.timeout:60000}")
    private long challengeTimeout;
    
    // 챌린지 저장소 (실제 운영 환경에서는 Redis 사용 권장)
    private final Map<String, ChallengeData> challengeStore = new HashMap<>();
    
    /**
     * 챌린지 데이터 클래스
     */
    private static class ChallengeData {
        String challenge;
        Long userId;
        String email;
        LocalDateTime expiresAt;
        
        ChallengeData(String challenge, Long userId, String email, long timeoutMs) {
            this.challenge = challenge;
            this.userId = userId;
            this.email = email;
            this.expiresAt = LocalDateTime.now().plusNanos(timeoutMs * 1_000_000);
        }
        
        boolean isExpired() {
            return LocalDateTime.now().isAfter(expiresAt);
        }
    }
    
    @Override
    public Map<String, Object> startRegistration(Long userId, String deviceName) {
        log.info("Passkey 등록 시작: userId={}, deviceName={}", userId, deviceName);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));
        
        // 챌린지 생성
        byte[] challengeBytes = new byte[32];
        new SecureRandom().nextBytes(challengeBytes);
        String challenge = Base64UrlUtil.encodeToString(challengeBytes);
        
        // 챌린지 저장
        String challengeKey = UUID.randomUUID().toString();
        challengeStore.put(challengeKey, new ChallengeData(challenge, userId, user.getEmail(), challengeTimeout));
        
        // PublicKeyCredentialCreationOptions 생성
        Map<String, Object> options = new HashMap<>();
        options.put("challenge", challenge);
        
        Map<String, Object> rp = new HashMap<>();
        rp.put("name", rpName);
        rp.put("id", rpId);
        options.put("rp", rp);
        
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", Base64UrlUtil.encodeToString(userId.toString().getBytes()));
        userInfo.put("name", user.getEmail());
        userInfo.put("displayName", user.getName() != null ? user.getName() : user.getEmail());
        options.put("user", userInfo);
        
        List<Map<String, Object>> pubKeyCredParams = new ArrayList<>();
        Map<String, Object> param1 = new HashMap<>();
        param1.put("type", "public-key");
        param1.put("alg", -7); // ES256
        pubKeyCredParams.add(param1);
        Map<String, Object> param2 = new HashMap<>();
        param2.put("type", "public-key");
        param2.put("alg", -257); // RS256
        pubKeyCredParams.add(param2);
        options.put("pubKeyCredParams", pubKeyCredParams);
        
        options.put("timeout", challengeTimeout);
        
        Map<String, Object> authenticatorSelection = new HashMap<>();
        authenticatorSelection.put("authenticatorAttachment", "platform");
        authenticatorSelection.put("userVerification", "required");
        authenticatorSelection.put("requireResidentKey", false);
        options.put("authenticatorSelection", authenticatorSelection);
        
        options.put("attestation", "none");
        options.put("challengeKey", challengeKey); // 클라이언트가 반환해야 함
        
        log.info("Passkey 등록 챌린지 생성 완료: challengeKey={}", challengeKey);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("options", options);
        
        return result;
    }
    
    @Override
    @Transactional
    public Map<String, Object> finishRegistration(Long userId, Map<String, Object> credential, String challengeKey, String deviceName) {
        log.info("Passkey 등록 완료: userId={}, deviceName={}", userId, deviceName);
        
        // 챌린지 검증
        ChallengeData challengeData = challengeStore.get(challengeKey);
        if (challengeData == null || challengeData.isExpired()) {
            throw new RuntimeException("유효하지 않거나 만료된 챌린지입니다.");
        }
        
        if (!challengeData.userId.equals(userId)) {
            throw new RuntimeException("사용자 ID가 일치하지 않습니다.");
        }
        
        // 챌린지 삭제
        challengeStore.remove(challengeKey);
        
        try {
            // WebAuthn 등록 검증 (간단한 구현)
            // 실제로는 webauthn4j를 사용하여 검증해야 함
            String credentialId = (String) credential.get("id");
            Map<String, Object> response = (Map<String, Object>) credential.get("response");
            String clientDataJSON = (String) response.get("clientDataJSON");
            String attestationObject = (String) response.get("attestationObject");
            
            // TODO: webauthn4j를 사용한 실제 검증 로직 구현 필요
            // 현재는 기본 검증만 수행
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));
            
            // Passkey 저장
            UserPasskey passkey = UserPasskey.builder()
                    .user(user)
                    .credentialId(credentialId)
                    .publicKey(attestationObject) // 실제로는 공개 키만 추출해야 함
                    .counter(0L)
                    .deviceName(deviceName)
                    .isActive(true)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            passkey = passkeyRepository.save(passkey);
            
            log.info("Passkey 등록 완료: passkeyId={}, credentialId={}", passkey.getId(), credentialId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Passkey 등록이 완료되었습니다.");
            result.put("passkeyId", passkey.getId());
            
            return result;
            
        } catch (Exception e) {
            log.error("Passkey 등록 실패", e);
            throw new RuntimeException("Passkey 등록에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    public Map<String, Object> startAuthentication(String email) {
        log.info("Passkey 인증 시작: email={}", email);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        User user = userRepository.findByTenantIdAndEmail(tenantId, email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + email));
        
        // 사용자의 활성화된 Passkey 목록 조회
        List<UserPasskey> passkeys = passkeyRepository.findActivePasskeysByUserId(user.getId());
        
        if (passkeys.isEmpty()) {
            throw new RuntimeException("등록된 Passkey가 없습니다.");
        }
        
        // 챌린지 생성
        byte[] challengeBytes = new byte[32];
        new SecureRandom().nextBytes(challengeBytes);
        String challenge = Base64UrlUtil.encodeToString(challengeBytes);
        
        // 챌린지 저장
        String challengeKey = UUID.randomUUID().toString();
        challengeStore.put(challengeKey, new ChallengeData(challenge, user.getId(), email, challengeTimeout));
        
        // allowCredentials 생성
        List<Map<String, Object>> allowCredentials = passkeys.stream()
                .map(p -> {
                    Map<String, Object> cred = new HashMap<>();
                    cred.put("id", p.getCredentialId());
                    cred.put("type", "public-key");
                    return cred;
                })
                .collect(Collectors.toList());
        
        Map<String, Object> options = new HashMap<>();
        options.put("challenge", challenge);
        options.put("allowCredentials", allowCredentials);
        options.put("timeout", challengeTimeout);
        options.put("userVerification", "required");
        options.put("challengeKey", challengeKey); // 클라이언트가 반환해야 함
        
        log.info("Passkey 인증 챌린지 생성 완료: challengeKey={}, passkeyCount={}", challengeKey, passkeys.size());
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("options", options);
        
        return result;
    }
    
    @Override
    @Transactional
    public Map<String, Object> finishAuthentication(String email, Map<String, Object> credential, String challengeKey) {
        log.info("Passkey 인증 완료: email={}", email);
        
        // 챌린지 검증
        ChallengeData challengeData = challengeStore.get(challengeKey);
        if (challengeData == null || challengeData.isExpired()) {
            throw new RuntimeException("유효하지 않거나 만료된 챌린지입니다.");
        }
        
        if (!challengeData.email.equals(email)) {
            throw new RuntimeException("이메일이 일치하지 않습니다.");
        }
        
        // 챌린지 삭제
        challengeStore.remove(challengeKey);
        
        try {
            String credentialId = (String) credential.get("id");
            
            // Passkey 조회
            UserPasskey passkey = passkeyRepository.findByCredentialIdAndIsDeletedFalse(credentialId)
                    .orElseThrow(() -> new RuntimeException("등록되지 않은 Passkey입니다."));
            
            // TODO: webauthn4j를 사용한 실제 검증 로직 구현 필요
            // 현재는 기본 검증만 수행
            
            // 카운터 업데이트
            passkey.setCounter(passkey.getCounter() + 1);
            passkey.setLastUsedAt(LocalDateTime.now());
            passkeyRepository.save(passkey);
            
            User user = passkey.getUser();
            
            // JWT 토큰 생성 (User 객체 사용)
            String accessToken = jwtService.generateToken(user);
            // 표준화 2025-12-08: username = userId이므로 refreshToken도 userId 사용, User 객체로 생성하여 tenantId, email 포함
            String refreshToken = jwtService.generateRefreshToken(user);
            
            log.info("Passkey 인증 성공: userId={}, passkeyId={}", user.getId(), passkey.getId());
            
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("email", user.getEmail());
            userInfo.put("name", user.getName() != null ? user.getName() : user.getEmail());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Passkey 인증 성공");
            result.put("accessToken", accessToken);
            result.put("refreshToken", refreshToken);
            result.put("userInfo", userInfo);
            
            return result;
            
        } catch (Exception e) {
            log.error("Passkey 인증 실패", e);
            throw new RuntimeException("Passkey 인증에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    public Map<String, Object> listPasskeys(Long userId) {
        log.info("Passkey 목록 조회: userId={}", userId);
        
        List<UserPasskey> passkeys = passkeyRepository.findActivePasskeysByUserId(userId);
        
        List<Map<String, Object>> passkeyList = passkeys.stream()
                .map(p -> {
                    Map<String, Object> passkeyMap = new HashMap<>();
                    passkeyMap.put("id", p.getId());
                    passkeyMap.put("deviceName", p.getDeviceName() != null ? p.getDeviceName() : "알 수 없음");
                    passkeyMap.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : "");
                    passkeyMap.put("lastUsedAt", p.getLastUsedAt() != null ? p.getLastUsedAt().toString() : "");
                    return passkeyMap;
                })
                .collect(Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("passkeys", passkeyList);
        
        return result;
    }
    
    @Override
    @Transactional
    public Map<String, Object> deletePasskey(Long userId, Long passkeyId) {
        log.info("Passkey 삭제: userId={}, passkeyId={}", userId, passkeyId);
        
        UserPasskey passkey = passkeyRepository.findById(passkeyId)
                .orElseThrow(() -> new RuntimeException("Passkey를 찾을 수 없습니다: " + passkeyId));
        
        if (!passkey.getUser().getId().equals(userId)) {
            throw new RuntimeException("본인의 Passkey만 삭제할 수 있습니다.");
        }
        
        passkey.setIsDeleted(true);
        passkey.setIsActive(false);
        passkeyRepository.save(passkey);
        
        log.info("Passkey 삭제 완료: passkeyId={}", passkeyId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Passkey가 삭제되었습니다.");
        
        return result;
    }
}

