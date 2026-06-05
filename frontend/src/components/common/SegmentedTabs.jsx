/**
 * SegmentedTabs — MGButton SSOT 핸드오프 v1.1 (2026-06-05 채택)
 *
 * Q1=A 채택: MGButton 으로부터 분리된 전용 컴포넌트.
 * Q2=P2 채택: 활성/비활성 동일 톤 명도 차이 (외곽선 폐기, 단차 원천 차단).
 *
 * 사용 예:
 * ```jsx
 * <SegmentedTabs
 *   items={[
 *     { value: 'detail', label: '상세' },
 *     { value: 'notes', label: '특이사항', badge: 3 }
 *   ]}
 *   activeValue={tab}
 *   onChange={setTab}
 *   ariaLabel="일정 상세 보기"
 * />
 * ```
 *
 * a11y:
 * - role="tablist" + aria-label (필수)
 * - role="tab" + aria-selected
 * - ArrowLeft/Right + Home/End 키보드 nav
 */

import React, { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import './SegmentedTabs.css';

const SegmentedTabs = ({
  items,
  activeValue,
  onChange,
  ariaLabel,
  size = 'md',
  className = '',
}) => {
  const tabRefs = useRef([]);

  const handleKeyDown = useCallback(
    (e, idx) => {
      if (!items.length) return;
      let nextIdx = null;
      if (e.key === 'ArrowLeft') {
        nextIdx = idx === 0 ? items.length - 1 : idx - 1;
      } else if (e.key === 'ArrowRight') {
        nextIdx = idx === items.length - 1 ? 0 : idx + 1;
      } else if (e.key === 'Home') {
        nextIdx = 0;
      } else if (e.key === 'End') {
        nextIdx = items.length - 1;
      }
      if (nextIdx !== null) {
        e.preventDefault();
        const target = items[nextIdx];
        if (target && !target.disabled) {
          onChange(target.value);
          const ref = tabRefs.current[nextIdx];
          if (ref) ref.focus();
        }
      }
    },
    [items, onChange]
  );

  return (
    <div
      className={`mg-segmented-tabs mg-segmented-tabs--${size} ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item, idx) => {
        const isActive = item.value === activeValue;
        const tabClass = [
          'mg-segmented-tabs__tab',
          isActive ? 'mg-segmented-tabs__tab--active' : 'mg-segmented-tabs__tab--inactive',
          item.disabled ? 'mg-segmented-tabs__tab--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={item.value}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={item.ariaControls}
            id={item.id}
            tabIndex={isActive ? 0 : -1}
            disabled={item.disabled}
            className={tabClass}
            onClick={() => !item.disabled && onChange(item.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          >
            <span className="mg-segmented-tabs__tab-label">{item.label}</span>
            {typeof item.badge !== 'undefined' && item.badge !== null && (
              <span className="mg-segmented-tabs__tab-badge" aria-hidden="true">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

SegmentedTabs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
      badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      disabled: PropTypes.bool,
      ariaControls: PropTypes.string,
      id: PropTypes.string,
    })
  ).isRequired,
  activeValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md']),
  className: PropTypes.string,
};

export default SegmentedTabs;
