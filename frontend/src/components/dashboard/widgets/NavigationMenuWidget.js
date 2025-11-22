/**
 * Navigation Menu Widget
 * 역할별 동적 메뉴를 표시하는 위젯
 * SimpleHamburgerMenu를 기반으로 위젯화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sessionManager } from '../../../utils/sessionManager';
import { hasMenuAccess } from '../../../utils/menuPermissionValidator';
import './Widget.css';
import './NavigationMenuWidget.css';

const NavigationMenuWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});
  const [activePath, setActivePath] = useState(location.pathname);
  
  const config = widget.config || {};
  const menuItems = config.menuItems || [];
  const menuStyle = config.style || 'vertical'; // vertical, horizontal, sidebar
  const showIcons = config.showIcons !== false;
  
  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);
  
  const handleMenuClick = async (menuItem) => {
    if (!menuItem.path || menuItem.path === '준비중') {
      return;
    }
    
    // 권한 확인
    if (menuItem.permission || menuItem.menuGroup) {
      const permission = menuItem.permission || menuItem.menuGroup;
      const hasAccess = await hasMenuAccess(permission);
      if (!hasAccess) {
        console.warn(`🚫 메뉴 접근 권한 없음: ${permission}`);
        return;
      }
    }
    
    // 역할 필터링
    if (menuItem.roles && user?.role) {
      if (!menuItem.roles.includes(user.role)) {
        return;
      }
    }
    
    navigate(menuItem.path);
    
    // 클릭 이벤트 핸들러 실행
    if (menuItem.onClick && typeof menuItem.onClick === 'function') {
      menuItem.onClick(menuItem, user);
    }
  };
  
  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  const isActive = (path) => {
    if (!path) return false;
    return activePath === path || activePath.startsWith(path + '/');
  };
  
  const hasChildren = (item) => {
    return item.children && Array.isArray(item.children) && item.children.length > 0;
  };
  
  const shouldShowMenuItem = async (item) => {
    // 역할 필터링
    if (item.roles && user?.role) {
      if (!item.roles.includes(user.role)) {
        return false;
      }
    }
    
    // 권한 필터링
    if (item.permission || item.menuGroup) {
      const permission = item.permission || item.menuGroup;
      const hasAccess = await hasMenuAccess(permission);
      if (!hasAccess) {
        return false;
      }
    }
    
    return true;
  };
  
  const renderMenuItem = (item, level = 0) => {
    const hasSubItems = hasChildren(item);
    const isExpanded = expandedItems[item.id];
    const itemActive = isActive(item.path);
    
    return (
      <div key={item.id} className={`navigation-menu-item navigation-menu-level-${level}`}>
        <div
          className={`navigation-menu-link ${itemActive ? 'active' : ''} ${hasSubItems ? 'has-children' : ''}`}
          onClick={() => {
            if (hasSubItems) {
              toggleExpanded(item.id);
            } else {
              handleMenuClick(item);
            }
          }}
        >
          {showIcons && item.icon && (
            <i className={`navigation-menu-icon ${item.icon}`}></i>
          )}
          <span className="navigation-menu-label">{item.label}</span>
          {hasSubItems && (
            <i className={`navigation-menu-arrow ${isExpanded ? 'expanded' : ''}`}>
              <i className="bi bi-chevron-down"></i>
            </i>
          )}
          {item.badge && (
            <span className="navigation-menu-badge">{item.badge}</span>
          )}
        </div>
        
        {hasSubItems && isExpanded && (
          <div className="navigation-menu-children">
            {item.children.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  // 필터링된 메뉴 항목 (비동기 필터링은 useEffect에서 처리)
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  
  useEffect(() => {
    const filterMenus = async () => {
      const filtered = [];
      for (const item of menuItems) {
        const shouldShow = await shouldShowMenuItem(item);
        if (shouldShow) {
          // 자식 메뉴도 필터링
          if (hasChildren(item)) {
            const filteredChildren = [];
            for (const child of item.children) {
              const shouldShowChild = await shouldShowMenuItem(child);
              if (shouldShowChild) {
                filteredChildren.push(child);
              }
            }
            filtered.push({ ...item, children: filteredChildren });
          } else {
            filtered.push(item);
          }
        }
      }
      setFilteredMenuItems(filtered);
    };
    
    if (menuItems.length > 0) {
      filterMenus();
    }
  }, [menuItems, user]);
  
  if (menuItems.length === 0) {
    return (
      <div className="widget widget-navigation-menu">
        <div className="widget-header">
          <div className="widget-title">{config.title || '메뉴'}</div>
        </div>
        <div className="widget-body">
          <div className="navigation-menu-empty">
            <p>메뉴 항목이 없습니다</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`widget widget-navigation-menu widget-navigation-${menuStyle}`}>
      <div className="widget-header">
        {config.title && (
          <div className="widget-title">{config.title}</div>
        )}
      </div>
      <div className="widget-body">
        <nav className={`navigation-menu navigation-menu-${menuStyle}`}>
          {filteredMenuItems.map(item => renderMenuItem(item))}
        </nav>
      </div>
    </div>
  );
};

export default NavigationMenuWidget;

