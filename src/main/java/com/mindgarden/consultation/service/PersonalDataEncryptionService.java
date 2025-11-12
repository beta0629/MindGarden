package com.mindgarden.consultation.service;

import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 개인정보 암호화 서비스
 *
 * <p>PersonalDataEncryptionUtil을 감싸는 단순 래퍼. 서비스/컨트롤러 계층에서
 * 의존성을 쉽게 주입받을 수 있도록 제공한다.</p>
 *
 * @author MindGarden
 * @version 3.0.0
 * @since 2024-12-19
 */
@Service
@RequiredArgsConstructor
public class PersonalDataEncryptionService {

    private final PersonalDataEncryptionUtil encryptionUtil;

    public String encrypt(String plainText) {
        return encryptionUtil.safeEncrypt(plainText);
    }

    public String decrypt(String encryptedText) {
        return encryptionUtil.safeDecrypt(encryptedText);
    }

    public String ensureActiveKey(String text) {
        return encryptionUtil.ensureActiveKeyEncryption(text);
    }

    public boolean isEncrypted(String text) {
        return encryptionUtil.isEncrypted(text);
    }
}
