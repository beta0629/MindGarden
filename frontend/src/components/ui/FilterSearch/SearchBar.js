/**
 * 검색 바 컴포넌트 (Presentational)
 * 
 * 표준화 원칙 준수:
 * - mg-v2-* CSS 클래스 사용
 * - CSS 변수 사용 (하드코딩 금지)
 * - Presentational 패턴 (UI만 담당)
 * 
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-12-09
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Hash } from 'lucide-react';
import { SEARCH_PLACEHOLDER } from '../../../constants/filterSearch';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';

const SearchBar = ({
  searchTerm = '',
  suggestions = [],
  showSuggestions = false,
  placeholder = SEARCH_PLACEHOLDER,
  onSearchChange,
  onSelectSuggestion,
  onClear,
  enableHashtag = true // 해시태그 검색 활성화
}) => {
  const [hashtags, setHashtags] = useState([]);
  const inputRef = useRef(null);

  // 해시태그 추출 (#으로 시작하는 단어)
  useEffect(() => {
    if (enableHashtag && searchTerm) {
      const hashtagRegex = /#(\w+)/g;
      const matches = searchTerm.match(hashtagRegex);
      if (matches) {
        setHashtags(matches.map(tag => tag.substring(1))); // # 제거
      } else {
        setHashtags([]);
      }
    }
  }, [searchTerm, enableHashtag]);

  // 해시태그 클릭 핸들러
  const handleHashtagClick = (tag) => {
    const newSearchTerm = searchTerm.replace(/#\w+/g, '').trim();
    const hashtagText = `#${tag}`;
    const finalTerm = newSearchTerm ? `${newSearchTerm} ${hashtagText}` : hashtagText;
    onSearchChange(finalTerm);
    inputRef.current?.focus();
  };

  return (
    <div className="mg-v2-search-bar">
      <div className="mg-v2-search-bar__wrapper">
        <Search className="mg-v2-search-bar__icon" size={20} />
        <input
          ref={inputRef}
          type="text"
          className="mg-v2-search-bar__input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="검색어 입력"
        />
        {searchTerm && (
          <MGButton
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: false,
              className: 'mg-v2-search-bar__clear'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onClear}
            type="button"
            aria-label="검색어 지우기"
            variant="outline"
            preventDoubleClick={false}
          >
            <X size={16} />
          </MGButton>
        )}
      </div>

      {/* 해시태그 표시 (모바일 친화적) */}
      {enableHashtag && hashtags.length > 0 && (
        <div className="mg-v2-search-bar__hashtags">
          {hashtags.map((tag, index) => (
            <MGButton
              key={index}
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'md',
                loading: false,
                className: 'mg-v2-search-bar__hashtag'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => handleHashtagClick(tag)}
              type="button"
              variant="outline"
              preventDoubleClick={false}
            >
              <Hash size={12} />
              {tag}
            </MGButton>
          ))}
        </div>
      )}
      
      {/* 자동완성 드롭다운 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mg-v2-search-bar__suggestions">
          {suggestions.map(suggestion => (
            <div 
              key={suggestion.id || suggestion.value}
              className="mg-v2-search-bar__suggestion-item"
              onClick={() => onSelectSuggestion(suggestion)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSelectSuggestion(suggestion);
                }
              }}
            >
              {suggestion.name || suggestion.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

