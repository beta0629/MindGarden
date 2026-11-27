/**
 * ClientSidePeekContent — 내담자 Side Peek 본문 (개요 + 질문지 + 이력 + 결제 내역)
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../../common/SafeText';
import MGButton from '../../../common/MGButton';
import { getUserStatusKoreanNameSync, maskEncryptedDisplay } from '../../../../utils/codeHelper';
import { maskEmailDisplay, maskPhoneDisplay } from '../../../../utils/partyPiiDisplay';
import { PACKAGE_PAYMENT_HISTORY_UI } from '../../../../constants/packagePaymentHistory';
import { CLIENT_EVENT_TIMELINE_UI } from '../../../../constants/clientEventTimeline';
import { USER_ROLES, RoleUtils } from '../../../../constants/roles';
import PackagePaymentHistoryList from '../../package-payment-history/PackagePaymentHistoryList';
import ClientEventTimelineList from '../../client-event-timeline/ClientEventTimelineList';
import SctClientQuestionnairePanel from '../../sct/SctClientQuestionnairePanel';
import useSctFeatureEnabled from '../../../../hooks/useSctFeatureEnabled';
import { useSession } from '../../../../contexts/SessionContext';
import { SCT_CSS, SCT_UI } from '../../../../constants/sctOnline';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import './ClientSidePeekContent.css';

const PEEK_TAB = Object.freeze({
  OVERVIEW: 'overview',
  QUESTIONNAIRE: 'questionnaire',
  HISTORY: 'history'
});

const ClientSidePeekContent = ({ client }) => {
  const { enabled: sctEnabled } = useSctFeatureEnabled();
  const { user } = useSession();
  const canViewHistory = RoleUtils.hasAnyRole(user, [USER_ROLES.ADMIN, USER_ROLES.STAFF]);
  const showTablist = sctEnabled || canViewHistory;
  const [peekTab, setPeekTab] = useState(PEEK_TAB.OVERVIEW);

  if (!client) {
    return null;
  }

  const clientName = maskEncryptedDisplay(client.name, '이름');
  const statusLabel = getUserStatusKoreanNameSync(client?.status);
  const phone = maskPhoneDisplay(client.phone);
  const email = maskEmailDisplay(client.email);
  const clientId = client.id;

  return (
    <div className={`client-side-peek-stub ${SCT_CSS.PEEK_TAB}`}>
      {showTablist ? (
        <div className="mg-v2-sct-peek__tabs mg-v2-ad-b0kla__pill-toggle" role="tablist" aria-label="내담자 상세 탭">
          <MGButton
            type="button"
            variant="outline"
            size="small"
            preventDoubleClick={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            role="tab"
            aria-selected={peekTab === PEEK_TAB.OVERVIEW}
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: `mg-v2-ad-b0kla__pill ${peekTab === PEEK_TAB.OVERVIEW ? 'mg-v2-ad-b0kla__pill--active' : ''}`
            })}
            onClick={() => setPeekTab(PEEK_TAB.OVERVIEW)}
          >
            {SCT_UI.TAB_OVERVIEW}
          </MGButton>
          {sctEnabled ? (
            <MGButton
              type="button"
              variant="outline"
              size="small"
              preventDoubleClick={false}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              role="tab"
              aria-selected={peekTab === PEEK_TAB.QUESTIONNAIRE}
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'sm',
                loading: false,
                className: `mg-v2-ad-b0kla__pill ${peekTab === PEEK_TAB.QUESTIONNAIRE ? 'mg-v2-ad-b0kla__pill--active' : ''}`
              })}
              onClick={() => setPeekTab(PEEK_TAB.QUESTIONNAIRE)}
            >
              {SCT_UI.TAB_QUESTIONNAIRE}
            </MGButton>
          ) : null}
          {canViewHistory ? (
            <MGButton
              type="button"
              variant="outline"
              size="small"
              preventDoubleClick={false}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              role="tab"
              aria-selected={peekTab === PEEK_TAB.HISTORY}
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'sm',
                loading: false,
                className: `mg-v2-ad-b0kla__pill ${peekTab === PEEK_TAB.HISTORY ? 'mg-v2-ad-b0kla__pill--active' : ''}`
              })}
              onClick={() => setPeekTab(PEEK_TAB.HISTORY)}
            >
              {CLIENT_EVENT_TIMELINE_UI.TAB_HISTORY}
            </MGButton>
          ) : null}
        </div>
      ) : null}

      {(!showTablist || peekTab === PEEK_TAB.OVERVIEW) ? (
        <>
          <dl className="client-side-peek-stub__facts">
            <div className="client-side-peek-stub__fact">
              <dt>이름</dt>
              <dd><SafeText>{clientName}</SafeText></dd>
            </div>
            <div className="client-side-peek-stub__fact">
              <dt>상태</dt>
              <dd><SafeText>{statusLabel}</SafeText></dd>
            </div>
            <div className="client-side-peek-stub__fact">
              <dt>연락처</dt>
              <dd><SafeText>{phone}</SafeText></dd>
            </div>
            <div className="client-side-peek-stub__fact">
              <dt>이메일</dt>
              <dd><SafeText>{email}</SafeText></dd>
            </div>
          </dl>

          {clientId != null && (
            <section
              className="client-side-peek-stub__payment-history"
              aria-label={PACKAGE_PAYMENT_HISTORY_UI.SECTION_TITLE}
            >
              <h3 className="client-side-peek-stub__section-title">
                <SafeText>{PACKAGE_PAYMENT_HISTORY_UI.SECTION_TITLE}</SafeText>
              </h3>
              <PackagePaymentHistoryList clientId={clientId} showAdminDetails />
            </section>
          )}
        </>
      ) : null}

      {sctEnabled && peekTab === PEEK_TAB.QUESTIONNAIRE ? (
        <SctClientQuestionnairePanel client={client} />
      ) : null}

      {canViewHistory && peekTab === PEEK_TAB.HISTORY && clientId != null ? (
        <section
          className="client-side-peek-stub__history"
          aria-label={CLIENT_EVENT_TIMELINE_UI.SECTION_TITLE}
        >
          <ClientEventTimelineList clientId={clientId} />
        </section>
      ) : null}
    </div>
  );
};

ClientSidePeekContent.propTypes = {
  client: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    status: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string
  })
};

ClientSidePeekContent.defaultProps = {
  client: null
};

export default ClientSidePeekContent;
