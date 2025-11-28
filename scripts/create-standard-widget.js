#!/usr/bin/env node

/**
 * 표준화된 위젯 생성 스크립트
 * 
 * 모든 새로운 위젯이 BaseWidget과 useWidget을 사용하도록 강제하는 템플릿
 * 
 * 사용법: node scripts/create-standard-widget.js <위젯이름> [카테고리]
 * 예시: node scripts/create-standard-widget.js MyNewWidget admin
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-28
 */

const fs = require('fs');
const path = require('path');

// 명령행 인수 파싱
const [,, widgetName, category = 'common'] = process.argv;

if (!widgetName) {
  console.error('❌ 위젯 이름이 필요합니다.');
  console.log('사용법: node scripts/create-standard-widget.js <위젯이름> [카테고리]');
  console.log('예시: node scripts/create-standard-widget.js MyNewWidget admin');
  process.exit(1);
}

// 위젯 이름 검증
if (!widgetName.endsWith('Widget')) {
  console.error('❌ 위젯 이름은 "Widget"으로 끝나야 합니다.');
  process.exit(1);
}

// 카테고리별 경로 설정
const categoryPaths = {
  'common': 'frontend/src/components/dashboard/widgets',
  'admin': 'frontend/src/components/dashboard/widgets/admin',
  'consultation': 'frontend/src/components/dashboard/widgets/consultation',
  'erp': 'frontend/src/components/dashboard/widgets/erp'
};

const widgetDir = categoryPaths[category];
if (!widgetDir) {
  console.error(`❌ 지원하지 않는 카테고리: ${category}`);
  console.log('지원하는 카테고리:', Object.keys(categoryPaths).join(', '));
  process.exit(1);
}

// 파일 경로 설정
const widgetPath = path.join(widgetDir, `${widgetName}.js`);
const testPath = path.join(widgetDir, `${widgetName}.test.js`);
const storyPath = path.join(widgetDir, `${widgetName}.stories.js`);

// 디렉토리 생성
if (!fs.existsSync(widgetDir)) {
  fs.mkdirSync(widgetDir, { recursive: true });
}

// 상대 경로 계산 (카테고리에 따라)
const getRelativePath = (category) => {
  switch (category) {
    case 'admin':
    case 'consultation':
    case 'erp':
      return '../';
    default:
      return './';
  }
};

const relativePath = getRelativePath(category);

// 표준화된 위젯 템플릿
const widgetTemplate = `/**
 * ${widgetName}
 * 
 * 표준화된 MindGarden 위젯
 * - BaseWidget 사용 (표준 레이아웃, 로딩/에러 처리)
 * - useWidget 훅 사용 (데이터 관리, 캐싱, 자동 새로고침)
 * - WIDGET_CONSTANTS 사용 (CSS 클래스, 메시지 등)
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since ${new Date().toISOString().split('T')[0]}
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWidget } from '${category === 'common' ? '../../../' : '../../../../'}hooks/useWidget';
import BaseWidget from '${relativePath}BaseWidget';
import { WIDGET_CONSTANTS } from '${category === 'common' ? '../../../' : '../../../../'}constants/widgetConstants';
import { MG_DESIGN_TOKENS } from '${category === 'common' ? '../../../' : '../../../../'}constants/designTokens';
import '${relativePath}Widget.css';

/**
 * ${widgetName} 컴포넌트
 * 
 * @param {Object} widget - 위젯 설정 정보
 * @param {Object} user - 현재 사용자 정보
 * @returns {JSX.Element}
 */
const ${widgetName} = ({ widget, user }) => {
  const navigate = useNavigate();
  
  // ✅ 표준화된 위젯 훅 사용 (필수)
  const {
    data,
    loading,
    error,
    hasData,
    isEmpty,
    refresh,
    formatValue
  } = useWidget(widget, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  // 위젯 내용 렌더링
  const renderContent = () => {
    if (!hasData) {
      return null; // BaseWidget에서 빈 상태 처리
    }

    return (
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_CONTENT}>
        {/* TODO: 실제 위젯 내용을 여기에 구현하세요 */}
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_BODY}>
          <p>데이터 수: {formatValue(data?.count || 0, 'number')}</p>
          <p>마지막 업데이트: {formatValue(data?.lastUpdated, 'datetime')}</p>
        </div>
        
        {/* 예시: 액션 버튼 */}
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_FLEX + ' ' + WIDGET_CONSTANTS.CSS_CLASSES.MG_GAP_SM}>
          <button 
            className="mg-button mg-button--primary"
            onClick={() => navigate('/admin/some-page')}
          >
            {WIDGET_CONSTANTS.BUTTON_LABELS.VIEW_MORE}
          </button>
        </div>
      </div>
    );
  };

  // ✅ 표준화된 BaseWidget 사용 (필수)
  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      onRefresh={refresh}
      headerActions={{
        refresh: {
          label: WIDGET_CONSTANTS.BUTTON_LABELS.REFRESH,
          onClick: refresh
        }
      }}
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default ${widgetName};
`;

