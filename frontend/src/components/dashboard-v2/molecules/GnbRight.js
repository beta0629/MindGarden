/**
 * GnbRight - GNB 우측 영역: 검색바 + Calendar/Bell/Moon 아이콘 그룹
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React, { useState } from 'react';
import { Calendar, Bell, Moon, LogOut, Building } from 'lucide-react';
import { SearchInput, NavIcon } from '../atoms';
import { sessionManager } from '../../../utils/sessionManager';
import './GnbRight.css';

const GnbRight = ({ searchValue = '', onSearchChange, onCalendarClick, onBellClick, onMoonClick, onLogout }) => {
  const [showTenantInfo, setShowTenantInfo] = useState(false);
  const user = sessionManager.getUser();
  const tenantId = user?.tenantId || 'Unknown';

  return (
    <div className="mg-v2-gnb-right">
      <SearchInput value={searchValue} onChange={onSearchChange} />
      <div className="mg-v2-gnb-right__icons">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <NavIcon 
            icon={Building} 
            label="테넌트 정보" 
            onClick={() => setShowTenantInfo(!showTenantInfo)} 
          />
          {showTenantInfo && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              border: '1px solid var(--border-color, #e5e7eb)',
              borderRadius: 'var(--border-radius-sm, 4px)',
              fontSize: '0.75rem',
              color: 'var(--text-tertiary, #6b7280)',
              whiteSpace: 'nowrap',
              zIndex: 100,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Tenant ID: {tenantId}
            </div>
          )}
        </div>
        <NavIcon icon={Calendar} label="캘린더" onClick={onCalendarClick} />
        <NavIcon icon={Bell} label="알림" onClick={onBellClick} />
        <NavIcon icon={Moon} label="다크 모드" onClick={onMoonClick} />
        {onLogout && (
          <NavIcon icon={LogOut} label="로그아웃" onClick={onLogout} className="mg-v2-gnb-right__logout" />
        )}
      </div>
    </div>
  );
};

export default GnbRight;
