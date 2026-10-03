package com.coresolution.consultation.constant.compliance;

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
     * 침해사고 대응팀 구성.
     *
     * <p>P1 보안(2026-10-03): 연락처는 특정 테넌트(마인드가든) 값이 하드코딩되어 있어
     * 다른 테넌트가 로그인해도 마인드가든 전화·이메일·주소가 노출됐다. 연락처는 호출 측에서
     * 현재 테넌트 센터 프로필로 주입하고, 비어 있으면 공백 + 안내 문구만 노출한다.
     * 마인드가든 값으로의 폴백은 없다.
     *
     * @param contactInfo 현재 테넌트 센터 연락처 (비어 있으면 공백 + 안내 문구)
     * @return 대응팀 맵
     */
    public static Map<String, Object> breachResponseTeam(Map<String, Object> contactInfo) {
        return Map.of(
            "teamLeader", "개인정보보호책임자",
            "members", List.of(
                "기술팀장 (보안 담당)",
                "법무팀장 (법적 대응)",
                "마케팅팀장 (소통 담당)",
                "개발팀장 (기술적 대응)"
            ),
            "contactInfo", contactInfo
        );
    }
}
