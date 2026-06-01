package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 SMS 템플릿 관리 화면 응답 — 키별 행 1건.
 *
 * <p>전역(tenant_id IS NULL) 본문과 현재 테넌트 override 본문을 함께 노출한다.
 * 어드민은 tenant override 본문만 수정·삭제할 수 있으며, 전역 본문은 Flyway 로만
 * 변경한다(SSOT 가드, {@code docs/standards/}).
 *
 * @param key                       SMS_TEMPLATE common_code.code_value (예: PAYMENT_COMPLETED)
 * @param label                     화면 표시용 한글 라벨 (common_code.korean_name)
 * @param description               본문 사용처·변수 설명 (common_code.code_description)
 * @param category                  분류 메타 (extra_data.category)
 * @param variables                 변수 목록 (extra_data.variables) — 미리보기 입력 폼 자동 생성
 * @param globalContent             전역 본문(Flyway 시드, 읽기 전용)
 * @param tenantContent             현재 테넌트 override 본문(없으면 null)
 * @param updatedAt                 마지막 수정 시각 (테넌트 override 우선, 없으면 전역)
 * @param updatedByLabel            마지막 수정자 라벨(현재는 SYSTEM/관리자 표기, 추후 audit 보강)
 * @param tenantOverride            테넌트 override 활성 여부 (UI 배지용)
 * @param globalDispatchEnabled     글로벌 자동 SMS 발송 게이트 상태 (system_config)
 * @param tenantDispatchEnabled     종목별 자동 SMS 발송 게이트 상태 (extra_data.dispatch_enabled —
 *                                  테넌트 override 우선, 없으면 글로벌 row 값)
 * @param effectiveDispatchEnabled  글로벌 AND 종목별 AND 결과 — 실제 발송 여부 (어드민 뱃지)
 * @param audience                  수신 대상 분류 (extra_data.audience) —
 *                                  'CLIENT'/'CONSULTANT'/'BOTH'/'ADMIN'/'SYSTEM'.
 *                                  null/미시드 시 화면에서 'CLIENT' 기본 처리 (Pill 배지 색상 분기용).
 *                                  Flyway V20260607_005 재시드 — BOTH 4종 (CONSULTATION_CONFIRMED,
 *                                  CONSULTATION_REMINDER, SCHEDULE_CHANGED, SESSION_ENDING_SOON) +
 *                                  ADMIN 1종 (DEPOSIT_PENDING_REMINDER) + 나머지 CLIENT 10종.
 * @param trigger                   발송 조건/트리거 자연어 (extra_data.trigger) — 어드민 UI 에
 *                                  '발송 조건: ...' 강조 노출. 본문만 보고 트리거 헷갈리는 문제 해소.
 *                                  null/미시드 시 화면에서 미노출.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsTemplateAdminItem {
    private String key;
    private String label;
    private String description;
    private String category;
    private List<String> variables;
    private String globalContent;
    private String tenantContent;
    private LocalDateTime updatedAt;
    private String updatedByLabel;
    private boolean tenantOverride;
    private boolean globalDispatchEnabled;
    private boolean tenantDispatchEnabled;
    private boolean effectiveDispatchEnabled;
    private String audience;
    private String trigger;
}
