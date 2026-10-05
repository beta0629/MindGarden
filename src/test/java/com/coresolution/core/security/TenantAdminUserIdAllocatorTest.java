package com.coresolution.core.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("테넌트 관리자 user_id")
class TenantAdminUserIdAllocatorTest {

    @Test
    @DisplayName("이메일 로컬 파트를 그대로 쓰지 않는다")
    void allocateDoesNotUseEmailLocalPart() {
        String userId = TenantAdminUserIdAllocator.allocate(
                "tenant-incheon-counseling-001",
                UUID.fromString("11111111-1111-1111-1111-111111111111"));

        assertThat(userId).startsWith("adm-");
        assertThat(userId).doesNotContain("beta0629");
        assertThat(userId).doesNotContain("@");
        assertThat(userId).hasSizeLessThanOrEqualTo(TenantAdminUserIdAllocator.MAX_BASE_LENGTH);
        assertThat(userId).matches("adm-[a-z0-9]+-[0-9a-f]{10}");
    }

    @Test
    @DisplayName("같은 테넌트라도 난수가 다르면 user_id 가 다르다")
    void differentRandomYieldsDifferentId() {
        String first = TenantAdminUserIdAllocator.allocate(
                "mindcare", UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111"));
        String second = TenantAdminUserIdAllocator.allocate(
                "mindcare", UUID.fromString("bbbbbbbb-2222-2222-2222-222222222222"));

        assertThat(first).isNotEqualTo(second);
        assertThat(first).doesNotStartWith("mindcare");
    }

    @Test
    @DisplayName("빈 테넌트는 거절한다")
    void blankTenantRejected() {
        assertThatThrownBy(() -> TenantAdminUserIdAllocator.allocate("  "))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("접미사를 붙여도 50자를 넘지 않는다")
    void suffixStaysWithinColumn() {
        String base = "adm-" + "a".repeat(42);
        assertThat(base).hasSize(TenantAdminUserIdAllocator.MAX_BASE_LENGTH);

        String suffixed = TenantAdminUserIdAllocator.withSuffix(base, 1000);

        assertThat(suffixed).hasSize(50);
        assertThat(suffixed).endsWith("1000");
    }
}
