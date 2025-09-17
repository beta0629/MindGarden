import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * 공통 로딩 컴포넌트 - 간편 사용을 위한 래퍼
 */

// 전체 화면 로딩
export const FullscreenLoading = ({ text = "로딩 중..." }) => (
    <LoadingSpinner 
        text={text}
        size="large"
        variant="pulse"
        fullscreen={true}
    />
);

// 인라인 로딩 (카드 내부용)
export const InlineLoading = ({ text = "로딩 중...", size = "medium" }) => (
    <LoadingSpinner 
        text={text}
        size={size}
        variant="pulse"
        inline={true}
    />
);

// 페이지 로딩 (페이지 중앙)
export const PageLoading = ({ text = "페이지를 불러오는 중..." }) => (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        width: '100%'
    }}>
        <LoadingSpinner 
            text={text}
            size="large"
            variant="pulse"
            inline={true}
        />
    </div>
);

// 작은 로딩 (버튼 내부용)
export const ButtonLoading = ({ text = "처리 중..." }) => (
    <LoadingSpinner 
        text={text}
        size="small"
        variant="dots"
        showText={false}
    />
);

// 데이터 로딩 (테이블/리스트용)
export const DataLoading = ({ text = "데이터를 불러오는 중..." }) => (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '40px',
        width: '100%'
    }}>
        <LoadingSpinner 
            text={text}
            size="medium"
            variant="pulse"
            inline={true}
        />
    </div>
);

// 기본 로딩 (일반적인 용도)
const CommonLoading = ({ 
    text = "로딩 중...", 
    size = "medium", 
    variant = "pulse",
    type = "inline" // fullscreen, page, inline, data, button
}) => {
    switch (type) {
        case 'fullscreen':
            return <FullscreenLoading text={text} />;
        case 'page':
            return <PageLoading text={text} />;
        case 'data':
            return <DataLoading text={text} />;
        case 'button':
            return <ButtonLoading text={text} />;
        case 'inline':
        default:
            return <InlineLoading text={text} size={size} />;
    }
};

export default CommonLoading;
