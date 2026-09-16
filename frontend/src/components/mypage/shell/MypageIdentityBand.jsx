/**
 * MypageIdentityBand — dual-role identity (name + 「운영 · 상담」)
 * Spec cite: clinic-os-mypage-dual.md (TO-BE v2). Not a mode switch.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import { MYPAGE_DUAL_IDENTITY } from '../../../constants/mypageDualRoleUi';

/**
 * @param {object} props
 * @param {string} props.displayName
 * @param {string} props.roleLabel
 */
const MypageIdentityBand = ({ displayName = '', roleLabel }) => (
  <section
    className="mg-mypage-clinic-os__identity"
    data-testid="mypage-identity-band"
    aria-label={MYPAGE_DUAL_IDENTITY.SECTION_ARIA}
  >
    <p
      className="mg-mypage-clinic-os__identity-name"
      data-testid="mypage-identity-name"
    >
      <SafeText>{displayName}</SafeText>
    </p>
    <p
      className="mg-mypage-clinic-os__identity-role"
      data-testid="mypage-identity-role"
      aria-label={MYPAGE_DUAL_IDENTITY.ROLE_ARIA}
    >
      <SafeText>{roleLabel}</SafeText>
    </p>
  </section>
);

MypageIdentityBand.propTypes = {
  displayName: PropTypes.string,
  roleLabel: PropTypes.string.isRequired
};

export default MypageIdentityBand;