// 테스트 파일 템플릿
const testTemplate = `/**
 * ${widgetName} 테스트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since ${new Date().toISOString().split('T')[0]}
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ${widgetName} from './${widgetName}';

// 테스트 헬퍼
const renderWidget = (props = {}) => {
  const defaultProps = {
    widget: {
      id: 'test-widget',
      type: '${widgetName.toLowerCase().replace('widget', '')}',
      config: {
        title: '테스트 위젯',
        subtitle: '테스트용 위젯입니다'
      }
    },
    user: {
      id: 'test-user',
      name: '테스트 사용자',
      role: 'admin',
      tenantId: 'test-tenant'
    }
  };

  return render(
    <BrowserRouter>
      <${widgetName} {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('${widgetName}', () => {
  test('위젯이 정상적으로 렌더링된다', () => {
    renderWidget();
    expect(screen.getByText('테스트 위젯')).toBeInTheDocument();
  });

  test('로딩 상태를 표시한다', () => {
    renderWidget();
    // BaseWidget의 로딩 처리 확인
    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true');
  });

  test('에러 상태를 처리한다', async () => {
    // API 에러 시뮬레이션
    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));
    
    renderWidget();
    
    await waitFor(() => {
      expect(screen.getByText(/오류/)).toBeInTheDocument();
    });
  });

  test('새로고침 기능이 작동한다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ count: 10 })
    });

    renderWidget();
    
    const refreshButton = screen.getByText('새로고침');
    expect(refreshButton).toBeInTheDocument();
  });
});
`;

// Storybook 스토리 템플릿
const storyTemplate = `/**
 * ${widgetName} Storybook 스토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since ${new Date().toISOString().split('T')[0]}
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ${widgetName} from './${widgetName}';

export default {
  title: 'Widgets/${category}/${widgetName}',
  component: ${widgetName},
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div style={{ padding: '20px', maxWidth: '600px' }}>
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: '표준화된 MindGarden 위젯입니다. BaseWidget과 useWidget을 사용합니다.'
      }
    }
  }
};

// 기본 스토리
export const Default = {
  args: {
    widget: {
      id: 'story-widget',
      type: '${widgetName.toLowerCase().replace('widget', '')}',
      config: {
        title: '${widgetName}',
        subtitle: '기본 위젯 예시'
      }
    },
    user: {
      id: 'story-user',
      name: '스토리북 사용자',
      role: 'admin',
      tenantId: 'story-tenant'
    }
  }
};

// 로딩 상태
export const Loading = {
  args: {
    ...Default.args,
    widget: {
      ...Default.args.widget,
      config: {
        ...Default.args.widget.config,
        dataSource: {
          type: 'api',
          url: '/api/slow-endpoint' // 느린 API 시뮬레이션
        }
      }
    }
  }
};

// 에러 상태
export const Error = {
  args: {
    ...Default.args,
    widget: {
      ...Default.args.widget,
      config: {
        ...Default.args.widget.config,
        dataSource: {
          type: 'api',
          url: '/api/error-endpoint' // 에러 API 시뮬레이션
        }
      }
    }
  }
};

// 빈 데이터 상태
export const Empty = {
  args: {
    ...Default.args,
    widget: {
      ...Default.args.widget,
      config: {
        ...Default.args.widget.config,
        dataSource: {
          type: 'static',
          data: null
        }
      }
    }
  }
};
`;

// 파일 생성
try {
  // 위젯 파일 생성
  if (fs.existsSync(widgetPath)) {
    console.error(`❌ 위젯 파일이 이미 존재합니다: ${widgetPath}`);
    process.exit(1);
  }
  
  fs.writeFileSync(widgetPath, widgetTemplate);
  console.log(`✅ 위젯 파일 생성: ${widgetPath}`);
  
  // 테스트 파일 생성
  fs.writeFileSync(testPath, testTemplate);
  console.log(`✅ 테스트 파일 생성: ${testPath}`);
  
  // 스토리 파일 생성
  fs.writeFileSync(storyPath, storyTemplate);
  console.log(`✅ 스토리 파일 생성: ${storyPath}`);
  
  console.log('\\n🎉 표준화된 위젯이 성공적으로 생성되었습니다!');
  console.log('\\n📋 다음 단계:');
  console.log(`1. ${widgetPath} 파일을 열어 실제 로직을 구현하세요`);
  console.log(`2. WidgetRegistry.js에 위젯을 등록하세요`);
  console.log(`3. 테스트를 실행하여 동작을 확인하세요: npm test ${widgetName}`);
  console.log(`4. Storybook에서 UI를 확인하세요: npm run storybook`);
  
} catch (error) {
  console.error('❌ 위젯 생성 중 오류 발생:', error.message);
  process.exit(1);
}
