package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

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

    @Test
    @DisplayName("급여 계산 메일 본문: 옵션 급여 행·금액 및 푸터 {{companyName}} 치환")
    void createSalaryCalculationEmailContent_optionSalaryAndResolvesFooterPlaceholders() {
        Map<String, Object> data = new HashMap<>();
        data.put("baseSalary", 0L);
        data.put("commissionEarnings", 80000L);
        data.put("hourlyEarnings", 50000L);
        data.put("bonusEarnings", 10000L);
        data.put("grossSalary", 150000L);
        data.put("totalSalary", 150000L);
        data.put("taxAmount", 15000L);
        data.put("netSalary", 120000L);
        data.put("consultationCount", 3);

        String html = ReflectionTestUtils.invokeMethod(
                emailService,
                "createSalaryCalculationEmailContent",
                "홍길동",
                "2025-06",
                data);

        assertTrue(html.contains("옵션 급여"));
        assertTrue(html.contains("130,000원"), html);
        assertTrue(html.contains("특별지원금"));
        assertTrue(html.contains("+10,000원"));
        assertTrue(html.contains("총 급여 (세전)"));
        assertTrue(html.contains("150,000원"));
        assertTrue(html.contains("세금·공제"));
        assertTrue(html.contains("-15,000원"));
        assertTrue(html.contains("실지급액 (세후)"));
        assertTrue(html.contains("120,000원"));
        assertTrue(html.contains("상담 건수"));
        assertTrue(html.contains("3건"));
        assertFalse(html.contains("{{companyName}}"), html);
        assertFalse(html.contains("{{supportEmail}}"), html);
        assertTrue(html.contains("mindgarden 팀"), html);
    }

    @Test
    @DisplayName("급여 계산 메일 본문: 기본+상담(회기수)+특별지원+총액(gross) 시나리오")
    void createSalaryCalculationEmailContent_baseCommissionBonusGross() {
        Map<String, Object> data = new HashMap<>();
        data.put("baseSalary", 40000L);
        data.put("commissionEarnings", 120000L);
        data.put("hourlyEarnings", 0L);
        data.put("bonusEarnings", 10000L);
        data.put("grossSalary", 130000L);
        data.put("totalSalary", 170000L);
        data.put("taxAmount", 20000L);
        data.put("netSalary", 90000L);
        data.put("consultationCount", 5);

        String html = ReflectionTestUtils.invokeMethod(
                emailService,
                "createSalaryCalculationEmailContent",
                "이몽룡",
                "2025-05",
                data);

        assertTrue(html.contains("기본 급여"));
        assertTrue(html.contains("40,000원"));
        assertTrue(html.contains("상담(회기수) 급여"));
        assertTrue(html.contains("120,000원"));
        assertFalse(html.contains("옵션 급여"), "시급·커미션 동시 양수가 아니면 옵션 급여 라벨 없음");
        assertTrue(html.contains("특별지원금"));
        assertTrue(html.contains("+10,000원"));
        assertTrue(html.contains("총 급여 (세전)"));
        assertTrue(html.contains("130,000원"));
        assertFalse(html.contains("{{companyName}}"));
    }
}
