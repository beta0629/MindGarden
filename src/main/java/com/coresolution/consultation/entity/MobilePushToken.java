package com.coresolution.consultation.entity;

import com.coresolution.consultation.constant.MobilePushConstants;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 모바일 푸시 디바이스 토큰 (테넌트·사용자 스코프).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Entity
@Table(
        name = "mobile_push_tokens",
        uniqueConstraints = {
            @UniqueConstraint(name = "uk_mpt_tenant_user_tokenhash", columnNames = {"tenant_id", "user_id", "token_sha256"})
        },
        indexes = {
            @Index(name = "idx_mpt_tenant_user_active", columnList = "tenant_id,user_id,active")
        }
)
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class MobilePushToken extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "token_sha256", nullable = false, length = MobilePushConstants.TOKEN_SHA256_HEX_LENGTH)
    private String tokenSha256;

    @Column(name = "push_token", nullable = false, columnDefinition = "TEXT")
    private String pushToken;

    @Column(name = "platform", nullable = false, length = 16)
    private String platform;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "device_info", columnDefinition = "json")
    private JsonNode deviceInfo;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private boolean active = true;
}
