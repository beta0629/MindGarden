package com.coresolution.consultation.dto;

import lombok.Builder;
import lombok.Value;

/**
 * 일반 로그인(전화 + 비밀번호) 다중 매치 시 계정 선택 화면에 노출할 후보 정보.
 *
 * <p>본인 인증(phone + password)을 모두 통과한 사용자에게만 노출되므로 다음만 포함한다.
 * 전체 email · 이름 · 가입일 · 권한 상세는 보안 표준상 노출 금지.</p>
 *
 * <ul>
 *   <li>{@link #userId} — 카드 클릭 시 {@code /api/v1/auth/select-account} 로 전송할 PK</li>
 *   <li>{@link #role} — 사용자 역할 enum 코드(예: {@code ADMIN}, {@code CONSULTANT})</li>
 *   <li>{@link #roleDisplayLabel} — 짧은 한글 라벨(예: 관리자, 상담사)</li>
 *   <li>{@link #dashboardGuide} — 로그인 후 이동할 대시보드 안내 문구</li>
 *   <li>{@link #optionLabel} — "관리자 계정 (ID: 12)" 형태 식별용 라벨</li>
 *   <li>{@link #maskedEmail} — {@code a***@example.com} 형태 마스킹 이메일(없을 수 있음)</li>
 *   <li>{@link #branchName} — 브랜치명(없을 수 있음)</li>
 * </ul>
 *
 * <p>OAuth 의 {@code OAuthAccountSelectionPreviewItem} 와 동일한 핵심 필드를 공유하여 프론트
 * 컴포넌트 재사용성을 유지한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Value
@Builder
public class AccountCandidate {

    /** 사용자 PK — 선택 완료 시 본 값을 {@code selectionToken} 과 함께 전송한다. */
    long userId;

    /** 사용자 역할 enum 코드. 표시는 {@link #roleDisplayLabel} 사용. */
    String role;

    /** 짧은 역할 표시(예: 관리자, 상담사). */
    String roleDisplayLabel;

    /** 로그인 후 이동할 대시보드 안내. */
    String dashboardGuide;

    /** "관리자 계정 (ID: 12)" 형태 식별용 라벨. */
    String optionLabel;

    /** 마스킹된 이메일(예: {@code a***@example.com}) — 본인 식별 보조용. 비공개 사용자는 null. */
    String maskedEmail;

    /** 브랜치명(예: "인천 본점") — 본인 식별 보조용. 미지정 시 null. */
    String branchName;
}
