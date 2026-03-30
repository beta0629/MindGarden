/**
 * 이메일 도메인 동적 선택 컴포넌트
 * 로컬 파트는 입력, 도메인은 검색 가능한 드롭다운
 * 재사용 가능한 독립 컴포넌트
 * 표준화 원칙 준수: CSS 클래스 사용, 인라인 스타일 금지
 */

import { useState, useRef, useEffect } from "react";
import { COMPONENT_CSS } from "../../constants/css-variables";
import "../../styles/components/email-domain-autocomplete.css";

// 일반적인 이메일 도메인 목록
const COMMON_EMAIL_DOMAINS = [
  'gmail.com',
  'naver.com',
  'daum.net',
  'kakao.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'hanmail.net',
  'nate.com',
  'icloud.com',
  'live.co.kr', // 추가
];

interface EmailDomainAutocompleteProps {
  emailLocal: string;
  emailDomain: string;
  emailCustomDomain?: string;
  onDomainChange: (domain: string) => void;
  onLocalChange: (local: string) => void;
  onCustomDomainChange?: (customDomain: string) => void;
  className?: string;
  placeholder?: string;
}

export default function EmailDomainAutocomplete({
  emailLocal,
  emailDomain,
  emailCustomDomain = '',
  onDomainChange,
  onLocalChange,
  onCustomDomainChange,
  className = '',
  placeholder = '이메일 아이디',
}: EmailDomainAutocompleteProps) {
  const [domainSearch, setDomainSearch] = useState('');
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const [filteredDomains, setFilteredDomains] = useState<string[]>(COMMON_EMAIL_DOMAINS);
  const domainInputRef = useRef<HTMLInputElement>(null);
  const domainDropdownRef = useRef<HTMLDivElement>(null);

  // 도메인 검색 필터링
  useEffect(() => {
    if (domainSearch.trim()) {
      const filtered = COMMON_EMAIL_DOMAINS.filter(domain =>
        domain.toLowerCase().includes(domainSearch.toLowerCase())
      );
      setFilteredDomains(filtered);
    } else {
      setFilteredDomains(COMMON_EMAIL_DOMAINS);
    }
  }, [domainSearch]);

  // 선택된 도메인이 변경되면 검색어 초기화
  useEffect(() => {
    if (emailDomain) {
      setDomainSearch(emailDomain);
      setShowDomainDropdown(false);
    } else {
      setDomainSearch('');
    }
  }, [emailDomain]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        domainDropdownRef.current &&
        !domainDropdownRef.current.contains(event.target as Node) &&
        domainInputRef.current &&
        !domainInputRef.current.contains(event.target as Node)
      ) {
        setShowDomainDropdown(false);
        // 선택된 도메인이 없으면 검색어 초기화
        if (!emailDomain) {
          setDomainSearch('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [emailDomain]);

  // 로컬 파트 입력 변경
  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const local = e.target.value;
    onLocalChange(local);
  };

  // 도메인 검색 입력 변경
  const handleDomainSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    setDomainSearch(search);
    setShowDomainDropdown(true);
    
    // 검색어가 정확히 일치하는 도메인이 있으면 자동 선택
    const exactMatch = COMMON_EMAIL_DOMAINS.find(
      d => d.toLowerCase() === search.toLowerCase()
    );
    if (exactMatch) {
      onDomainChange(exactMatch);
    } else if (emailDomain && emailDomain !== '@직접입력') {
      // 검색어가 변경되고 목록에 없는 도메인이면 선택 해제
      onDomainChange('');
    }
  };

  // 도메인 입력 필드 blur 처리 - 목록에 없으면 직접입력 모드로 전환
  // onBlur가 onClick보다 먼저 발생하므로 약간의 지연을 추가
  const handleDomainBlur = () => {
    // 약간의 지연을 추가하여 onClick 이벤트가 먼저 처리되도록 함
    setTimeout(() => {
      // 드롭다운이 여전히 열려있으면 (클릭으로 선택된 경우) 닫지 않음
      if (!showDomainDropdown) {
        return;
      }
      
      const search = domainSearch.trim();
      
      if (search && search.length > 0) {
        // 목록에 있는 도메인인지 확인
        const exactMatch = COMMON_EMAIL_DOMAINS.find(
          d => d.toLowerCase() === search.toLowerCase()
        );
        
        if (!exactMatch) {
          // 목록에 없는 도메인이면 직접입력 모드로 전환
          onDomainChange('@직접입력');
          if (onCustomDomainChange) {
            // @가 없으면 추가
            const customDomain = search.startsWith('@') ? search : `@${search}`;
            onCustomDomainChange(customDomain);
          }
          setDomainSearch('');
        }
      }
      
      setShowDomainDropdown(false);
    }, 200);
  };

  // 도메인 선택
  const handleDomainSelect = (domain: string) => {
    // onBlur 이벤트를 방지하기 위해 mousedown 이벤트 사용
    onDomainChange(domain);
    setDomainSearch(domain);
    setShowDomainDropdown(false);
  };

  // 도메인 입력 필드 포커스
  const handleDomainFocus = () => {
    setShowDomainDropdown(true);
  };

  return (
    <div className="trinity-email-input">
      {/* 로컬 파트 입력 필드 */}
      <input
        type="text"
        value={emailLocal}
        onChange={handleLocalChange}
        placeholder={placeholder}
        className={`${className} trinity-email-input__local`}
        autoComplete="username"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />
      
      {/* @ 기호 */}
      <span className="trinity-email-input__separator">
        @
      </span>
      
      {/* 도메인 검색 가능한 드롭다운 */}
      <div className="trinity-email-input__domain-wrapper">
        <input
          ref={domainInputRef}
          type="text"
          value={emailDomain === '@직접입력' ? emailCustomDomain.replace('@', '') : domainSearch}
          onChange={handleDomainSearchChange}
          onFocus={handleDomainFocus}
          onBlur={handleDomainBlur}
          placeholder="도메인 검색 또는 선택"
          className={`${className} trinity-email-input__domain-input`}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
        
        {/* 도메인 드롭다운 목록 */}
        {showDomainDropdown && filteredDomains.length > 0 && (
          <div
            ref={domainDropdownRef}
            className="trinity-email-input__domain-dropdown"
          >
            {filteredDomains.map((domain) => (
              <button
                key={domain}
                type="button"
                onMouseDown={(e) => {
                  // onBlur 이벤트를 방지하기 위해 preventDefault 사용
                  e.preventDefault();
                  handleDomainSelect(domain);
                }}
                className={`trinity-email-input__domain-option ${
                  emailDomain === domain ? 'trinity-email-input__domain-option--selected' : ''
                }`}
              >
                {domain}
              </button>
            ))}
          </div>
        )}
        
        {/* 검색 결과가 없을 때 */}
        {showDomainDropdown && domainSearch.trim() && filteredDomains.length === 0 && (
          <div
            ref={domainDropdownRef}
            className="trinity-email-input__domain-empty"
          >
            목록에 없는 도메인입니다. 입력을 완료하면 직접입력 모드로 전환됩니다.
          </div>
        )}
      </div>
      
      {/* 직접입력 모드일 때 커스텀 도메인 입력 필드 */}
      {emailDomain === '@직접입력' && (
        <div className="trinity-email-input__custom-domain-wrapper">
          <input
            type="text"
            value={emailCustomDomain.replace('@', '')}
            onChange={(e) => {
              let customDomain = e.target.value.trim();
              if (customDomain && !customDomain.startsWith('@')) {
                customDomain = `@${customDomain}`;
              }
              if (onCustomDomainChange) {
                onCustomDomainChange(customDomain);
              }
            }}
            placeholder="도메인 입력 (예: live.co.kr)"
            className={`${className} trinity-email-input__custom-domain-input`}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <small className="trinity-email-input__custom-domain-hint">
            도메인을 입력해주세요 (예: live.co.kr)
          </small>
        </div>
      )}
    </div>
  );
}

