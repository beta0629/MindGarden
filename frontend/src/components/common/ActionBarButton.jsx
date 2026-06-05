/**
 * ActionBarButton — ActionBar 안에서 사용하는 SSOT 단일 액션 버튼.
 *
 * ⚠️ 카드용 `ActionButton` (mg-v2-button) 과 다른 컴포넌트. 명명 충돌 회피 위해
 * `ActionBarButton` 으로 분리. 사용 위치는 ActionBar 내부로 제한.
 *
 * MGButton 과 완전 독립. mg-button / mg-v2-* / ERP buildErpMgButtonClassName /
 * ScheduleB0KlA / AdminDashboardB0KlA 등 어떤 기존 CSS chain 도 끼어들지 못함.
 * 단일 클래스 prefix `mg-action-btn` 으로 height/padding/border/font 모두 결정.
 *
 * variant: primary (cs-success-600) · outline (mint cs-success-50) ·
 *          danger (cs-error-600) · ghost (transparent)
 * size: md (48px) · sm (40px)
 *
 * 디자인 핸드오프: docs/project-management/2026-06-05/MGBUTTON_SSOT_DESIGN_HANDOFF.md
 *   §N v2.0 — MGButton 의존 끊고 신규 컴포넌트 도입 (2026-06-05 사용자 결재)
 */

import React from 'react';
import PropTypes from 'prop-types';
import './ActionBarButton.css';

const ActionBarButton = React.forwardRef((
    {
        children,
        variant = 'primary',
        size = 'md',
        type = 'button',
        disabled = false,
        loading = false,
        onClick,
        className = '',
        title,
        'aria-label': ariaLabel,
        'aria-disabled': ariaDisabledProp,
        'data-testid': dataTestId,
    },
    ref
) => {
    const isDisabled = disabled || loading;
    const classes = [
        'mg-action-btn',
        `mg-action-btn--${variant}`,
        `mg-action-btn--${size}`,
        loading ? 'mg-action-btn--loading' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            ref={ref}
            type={type}
            className={classes}
            disabled={isDisabled}
            aria-disabled={ariaDisabledProp !== undefined ? ariaDisabledProp : isDisabled || undefined}
            aria-busy={loading || undefined}
            aria-label={ariaLabel}
            data-testid={dataTestId}
            title={title}
            onClick={isDisabled ? undefined : onClick}
        >
            <span className="mg-action-btn__label">{children}</span>
        </button>
    );
});

ActionBarButton.displayName = 'ActionBarButton';

ActionBarButton.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['primary', 'outline', 'danger', 'ghost']),
    size: PropTypes.oneOf(['md', 'sm']),
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string,
    title: PropTypes.string,
    'aria-label': PropTypes.string,
    'aria-disabled': PropTypes.bool,
    'data-testid': PropTypes.string,
};

export default ActionBarButton;
