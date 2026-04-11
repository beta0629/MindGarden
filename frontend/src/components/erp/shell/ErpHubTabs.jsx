import React, { useCallback } from 'react';
import MGButton from '../../common/MGButton';

const TAB_ACTIVE = 'mg-v2-tab-active';

/**
 * ERP 허브 탭 슬롯 — `mg-v2-tabs` 래퍼 또는 `items` 기반 탭 버튼.
 * 기존 ERP 화면 로직을 복제하지 않고, 슬롯·탭 표시만 제공한다.
 *
 * @param {React.ReactNode} [children] — 커스텀 탭 콘텐츠
 * @param {Array<{ id: string, label: string }>} [items] — 탭 정의 (children 없을 때)
 * @param {string} [activeId] — 선택된 탭 id
 * @param {(id: string) => void} [onTabChange] — 탭 변경
 * @param {string} [className] — 추가 클래스
 * @param {string} [ariaLabel] — tablist 접근성 라벨
 */
const ErpHubTabs = ({
  children,
  items,
  activeId,
  onTabChange,
  className = '',
  ariaLabel = 'ERP 허브 탭'
}) => {
  const rootClass = ['mg-v2-tabs', className].filter(Boolean).join(' ');

  const handleItemTabClick = useCallback(
    (event) => {
      const raw = event.currentTarget.dataset.tabId;
      if (raw != null && onTabChange) {
        onTabChange(raw);
      }
    },
    [onTabChange]
  );

  if (children != null) {
    return (
      <div className={rootClass} role="tablist" aria-label={ariaLabel}>
        {children}
      </div>
    );
  }

  const list = Array.isArray(items) ? items : [];

  return (
    <div className={rootClass} role="tablist" aria-label={ariaLabel}>
      {list.map((item) => {
        const isActive = activeId === item.id;
        return (
          <MGButton
            key={item.id}
            type="button"
            role="tab"
            data-tab-id={item.id}
            aria-selected={isActive}
            className={['mg-v2-tab', isActive ? TAB_ACTIVE : ''].filter(Boolean).join(' ')}
            onClick={handleItemTabClick}
            variant="outline"
            preventDoubleClick={false}
          >
            {item.label}
          </MGButton>
        );
      })}
    </div>
  );
};

export default ErpHubTabs;
