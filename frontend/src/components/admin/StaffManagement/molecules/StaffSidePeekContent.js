/**
 * StaffSidePeekContent — 스태ff Side Peek stub 본문
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React from 'react';
import PropTypes from 'prop-types';
import { maskEncryptedDisplay } from '../../../../utils/codeHelper';
import { formatKoreanMobileForDisplay } from '../../../../utils/koreanMobilePhone';
import {
  STAFF_MGMT_MASK,
  STAFF_MGMT_ROLE_LABELS,
  STAFF_MGMT_SIDE_PEEK,
  STAFF_MGMT_STATUS
} from '../../../../constants/staffManagementStrings';
import { USER_ROLES } from '../../../../constants/roles';
import './StaffSidePeekContent.css';

const roleOf = (staff) => (typeof staff?.role === 'string' ? staff.role : staff?.role?.name) || '';

const StaffSidePeekContent = ({ staff }) => {
  if (!staff) {
    return null;
  }

  const staffName = maskEncryptedDisplay(staff.name, STAFF_MGMT_MASK.NAME);
  const roleLabel = STAFF_MGMT_ROLE_LABELS[roleOf(staff)] || roleOf(staff);
  const statusLabel = staff.isActive ? STAFF_MGMT_STATUS.ACTIVE : STAFF_MGMT_STATUS.INACTIVE;
  const phone = formatKoreanMobileForDisplay(maskEncryptedDisplay(staff.phone, STAFF_MGMT_MASK.PHONE_NONE));
  const email = maskEncryptedDisplay(staff.email, STAFF_MGMT_MASK.EMAIL);
  const permissionPlaceholder = roleOf(staff) === USER_ROLES.ADMIN
    ? STAFF_MGMT_SIDE_PEEK.PERMISSION_ADMIN
    : STAFF_MGMT_SIDE_PEEK.PERMISSION_STAFF;

  return (
    <div className="staff-side-peek-stub">
      <dl className="staff-side-peek-stub__facts">
        <div className="staff-side-peek-stub__fact">
          <dt>이름</dt>
          <dd>{staffName}</dd>
        </div>
        <div className="staff-side-peek-stub__fact">
          <dt>역할</dt>
          <dd>{roleLabel}</dd>
        </div>
        <div className="staff-side-peek-stub__fact">
          <dt>상태</dt>
          <dd>{statusLabel}</dd>
        </div>
        <div className="staff-side-peek-stub__fact">
          <dt>연락처</dt>
          <dd>{phone}</dd>
        </div>
        <div className="staff-side-peek-stub__fact">
          <dt>이메일</dt>
          <dd>{email}</dd>
        </div>
        <div className="staff-side-peek-stub__fact">
          <dt>권한</dt>
          <dd>{permissionPlaceholder}</dd>
        </div>
      </dl>
      <p className="staff-side-peek-stub__placeholder" role="note">
        {STAFF_MGMT_SIDE_PEEK.MVP_NOTE}
      </p>
    </div>
  );
};

StaffSidePeekContent.propTypes = {
  staff: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    role: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    isActive: PropTypes.bool,
    phone: PropTypes.string,
    email: PropTypes.string
  })
};

StaffSidePeekContent.defaultProps = {
  staff: null
};

export default StaffSidePeekContent;
