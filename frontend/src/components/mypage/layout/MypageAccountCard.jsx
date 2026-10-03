/**
 * MypageAccountCard — 내 계정 (아바타 · 이름 · 센터 · 역할 칩). 칩은 표시만, 전환 아님.
 * 기존 MypageIdentityBand(이중역할 신원 띠)를 흡수.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import PropTypes from 'prop-types';
import Avatar from '../../common/Avatar';
import SafeText from '../../common/SafeText';
import { MYPAGE_LAYOUT_COPY } from '../../../constants/mypageRoleLayout';
import { MYPAGE_DUAL_IDENTITY } from '../../../constants/mypageDualRoleUi';

/**
 * @param {object} props
 * @param {string} [props.displayName]
 * @param {string} [props.centerName]
 * @param {string} props.roleLabel
 * @param {string|null} [props.avatarSrc]
 */
const MypageAccountCard = ({ displayName = '', centerName = '', roleLabel, avatarSrc = null }) => (
  <section
    className="mg-mypage-account mg-mypage-layout__card"
    data-testid="mypage-account-card"
    aria-label={MYPAGE_LAYOUT_COPY.ACCOUNT_CARD_ARIA}
  >
    <Avatar
      profileImageUrl={avatarSrc}
      displayName={displayName}
      className="mg-mypage-account__avatar"
    />
    <div className="mg-mypage-account__text">
      <p className="mg-mypage-account__name" data-testid="mypage-account-name">
        <SafeText>{displayName || MYPAGE_LAYOUT_COPY.NO_VALUE}</SafeText>
      </p>
      {centerName ? (
        <p className="mg-mypage-account__center" data-testid="mypage-account-center">
          <SafeText>{centerName}</SafeText>
        </p>
      ) : null}
      <span
        className="mg-mypage-chip"
        data-testid="mypage-account-role"
        aria-label={MYPAGE_DUAL_IDENTITY.ROLE_ARIA}
      >
        <SafeText>{roleLabel}</SafeText>
      </span>
    </div>
  </section>
);

MypageAccountCard.propTypes = {
  displayName: PropTypes.string,
  centerName: PropTypes.string,
  roleLabel: PropTypes.string.isRequired,
  avatarSrc: PropTypes.string
};

export default MypageAccountCard;
