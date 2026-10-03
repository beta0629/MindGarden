/**
 * MypageLayout — 역할 설정(layout · surface)으로만 바뀌는 마이페이지 콘텐츠 레이아웃
 * aside 모드: main | aside 320 (내 계정 · 역할 지도/바로가기 · 목차)
 * single 모드: 내 계정 + 바로가기 2칸 → main (목차 없음)
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import PropTypes from 'prop-types';
import { MYPAGE_LAYOUT_MODES, MYPAGE_SURFACES } from '../../../constants/mypageRoleLayout';
import './MypageLayout.css';

const ASIDE_ARIA = '내 계정과 바로가기';

/**
 * @param {object} props
 * @param {'aside'|'single'} props.mode
 * @param {'stone'|'card'} props.surface
 * @param {import('react').ReactNode} props.account
 * @param {import('react').ReactNode} [props.links]
 * @param {import('react').ReactNode} [props.index] aside 모드에서만 그림
 * @param {import('react').ReactNode} [props.notice] main 맨 위 알림 (탈퇴 대기 등)
 * @param {string} [props.roleKey]
 */
const MypageLayout = ({ mode, surface, account, links = null, index = null, notice = null, roleKey, children }) => {
  const rootClass = [
    'mg-mypage-layout',
    `mg-mypage-layout--${mode}`,
    `mg-mypage-layout--${surface}`
  ].join(' ');

  return (
    <div className={rootClass} data-testid="mypage-layout" data-mypage-role={roleKey}>
      <aside className="mg-mypage-layout__aside" aria-label={ASIDE_ARIA}>
        {account}
        {links}
        {mode === MYPAGE_LAYOUT_MODES.ASIDE ? index : null}
      </aside>
      <div className="mg-mypage-layout__main">
        {notice}
        {children}
      </div>
    </div>
  );
};

MypageLayout.propTypes = {
  mode: PropTypes.oneOf(Object.values(MYPAGE_LAYOUT_MODES)).isRequired,
  surface: PropTypes.oneOf(Object.values(MYPAGE_SURFACES)).isRequired,
  account: PropTypes.node.isRequired,
  links: PropTypes.node,
  index: PropTypes.node,
  notice: PropTypes.node,
  roleKey: PropTypes.string,
  children: PropTypes.node
};

export default MypageLayout;
