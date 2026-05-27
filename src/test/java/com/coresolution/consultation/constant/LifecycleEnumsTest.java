package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * Lifecycle ENUM 6종 SSOT 회귀 — code 적재값 + messageKey i18n 분리 가드 + fromCode 정합.
 *
 * <p>V20260604_001 의 5종 ENUM-like 컬럼(action / notification_type / destruction_type /
 * legal_basis / event_type / compensation_type) 캡슐화가 하드코딩 게이트 §17.1 준수를
 * 유지하는지 검증. 한국어 라벨은 메시지 키 (i18n) 로만 노출되므로 본 테스트는
 * 메시지 번들 의존 없이 enum 자체의 SSOT 만 확인한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@DisplayName("Lifecycle ENUM 6종 SSOT 회귀")
class LifecycleEnumsTest {

    @Nested
    @DisplayName("AuditAction")
    class AuditActionTests {
        @Test
        @DisplayName("code 와 messageKey 가 SSOT 패턴(코드값 그대로 + enums.<Name>.<CODE>)을 따른다")
        void code_messageKey_ssot() {
            for (AuditAction action : AuditAction.values()) {
                assertThat(action.getCode()).isEqualTo(action.name());
                assertThat(action.getMessageKey())
                        .isEqualTo("enums.AuditAction." + action.name());
            }
        }

        @Test
        @DisplayName("fromCode 는 정확한 enum 을 반환하고 알 수 없는 코드는 예외")
        void fromCode_roundtrip() {
            assertThat(AuditAction.fromCode("USER_ANONYMIZE"))
                    .isEqualTo(AuditAction.USER_ANONYMIZE);
            assertThat(AuditAction.fromCode("LIFECYCLE_STATE_CHANGE"))
                    .isEqualTo(AuditAction.LIFECYCLE_STATE_CHANGE);
            assertThatThrownBy(() -> AuditAction.fromCode("UNKNOWN_ACTION"))
                    .isInstanceOf(IllegalArgumentException.class);
            assertThatThrownBy(() -> AuditAction.fromCode(null))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("NotificationType")
    class NotificationTypeTests {
        @Test
        @DisplayName("code 와 messageKey 가 SSOT 패턴을 따른다")
        void code_messageKey_ssot() {
            for (NotificationType type : NotificationType.values()) {
                assertThat(type.getCode()).isEqualTo(type.name());
                assertThat(type.getMessageKey())
                        .isEqualTo("enums.NotificationType." + type.name());
            }
        }

        @Test
        @DisplayName("fromCode 는 정확한 enum 을 반환하고 알 수 없는 코드는 예외")
        void fromCode_roundtrip() {
            assertThat(NotificationType.fromCode("WITHDRAWAL"))
                    .isEqualTo(NotificationType.WITHDRAWAL);
            assertThatThrownBy(() -> NotificationType.fromCode("BOGUS"))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("DestructionType")
    class DestructionTypeTests {
        @Test
        @DisplayName("4 유형(ANONYMIZE/TOMBSTONE/HARD_DELETE/DORMANT_TRANSITION)이 모두 정의된다")
        void four_paths_defined() {
            assertThat(DestructionType.values()).containsExactlyInAnyOrder(
                    DestructionType.ANONYMIZE,
                    DestructionType.TOMBSTONE,
                    DestructionType.HARD_DELETE,
                    DestructionType.DORMANT_TRANSITION);
        }

        @Test
        @DisplayName("fromCode 는 정확한 enum 을 반환")
        void fromCode_roundtrip() {
            assertThat(DestructionType.fromCode("ANONYMIZE"))
                    .isEqualTo(DestructionType.ANONYMIZE);
            assertThat(DestructionType.fromCode("DORMANT_TRANSITION"))
                    .isEqualTo(DestructionType.DORMANT_TRANSITION);
            assertThatThrownBy(() -> DestructionType.fromCode(null))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("LegalBasis")
    class LegalBasisTests {
        @Test
        @DisplayName("8 법적 근거가 정의되고 ASCII 코드만 사용한다(절(§) 문자 회피)")
        void legal_basis_ascii_only() {
            assertThat(LegalBasis.values()).hasSize(8);
            for (LegalBasis basis : LegalBasis.values()) {
                assertThat(basis.getCode())
                        .as("LegalBasis %s 의 code 는 ASCII 만 포함해야 한다", basis)
                        .matches("[A-Z0-9_]+");
            }
        }

        @Test
        @DisplayName("fromCode 는 PIPA/의료법/상법/세법/GDPR 코드를 모두 인식")
        void fromCode_all_codes() {
            assertThat(LegalBasis.fromCode("PIPA_36")).isEqualTo(LegalBasis.PIPA_36);
            assertThat(LegalBasis.fromCode("MEDICAL_LAW_22_10Y"))
                    .isEqualTo(LegalBasis.MEDICAL_LAW_22_10Y);
            assertThat(LegalBasis.fromCode("GDPR_17")).isEqualTo(LegalBasis.GDPR_17);
        }
    }

    @Nested
    @DisplayName("MappingHistoryEventType")
    class MappingHistoryEventTypeTests {
        @Test
        @DisplayName("8 이벤트 타입이 정의된다")
        void eight_event_types() {
            assertThat(MappingHistoryEventType.values()).hasSize(8);
        }

        @Test
        @DisplayName("fromCode 는 정확한 enum 을 반환")
        void fromCode_roundtrip() {
            assertThat(MappingHistoryEventType.fromCode("CREATED"))
                    .isEqualTo(MappingHistoryEventType.CREATED);
            assertThat(MappingHistoryEventType.fromCode("PARTIAL_REFUND"))
                    .isEqualTo(MappingHistoryEventType.PARTIAL_REFUND);
        }
    }

    @Nested
    @DisplayName("CompensationType")
    class CompensationTypeTests {
        @Test
        @DisplayName("4 보상 타입(NO_SHOW_COMP/LATE_CANCEL_COMP/EXTENSION/PARTIAL_REFUND_ROLLBACK)이 정의된다")
        void four_compensation_types() {
            assertThat(CompensationType.values()).containsExactlyInAnyOrder(
                    CompensationType.NO_SHOW_COMP,
                    CompensationType.LATE_CANCEL_COMP,
                    CompensationType.EXTENSION,
                    CompensationType.PARTIAL_REFUND_ROLLBACK);
        }

        @Test
        @DisplayName("fromCode 는 정확한 enum 을 반환")
        void fromCode_roundtrip() {
            assertThat(CompensationType.fromCode("NO_SHOW_COMP"))
                    .isEqualTo(CompensationType.NO_SHOW_COMP);
            assertThatThrownBy(() -> CompensationType.fromCode("UNKNOWN"))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }
}
