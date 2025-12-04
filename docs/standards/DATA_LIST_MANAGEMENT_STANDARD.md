# 데이터 리스트 관리 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 데이터 리스트 관리 표준입니다.  
목록 조회 시 성능 최적화를 위한 연속 스크롤(무한 스크롤) 및 페이징 전략을 정의합니다.

### 참조 문서
- [성능 최적화 표준](./PERFORMANCE_OPTIMIZATION_STANDARD.md)
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [프론트엔드 개발 표준](./FRONTEND_DEVELOPMENT_STANDARD.md)

### 구현 위치
- **무한 스크롤 유틸리티**: `frontend/src/utils/scripts.js`
- **페이징 컴포넌트**: `frontend/src/components/common/MGPagination.js`
- **API 페이징**: 백엔드 Pageable 인터페이스

---

## 🎯 데이터 리스트 관리 원칙

### 1. 연속 스크롤 우선
```
목록 조회 시 한 번에 많은 데이터를 받아오지 않고 연속 스크롤 사용
```

**원칙**:
- ✅ 기본적으로 연속 스크롤(무한 스크롤) 사용
- ✅ 페이지당 최대 20개 데이터 조회
- ✅ 스크롤 하단 도달 시 자동 로딩
- ✅ 로딩 상태 표시

### 2. 페이징 대안
```
연속 스크롤이 부적합한 경우에만 페이징 사용
```

**원칙**:
- ✅ 검색 결과는 페이징 사용
- ✅ 필터링/정렬이 복잡한 경우 페이징
- ✅ 사용자가 특정 페이지로 이동해야 하는 경우

### 3. 데이터 제한
```
한 번에 조회하는 데이터 제한 (최대 20개)
```

**원칙**:
- ✅ 기본 페이지 크기: 20개
- ✅ 최대 페이지 크기: 100개
- ✅ 초기 로딩: 최대 20개
- ❌ 한 번에 100개 이상 조회 금지

---

## 🔄 연속 스크롤 구현

### 1. 기본 구현 패턴

#### 컴포넌트 구조
```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../../utils/ajax';

const DataList = ({ endpoint }) => {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [totalElements, setTotalElements] = useState(0);

    const PAGE_SIZE = 20;

    // 데이터 로딩
    const loadData = useCallback(async (pageNum) => {
        try {
            setLoading(true);
            const response = await apiGet(
                `${endpoint}?page=${pageNum}&size=${PAGE_SIZE}`
            );
            
            if (response.success && response.data) {
                const newItems = response.data.content || [];
                const total = response.data.totalElements || 0;
                
                setItems(prev => pageNum === 0 ? newItems : [...prev, ...newItems]);
                setTotalElements(total);
                setHasMore((pageNum + 1) * PAGE_SIZE < total);
            }
        } catch (error) {
            console.error('데이터 로딩 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    // 초기 로딩
    useEffect(() => {
        loadData(0);
    }, [loadData]);

    // 스크롤 감지
    useEffect(() => {
        const handleScroll = () => {
            if (loading || !hasMore) return;

            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;

            // 하단 100px 전에 도달하면 로딩 시작
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                loadData(page + 1);
                setPage(prev => prev + 1);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, hasMore, page, loadData]);

    return (
        <div className="data-list">
            {items.map(item => (
                <div key={item.id} className="data-list-item">
                    {/* 아이템 렌더링 */}
                </div>
            ))}
            
            {loading && (
                <div className="data-list-loading">
                    로딩 중...
                </div>
            )}
            
            {!hasMore && items.length > 0 && (
                <div className="data-list-end">
                    모든 데이터를 불러왔습니다. ({totalElements}개)
                </div>
            )}
        </div>
    );
};
```

### 2. 무한 스크롤 훅

#### 커스텀 훅 구현
```javascript
// hooks/useInfiniteScroll.js
import { useState, useEffect, useCallback, useRef } from 'react';

export const useInfiniteScroll = (loadMore, hasMore, loading) => {
    const [page, setPage] = useState(0);
    const observerRef = useRef(null);
    const lastItemRef = useCallback(node => {
        if (loading) return;
        if (observerRef.current) observerRef.current.disconnect();
        
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
                loadMore(page + 1);
            }
        });
        
        if (node) observerRef.current.observe(node);
    }, [loading, hasMore, page, loadMore]);

    return { page, lastItemRef };
};
```

#### 사용 예시
```javascript
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

const DataList = ({ endpoint }) => {
    const [items, setItems] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const PAGE_SIZE = 20;

    const loadMore = useCallback(async (pageNum) => {
        setLoading(true);
        const response = await apiGet(`${endpoint}?page=${pageNum}&size=${PAGE_SIZE}`);
        
        if (response.success) {
            const newItems = response.data.content || [];
            setItems(prev => [...prev, ...newItems]);
            setHasMore(newItems.length === PAGE_SIZE);
        }
        setLoading(false);
    }, [endpoint]);

    const { lastItemRef } = useInfiniteScroll(loadMore, hasMore, loading);

    return (
        <div>
            {items.map((item, index) => (
                <div
                    key={item.id}
                    ref={index === items.length - 1 ? lastItemRef : null}
                >
                    {/* 아이템 렌더링 */}
                </div>
            ))}
            {loading && <div>로딩 중...</div>}
        </div>
    );
};
```

