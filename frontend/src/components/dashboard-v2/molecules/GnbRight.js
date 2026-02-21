/**
 * GnbRight - GNB 우측 영역: 검색바 + Calendar/Bell/Moon 아이콘 그룹
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import { Calendar, Bell, Moon } from 'lucide-react';
import { SearchInput, NavIcon } from '../atoms';
import './GnbRight.css';

const GnbRight = ({ searchValue = '', onSearchChange, onCalendarClick, onBellClick, onMoonClick }) => {
  return (
    <div className="mg-v2-gnb-right">
      <SearchInput value={searchValue} onChange={onSearchChange} />
      <div className="mg-v2-gnb-right__icons">
        <NavIcon icon={Calendar} label="캘린더" onClick={onCalendarClick} />
        <NavIcon icon={Bell} label="알림" onClick={onBellClick} />
        <NavIcon icon={Moon} label="다크 모드" onClick={onMoonClick} />
      </div>
    </div>
  );
};

export default GnbRight;
