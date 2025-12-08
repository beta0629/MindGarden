# 필터 및 검색 UI 표준화 (컴포넌트 표준화 원칙 준수)

**작성일**: 2025-12-09  
**상태**: 표준화 원칙 준수  
**우선순위**: 최우선

---

## 🎯 표준화 원칙 준수

### 핵심 원칙
1. **CSS 클래스 네이밍**: `mg-v2-*` 접두사 사용
2. **CSS 변수 사용**: 하드코딩 금지, `var(--mg-*)` 사용
3. **BEM 네이밍**: `mg-{component}-{element}--{modifier}`
4. **공통 컴포넌트 재사용**: MGButton, Card 등 기존 컴포넌트 활용
5. **Presentational/Container 패턴**: UI와 로직 분리
6. **상수화**: API, 메시지, 라벨 등 상수로 정의

---

## 🎨 2025 디자인 트렌드 (표준화 원칙 준수)

### 1. Glassmorphism (글래스모피즘)
- 반투명 배경 + 블러 효과
- 깔끔하고 모던한 느낌
- iOS 스타일

### 2. Minimalism (미니멀리즘)
- 깔끔한 디자인, 여백 활용
- 불필요한 요소 제거
- 집중도 향상

### 3. Smart Search (스마트 검색)
- 자동완성
- 실시간 검색 (debounce)
- 검색 제안
- 검색 히스토리

### 4. Filter Chips (필터 칩)
- 선택된 필터를 칩으로 표시
- 쉽게 제거 가능
- 시각적 피드백

### 5. Floating Labels (플로팅 라벨)
- 플레이스홀더가 라벨로 변환
- 공간 효율적
- 현대적인 느낌

---

## 🔍 가장 편한 검색 방법

### 1. 자동완성 검색 (Google 스타일) ⭐ 추천

**장점**:
- 빠른 검색
- 오타 방지
- 사용자 편의성 최대

**구현**:
```jsx
// 자동완성 검색 컴포넌트
<AutoCompleteSearch
  placeholder="이름, 이메일, 전화번호로 검색..."
  onSearch={handleSearch}
  suggestions={searchSuggestions}
  debounceMs={300}
/>
```

**특징**:
- 타이핑 시 자동완성 제안
- 최근 검색어 표시
- 실시간 필터링 (debounce 300ms)
- 여러 필드 동시 검색 (이름, 이메일, 전화번호)

### 2. 실시간 필터링 (Debounce)

**장점**:
- 즉각적인 결과
- 서버 부하 감소 (debounce)

**구현**:
```jsx
// 실시간 검색 (debounce)
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearchTerm) {
    performSearch(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);
```

### 3. 스마트 검색 (다중 필드)

**장점**:
- 한 번에 여러 필드 검색
- 사용자 편의성

**구현**:
```jsx
// 스마트 검색 (이름, 이메일, 전화번호 동시 검색)
const smartSearch = (term) => {
  return items.filter(item => 
    item.name?.toLowerCase().includes(term.toLowerCase()) ||
    item.email?.toLowerCase().includes(term.toLowerCase()) ||
    item.phone?.replace(/-/g, '').includes(term.replace(/-/g, ''))
  );
};
```

---

## 🎯 표준 필터/검색 컴포넌트 설계

### 1. 통합 검색 바 (Unified Search Bar)

**디자인**:
- Glassmorphism 스타일
- Floating label
- 자동완성 드롭다운
- 검색 아이콘 + 클리어 버튼

**구조** (표준화 원칙 준수):
```jsx
// 상수 정의
const SEARCH_PLACEHOLDER = "이름, 이메일, 전화번호로 검색...";
const DEBOUNCE_DELAY = 300;

// Presentational 컴포넌트
const SearchBar = ({
  searchTerm,
  suggestions = [],
  showSuggestions = false,
  onSearchChange,
  onSelectSuggestion,
  onClear
}) => {
  return (
    <div className="mg-v2-search-bar">
      <div className="mg-v2-search-bar__wrapper">
        <Search className="mg-v2-search-bar__icon" size={20} />
        <input
          type="text"
          className="mg-v2-search-bar__input"
          placeholder={SEARCH_PLACEHOLDER}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button 
            className="mg-v2-search-bar__clear"
            onClick={onClear}
            type="button"
            aria-label="검색어 지우기"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      {/* 자동완성 드롭다운 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mg-v2-search-bar__suggestions">
          {suggestions.map(suggestion => (
            <div 
              key={suggestion.id}
              className="mg-v2-search-bar__suggestion-item"
              onClick={() => onSelectSuggestion(suggestion)}
            >
              {suggestion.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 2. 필터 칩 시스템 (Filter Chips)

**디자인**:
- 선택된 필터를 칩으로 표시
- 제거 버튼 포함
- 색상으로 구분

**구조** (표준화 원칙 준수):
```jsx
// 상수 정의
const FILTER_CHIP_CLEAR_ALL = "모두 제거";

