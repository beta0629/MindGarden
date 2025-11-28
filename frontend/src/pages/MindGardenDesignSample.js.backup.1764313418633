/**
 * MindGarden 디자인 시스템 샘플 페이지
 * 모든 공통 컴포넌트의 일관성을 확인하는 테스트 페이지
 */

import React, { useState } from 'react';
import MGButton from '../components/common/MGButton';
import MGCard from '../components/common/MGCard';
import MGPageHeader from '../components/common/MGPageHeader';

const MindGardenDesignSample = () => {
  const [loading, setLoading] = useState(false);

  const handleButtonClick = (variant) => {
    console.log(`${variant} 버튼 클릭됨`);
  };

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 페이지 헤더 */}
      <MGPageHeader
        title="MindGarden 디자인 시스템"
        subtitle="일관성 있는 UI 컴포넌트 샘플"
        description="모든 컴포넌트가 동일한 디자인 언어를 사용하는지 확인합니다"
        icon="🎨"
        actions={
          <MGButton 
            variant="primary" 
            size="small"
            onClick={() => console.log('샘플 액션')}
          >
            샘플 액션
          </MGButton>
        }
      />

      {/* 버튼 샘플 */}
      <MGCard variant="elevated" padding="large" className="mb-4">
        <h2 className="mg-card__title">버튼 컴포넌트</h2>
        <p className="mg-card__description">다양한 크기와 스타일의 버튼들</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          {/* Primary 버튼들 */}
          <MGButton variant="primary" size="small" onClick={() => handleButtonClick('primary-small')}>
            Primary Small
          </MGButton>
          <MGButton variant="primary" size="medium" onClick={() => handleButtonClick('primary-medium')}>
            Primary Medium
          </MGButton>
          <MGButton variant="primary" size="large" onClick={() => handleButtonClick('primary-large')}>
            Primary Large
          </MGButton>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          {/* Secondary 버튼들 */}
          <MGButton variant="secondary" onClick={() => handleButtonClick('secondary')}>
            Secondary
          </MGButton>
          <MGButton variant="success" onClick={() => handleButtonClick('success')}>
            Success
          </MGButton>
          <MGButton variant="warning" onClick={() => handleButtonClick('warning')}>
            Warning
          </MGButton>
          <MGButton variant="danger" onClick={() => handleButtonClick('danger')}>
            Danger
          </MGButton>
          <MGButton variant="ghost" onClick={() => handleButtonClick('ghost')}>
            Ghost
          </MGButton>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          {/* 특수 상태 버튼들 */}
          <MGButton variant="primary" disabled>
            Disabled
          </MGButton>
          <MGButton variant="primary" loading={loading} onClick={handleLoadingTest}>
            {loading ? '로딩 중...' : '로딩 테스트'}
          </MGButton>
          <MGButton variant="primary" icon="📧">
            아이콘 버튼
          </MGButton>
        </div>
      </MGCard>

      {/* 카드 샘플 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {/* 기본 카드 */}
        <MGCard variant="default" padding="medium">
          <h3 className="mg-card__title">기본 카드</h3>
          <p>기본 스타일의 카드입니다. 테두리와 배경이 있는 일반적인 카드 디자인입니다.</p>
          <div className="mg-card__actions">
            <MGButton variant="primary" size="small">액션</MGButton>
          </div>
        </MGCard>

        {/* Elevated 카드 */}
        <MGCard variant="elevated" padding="medium">
          <h3 className="mg-card__title">Elevated 카드</h3>
          <p>그림자가 강조된 카드입니다. 중요한 내용을 강조할 때 사용합니다.</p>
          <div className="mg-card__actions">
            <MGButton variant="secondary" size="small">액션</MGButton>
          </div>
        </MGCard>

        {/* Outlined 카드 */}
        <MGCard variant="outlined" padding="medium">
          <h3 className="mg-card__title">Outlined 카드</h3>
          <p>테두리가 두꺼운 카드입니다. 선택 가능한 옵션을 표시할 때 사용합니다.</p>
          <div className="mg-card__actions">
            <MGButton variant="ghost" size="small">액션</MGButton>
          </div>
        </MGCard>

        {/* Filled 카드 */}
        <MGCard variant="filled" padding="medium">
          <h3 className="mg-card__title">Filled 카드</h3>
          <p>배경색이 있는 카드입니다. 섹션을 구분할 때 사용합니다.</p>
          <div className="mg-card__actions">
            <MGButton variant="primary" size="small">액션</MGButton>
          </div>
        </MGCard>

        {/* Glass 카드 */}
        <MGCard variant="glass" padding="medium">
          <h3 className="mg-card__title">Glass 카드</h3>
          <p>글래스모피즘 효과가 적용된 카드입니다. 모던한 느낌을 원할 때 사용합니다.</p>
          <div className="mg-card__actions">
            <MGButton variant="primary" size="small">액션</MGButton>
          </div>
        </MGCard>

        {/* 클릭 가능한 카드 */}
        <MGCard variant="elevated" padding="medium" onClick={() => alert('카드 클릭됨!')}>
          <h3 className="mg-card__title">클릭 가능한 카드</h3>
          <p>클릭할 수 있는 카드입니다. 호버 시 그림자와 변형 효과가 나타납니다.</p>
          <div className="mg-card__actions">
            <MGButton variant="secondary" size="small">액션</MGButton>
          </div>
        </MGCard>
      </div>

      {/* 페이지 헤더 샘플 */}
      <MGCard variant="elevated" padding="large" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h2 className="mg-card__title">페이지 헤더 컴포넌트</h2>
        <p className="mg-card__description">다양한 페이지 헤더 스타일</p>
        
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h3>기본 헤더</h3>
          <MGPageHeader
            title="기본 페이지 제목"
            subtitle="페이지 부제목"
            description="페이지에 대한 설명을 여기에 작성합니다."
            icon="📄"
          />
        </div>

        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h3>뒤로가기 버튼이 있는 헤더</h3>
          <MGPageHeader
            title="뒤로가기 헤더"
            subtitle="뒤로가기 버튼이 포함된 헤더"
            showBackButton={true}
            icon="🔙"
          />
        </div>

        <div>
          <h3>액션 버튼이 있는 헤더</h3>
          <MGPageHeader
            title="액션 헤더"
            subtitle="여러 액션 버튼이 포함된 헤더"
            actions={
              <>
                <MGButton variant="ghost" size="small">저장</MGButton>
                <MGButton variant="primary" size="small">완료</MGButton>
              </>
            }
            icon="⚡"
          />
        </div>
      </MGCard>
    </div>
  );
};

export default MindGardenDesignSample;



