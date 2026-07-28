/**
 * ClientSidePeekContent — 내담자 Side Peek 본문 (개요 + 결제 내역)
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../../common/SafeText';
import { getUserStatusKoreanNameSync, maskEncryptedDisplay } from '../../../../utils/codeHelper';
import { maskEmailDisplay, maskPhoneDisplay } from '../../../../utils/partyPiiDisplay';
import { PACKAGE_PAYMENT_HISTORY_UI } from '../../../../constants/packagePaymentHistory';
import PackagePaymentHistoryList from '../../package-payment-history/PackagePaymentHistoryList';
import './ClientSidePeekContent.css';

const ClientSidePeekContent = ({ client }) => {
  if (!client) {
    return null;
  }

  const clientName = maskEncryptedDisplay(client.name, '이름');
  const statusLabel = getUserStatusKoreanNameSync(client?.status);
  const phone = maskPhoneDisplay(client.phone);
  const email = maskEmailDisplay(client.email);
  const clientId = client.id;

  return (
    <div className="client-side-peek-stub">
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