// Presentational 컴포넌트
const FilterChips = ({
  activeFilters = [],
  onRemoveFilter,
  onClearAll
}) => {
  if (activeFilters.length === 0) return null;
  
  return (
    <div className="mg-v2-filter-chips">
      {activeFilters.map(filter => (
        <div key={filter.key} className="mg-v2-filter-chip">
          <span className="mg-v2-filter-chip__label">
            {filter.label}: {filter.value}
          </span>
          <button 
            className="mg-v2-filter-chip__remove"
            onClick={() => onRemoveFilter(filter.key)}
            type="button"
            aria-label={`${filter.label} 필터 제거`}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      
      <button 
        className="mg-v2-filter-chip__clear-all"
        onClick={onClearAll}
        type="button"
      >
        {FILTER_CHIP_CLEAR_ALL}
      </button>
    </div>
  );
};
```

### 3. 드롭다운 필터 (Dropdown Filters)

**디자인**:
- 미니멀한 드롭다운
- 아이콘 + 라벨
- 다중 선택 지원

**구조** (표준화 원칙 준수):
```jsx
// 상수 정의
const FILTER_LABEL_ALL = "전체";

// Presentational 컴포넌트
const FilterDropdown = ({
  label,
  value,
  options = [],
  onChange,
  placeholder = FILTER_LABEL_ALL
}) => {
  return (
    <div className="mg-v2-filter-dropdown">
      <label className="mg-v2-filter-dropdown__label">
        <Filter size={16} />
        {label}
      </label>
      <select
        className="mg-v2-select mg-v2-filter-dropdown__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
```

### 4. 빠른 필터 버튼 (Quick Filter Buttons)

**디자인**:
- 토글 버튼 스타일
- 활성/비활성 상태 표시
- 아이콘 + 텍스트

**구조** (표준화 원칙 준수 - MGButton 재사용):
```jsx
// 상수 정의
const QUICK_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '활성' },
  { value: 'inactive', label: '비활성' }
];

// Presentational 컴포넌트
import MGButton from '@/components/common/MGButton';

const QuickFilters = ({
  activeFilter,
  onFilterChange
}) => {
  return (
    <div className="mg-v2-quick-filters">
      {QUICK_FILTER_OPTIONS.map(option => (
        <MGButton
          key={option.value}
          variant={activeFilter === option.value ? 'primary' : 'outline'}
          size="small"
          onClick={() => onFilterChange(option.value)}
          className={`mg-v2-quick-filter ${activeFilter === option.value ? 'mg-v2-quick-filter--active' : ''}`}
        >
          {option.label}
        </MGButton>
      ))}
    </div>
  );
};
```

### 5. 접을 수 있는 고급 필터 (Collapsible Advanced Filters)

**디자인**:
- 기본: 간단한 필터만 표시
- 확장: 고급 필터 패널
- 애니메이션 효과

**구조**:
```jsx
<div className="mg-filter-panel">
  <div className="mg-filter-panel__header">
    <h3>필터</h3>
    <button 
      className="mg-filter-panel__toggle"
      onClick={toggleAdvancedFilters}
    >
      {showAdvanced ? '간단히' : '고급 필터'}
      <ChevronIcon />
    </button>
  </div>
  
  {/* 기본 필터 */}
  <div className="mg-filter-panel__basic">
    <QuickFilters />
    <SearchBar />
  </div>
  
  {/* 고급 필터 (접을 수 있음) */}
  {showAdvanced && (
    <div className="mg-filter-panel__advanced">
      <DateRangeFilter />
      <MultiSelectFilter />
      <NumberRangeFilter />
    </div>
  )}
</div>
```

---

## 📐 표준 레이아웃

### 1. 컴팩트 레이아웃 (기본)

```
┌─────────────────────────────────────────┐
│ [🔍 검색바] [필터 드롭다운] [초기화]    │
│ [필터 칩들...]                          │
└─────────────────────────────────────────┘
```

### 2. 확장 레이아웃 (고급 필터)

```
┌─────────────────────────────────────────┐
│ [🔍 검색바] [필터 드롭다운] [고급 필터▼]│
│ [필터 칩들...]                          │
│ ─────────────────────────────────────── │
│ [날짜 범위] [다중 선택] [숫자 범위]     │
└─────────────────────────────────────────┘
```

### 3. 사이드바 필터 (대시보드)

```
┌──────────┬──────────────────────────────┐
│ [필터]   │ [🔍 검색바]                  │
│          │ [결과 목록...]                │
│ [상태]   │                              │
│ [카테고리]│                              │
│ [날짜]   │                              │
└──────────┴──────────────────────────────┘
```

---

## 🎨 CSS 스타일 (Glassmorphism + Minimalism)

### 검색 바 스타일 (표준화 원칙 준수)

```css
/* 표준화 원칙: mg-v2-* 접두사, CSS 변수 사용, 하드코딩 금지 */

.mg-v2-search-bar {
  position: relative;
  width: 100%;
}

.mg-v2-search-bar__wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--mg-shadow-sm);
  transition: all 0.2s;
}

.mg-v2-search-bar__wrapper:focus-within {
  border-color: var(--cs-primary-500);
  box-shadow: var(--mg-shadow-md);
}

.mg-v2-search-bar__input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--font-size-base);
  color: var(--cs-secondary-900);
  outline: none;
}

