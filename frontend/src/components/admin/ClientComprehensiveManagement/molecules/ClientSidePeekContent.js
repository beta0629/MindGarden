/**
 * ClientSidePeekContent — 내담자 Side Peek stub 본문
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getUserStatusKoreanNameSync, maskEncryptedDisplay } from '../../../../utils/codeHelper';
import { maskEmailDisplay, maskPhoneDisplay } from '../../../../utils/partyPiiDisplay';
import './ClientSidePeekContent.css';

const ClientSidePeekContent = ({ client }) => {
  if (!client) {
    return null;
  }

  const clientName = maskEncryptedDisplay(client.name, '이름');
  const statusLabel = getUserStatusKoreanNameSync(client?.status);
  const phone = maskPhoneDisplay(client.phone);
  const email = maskEmailDisplay(client.email);

  return (
    <div className="client-side-peek-stub">
      <dl className="client-side-peek-stub__facts">
        <div className="client-side-peek-stub__fact">
          <dt>이름</dt>
          <dd>{clientName}</dd>
        </div>
        <div className="client-side-peek-stub__fact">
          <dt>상태</dt>
          <dd>{statusLabel}</dd>
        </div>
        <div className="client-side-peek-stub__fact">
          <dt>연락처</dt>
          <dd>{phone}</dd>
        </div>
        <div className="client-side-peek-stub__fact">
          <dt>이메일</dt>
          <dd>{email}</dd>
        </div>
      </dl>
      <p className="client-side-peek-stub__placeholder" role="note">
        상담 이력·매칭·결제 상세는 이후 Side Peek MVP에서 제공됩니다.
      </p>
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
