/**
 * AccountSelectionModal — 일반 로그인(전화 + 비밀번호) 다중 매치 시 계정 선택 모달.
 *
 * <p>P1 silent first 차단 흐름의 두 번째 단계. {@code POST /api/v1/auth/login} 응답이
 * {@code multipleAccounts: true} 일 때 부모(`UnifiedLogin`) 가 본 모달을 열고, 사용자가
 * 카드 클릭으로 계정을 선택하면 {@code POST /api/v1/auth/select-account} 로 후속 요청.</p>
 *
 * <p>OAuth 의 `OAuthAccountSelection*` 스펙(`docs/design-system/OAUTH_PHONE_VERIFICATION_UX_SPEC.md`)
 * 과 동일한 카드 패턴(라벨 + 대시보드 안내) 을 따르되, 네트워크 호출은 일반 로그인 전용
 * 엔드포인트로만 보낸다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */

import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import {
  OAUTH_ACCOUNT_SELECTION_STRINGS,
  buildOAuthAccountSelectionCandidatePrimaryLine,
  buildOAuthAccountSelectionCandidateSecondaryLine
} from '../../constants/oauthAccountSelectionStrings';
import { authAPI } from '../../utils/ajax';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen — 모달 표시 여부
 * @param {() => void} props.onClose — 모달 닫기 (취소/실패)
 * @param {Array<{userId:number, role?:string, roleDisplayLabel?:string,
 *   dashboardGuide?:string, optionLabel?:string, maskedEmail?:string,
 *   branchName?:string}>} props.candidates — BE 가 발급한 계정 후보 카드 목록
 * @param {string} props.selectionToken — `/api/v1/auth/select-account` 호출 시 함께 보낼 단기 JWT
 * @param {(payload:{response:Object, selectedUserId:number}) => Promise<void>} props.onSelected
 *   — `/select-account` 성공 시 부모에서 세션·라우팅 처리
 * @param {(payload:{message:string, requiresConfirmation?:boolean,
 *   data?:Object}) => void} [props.onRequiresConfirmation] — 중복 로그인 확인 분기
 * @param {(payload:{status?:number, message?:string}) => void} [props.onError] — 오류 분기
 */
const AccountSelectionModal = ({
  isOpen,
  onClose,
  candidates,
  selectionToken,
  onSelected,
  onRequiresConfirmation,
  onError
}) => {
  const [submittingId, setSubmittingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSelect = useCallback(async(candidate) => {
    if (!candidate || candidate.userId == null) {
      return;
    }
    if (submittingId != null) {
      return;
    }
    setSubmittingId(candidate.userId);
    setErrorMessage('');
    try {
      const result = await authAPI.selectAccount({
        selectionToken,
        selectedUserId: candidate.userId
      });
      const data = result?.data || result || {};
      if (result?.success) {
        if (typeof onSelected === 'function') {
          await onSelected({ response: result, selectedUserId: candidate.userId });
        }
        return;
      }
      if (data?.requiresConfirmation || data?.responseType === 'duplicate_login_confirmation') {
        if (typeof onRequiresConfirmation === 'function') {
          onRequiresConfirmation({
            message: data?.message || result?.message,
            requiresConfirmation: true,
            data
          });
        }
        return;
      }
      const msg = result?.message || data?.message || OAUTH_ACCOUNT_SELECTION_STRINGS.COMPLETE_FAILED;
      setErrorMessage(msg);
      if (typeof onError === 'function') {
        onError({ status: result?.status, message: msg });
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message
        || e?.message
        || OAUTH_ACCOUNT_SELECTION_STRINGS.COMPLETE_FAILED;
      setErrorMessage(msg);
      if (typeof onError === 'function') {
        onError({ status: e?.response?.status, message: msg });
      }
    } finally {
      setSubmittingId(null);
    }
  }, [onError, onRequiresConfirmation, onSelected, selectionToken, submittingId]);

  if (!isOpen) {
    return null;
  }

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={OAUTH_ACCOUNT_SELECTION_STRINGS.MODAL_TITLE}
      size="small"
      variant="form"
    >
      <div className="mg-v2-form-section">
        <p className="mg-v2-form-section__description">
          {OAUTH_ACCOUNT_SELECTION_STRINGS.MODAL_SUBTITLE}
        </p>
      </div>

      <ul
        className="mg-v2-form-section"
        aria-label={OAUTH_ACCOUNT_SELECTION_STRINGS.MODAL_TITLE}
        data-testid="account-selection-candidate-list"
      >
        {(candidates || []).map((candidate) => {
          const primary = buildOAuthAccountSelectionCandidatePrimaryLine(candidate);
          const secondary = buildOAuthAccountSelectionCandidateSecondaryLine(candidate);
          const isSubmitting = submittingId === candidate.userId;
          return (
            <li key={candidate.userId} className="mg-v2-form-section__item">
              <MGButton
                type="button"
                variant="ghost"
                fullWidth
                disabled={submittingId != null}
                onClick={() => handleSelect(candidate)}
                data-testid={`account-selection-candidate-${candidate.userId}`}
              >
                <span className="mg-v2-form-section__item-primary">
                  {primary}
                </span>
                {secondary ? (
                  <span className="mg-v2-form-section__item-secondary">
                    {secondary}
                  </span>
                ) : null}
                {candidate.maskedEmail ? (
                  <span className="mg-v2-form-section__item-meta">
                    {candidate.maskedEmail}
                  </span>
                ) : null}
                {candidate.branchName ? (
                  <span className="mg-v2-form-section__item-meta">
                    {candidate.branchName}
                  </span>
                ) : null}
                {isSubmitting ? (
                  <span className="mg-v2-form-section__item-meta">…</span>
                ) : null}
              </MGButton>
            </li>
          );
        })}
      </ul>

      {errorMessage ? (
        <div
          className="mg-v2-form-section__error"
          role="alert"
          data-testid="account-selection-error"
        >
          {errorMessage}
        </div>
      ) : null}
    </UnifiedModal>
  );
};

AccountSelectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  candidates: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.number.isRequired,
      role: PropTypes.string,
      roleDisplayLabel: PropTypes.string,
      dashboardGuide: PropTypes.string,
      optionLabel: PropTypes.string,
      maskedEmail: PropTypes.string,
      branchName: PropTypes.string
    })
  ).isRequired,
  selectionToken: PropTypes.string.isRequired,
  onSelected: PropTypes.func.isRequired,
  onRequiresConfirmation: PropTypes.func,
  onError: PropTypes.func
};

AccountSelectionModal.defaultProps = {
  onRequiresConfirmation: undefined,
  onError: undefined
};

export default AccountSelectionModal;
