package com.coresolution.consultation.dto.lifecycle;

import java.time.LocalDate;

import com.coresolution.consultation.entity.User;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 휴면(DORMANT) 진입 시점에 vault 로 격리할 사용자 PII 스냅샷.
 *
 * <p>USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.9 (Q9) — DORMANT 진입 시 {@code users}
 * 테이블의 PII 컬럼은 surrogate 로 치환되고, 원본 PII 는 본 스냅샷으로 직렬화되어
 * AES-256-GCM 암호화 후 {@code dormant_user_pii_vault.encrypted_pii} 에 보관된다.
 * 4년 후 ANONYMIZED 전이 시점에 vault 행이 삭제되어 영구 파기되며, 그 전에 사용자가
 * 활성 복귀(reactivate)하면 본 스냅샷이 복호화되어 {@code users} 행으로 원복된다.</p>
 *
 * <p>본 클래스는 final + immutable 로 설계된 단순 VO 이며, {@link DormantUserPiiSnapshot#fromUser(User)}
 * 와 {@link #applyTo(User)} 두 메서드만 외부에 노출한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
public final class DormantUserPiiSnapshot {

    /** JSON 스냅샷 버전. 향후 PII 컬럼 추가/제거 시 마이그레이션 핸들링 기준. */
    public static final int CURRENT_VERSION = 1;

    private final int version;
    private final String email;
    private final String name;
    private final String nickname;
    private final String phone;
    private final String gender;
    private final LocalDate birthDate;
    private final String address;
    private final String addressDetail;
    private final String postalCode;
    private final String rrnEncrypted;
    private final String profileImageUrl;

    private DormantUserPiiSnapshot(Builder builder) {
        this.version = builder.version;
        this.email = builder.email;
        this.name = builder.name;
        this.nickname = builder.nickname;
        this.phone = builder.phone;
        this.gender = builder.gender;
        this.birthDate = builder.birthDate;
        this.address = builder.address;
        this.addressDetail = builder.addressDetail;
        this.postalCode = builder.postalCode;
        this.rrnEncrypted = builder.rrnEncrypted;
        this.profileImageUrl = builder.profileImageUrl;
    }

    /**
     * Jackson 역직렬화 전용 생성자 — DormantPiiVaultService.decrypt 가 사용한다.
     */
    @JsonCreator
    public DormantUserPiiSnapshot(
            @JsonProperty("version") int version,
            @JsonProperty("email") String email,
            @JsonProperty("name") String name,
            @JsonProperty("nickname") String nickname,
            @JsonProperty("phone") String phone,
            @JsonProperty("gender") String gender,
            @JsonProperty("birthDate") LocalDate birthDate,
            @JsonProperty("address") String address,
            @JsonProperty("addressDetail") String addressDetail,
            @JsonProperty("postalCode") String postalCode,
            @JsonProperty("rrnEncrypted") String rrnEncrypted,
            @JsonProperty("profileImageUrl") String profileImageUrl) {
        this.version = version > 0 ? version : CURRENT_VERSION;
        this.email = email;
        this.name = name;
        this.nickname = nickname;
        this.phone = phone;
        this.gender = gender;
        this.birthDate = birthDate;
        this.address = address;
        this.addressDetail = addressDetail;
        this.postalCode = postalCode;
        this.rrnEncrypted = rrnEncrypted;
        this.profileImageUrl = profileImageUrl;
    }

    public static Builder builder() {
        return new Builder();
    }

    /**
     * {@link User} 의 PII 컬럼을 스냅샷으로 추출.
     *
     * @param user 대상 사용자
     * @return PII 스냅샷
     */
    public static DormantUserPiiSnapshot fromUser(User user) {
        if (user == null) {
            throw new IllegalArgumentException("user must not be null");
        }
        return builder()
                .version(CURRENT_VERSION)
                .email(user.getEmail())
                .name(user.getName())
                .nickname(user.getNickname())
                .phone(user.getPhone())
                .gender(user.getGender())
                .birthDate(user.getBirthDate())
                .address(user.getAddress())
                .addressDetail(user.getAddressDetail())
                .postalCode(user.getPostalCode())
                .rrnEncrypted(user.getRrnEncrypted())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }

    /**
     * 스냅샷을 {@link User} 행에 원복 (reactivate 경로).
     *
     * @param user 대상 사용자
     */
    public void applyTo(User user) {
        if (user == null) {
            throw new IllegalArgumentException("user must not be null");
        }
        user.setEmail(email);
        user.setName(name);
        user.setNickname(nickname);
        user.setPhone(phone);
        user.setGender(gender);
        user.setBirthDate(birthDate);
        user.setAddress(address);
        user.setAddressDetail(addressDetail);
        user.setPostalCode(postalCode);
        user.setRrnEncrypted(rrnEncrypted);
        user.setProfileImageUrl(profileImageUrl);
    }

    public int getVersion() {
        return version;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getNickname() {
        return nickname;
    }

    public String getPhone() {
        return phone;
    }

    public String getGender() {
        return gender;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public String getAddress() {
        return address;
    }

    public String getAddressDetail() {
        return addressDetail;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public String getRrnEncrypted() {
        return rrnEncrypted;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public static final class Builder {
        private int version = CURRENT_VERSION;
        private String email;
        private String name;
        private String nickname;
        private String phone;
        private String gender;
        private LocalDate birthDate;
        private String address;
        private String addressDetail;
        private String postalCode;
        private String rrnEncrypted;
        private String profileImageUrl;

        public Builder version(int version) {
            this.version = version;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder nickname(String nickname) {
            this.nickname = nickname;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder gender(String gender) {
            this.gender = gender;
            return this;
        }

        public Builder birthDate(LocalDate birthDate) {
            this.birthDate = birthDate;
            return this;
        }

        public Builder address(String address) {
            this.address = address;
            return this;
        }

        public Builder addressDetail(String addressDetail) {
            this.addressDetail = addressDetail;
            return this;
        }

        public Builder postalCode(String postalCode) {
            this.postalCode = postalCode;
            return this;
        }

        public Builder rrnEncrypted(String rrnEncrypted) {
            this.rrnEncrypted = rrnEncrypted;
            return this;
        }

        public Builder profileImageUrl(String profileImageUrl) {
            this.profileImageUrl = profileImageUrl;
            return this;
        }

        public DormantUserPiiSnapshot build() {
            return new DormantUserPiiSnapshot(this);
        }
    }
}