.mg-v2-search-bar__input::placeholder {
  color: var(--cs-secondary-400);
}

.mg-v2-search-bar__icon {
  color: var(--cs-secondary-500);
  flex-shrink: 0;
}

.mg-v2-search-bar__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--cs-secondary-400);
  cursor: pointer;
  transition: color 0.2s;
}

.mg-v2-search-bar__clear:hover {
  color: var(--cs-secondary-700);
}

/* 자동완성 드롭다운 */
.mg-v2-search-bar__suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: var(--spacing-xs);
  background: var(--color-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--mg-shadow-lg);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.mg-v2-search-bar__suggestion-item {
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: background-color 0.2s;
}

.mg-v2-search-bar__suggestion-item:hover {
  background-color: var(--cs-secondary-50);
}
```

### 필터 칩 스타일 (표준화 원칙 준수)

```css
/* 표준화 원칙: mg-v2-* 접두사, CSS 변수 사용 */

.mg-v2-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.mg-v2-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--cs-primary-50);
  border: 1px solid var(--cs-primary-200);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  color: var(--cs-primary-700);
}

.mg-v2-filter-chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--cs-primary-600);
  cursor: pointer;
  transition: color 0.2s;
}

.mg-v2-filter-chip__remove:hover {
  color: var(--cs-primary-800);
}

.mg-v2-filter-chip__clear-all {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  background: transparent;
  color: var(--cs-secondary-600);
  font-size: var(--font-size-sm);
  cursor: pointer;
  text-decoration: underline;
}
```

### 빠른 필터 버튼 스타일 (MGButton 재사용)

```css
/* MGButton 컴포넌트를 재사용하므로 추가 스타일 최소화 */

.mg-v2-quick-filters {
  display: flex;
  gap: var(--spacing-xs);
}

.mg-v2-quick-filter {
  /* MGButton의 variant와 size prop으로 스타일 제어 */
}
```

---

## 🔧 구현 예시 (표준화 원칙 준수)

### 상수 정의 파일

```jsx
// frontend/src/constants/filterSearch.js

export const SEARCH_PLACEHOLDER = "이름, 이메일, 전화번호로 검색...";
export const DEBOUNCE_DELAY = 300;
export const FILTER_CHIP_CLEAR_ALL = "모두 제거";
export const FILTER_LABEL_ALL = "전체";

export const QUICK_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '활성' },
  { value: 'inactive', label: '비활성' }
];
```

### 통합 필터/검색 컴포넌트 (Container)

```jsx
// frontend/src/components/ui/FilterSearch/UnifiedFilterSearch.js
// Container 컴포넌트 (로직 포함)

