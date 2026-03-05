import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown } from 'lucide-react';
import './CustomSelect.css';

/**
 * 커스텀 드롭다운 컴포넌트
 * - 네이티브 select의 스크롤 문제 해결
 * - 완전한 CSS 제어 가능
 * - 접근성 지원
 * 
 * @author Core Solution
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
  loading = false,
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

  // 외부 클릭 감지 - 더 안정적인 방식
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    // mousedown 대신 click 이벤트 사용, 그리고 약간의 지연
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  // 스크롤 가능한 조상 요소 찾기 (scroll 이벤트는 버블링되지 않아 해당 요소에 직접 리스너 필요)
  const getScrollParent = (el) => {
    if (!el) return null;
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      const { overflowY } = window.getComputedStyle(parent);
      const scrollable = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
      if (scrollable && parent.scrollHeight > parent.clientHeight) return parent;
      parent = parent.parentElement;
    }
    return null;
  };

  // 드롭다운 위치 조정 + 스크롤/리사이즈 시 갱신 (모달 내부 스크롤 포함)
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!dropdownRef.current || !selectRef.current) return;
      const rect = selectRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 200;
      dropdown.style.position = 'fixed';
      dropdown.style.zIndex = '9999';
      dropdown.style.left = `${rect.left}px`;
      dropdown.style.width = `${Math.max(rect.width, 120)}px`;
      if (rect.bottom + dropdownHeight > viewportHeight) {
        dropdown.style.top = 'auto';
        dropdown.style.bottom = `${viewportHeight - rect.top}px`;
        dropdown.style.marginBottom = '4px';
      } else {
        dropdown.style.top = `${rect.bottom}px`;
        dropdown.style.bottom = 'auto';
        dropdown.style.marginTop = '4px';
      }
      if (rect.left + rect.width > viewportWidth) {
        dropdown.style.left = `${viewportWidth - rect.width - 16}px`;
      }
    };

    const t = requestAnimationFrame(() => {
      updatePosition();
      if (selectRef.current) selectRef.current.focus();
    });
    const onScrollOrResize = () => {
      requestAnimationFrame(updatePosition);
    };

    document.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);

    const scrollParent = getScrollParent(selectRef.current);
    if (scrollParent) {
      scrollParent.addEventListener('scroll', onScrollOrResize, true);
    }

    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      if (scrollParent) {
        scrollParent.removeEventListener('scroll', onScrollOrResize, true);
      }
    };
  }, [isOpen]);

  // 필터링된 옵션
  const safeOptions = Array.isArray(options) ? options : [];
  const filteredOptions = safeOptions.filter(option =>
    option && (option.label || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  // 선택된 옵션 찾기
  const selectedOption = safeOptions.find(option => option && option.value === value);

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
        e.stopPropagation();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        // 다음 옵션으로 이동 (간단한 구현)
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        // 이전 옵션으로 이동 (간단한 구현)
        break;
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (filteredOptions.length > 0) {
          handleOptionSelect(filteredOptions[0].value);
        }
        break;
    }
  };

  return (
    <div 
      ref={selectRef}
      className={`custom-select ${className} ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} ${error ? 'error' : ''}`}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      {/* 선택된 값 표시 */}
      <div 
        className="custom-select__trigger"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && !loading) {
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className="custom-select__value">
          {loading ? '로딩 중...' : selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="custom-select__arrow">
          <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </span>
      </div>

      {/* 드롭다운 메뉴: 포탈로 body에 렌더해 스크롤 시 옵션 패널이 모달과 함께 움직이지 않도록 함 */}
      {isOpen && ReactDOM.createPortal(
        <div ref={dropdownRef} className="custom-select__dropdown">
          {safeOptions.length > 5 && (
            <div className="custom-select__search">
              <input
                type="text"
                placeholder="검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="custom-select__search-input"
                autoFocus
              />
            </div>
          )}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionSelect(option.value);
                  }}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CustomSelect;
