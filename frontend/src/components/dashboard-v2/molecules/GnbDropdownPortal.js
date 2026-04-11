/**
 * GnbDropdownPortal — GNB 드롭다운 공통: body 포털 + 오버레이 + 패널 래퍼
 * ProfileDropdown, QuickActionsDropdown, NotificationDropdown에서 사용
 *
 * @author CoreSolution
 * @since 2026-04-11
 */

import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import '../styles/dropdown-common.css';

const GnbDropdownPortal = ({
  isOpen,
  onRequestClose,
  panelRef,
  panelStyle,
  panelClassName,
  panelRole,
  panelId,
  ariaLabel,
  ariaModal,
  children
}) => {
  if (!isOpen) {
    return null;
  }

  return ReactDOM.createPortal(
    <>
      <MGButton
        type="button"
        variant="outline"
        preventDoubleClick={false}
        className="mg-v2-dropdown-overlay"
        onClick={onRequestClose}
        aria-label="드롭다운 닫기"
      />
      <div
        ref={panelRef}
        id={panelId || undefined}
        className={panelClassName}
        role={panelRole || undefined}
        style={panelStyle}
        aria-label={ariaLabel || undefined}
        aria-modal={ariaModal === undefined ? undefined : ariaModal}
      >
        {children}
      </div>
    </>,
    document.body
  );
};

GnbDropdownPortal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onRequestClose: PropTypes.func.isRequired,
  panelRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ]),
  panelStyle: PropTypes.object,
  panelClassName: PropTypes.string,
  panelRole: PropTypes.string,
  panelId: PropTypes.string,
  ariaLabel: PropTypes.string,
  ariaModal: PropTypes.bool,
  children: PropTypes.node
};

export default GnbDropdownPortal;
