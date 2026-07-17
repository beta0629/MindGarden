import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import ActionBar from '../../common/ActionBar';
import ActionBarButton from '../../common/ActionBarButton';
import UnifiedModal from '../../common/modals/UnifiedModal';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import notificationManager from '../../../utils/notification';
import { toDisplayString, toErrorMessage, toSafeNumber } from '../../../utils/safeDisplay';
import { sessionManager } from '../../../utils/sessionManager';
import StandardizedApi from '../../../utils/standardizedApi';
import { SESSION_EXTENSION_UI } from '../../../utils/sessionExtensionPending';
import './SessionExtensionModal.css';

const MSG_USER_REQUIRED = '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.';
const MSG_SUBMIT_FAILED = '회기 추가 요청에 실패했습니다.';
const MSG_PACKAGE_REQUIRED = '현재 매핑의 패키지 정보를 확인할 수 없습니다.';
const DEFAULT_ADDITIONAL_SESSIONS = 1;
const DEFAULT_EXTENSION_AMOUNT = 0;

/**
 * 동일 패키지를 승계해 가변 회기·금액을 요청하는 모달.
 *
 * @author Core Solution
 * @since 2024-12-19
 */
const SessionExtensionModal = ({
  isOpen,
  onClose,
  mapping,
  onSessionExtensionRequested = undefined
}) => {
  const { t } = useTranslation();
  const [additionalSessions, setAdditionalSessions] = useState(DEFAULT_ADDITIONAL_SESSIONS);
  const [extensionAmount, setExtensionAmount] = useState(DEFAULT_EXTENSION_AMOUNT);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !mapping) {
      return;
    }
    setAdditionalSessions(DEFAULT_ADDITIONAL_SESSIONS);
    setExtensionAmount(DEFAULT_EXTENSION_AMOUNT);
    setReason('');
    setIsLoading(false);
    submittingRef.current = false;
  }, [isOpen, mapping]);

  const handleClose = () => {
    if (isLoading) {
      return;
    }
    setAdditionalSessions(DEFAULT_ADDITIONAL_SESSIONS);
    setExtensionAmount(DEFAULT_EXTENSION_AMOUNT);
    setReason('');
    onClose();
  };

  const handleSubmit = async(event) => {
    event?.preventDefault();

    if (submittingRef.current) {
      return;
    }
    if (mapping?.pendingSessionExtension) {
      notificationManager.warning(SESSION_EXTENSION_UI.DUPLICATE_PENDING);
      return;
    }
    if (additionalSessions < DEFAULT_ADDITIONAL_SESSIONS) {
      notificationManager.error('추가할 회기 수는 1회 이상이어야 합니다.');
      return;
    }
    if (!Number.isFinite(extensionAmount) || extensionAmount < DEFAULT_EXTENSION_AMOUNT) {
      notificationManager.error('추가분 결제 금액을 입력해 주세요. (회기 수와 다를 수 있습니다)');
      return;
    }

    const requesterId = sessionManager.getUser()?.id;
    if (!requesterId) {
      notificationManager.error(MSG_USER_REQUIRED);
      return;
    }
    if (!mapping.packageName && !mapping.package?.name) {
      notificationManager.error(MSG_PACKAGE_REQUIRED);
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);
    try {
      const result = await StandardizedApi.post(
        API_ENDPOINTS.ADMIN.SESSION_EXTENSIONS.REQUESTS,
        {
          mappingId: mapping.id,
          requesterId,
          additionalSessions,
          extensionAmount,
          reason: reason.trim() || '회기 추가 요청'
        }
      );
      if (result?.success === false) {
        throw new Error(result.message || MSG_SUBMIT_FAILED);
      }

      notificationManager.success(SESSION_EXTENSION_UI.SUCCESS_HINT);
      await onSessionExtensionRequested?.(mapping.id);
      onClose();
    } catch (error) {
      console.error('회기 추가 실패:', error);
      const message = error?.response?.data?.message
        || error?.message
        || toErrorMessage(error, MSG_SUBMIT_FAILED);
      notificationManager.error(message);
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  if (!isOpen || !mapping) {
    return null;
  }

  const usedSessions = Math.max(0, toSafeNumber(mapping.usedSessions, 0));
  const totalSessions = Math.max(
    0,
    toSafeNumber(mapping.totalSessions ?? mapping.package?.sessions, 0)
  );
  const remainingSessions = Math.max(
    0,
    toSafeNumber(mapping.remainingSessions, totalSessions - usedSessions)
  );
  const projectedTotal = totalSessions + additionalSessions;
  const projectedRemaining = remainingSessions + additionalSessions;
  const packageName = toDisplayString(
    mapping.packageName ?? mapping.package?.name,
    '패키지 정보 없음'
  );
  const clientName = toDisplayString(mapping.client?.name ?? mapping.clientName, '내담자 미지정');
  const consultantName = toDisplayString(
    mapping.consultant?.name ?? mapping.consultantName,
    '상담사 미지정'
  );
  const progressMax = Math.max(totalSessions, DEFAULT_ADDITIONAL_SESSIONS);
  const progressValue = Math.min(usedSessions, progressMax);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="회기 추가"
      subtitle={`${clientName} - ${consultantName}`}
      size="medium"
      className="mg-v2-ad-b0kla mg-extension-modal"
      backdropClick={!isLoading}
      showCloseButton
      loading={isLoading}
      actions={(
        <ActionBar align="end" gap="md">
          <ActionBarButton
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t('admin.actions.cancel')}
          </ActionBarButton>
          <ActionBarButton
            variant="primary"
            onClick={handleSubmit}
            loading={isLoading}
            disabled={additionalSessions < DEFAULT_ADDITIONAL_SESSIONS}
          >
            {`+${additionalSessions}회기 추가 요청`}
          </ActionBarButton>
        </ActionBar>
      )}
    >
      <form className="mg-extension" onSubmit={handleSubmit}>
          <section className="mg-extension__status" aria-labelledby="mg-extension-package-title">
            <span className="mg-extension__accent" aria-hidden="true" />
            <div className="mg-extension__status-content">
              <h3 id="mg-extension-package-title" className="mg-extension__package">
                {packageName}
              </h3>
              <progress
                className="mg-extension__progress"
                value={progressValue}
                max={progressMax}
                aria-label="현재 회기 사용 진행률"
              />
              <p className="mg-extension__session-summary">
                {`사용 ${usedSessions}회 / 남은 ${remainingSessions}회 / 총 ${totalSessions}회`}
              </p>
            </div>
          </section>

          <section className="mg-extension__inputs" aria-labelledby="mg-extension-input-title">
            <header className="mg-extension__section-header">
              <h3 id="mg-extension-input-title" className="mg-extension__section-title">추가 정보</h3>
              <p className="mg-extension__help">
                동일 패키지를 승계하며 패키지명과 기존 가격은 변경하지 않습니다.
              </p>
            </header>
            <div className="mg-extension__input-grid">
              <label className="mg-extension__field" htmlFor="mg-extension-count">
                <span className="mg-extension__label">추가 회기 수</span>
                <input
                  id="mg-extension-count"
                  type="number"
                  className="mg-v2-input"
                  value={additionalSessions}
                  min={DEFAULT_ADDITIONAL_SESSIONS}
                  step={DEFAULT_ADDITIONAL_SESSIONS}
                  onChange={(event) => setAdditionalSessions(toSafeNumber(
                    event.target.value,
                    DEFAULT_ADDITIONAL_SESSIONS
                  ))}
                  disabled={isLoading}
                  required
                />
              </label>
              <label className="mg-extension__field" htmlFor="mg-extension-amount">
                <span className="mg-extension__label">추가분 결제 금액(원)</span>
                <span className="mg-extension__amount-control">
                  <input
                    id="mg-extension-amount"
                    type="number"
                    className="mg-v2-input"
                    aria-label="추가분 결제 금액(원)"
                    value={extensionAmount}
                    min={DEFAULT_EXTENSION_AMOUNT}
                    onChange={(event) => setExtensionAmount(toSafeNumber(
                      event.target.value,
                      DEFAULT_EXTENSION_AMOUNT
                    ))}
                    disabled={isLoading}
                    required
                  />
                  <span className="mg-extension__unit" aria-hidden="true">원</span>
                </span>
              </label>
            </div>
            <label className="mg-extension__field" htmlFor="mg-extension-reason">
              <span className="mg-extension__label">사유 (선택)</span>
              <textarea
                id="mg-extension-reason"
                className="mg-v2-input mg-extension__textarea"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="회기 추가 사유를 입력하세요"
                disabled={isLoading}
              />
            </label>
          </section>

          <section className="mg-extension__projection" aria-labelledby="mg-extension-projection-title">
            <h3 id="mg-extension-projection-title" className="mg-extension__section-title">예상 결과</h3>
            <dl className="mg-extension__projection-list">
              <div className="mg-extension__projection-row">
                <dt>총 회기 수</dt>
                <dd>
                  <span>{`${totalSessions}회`}</span>
                  <span aria-hidden="true">→</span>
                  <strong>{`${projectedTotal}회`}</strong>
                </dd>
              </div>
              <div className="mg-extension__projection-row">
                <dt>남은 회기 수</dt>
                <dd>
                  <span>{`${remainingSessions}회`}</span>
                  <span aria-hidden="true">→</span>
                  <strong>{`${projectedRemaining}회`}</strong>
                </dd>
              </div>
            </dl>
          </section>
      </form>
    </UnifiedModal>
  );
};

SessionExtensionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    clientName: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    consultantName: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    packageName: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    usedSessions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    remainingSessions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalSessions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    package: PropTypes.object,
    client: PropTypes.object,
    consultant: PropTypes.object,
    pendingSessionExtension: PropTypes.object
  }).isRequired,
  onSessionExtensionRequested: PropTypes.func
};

export default SessionExtensionModal;
