import React, { useState, useRef, useEffect } from 'react';
import './MultiSelectCheckbox.css';

const MultiSelectCheckbox = ({ 
  options = [], 
  selectedValues = [], 
  onChange, 
  placeholder = "선택하세요",
  className = "",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // 외부 클릭 감지 및 모달 스크롤 조정
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 드롭다운이 열릴 때 모달 스크롤 조정
  useEffect(() => {
    if (isOpen) {
      // 약간의 지연 후 스크롤 조정 (DOM 업데이트 후)
      setTimeout(() => {
        const modal = dropdownRef.current?.closest('.mg-modal');
        const modalBody = modal?.querySelector('.mg-modal-body');
        
        if (modalBody) {
          // 드롭다운이 모달 하단에 위치하도록 스크롤
          const dropdown = dropdownRef.current?.querySelector('.mg-multi-select-dropdown');
          if (dropdown) {
            const dropdownRect = dropdown.getBoundingClientRect();
            const modalRect = modal.getBoundingClientRect();
            
            // 드롭다운이 모달 하단을 벗어나면 스크롤
            if (dropdownRect.bottom > modalRect.bottom) {
              const scrollAmount = dropdownRect.bottom - modalRect.bottom + 20; // 20px 여백
              modalBody.scrollTop += scrollAmount;
            }
          }
        }
      }, 100);
    }
  }, [isOpen]);

  // 검색 필터링된 옵션들
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 선택된 옵션들의 라벨
  const selectedLabels = options
    .filter(option => selectedValues.includes(option.value))
    .map(option => option.label);

  // 옵션 토글
  const handleToggleOption = (value) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    onChange(newSelectedValues);
  };

  // 모든 옵션 선택/해제
  const handleSelectAll = () => {
    if (selectedValues.length === filteredOptions.length) {
      // 모든 옵션이 선택된 경우 - 모두 해제
      const newSelectedValues = selectedValues.filter(value => 
        !filteredOptions.some(option => option.value === value)
      );
      onChange(newSelectedValues);
    } else {
      // 일부 또는 아무것도 선택되지 않은 경우 - 모두 선택
      const newSelectedValues = [...new Set([
        ...selectedValues,
        ...filteredOptions.map(option => option.value)
      ])];
      onChange(newSelectedValues);
    }
  };

  return (
    <div className={`mg-multi-select ${className}`} ref={dropdownRef}>
      {/* 선택된 값들을 표시하는 트리거 버튼 */}
      <div 
        className={`mg-multi-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="mg-multi-select-value">
          {selectedLabels.length > 0 ? (
            <div className="mg-multi-select-selected">
              {selectedLabels.slice(0, 2).join(', ')}
              {selectedLabels.length > 2 && ` 외 ${selectedLabels.length - 2}개`}
            </div>
          ) : (
            <span className="mg-multi-select-placeholder">{placeholder}</span>
          )}
        </div>
        <div className={`mg-multi-select-arrow ${isOpen ? 'open' : ''}`}>
          ▼
        </div>
      </div>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="mg-multi-select-dropdown">
          {/* 검색 입력 */}
          <div className="mg-multi-select-search">
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mg-multi-select-search-input"
            />
          </div>

          {/* 전체 선택/해제 */}
          <div className="mg-multi-select-option select-all">
            <label className="mg-multi-select-checkbox-label">
              <input
                type="checkbox"
                checked={filteredOptions.length > 0 && selectedValues.length === filteredOptions.length}
                onChange={handleSelectAll}
                className="mg-multi-select-checkbox"
              />
              <span className="mg-multi-select-checkbox-text">
                {selectedValues.length === filteredOptions.length ? '전체 해제' : '전체 선택'}
              </span>
            </label>
          </div>

          {/* 옵션 리스트 */}
          <div className="mg-multi-select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div 
                  key={option.value} 
                  className="mg-multi-select-option"
                >
                  <label className="mg-multi-select-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option.value)}
                      onChange={() => handleToggleOption(option.value)}
                      className="mg-multi-select-checkbox"
                    />
                    <span className="mg-multi-select-checkbox-text">
                      {option.label}
                    </span>
                  </label>
                </div>
              ))
            ) : (
              <div className="mg-multi-select-no-options">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectCheckbox;
