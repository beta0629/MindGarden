package com.coresolution.consultation.sct.unit;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import com.coresolution.consultation.sct.controller.SctInvitationController;
import com.coresolution.consultation.sct.dto.SctDomainMemoUpsertRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * domain-memos PreAuthorize 가 invitation detail 과 동일하게 STAFF 를 통과시켜
 * 서비스 계층 deny+감사({@code SctClinicalAccessDeniedAuditWriter})까지 도달하게 한다.
 *
 * @author MindGarden
 * @since 2026-11-24
 */
@DisplayName("SctInvitationController domain-memos @PreAuthorize")
class SctInvitationControllerDomainMemoPreAuthorizeTest {

    private static final String STAFF_LIKE =
            "hasAnyRole('ADMIN','STAFF','CONSULTANT')";

    @Test
    @DisplayName("GET domain-memos — ADMIN·STAFF·CONSULTANT (서비스에서 STAFF 임상 본문 거부)")
    void listDomainMemos_preAuthorizeIncludesStaff() throws Exception {
        Method method = SctInvitationController.class.getDeclaredMethod(
                "listDomainMemos", Long.class, HttpSession.class, HttpServletRequest.class);
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
        assertThat(annotation).as("@PreAuthorize 필수").isNotNull();
        assertThat(annotation.value()).isEqualTo(STAFF_LIKE);
    }

    @Test
    @DisplayName("PUT domain-memos — ADMIN·STAFF·CONSULTANT (서비스에서 STAFF 임상 본문 거부)")
    void upsertDomainMemo_preAuthorizeIncludesStaff() throws Exception {
        Method method = SctInvitationController.class.getDeclaredMethod(
                "upsertDomainMemo",
                Long.class,
                String.class,
                SctDomainMemoUpsertRequest.class,
                HttpSession.class,
                HttpServletRequest.class);
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
        assertThat(annotation).as("@PreAuthorize 필수").isNotNull();
        assertThat(annotation.value()).isEqualTo(STAFF_LIKE);
    }

    @Test
    @DisplayName("invitation detail GET 과 domain-memos 역할식이 동일하다")
    void invitationDetailAndDomainMemos_shareStaffLikeRoles() throws Exception {
        Method detail = SctInvitationController.class.getDeclaredMethod(
                "get", Long.class, HttpSession.class, HttpServletRequest.class);
        Method list = SctInvitationController.class.getDeclaredMethod(
                "listDomainMemos", Long.class, HttpSession.class, HttpServletRequest.class);
        assertThat(detail.getAnnotation(PreAuthorize.class).value())
                .isEqualTo(list.getAnnotation(PreAuthorize.class).value());
    }
}