---

## 📄 페이징 구현

### 1. 페이징 사용 케이스

#### 페이징을 사용하는 경우
- ✅ 검색 결과
- ✅ 필터링/정렬이 복잡한 경우
- ✅ 사용자가 특정 페이지로 이동해야 하는 경우
- ✅ 데이터가 매우 많고 특정 위치를 찾아야 하는 경우

#### 페이징 컴포넌트 사용
```javascript
import MGPagination from '../common/MGPagination';

const SearchResults = ({ results, onPageChange, currentPage, totalPages }) => {
    return (
        <div>
            {/* 검색 결과 목록 */}
            <div className="results-list">
                {results.map(item => (
                    <div key={item.id}>{/* 아이템 */}</div>
                ))}
            </div>
            
            {/* 페이징 */}
            <MGPagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={20}
                onPageChange={onPageChange}
            />
        </div>
    );
};
```

---

## 📊 페이지 크기 표준

### 1. 기본 페이지 크기

| 목록 유형 | 기본 크기 | 최대 크기 |
|----------|---------|----------|
| 일반 목록 | 20개 | 100개 |
| 대시보드 미리보기 | 5~10개 | 20개 |
| 검색 결과 | 20개 | 50개 |
| 통계 데이터 | 10개 | 20개 |

### 2. 페이지 크기 설정

#### 백엔드 기본값
```java
@GetMapping("/api/v1/users")
public ResponseEntity<ApiResponse<Page<UserResponse>>> getUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,  // 기본 20개
        Pageable pageable
) {
    // 최대 100개로 제한
    if (size > 100) {
        size = 100;
    }
    
    Page<User> users = userRepository.findAll(
        PageRequest.of(page, size)
    );
    
    return success(users.map(UserResponse::from));
}
```

#### 프론트엔드 상수
```javascript
// constants/pagination.js
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    DASHBOARD_PREVIEW_SIZE: 5,
    SEARCH_RESULT_SIZE: 20
};
```

---

## 🚫 금지 사항

### 1. 한 번에 많은 데이터 조회 금지
```javascript
// ❌ 금지: 한 번에 모든 데이터 조회
const response = await apiGet('/api/v1/users?size=1000');

// ✅ 권장: 페이지 크기 제한
const response = await apiGet('/api/v1/users?page=0&size=20');
```

### 2. 전체 데이터 로딩 금지
```javascript
// ❌ 금지: 전체 데이터를 한 번에 로딩
const allData = await Promise.all([
    apiGet('/api/v1/users'),
    apiGet('/api/v1/consultants'),
    apiGet('/api/v1/clients')
]);

// ✅ 권장: 필요한 만큼만 로딩
const [users, consultants, clients] = await Promise.all([
    apiGet('/api/v1/users?size=20'),
    apiGet('/api/v1/consultants?size=20'),
    apiGet('/api/v1/clients?size=20')
]);
```

### 3. 스크롤 이벤트 중복 처리 금지
```javascript
// ❌ 금지: 스크롤 이벤트 중복 처리
window.addEventListener('scroll', handleScroll);
window.addEventListener('scroll', handleScroll); // 중복!

// ✅ 권장: 디바운스/스로틀 사용
const throttledHandleScroll = throttle(handleScroll, 100);
window.addEventListener('scroll', throttledHandleScroll);
```

---

## ✅ 체크리스트

### 연속 스크롤 구현 시
- [ ] 기본 페이지 크기 20개로 설정
- [ ] 스크롤 하단 감지 구현
- [ ] 로딩 상태 표시
- [ ] 더 이상 데이터가 없을 때 표시
- [ ] 스크롤 이벤트 최적화 (디바운스/스로틀)
- [ ] 에러 처리 구현

### 페이징 구현 시
- [ ] 기본 페이지 크기 20개로 설정
- [ ] 최대 페이지 크기 100개로 제한
- [ ] 페이지 정보 표시 (현재 페이지 / 전체 페이지)
- [ ] 페이지 네비게이션 UI 제공
- [ ] 페이지 변경 시 스크롤 상단 이동

---

## 💡 베스트 프랙티스

### 1. 스크롤 성능 최적화
```javascript
// 디바운스 사용
import { debounce } from 'lodash';

const handleScroll = debounce(() => {
    // 스크롤 처리 로직
}, 100);

window.addEventListener('scroll', handleScroll);
```

### 2. 가상 스크롤 (대량 데이터)
```javascript
// react-window 사용 (수천 개 이상의 아이템)
import { FixedSizeList } from 'react-window';

const VirtualizedList = ({ items }) => {
    return (
        <FixedSizeList
            height={600}
            itemCount={items.length}
            itemSize={50}
        >
            {({ index, style }) => (
                <div style={style}>
                    {items[index]}
                </div>
            )}
        </FixedSizeList>
    );
};
```

### 3. 로딩 상태 표시
```javascript
// 로딩 스켈레톤 UI
{loading && (
    <div className="skeleton-loader">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-item" />
        ))}
    </div>
)}
```

---

## 📞 문의

데이터 리스트 관리 표준 관련 문의:
- 프론트엔드 팀
- 백엔드 팀

**최종 업데이트**: 2025-12-03

