/**
 * MypageQuietHeader — Clinic-OS quiet page header (h1 + ghost actions)
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { MYPAGE_TITLE_ID } from '../../../constants/mypageUi';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';

/**
 * @param {object} props
 * @param {() => void} props.onSupportClick
 * @param {() => void} props.onLogoutClick
 */
const MypageQuietHeader = ({ onSupportClick, onLogoutClick }) => (
  <header className="mg-mypage-clinic-os__header" aria-label="마이페이지">
    <h1 id={MYPAGE_TITLE_ID} className="mg-mypage-clinic-os__title">
      마이페이지
    </h1>
    <nav className="mg-mypage-clinic-os__header-actions" aria-label="계정 바로가기">
      <MGButton
        type="button"
        variant="ghost"
        size="small"
        className={buildErpMgButtonClassName({
          variant: 'ghost',
          size: 'sm',
          loading: false,
          className: 'mg-mypage-clinic-os__header-action'
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onSupportClick}
        preventDoubleClick={false}
      >
        고객센터
      </MGButton>
      <MGButton
        type="button"
        variant="ghost"
        size="small"
        className={buildErpMgButtonClassName({
          variant: 'ghost',
          size: 'sm',
          loading: false,
          className: 'mg-mypage-clinic-os__header-action'
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onLogoutClick}
        preventDoubleClick={false}
      >
        로그아웃
      </MGButton>
    </nav>
  </header>
);

MypageQuietHeader.propTypes = {
  onSupportClick: PropTypes.func.isRequired,
  onLogoutClick: PropTypes.func.isRequired
};

export default MypageQuietHeader;
