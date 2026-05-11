package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Properties;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coresolution.consultation.dto.EmailAttachmentPart;
import com.coresolution.consultation.dto.EmailRequest;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.core.repository.TenantRepository;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

/**
 * {@link EmailServiceImpl} 단위 테스트 — MIME 첨부(바이너리·경로) 발송 경로 검증.
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
@ExtendWith(MockitoExtension.class)
class EmailServiceImplTest {

    @Mock
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @Mock
    private CommonCodeService commonCodeService;

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private EmailServiceImpl emailService;

    @Test
    @DisplayName("sendEmail: binaryAttachments 가 있으면 MimeMessage 로 JavaMailSender.send 호출")
    void sendEmail_withBinaryAttachments_invokesMailSender() throws Exception {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        String to = "payroll-" + UUID.randomUUID() + "@example.com";
        EmailRequest request = EmailRequest.builder()
                .toEmail(to)
                .subject("급여 안내")
                .content("<html><body>본문</body></html>")
                .type("HTML")
                .binaryAttachments(List.of(EmailAttachmentPart.builder()
                        .filename("salary.pdf")
                        .mimeType("application/pdf")
                        .content(new byte[] { 0x25, 0x50, 0x44, 0x46 }) // %PDF
                        .build()))
                .build();

        EmailResponse response = emailService.sendEmail(request);

        assertTrue(response.isSuccess());
        verify(javaMailSender).createMimeMessage();
        verify(javaMailSender).send(mimeMessage);
    }

    @Test
    @DisplayName("sendEmail: attachments 경로가 유효하지 않으면 스킵하고 발송은 성공")
    void sendEmail_withInvalidPathAttachment_skipsAndSends() throws Exception {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        String to = "notify-" + UUID.randomUUID() + "@example.com";
        EmailRequest request = EmailRequest.builder()
                .toEmail(to)
                .subject("제목")
                .content("<p>내용</p>")
                .type("HTML")
                .attachments(List.of("/no/such/file-" + UUID.randomUUID() + ".bin"))
                .build();

        EmailResponse response = emailService.sendEmail(request);

        assertTrue(response.isSuccess());
        verify(javaMailSender).send(any(MimeMessage.class));
    }
}
