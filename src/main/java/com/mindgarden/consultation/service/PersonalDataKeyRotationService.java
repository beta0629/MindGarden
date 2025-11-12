package com.mindgarden.consultation.service;

import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 암호화 키 로테이션 지원 서비스
 *
 * <p>활성 키가 변경되었을 때 기존 암호화 데이터를 순차적으로 재암호화한다.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PersonalDataKeyRotationService {

    private final UserRepository userRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;

    /**
     * 사용자 개인정보를 활성 키로 재암호화한다.
     *
     * @return 재암호화된 사용자 수
     */
    @Transactional
    public int rotateUserPersonalData() {
        List<User> users = userRepository.findAll();
        int updatedCount = 0;

        for (User user : users) {
            boolean modified = false;

            if (needsRotation(user.getName())) {
                user.setName(encryptionUtil.ensureActiveKeyEncryption(user.getName()));
                modified = true;
            }
            if (needsRotation(user.getNickname())) {
                user.setNickname(encryptionUtil.ensureActiveKeyEncryption(user.getNickname()));
                modified = true;
            }
            if (needsRotation(user.getPhone())) {
                user.setPhone(encryptionUtil.ensureActiveKeyEncryption(user.getPhone()));
                modified = true;
            }
            if (needsRotation(user.getGender())) {
                user.setGender(encryptionUtil.ensureActiveKeyEncryption(user.getGender()));
                modified = true;
            }
            if (needsRotation(user.getAddress())) {
                user.setAddress(encryptionUtil.ensureActiveKeyEncryption(user.getAddress()));
                modified = true;
            }

            if (modified) {
                updatedCount++;
            }
        }

        log.info("🔄 암호화 키 로테이션 완료: {}명의 사용자 데이터가 업데이트되었습니다.", updatedCount);
        return updatedCount;
    }

    private boolean needsRotation(String value) {
        if (value == null || value.trim().isEmpty()) {
            return false;
        }
        return encryptionUtil.isEncrypted(value) && !encryptionUtil.isEncryptedWithActiveKey(value);
    }
}