import React, { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import SearchBar from './SearchBar';
import QuickFilters from './QuickFilters';
import FilterChips from './FilterChips';
import FilterDropdown from './FilterDropdown';
import { SEARCH_PLACEHOLDER, DEBOUNCE_DELAY } from '@/constants/filterSearch';

const UnifiedFilterSearch = ({
  onSearch,
  onFilterChange,
  filters = [],
  searchPlaceholder = SEARCH_PLACEHOLDER,
  showQuickFilters = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);

  // Debounce 검색
  useEffect(() => {
    if (debouncedSearchTerm) {
      onSearch(debouncedSearchTerm);
      loadSuggestions(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...activeFilters, [filterKey]: value };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRemoveFilter = (filterKey) => {
    const newFilters = { ...activeFilters };
    delete newFilters[filterKey];
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="mg-v2-filter-search">
      <SearchBar
        searchTerm={searchTerm}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        placeholder={searchPlaceholder}
        onSearchChange={handleSearchChange}
        onSelectSuggestion={(suggestion) => {
          handleSearchChange(suggestion.name);
          setShowSuggestions(false);
        }}
        onClear={() => handleSearchChange('')}
      />

      {showQuickFilters && (
        <QuickFilters
          activeFilter={activeFilters.status}
          onFilterChange={(value) => handleFilterChange('status', value)}
        />
      )}

      <FilterChips
        activeFilters={Object.entries(activeFilters).map(([key, value]) => ({
          key,
          label: filters.find(f => f.key === key)?.label || key,
          value
        }))}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={() => {
          setActiveFilters({});
          onFilterChange({});
        }}
      />
    </div>
  );
};

export default UnifiedFilterSearch;
```

### Presentational 컴포넌트들

```jsx
// frontend/src/components/ui/FilterSearch/SearchBar.js
// Presentational 컴포넌트 (UI만)

import React from 'react';
import { Search, X } from 'lucide-react';
import { SEARCH_PLACEHOLDER } from '@/constants/filterSearch';

const SearchBar = ({
  searchTerm,
  suggestions = [],
  showSuggestions = false,
  placeholder = SEARCH_PLACEHOLDER,
  onSearchChange,
  onSelectSuggestion,
  onClear
}) => {
  return (
    <div className="mg-v2-search-bar">
      <div className="mg-v2-search-bar__wrapper">
        <Search className="mg-v2-search-bar__icon" size={20} />
        <input
          type="text"
          className="mg-v2-search-bar__input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button 
            className="mg-v2-search-bar__clear"
            onClick={onClear}
            type="button"
            aria-label="검색어 지우기"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="mg-v2-search-bar__suggestions">
          {suggestions.map(suggestion => (
            <div 
              key={suggestion.id}
              className="mg-v2-search-bar__suggestion-item"
              onClick={() => onSelectSuggestion(suggestion)}
            >
              {suggestion.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
```

---

## 📐 표준화 원칙 체크리스트

### 필수 준수 사항
- [x] `mg-v2-*` CSS 클래스 접두사 사용
- [x] CSS 변수 사용 (`var(--mg-*)`, `var(--spacing-*)`, `var(--color-*)`)
- [x] 하드코딩 금지 (색상, 크기, 간격 등)
- [x] BEM 네이밍 (`mg-{component}-{element}--{modifier}`)
- [x] 공통 컴포넌트 재사용 (MGButton, Card 등)
- [x] Presentational/Container 패턴 적용
- [x] 상수화 (API, 메시지, 라벨 등)
- [x] 인라인 스타일 금지

### CSS 변수 사용 예시
```css
/* ✅ 좋은 예 */
.mg-v2-search-bar__wrapper {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-white);
  border-color: var(--cs-primary-500);
}

/* ❌ 나쁜 예 */
.mg-v2-search-bar__wrapper {
  padding: 8px 16px;
  background: #ffffff;
  border-color: #3b82f6;
}
```

---

## ✅ 마이그레이션 체크리스트

### 우선순위 1: 내담자 관리 화면
- [ ] 검색 바 → 자동완성 검색 바
- [ ] 필터 드롭다운 → 빠른 필터 버튼 + 드롭다운
- [ ] 필터 칩 시스템 추가
- [ ] Glassmorphism 스타일 적용

### 우선순위 2: 상담사 관리 화면
- [ ] 동일한 패턴 적용

### 우선순위 3: 매핑 관리 화면
- [ ] 통합 필터/검색 컴포넌트 적용

### 우선순위 4: 모든 리스트 화면
- [ ] 표준 컴포넌트로 통일

---

## 📊 성공 지표

1. ✅ 검색 속도 향상 (자동완성)
2. ✅ 필터 사용 편의성 향상 (칩 시스템)
3. ✅ 시각적 일관성 (Glassmorphism)
4. ✅ 사용자 만족도 향상
5. ✅ 모던한 디자인 (2025 트렌드)

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-09

