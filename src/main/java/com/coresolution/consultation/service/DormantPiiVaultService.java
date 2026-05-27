package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.lifecycle.DormantUserPiiSnapshot;

/**
 * 휴면 PII vault 암호화/복호화 SSOT — USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.9.
 *
 * <p>AES-256-GCM (nonce 12 bytes, tag 16 bytes) 으로 사용자 PII 스냅샷을 암호화·복호화하여
 * {@code dormant_user_pii_vault.encrypted_pii} 컬럼에 JSON 으로 저장한다. 키는
 * {@code mindgarden.lifecycle.dormant-pii-encryption-key} 환경변수에서 Base64 디코딩하여
 * 사용한다 (32 bytes / AES-256).</p>
 *
 * <p>JSON 본문 포맷:</p>
 * <pre>{@code
 *   {
 *     "v": 1,
 *     "nonce": "<base64-12bytes>",
 *     "ciphertext": "<base64>",
 *     "tag": "<base64-16bytes>"
 *   }
 * }</pre>
 *
 * <p>{@code nonce} 는 매 INSERT 마다 {@code SecureRandom} 으로 신규 생성된다. 키 로테이션은
 * 미구현 (Phase 5+ 후속).</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
public interface DormantPiiVaultService {

    /**
     * PII 스냅샷 → AES-256-GCM 암호문 JSON 직렬화.
     *
     * @param snapshot 직렬화 대상 스냅샷 (non-null)
     * @return JSON 본문 (dormant_user_pii_vault.encrypted_pii 컬럼 적재용)
     */
    String encrypt(DormantUserPiiSnapshot snapshot);

    /**
     * AES-256-GCM 암호문 JSON → PII 스냅샷 복호화.
     *
     * @param ciphertextJson encrypt 가 생성한 JSON
     * @return 복호화된 스냅샷
     * @throws IllegalArgumentException 입력 JSON 이 손상되었거나 키가 일치하지 않는 경우
     */
    DormantUserPiiSnapshot decrypt(String ciphertextJson);
}
