# 리스트 UI 카드 형태 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 리스트 UI 표시 표준입니다.  
목록 형태의 데이터는 반드시 카드 형태로 표시하여 버튼 세로 배치 문제를 방지합니다.

### 참조 문서
- [프론트엔드 개발 표준](./FRONTEND_DEVELOPMENT_STANDARD.md)
- [반응형 레이아웃 표준](./RESPONSIVE_LAYOUT_STANDARD.md)
- [데이터 리스트 관리 표준](./DATA_LIST_MANAGEMENT_STANDARD.md)

### 구현 위치
- **카드 컴포넌트**: `frontend/src/components/ui/Card/`
- **공통 카드**: `frontend/src/components/common/MGCard.js`
- **메시지 카드**: `frontend/src/components/common/MessageCard.js`

---

## 🎯 리스트 UI 카드 형태 원칙

### 1. 카드 형태 필수
```
모든 리스트 형태의 데이터는 카드 형태로 표시
```

**원칙**:
- ✅ 모든 목록 데이터는 카드 형태로 표시
- ✅ 테이블 형태 대신 카드 그리드 사용
- ✅ 버튼이 세로로 배치되지 않도록 카드 구조 활용
- ❌ 테이블 행 형태의 리스트 금지

### 2. 버튼 세로 배치 방지
```
카드 형태로 인해 버튼이 항상 가로로 배치됨
```

**원칙**:
- ✅ 카드 내부에 액션 영역 명확히 구분
- ✅ 버튼은 카드 하단 또는 우측에 가로 배치
- ✅ 반응형에서도 버튼은 가로 배치 유지
- ❌ 버튼 세로 배치 금지

### 3. 일관된 카드 디자인
```
모든 카드는 표준 카드 컴포넌트 사용
```

**원칙**:
- ✅ `MGCard` 또는 `Card` 컴포넌트 사용
- ✅ 일관된 패딩 및 간격
- ✅ 동일한 그림자 및 테두리 스타일

---

## 📦 카드 형태 리스트 구조

### 1. 기본 카드 리스트

#### 구조
```javascript
import MGCard from '../common/MGCard';

const DataList = ({ items }) => {
    return (
        <div className="data-list-grid">
            {items.map(item => (
                <MGCard key={item.id} className="data-list-card">
                    {/* 카드 헤더 */}
                    <div className="data-list-card__header">
                        <h3 className="data-list-card__title">{item.title}</h3>
                        {item.badge && (
                            <span className="data-list-card__badge">{item.badge}</span>
                        )}
                    </div>
                    
                    {/* 카드 본문 */}
                    <div className="data-list-card__content">
                        <p className="data-list-card__description">
                            {item.description}
                        </p>
                        <div className="data-list-card__meta">
                            <span>{item.meta1}</span>
                            <span>{item.meta2}</span>
                        </div>
                    </div>
                    
                    {/* 카드 액션 (버튼 가로 배치) */}
                    <div className="data-list-card__actions">
                        <button className="mg-button mg-button--primary">
                            수정
                        </button>
                        <button className="mg-button mg-button--outline">
                            삭제
                        </button>
                    </div>
                </MGCard>
            ))}
        </div>
    );
};
```

#### CSS 스타일
```css
/* 카드 그리드 레이아웃 */
.data-list-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    padding: 20px;
}

/* 카드 스타일 */
.data-list-card {
    display: flex;
    flex-direction: column;
    min-height: 200px;
}

/* 카드 헤더 */
.data-list-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--mg-border-color);
}

/* 카드 본문 */
.data-list-card__content {
    flex: 1;
    margin-bottom: 16px;
}

/* 카드 액션 (버튼 가로 배치) */
.data-list-card__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid var(--mg-border-color);
}

/* 반응형: 모바일에서도 버튼 가로 배치 유지 */
@media (max-width: 768px) {
    .data-list-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }
    
    .data-list-card__actions {
        flex-wrap: wrap; /* 필요시 줄바꿈 */
    }
}
```

### 2. 컴팩트 카드 리스트

#### 구조
```javascript
const CompactCardList = ({ items }) => {
    return (
        <div className="compact-card-list">
            {items.map(item => (
                <MGCard key={item.id} className="compact-card" variant="outlined">
                    <div className="compact-card__content">
                        <div className="compact-card__main">
                            <h4 className="compact-card__title">{item.title}</h4>
                            <p className="compact-card__subtitle">{item.subtitle}</p>
                        </div>
                        <div className="compact-card__actions">
                            <button className="mg-button mg-button--sm">
                                보기
                            </button>
                        </div>
                    </div>
                </MGCard>
            ))}
        </div>
    );
};
```

