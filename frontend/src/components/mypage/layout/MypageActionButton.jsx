/**
 * MypageActionButton — 마이페이지 버튼 (MGButton size sm 고정, h32 r8)
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT,
  mapErpVariantToMg
} from '../../erp/common/erpMgButtonProps';

/**
 * @param {object} props
 * @param {'primary'|'outline'|'ghost'|'danger-outline'|'danger'} [props.variant]
 */
const MypageActionButton = ({
  variant = 'outline',
  className = '',
  loading = false,
  preventDoubleClick = false,
  type = 'button',
  children,
  ...rest
}) => {
  const mgVariant = mapErpVariantToMg(variant);
  return (
    <MGButton
      type={type}
      variant={mgVariant}
      size="small"
      loading={loading}
      className={buildErpMgButtonClassName({
        variant: mgVariant,
        size: 'sm',
        loading,
        className: ['mg-mypage-button', className].filter(Boolean).join(' ')
      })}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      preventDoubleClick={preventDoubleClick}
      {...rest}
    >
      {children}
    </MGButton>
  );
};

MypageActionButton.propTypes = {
  variant: PropTypes.string,
  className: PropTypes.string,
  loading: PropTypes.bool,
  preventDoubleClick: PropTypes.bool,
  type: PropTypes.string,
  children: PropTypes.node
};

export default MypageActionButton;
