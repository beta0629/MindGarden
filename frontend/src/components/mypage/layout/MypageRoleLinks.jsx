/**
 * MypageRoleLinks — 역할 지도 / 바로가기 행 링크 (칩 · 제목 · 캡션 · chevron)
 * 기존 MypageRoleMap 의 primary 버튼 2개를 행 링크로 바꾼 것. 모드 전환 아님.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import SafeText from '../../common/SafeText';
import { ICONS, ICON_SIZES } from '../../../constants/icons';

const ChevronIcon = ICONS.CHEVRON_RIGHT;

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.landing]
 * @param {{ key: string, chip: string, title: string, caption?: string, to: string }[]} props.links
 */
const MypageRoleLinks = ({ title, landing = '', links }) => {
  const list = Array.isArray(links) ? links : [];
  if (!title || list.length === 0) {
    return null;
  }
  return (
    <nav
      className="mg-mypage-links mg-mypage-layout__card"
      data-testid="mypage-role-links"
      aria-label={title}
    >
      <h2 className="mg-mypage-links__title">{title}</h2>
      {landing ? (
        <p className="mg-mypage-links__landing" data-testid="mypage-role-links-landing">
          {landing}
        </p>
      ) : null}
      <ul className="mg-mypage-links__list">
        {list.map((link) => (
          <li key={link.key} className="mg-mypage-links__item">
            <Link
              className="mg-mypage-links__link"
              to={link.to}
              data-testid={`mypage-role-link-${link.key}`}
            >
              <span className="mg-mypage-chip">{link.chip}</span>
              <span className="mg-mypage-links__text">
                <span className="mg-mypage-links__link-title">
                  <SafeText>{link.title}</SafeText>
                </span>
                {link.caption ? (
                  <span className="mg-mypage-links__caption">
                    <SafeText>{link.caption}</SafeText>
                  </span>
                ) : null}
              </span>
              {ChevronIcon ? (
                <ChevronIcon
                  size={ICON_SIZES.SM}
                  aria-hidden
                  className="mg-mypage-links__chevron"
                />
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

MypageRoleLinks.propTypes = {
  title: PropTypes.string,
  landing: PropTypes.string,
  links: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      chip: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      caption: PropTypes.string,
      to: PropTypes.string.isRequired
    })
  )
};

export default MypageRoleLinks;
