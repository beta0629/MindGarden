/**
 * SidePeekShell — 우측 Side Peek 패널 (R-PEEK) 레이아웃 organism
 *
 * 본문(R-MAIN)을 밀어내는 분할 레이아웃. 오버레이·모달 대체가 아님.
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React, { useCallback, useEffect, useId } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import {
  SIDE_PEEK_SHELL_CSS_CLASS,
  SIDE_PEEK_SHELL_OPEN_CLASS,
  SIDE_PEEK_SHELL_REGION_ATTR,
  SIDE_PEEK_SHELL_REGION_PEEK
} from '../../../constants/sidePeekShellConstants';
import './SidePeekShell.css';

const SidePeekShell = ({
  isOpen = false,
  onClose = null,
  title = '',
  children = null,
  ariaLabel = ''
}) => {
  const titleId = useId();
  const resolvedAriaLabel = ariaLabel || title || '상세 패널';

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  return (
    <aside
      className={`${SIDE_PEEK_SHELL_CSS_CLASS}${
        isOpen ? ` ${SIDE_PEEK_SHELL_OPEN_CLASS}` : ''
      }`}
      role="complementary"
      {...{ [SIDE_PEEK_SHELL_REGION_ATTR]: SIDE_PEEK_SHELL_REGION_PEEK }}
      aria-label={resolvedAriaLabel}
      aria-hidden={!isOpen}
      hidden={!isOpen}
    >
      <header className="mg-side-peek-shell__header">
        {title ? (
          <h2 className="mg-side-peek-shell__title" id={titleId}>
            {title}
          </h2>
        ) : (
          <span className="mg-side-peek-shell__title mg-side-peek-shell__title--placeholder" id={titleId}>
            {resolvedAriaLabel}
          </span>
        )}
        <button
          type="button"
          className="mg-side-peek-shell__close"
          onClick={handleClose}
          aria-label="패널 닫기"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <div className="mg-side-peek-shell__body">
        {children}
      </div>
    </aside>
  );
};

SidePeekShell.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  ariaLabel: PropTypes.string
};

export default SidePeekShell;
