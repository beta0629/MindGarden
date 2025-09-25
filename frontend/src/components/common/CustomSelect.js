import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

/**
 * 커스텀 드롭다운 컴포넌트
 * - 네이티브 select의 스크롤 문제 해결
 * - 완전한 CSS 제어 가능
 * - 접근성 지원
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
const CustomSelect = ({ 
  options = [], 
  value = '', 
  onChange, 
  placeholder = '선택하세요',
  className = '',
  disabled = false,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 드롭다운 위치 조정
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 200; // 예상 드롭다운 높이

      // 화면 하단에 공간이 부족하면 위쪽으로 표시
      if (rect.bottom + dropdownHeight > viewportHeight) {
        dropdown.style.top = 'auto';
        dropdown.style.bottom = '100%';
        dropdown.style.marginBottom = '4px';
      } else {
        dropdown.style.top = '100%';
        dropdown.style.bottom = 'auto';
        dropdown.style.marginTop = '4px';
      }
    }
  }, [isOpen]);

  // 필터링된 옵션
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 선택된 옵션 찾기
  const selectedOption = options.find(option => option.value === value);

  // 옵션 선택 핸들러
  const handleOptionSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'ArrowDown':
        e.preventDefault();
        // 다음 옵션으로 이동 (간단한 구현)
        break;
      case 'ArrowUp':
        e.preventDefault();
        // 이전 옵션으로 이동 (간단한 구현)
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions.length > 0) {
          handleOptionSelect(filteredOptions[0].value);
        }
        break;
    }
  };

  return (
    <div 
      ref={selectRef}
      className={`custom-select ${className} ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      {/* 선택된 값 표시 */}
      <div 
        className="custom-select__trigger"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
      >
        <span className="custom-select__value">
          {loading ? '로딩 중...' : selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="custom-select__arrow">
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div ref={dropdownRef} className="custom-select__dropdown">
          {/* 검색 입력 (옵션이 많을 때) */}
          {options.length > 5 && (
            <div className="custom-select__search">
              <input
                type="text"
                placeholder="검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="custom-select__search-input"
                autoFocus
              />
            </div>
          )}

          {/* 옵션 목록 */}
          <div className="custom-select__options">
            {filteredOptions.length === 0 ? (
              <div className="custom-select__no-options">
                {searchTerm ? '검색 결과가 없습니다' : '옵션이 없습니다'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`custom-select__option ${value === option.value ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(option.value)}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
