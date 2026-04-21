package com.coresolution.consultation.constant.compliance;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 컴플라이언스 대시보드 샘플(데모) 데이터 구성.
 *
 * @author MindGarden
 * @since 2026-04-21
 */
public final class ComplianceDashboardSampleContent {

    private ComplianceDashboardSampleContent() {
    }

    /**
     * 개인정보 처리 목적별 위험도 평가 샘플.
     *
     * @return 목적별 위험도 맵
     */
    public static Map<String, Object> riskAssessment() {
        return Map.of(
            "userManagement", Map.of(
                "purpose", "회원가입 및 서비스 이용",
                "riskLevel", "중간",
                "dataTypes", List.of("이름", "이메일", "전화번호", "주소"),
                "retentionPeriod", "회원 탈퇴 시까지",
                "protectionMeasures", List.of("암호화", "접근 제어", "로그 관리")
            ),
            "consultationService", Map.of(
                "purpose", "상담 서비스 제공",
                "riskLevel", "높음",
                "dataTypes", List.of("상담 내용", "상담 일지", "개인정보"),
                "retentionPeriod", "상담 완료 후 5년",
                "protectionMeasures", List.of("의료정보 암호화", "접근 권한 관리", "비밀유지 의무")
            ),
            "paymentProcessing", Map.of(
                "purpose", "결제 및 환불 처리",
                "riskLevel", "높음",
                "dataTypes", List.of("결제 정보", "카드번호", "금융 거래 내역"),
                "retentionPeriod", "거래 완료 후 5년",
                "protectionMeasures", List.of("결제 정보 암호화", "PCI DSS 준수", "접근 로그 관리")
            ),
            "salaryManagement", Map.of(
                "purpose", "급여 계산 및 세금 처리",
                "riskLevel", "중간",
                "dataTypes", List.of("급여 정보", "세금 정보", "근로자 정보"),
                "retentionPeriod", "급여 지급 후 3년",
                "protectionMeasures", List.of("급여 정보 암호화", "접근 권한 관리", "감사 로그")
            )
        );
    }

    /**
     * 전체 위험도 평가 샘플.
     *
     * @return 전체 평가 맵
     */
    public static Map<String, Object> overallImpactAssessment() {
        return Map.of(
            "overallRiskLevel", "중간",
            "complianceStatus", "부분 준수",
            "improvementAreas", List.of(
                "개인정보 처리방침 보완",
                "개인정보 영향평가 정기 실시",
                "개인정보보호 교육 강화",
                "개인정보 침해사고 대응체계 구축"
            ),
            "nextAssessmentDate", LocalDateTime.now().plusMonths(6)
        );
    }

    /**
     * 침해사고 대응 절차 샘플.
     *
     * @return 단계별 대응 절차 맵
     */
    public static Map<String, Object> breachResponseProcedures() {
        return Map.of(
            "step1", Map.of(
                "title", "침해사고 발견 및 신고",
                "timeframe", "발견 즉시",
                "responsible", "개인정보보호책임자",
                "actions", List.of("침해사고 신고", "초기 대응팀 구성", "피해 범위 파악")
            ),
            "step2", Map.of(
                "title", "개인정보보호위원회 신고",
                "timeframe", "발견 후 24시간 이내",
                "responsible", "개인정보보호책임자",
                "actions", List.of("신고서 작성", "위원회 신고", "추가 조치 안내")
            ),
            "step3", Map.of(
                "title", "피해자 통지",
                "timeframe", "발견 후 5일 이내",
                "responsible", "대응팀",
                "actions", List.of("피해자 식별", "통지서 작성", "피해자 통지")
            ),
            "step4", Map.of(
                "title", "원인 분석 및 재발방지",
                "timeframe", "침해사고 발생 후 30일 이내",
                "responsible", "기술팀",
                "actions", List.of("원인 분석", "보안 강화", "재발방지 대책 수립")
            )
        );
    }

    /**
     * 침해사고 대응팀 구성 샘플.
     *
     * @return 대응팀 맵
     */
    public static Map<String, Object> breachResponseTeam() {
        return Map.of(
            "teamLeader", "개인정보보호책임자",
            "members", List.of(
                "기술팀장 (보안 담당)",
                "법무팀장 (법적 대응)",
                "마케팅팀장 (소통 담당)",
                "개발팀장 (기술적 대응)"
            ),
            "contactInfo", Map.of(
                "emergency", "02-1234-5678",
                "email", "privacy@mindgarden.co.kr",
                "address", "서울시 강남구 테헤란로 123"
            )
        );
    }
}
