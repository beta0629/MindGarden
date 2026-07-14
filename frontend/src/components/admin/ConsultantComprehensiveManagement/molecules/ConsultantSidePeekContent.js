/**
 * ConsultantSidePeekContent — 상담사 Side Peek stub 본문
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getUserStatusKoreanNameSync, maskEncryptedDisplay } from '../../../../utils/codeHelper';
import { maskPhoneDisplay } from '../../../../utils/partyPiiDisplay';
import { CONSULTANT_COMP_SIDE_PEEK } from '../../../../constants/consultantComprehensiveStrings';
import './ConsultantSidePeekContent.css';

const ConsultantSidePeekContent = ({ consultant }) => {
  if (!consultant) {
    return null;
  }

  const consultantName = maskEncryptedDisplay(consultant.name, '이름');
  const statusLabel = getUserStatusKoreanNameSync(consultant?.status);
  const phone = maskPhoneDisplay(consultant.phone);

  return (
    <div className="consultant-side-peek-stub">
      <dl className="consultant-side-peek-stub__facts">
        <div className="consultant-side-peek-stub__fact">
          <dt>이름</dt>
          <dd>{consultantName}</dd>
        </div>
        <div className="consultant-side-peek-stub__fact">
          <dt>상태</dt>
          <dd>{statusLabel}</dd>
        </div>
        <div className="consultant-side-peek-stub__fact">
          <dt>연락처</dt>
          <dd>{phone}</dd>
        </div>
        <div className="consultant-side-peek-stub__fact">
          <dt>가동률</dt>
          <dd>{CONSULTANT_COMP_SIDE_PEEK.UTILIZATION_PLACEHOLDER}</dd>
        </div>
      </dl>
      <p className="consultant-side-peek-stub__placeholder" role="note">
        {CONSULTANT_COMP_SIDE_PEEK.MVP_NOTE}
      </p>
    </div>
  );
};

ConsultantSidePeekContent.propTypes = {
  consultant: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    status: PropTypes.string,
    phone: PropTypes.string
  })
};

ConsultantSidePeekContent.defaultProps = {
  consultant: null
};

export default ConsultantSidePeekContent;