#### CSS 스타일
```css
.compact-card-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.compact-card {
    padding: 16px;
}

.compact-card__content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

.compact-card__main {
    flex: 1;
}

.compact-card__actions {
    flex-shrink: 0;
}
```

---

## 🚫 금지 사항

### 1. 테이블 행 형태 리스트 금지
```javascript
// ❌ 금지: 테이블 행 형태
<table>
    <tbody>
        {items.map(item => (
            <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                    <button>수정</button>
                    <button>삭제</button>
                </td>
            </tr>
        ))}
    </tbody>
</table>

// ✅ 권장: 카드 형태
<div className="data-list-grid">
    {items.map(item => (
        <MGCard key={item.id}>
            {/* 카드 내용 */}
        </MGCard>
    ))}
</div>
```

### 2. 버튼 세로 배치 금지
```javascript
// ❌ 금지: 버튼 세로 배치
<div className="item-actions">
    <button>수정</button>
    <button>삭제</button>
</div>

/* CSS */
.item-actions {
    display: flex;
    flex-direction: column; /* 세로 배치 */
}

// ✅ 권장: 버튼 가로 배치
<div className="item-actions">
    <button>수정</button>
    <button>삭제</button>
</div>

/* CSS */
.item-actions {
    display: flex;
    flex-direction: row; /* 가로 배치 */
    gap: 8px;
}
```

### 3. 리스트 형태와 카드 형태 혼용 금지
```javascript
// ❌ 금지: 혼용
<div>
    <ul>
        <li>항목 1</li>
        <li>항목 2</li>
    </ul>
    <MGCard>카드 1</MGCard>
    <MGCard>카드 2</MGCard>
</div>

// ✅ 권장: 카드 형태로 통일
<div className="data-list-grid">
    <MGCard>항목 1</MGCard>
    <MGCard>항목 2</MGCard>
</div>
```

---

## ✅ 체크리스트

### 리스트 UI 구현 시
- [ ] 카드 형태로 표시
- [ ] 버튼 가로 배치
- [ ] 표준 카드 컴포넌트 사용
- [ ] 일관된 카드 디자인
- [ ] 반응형 레이아웃 적용
- [ ] 카드 그리드 레이아웃

### 카드 액션 영역 구현 시
- [ ] 버튼 가로 배치 (필수)
- [ ] 액션 영역 명확히 구분
- [ ] 버튼 간격 적절히 설정
- [ ] 반응형에서도 가로 배치 유지

---

## 💡 베스트 프랙티스

### 1. 카드 그리드 레이아웃
```css
/* 반응형 그리드 */
.data-list-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

/* 모바일: 1열 */
@media (max-width: 768px) {
    .data-list-grid {
        grid-template-columns: 1fr;
    }
}

/* 태블릿: 2열 */
@media (min-width: 769px) and (max-width: 1024px) {
    .data-list-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* 데스크톱: 3-4열 */
@media (min-width: 1025px) {
    .data-list-grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
}
```

### 2. 카드 액션 버튼 그룹
```javascript
const CardActions = ({ item, onEdit, onDelete }) => {
    return (
        <div className="card-actions">
            <button 
                className="mg-button mg-button--primary mg-button--sm"
                onClick={() => onEdit(item)}
            >
                수정
            </button>
            <button 
                className="mg-button mg-button--danger mg-button--sm"
                onClick={() => onDelete(item)}
            >
                삭제
            </button>
        </div>
    );
};
```

### 3. 재사용 가능한 카드 컴포넌트
```javascript
const ListCard = ({ 
    title, 
    subtitle, 
    description, 
    badge,
    actions,
    onClick 
}) => {
    return (
        <MGCard 
            className="list-card"
            onClick={onClick}
            variant="elevated"
        >
            <div className="list-card__header">
                <div>
                    <h3 className="list-card__title">{title}</h3>
                    {subtitle && (
                        <p className="list-card__subtitle">{subtitle}</p>
                    )}
                </div>
                {badge && (
                    <span className="list-card__badge">{badge}</span>
                )}
            </div>
            
            {description && (
                <div className="list-card__content">
                    <p>{description}</p>
                </div>
            )}
            
            {actions && (
                <div className="list-card__actions">
                    {actions}
                </div>
            )}
        </MGCard>
    );
};
```

---

## 📞 문의

리스트 UI 카드 형태 표준 관련 문의:
- 프론트엔드 팀
- UX 팀

**최종 업데이트**: 2025-12-03

