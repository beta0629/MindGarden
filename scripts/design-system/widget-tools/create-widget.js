#!/usr/bin/env node

/**
 * MindGarden 위젯 생성 도구
 * 
 * 사용법:
 * node scripts/create-widget.js <위젯명> <타입> [옵션]
 * 
 * 예시:
 * node scripts/create-widget.js SystemOverview admin --api="/api/admin/system-stats"
 * node scripts/create-widget.js TodayStats common --multiple-apis
 * 
 * @author MindGarden
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// 명령행 인수 파싱
const args = process.argv.slice(2);
const widgetName = args[0];
const widgetType = args[1] || 'common'; // admin, common, consultation, academy
const options = {};

// 옵션 파싱
args.slice(2).forEach(arg => {
  if (arg.startsWith('--api=')) {
    options.apiEndpoint = arg.split('=')[1];
  } else if (arg === '--multiple-apis') {
    options.multipleApis = true;
  } else if (arg === '--no-api') {
    options.noApi = true;
  } else if (arg.startsWith('--description=')) {
    options.description = arg.split('=')[1];
  }
});

if (!widgetName) {
  console.error('❌ 위젯명을 입력해주세요.');
  console.log('사용법: node scripts/create-widget.js <위젯명> <타입> [옵션]');
  process.exit(1);
}

// 위젯 정보 설정
const widgetInfo = {
  name: widgetName,
  fileName: `${widgetName}Widget.js`,
  componentName: `${widgetName}Widget`,
  type: widgetType,
  kebabCase: widgetName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, ''),
  description: options.description || `${widgetName} 위젯`,
  apiEndpoint: options.apiEndpoint,
  multipleApis: options.multipleApis,
  noApi: options.noApi
};

console.log('🚀 위젯 생성 시작...');
console.log(`📋 위젯명: ${widgetInfo.name}`);
console.log(`📁 타입: ${widgetInfo.type}`);
console.log(`📄 파일명: ${widgetInfo.fileName}`);

// 위젯 템플릿 생성
function createWidgetTemplate() {
  const hasApi = !widgetInfo.noApi;
  const hasMultipleApis = widgetInfo.multipleApis;
  
  return `import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import StatCard from '../../../ui/Card/StatCard';
import MGButton from '../../../common/MGButton';
import { WIDGET_CONSTANTS } from '../../../../constants/widgetConstants';
import { MG_DESIGN_TOKENS } from '../../../../constants/designTokens';

/**
 * ${widgetInfo.description}
 * 
 * @param {Object} widget - 위젯 설정 정보
 * @param {Object} user - 현재 사용자 정보
 * @returns {JSX.Element}
 */
const ${widgetInfo.componentName} = ({ widget, user }) => {
  const navigate = useNavigate();
  
  // 표준화된 위젯 훅 사용
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
    cache: ${hasApi ? 'true' : 'false'},
    retryCount: 3
  });

  // 위젯 내용 렌더링
  const renderContent = () => {
    ${hasApi ? `if (!hasData) {
      return null; // BaseWidget에서 빈 상태 처리
    }

    return (
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_GRID}>
        <StatCard
          icon={<span>📊</span>}
          value={formatValue(data?.count || 0, 'number')}
          label="데이터 수"
          color={MG_DESIGN_TOKENS.COLORS.PRIMARY}
        />
        {/* TODO: 실제 데이터에 맞게 StatCard들을 추가하세요 */}
      </div>
    );` : `return (
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_CONTENT}>
        <p className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_BODY}>
          위젯 내용을 여기에 구현하세요.
        </p>
        <MGButton
          variant={MG_DESIGN_TOKENS.BUTTON_VARIANTS.PRIMARY}
          size={MG_DESIGN_TOKENS.BUTTON_SIZES.MEDIUM}
          onClick={() => console.log('버튼 클릭')}
        >
          {WIDGET_CONSTANTS.BUTTON_LABELS.ACTION}
        </MGButton>
      </div>
    );`}
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      onRefresh={refresh}
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default ${widgetInfo.componentName};
`;
}

// CSS 템플릿 생성 (MindGarden 디자인 시스템 기반)
function createCssTemplate() {
  return `
/* ========================================
   ${widgetInfo.componentName} 전용 스타일
   MindGarden 디자인 시스템 기반
   ======================================== */

/* 위젯 컨테이너 */
.mg-widget--${widgetInfo.kebabCase} {
  /* 위젯별 고유 스타일 - CSS 변수 사용 필수 */
  --widget-primary-color: var(--mg-primary-500);
  --widget-background: var(--mg-white);
  --widget-border: var(--mg-gray-200);
  --widget-shadow: var(--mg-shadow-sm);
  
  /* 기본 스타일 적용 */
  background-color: var(--widget-background);
  border: 1px solid var(--widget-border);
  border-radius: var(--mg-border-radius-md);
  box-shadow: var(--widget-shadow);
  transition: all var(--mg-duration-normal) var(--mg-easing-ease-in-out);
}

/* 호버 효과 */
.mg-widget--${widgetInfo.kebabCase}:hover {
  box-shadow: var(--mg-shadow-md);
  transform: translateY(-2px);
}

/* 위젯 헤더 */
.mg-widget--${widgetInfo.kebabCase} .mg-widget__header {
  background-color: var(--mg-gray-50);
  border-bottom: 1px solid var(--mg-gray-200);
  padding: var(--mg-spacing-md);
  border-radius: var(--mg-border-radius-md) var(--mg-border-radius-md) 0 0;
}

/* 위젯 제목 */
.mg-widget--${widgetInfo.kebabCase} .mg-widget__title {
  color: var(--mg-gray-900);
  font-size: var(--mg-font-size-lg);
  font-weight: var(--mg-font-weight-semibold);
  line-height: var(--mg-line-height-tight);
  margin: 0;
}

/* 위젯 부제목 */
.mg-widget--${widgetInfo.kebabCase} .mg-widget__subtitle {
  color: var(--mg-gray-600);
  font-size: var(--mg-font-size-sm);
  font-weight: var(--mg-font-weight-normal);
  margin: var(--mg-spacing-xs) 0 0 0;
}

/* 위젯 본문 */
.mg-widget--${widgetInfo.kebabCase} .mg-widget__body {
  padding: var(--mg-spacing-md);
}

/* 위젯 내용 */
.mg-widget--${widgetInfo.kebabCase} .mg-widget__content {
  /* 내용별 고유 스타일 */
}

/* 로딩 컨테이너 */
.mg-widget--${widgetInfo.kebabCase} .mg-loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: var(--mg-spacing-xl);
}

/* 로딩 스피너 */
.mg-widget--${widgetInfo.kebabCase} .mg-loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--mg-gray-200);
  border-top: 2px solid var(--mg-primary-500);
  border-radius: 50%;
  animation: mg-spin var(--mg-duration-normal) linear infinite;
  margin-bottom: var(--mg-spacing-sm);
}

/* 에러 컨테이너 */
.mg-widget--${widgetInfo.kebabCase} .mg-error-container {
  padding: var(--mg-spacing-md);
}

/* 에러 알림 */
.mg-widget--${widgetInfo.kebabCase} .mg-alert--error {
  background-color: var(--mg-error-50, #fef2f2);
  border: 1px solid var(--mg-error-200, #fecaca);
  color: var(--mg-error-700, #b91c1c);
  padding: var(--mg-spacing-md);
  border-radius: var(--mg-border-radius-md);
  display: flex;
  align-items: center;
  gap: var(--mg-spacing-sm);
}

/* 통계 그리드 (위젯 내부용) */
.mg-widget--${widgetInfo.kebabCase} .mg-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--mg-spacing-md);
  margin-top: var(--mg-spacing-md);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .mg-widget--${widgetInfo.kebabCase} .mg-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .mg-widget--${widgetInfo.kebabCase} .mg-widget__header,
  .mg-widget--${widgetInfo.kebabCase} .mg-widget__body {
    padding: var(--mg-spacing-sm);
  }
}

/* 다크 모드 지원 */
@media (prefers-color-scheme: dark) {
  .mg-widget--${widgetInfo.kebabCase} {
    --widget-background: var(--mg-gray-800);
    --widget-border: var(--mg-gray-700);
    --widget-shadow: var(--mg-shadow-dark-sm, 0 1px 3px rgba(0, 0, 0, 0.3));
  }
  
  .mg-widget--${widgetInfo.kebabCase} .mg-widget__header {
    background-color: var(--mg-gray-700);
    border-bottom-color: var(--mg-gray-600);
  }
  
  .mg-widget--${widgetInfo.kebabCase} .mg-widget__title {
    color: var(--mg-gray-100);
  }
  
  .mg-widget--${widgetInfo.kebabCase} .mg-widget__subtitle {
    color: var(--mg-gray-300);
  }
}

/* 애니메이션 키프레임 */
@keyframes mg-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 접근성 개선 */
.mg-widget--${widgetInfo.kebabCase}:focus-within {
  outline: 2px solid var(--mg-primary-500);
  outline-offset: 2px;
}

/* 프린트 스타일 */
@media print {
  .mg-widget--${widgetInfo.kebabCase} {
    box-shadow: none;
    border: 1px solid var(--mg-gray-400);
    break-inside: avoid;
  }
}
`;
}

// 테스트 파일 템플릿 생성
function createTestTemplate() {
  return `import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ${widgetInfo.componentName} from './${widgetInfo.fileName}';

// API 모킹
jest.mock('../../../utils/ajax', () => ({
  apiGet: jest.fn()
}));

const { apiGet } = require('../../../utils/ajax');

const renderWidget = (props = {}) => {
  const defaultProps = {
    widget: {
      config: {
        title: 'Test ${widgetInfo.name}',
        subtitle: 'Test subtitle'
      }
    },
    user: {
      id: 1,
      name: 'Test User',
      role: 'ADMIN'
    }
  };

  return render(
    <BrowserRouter>
      <${widgetInfo.componentName} {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('${widgetInfo.componentName}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('위젯이 정상적으로 렌더링된다', () => {
    ${widgetInfo.noApi ? 'renderWidget();' : `apiGet.mockResolvedValue({ data: 'test' });
    renderWidget();`}
    
    expect(screen.getByText('Test ${widgetInfo.name}')).toBeInTheDocument();
  });

  ${!widgetInfo.noApi ? `it('로딩 상태를 표시한다', () => {
    apiGet.mockImplementation(() => new Promise(() => {})); // 무한 대기
    renderWidget();
    
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('API 오류를 처리한다', async () => {
    apiGet.mockRejectedValue(new Error('API Error'));
    renderWidget();
    
    await waitFor(() => {
      expect(screen.getByText(/데이터를 불러올 수 없습니다/)).toBeInTheDocument();
    });
  });

  it('데이터를 성공적으로 로드한다', async () => {
    const mockData = { count: 10, items: [] };
    apiGet.mockResolvedValue(mockData);
    renderWidget();
    
    await waitFor(() => {
      expect(screen.getByText(JSON.stringify(mockData, null, 2))).toBeInTheDocument();
    });
  });` : ''}
});
`;
}

// 스토리북 파일 템플릿 생성
function createStoryTemplate() {
  return `import React from 'react';
import ${widgetInfo.componentName} from './${widgetInfo.fileName}';

export default {
  title: 'Widgets/${widgetInfo.type}/${widgetInfo.name}',
  component: ${widgetInfo.componentName},
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    widget: {
      control: 'object',
    },
    user: {
      control: 'object',
    },
  },
};

const Template = (args) => <${widgetInfo.componentName} {...args} />;

export const Default = Template.bind({});
Default.args = {
  widget: {
    config: {
      title: '${widgetInfo.description}',
      subtitle: '기본 설정'
    }
  },
  user: {
    id: 1,
    name: 'Test User',
    role: 'ADMIN'
  }
};

export const Loading = Template.bind({});
Loading.args = {
  ...Default.args,
  // 로딩 상태는 컴포넌트 내부에서 처리
};

export const Error = Template.bind({});
Error.args = {
  ...Default.args,
  // 에러 상태는 컴포넌트 내부에서 처리
};

export const CustomTitle = Template.bind({});
CustomTitle.args = {
  ...Default.args,
  widget: {
    config: {
      title: '커스텀 제목',
      subtitle: '커스텀 부제목'
    }
  }
};
`;
}

// 파일 생성 함수들
function createWidgetFile() {
  const widgetDir = path.join(__dirname, '..', 'frontend', 'src', 'components', 'dashboard', 'widgets');
  const typeDir = widgetInfo.type === 'common' ? widgetDir : path.join(widgetDir, widgetInfo.type);
  
  // 디렉토리 생성
  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir, { recursive: true });
  }
  
  const filePath = path.join(typeDir, widgetInfo.fileName);
  
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  파일이 이미 존재합니다: ${filePath}`);
    return false;
  }
  
  fs.writeFileSync(filePath, createWidgetTemplate());
  console.log(`✅ 위젯 파일 생성: ${filePath}`);
  return true;
}

function createCssFile() {
  const cssPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'dashboard', 'widgets', 'Widget.css');
  
  if (fs.existsSync(cssPath)) {
    // 기존 CSS 파일에 추가
    const existingCss = fs.readFileSync(cssPath, 'utf8');
    const newCss = createCssTemplate();
    
    if (!existingCss.includes(`widget-${widgetInfo.kebabCase}`)) {
      fs.appendFileSync(cssPath, newCss);
      console.log(`✅ CSS 스타일 추가: ${cssPath}`);
    } else {
      console.log(`⚠️  CSS 스타일이 이미 존재합니다: widget-${widgetInfo.kebabCase}`);
    }
  } else {
    fs.writeFileSync(cssPath, createCssTemplate());
    console.log(`✅ CSS 파일 생성: ${cssPath}`);
  }
}

function createTestFile() {
  const testDir = path.join(__dirname, '..', 'frontend', 'src', 'components', 'dashboard', 'widgets', '__tests__');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testPath = path.join(testDir, `${widgetInfo.componentName}.test.js`);
  
  if (!fs.existsSync(testPath)) {
    fs.writeFileSync(testPath, createTestTemplate());
    console.log(`✅ 테스트 파일 생성: ${testPath}`);
  } else {
    console.log(`⚠️  테스트 파일이 이미 존재합니다: ${testPath}`);
  }
}

function createStoryFile() {
  const storyDir = path.join(__dirname, '..', 'frontend', 'src', 'components', 'dashboard', 'widgets', '__stories__');
  
  if (!fs.existsSync(storyDir)) {
    fs.mkdirSync(storyDir, { recursive: true });
  }
  
  const storyPath = path.join(storyDir, `${widgetInfo.componentName}.stories.js`);
  
  if (!fs.existsSync(storyPath)) {
    fs.writeFileSync(storyPath, createStoryTemplate());
    console.log(`✅ 스토리북 파일 생성: ${storyPath}`);
  } else {
    console.log(`⚠️  스토리북 파일이 이미 존재합니다: ${storyPath}`);
  }
}

function updateWidgetRegistry() {
  const registryPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'dashboard', 'widgets', 'WidgetRegistry.js');
  
  if (!fs.existsSync(registryPath)) {
    console.log(`❌ WidgetRegistry.js 파일을 찾을 수 없습니다: ${registryPath}`);
    return;
  }
  
  let registryContent = fs.readFileSync(registryPath, 'utf8');
  
  // Import 추가
  const importPath = widgetInfo.type === 'common' 
    ? `./${widgetInfo.fileName}` 
    : `./${widgetInfo.type}/${widgetInfo.fileName}`;
  
  const importStatement = `import ${widgetInfo.componentName} from '${importPath}';`;
  
  if (!registryContent.includes(importStatement)) {
    // import 섹션 찾기
    const importSection = registryContent.match(/(\/\/ .*용 위젯.*\n)((?:import.*\n)*)/g);
    if (importSection) {
      const targetSection = widgetInfo.type === 'admin' ? '관리자용 위젯' : '공통 위젯';
      registryContent = registryContent.replace(
        new RegExp(`(// ${targetSection}.*\n)((?:import.*\n)*)`),
        `$1$2${importStatement}\n`
      );
    } else {
      // import 섹션이 없으면 파일 상단에 추가
      registryContent = importStatement + '\n' + registryContent;
    }
  }
  
  // 위젯 등록 추가
  const widgetKey = widgetInfo.kebabCase;
  const registrationLine = `  '${widgetKey}': ${widgetInfo.componentName},`;
  
  if (!registryContent.includes(registrationLine)) {
    const targetObject = widgetInfo.type === 'admin' ? 'ADMIN_WIDGETS' : 'COMMON_WIDGETS';
    
    // 해당 객체 찾아서 추가
    const objectPattern = new RegExp(`(const ${targetObject} = \\{[\\s\\S]*?)(\\};)`, 'm');
    const match = registryContent.match(objectPattern);
    
    if (match) {
      const beforeClosing = match[1];
      const closing = match[2];
      const newContent = beforeClosing + registrationLine + '\n' + closing;
      registryContent = registryContent.replace(objectPattern, newContent);
    }
  }
  
  fs.writeFileSync(registryPath, registryContent);
  console.log(`✅ WidgetRegistry 업데이트 완료`);
}

function generateDocumentation() {
  const docContent = `# ${widgetInfo.componentName}

## 개요
${widgetInfo.description}

## 사용법
\`\`\`javascript
{
  id: 'unique-widget-id',
  type: '${widgetInfo.kebabCase}',
  position: { row: 1, col: 1, colspan: 2, rowspan: 1 },
  config: {
    title: '위젯 제목',
    subtitle: '위젯 부제목'${widgetInfo.apiEndpoint ? `,
    apiEndpoint: '${widgetInfo.apiEndpoint}'` : ''}
  }
}
\`\`\`

## Props
- **widget**: 위젯 설정 정보
- **user**: 현재 사용자 정보

## Config 옵션
- **title**: 위젯 제목 (기본값: '${widgetInfo.description}')
- **subtitle**: 위젯 부제목 (선택사항)${widgetInfo.apiEndpoint ? `
- **apiEndpoint**: API 엔드포인트 (기본값: '${widgetInfo.apiEndpoint}')` : ''}

${widgetInfo.apiEndpoint ? `## API 연동
- **엔드포인트**: \`${widgetInfo.apiEndpoint}\`
- **메서드**: GET
- **응답 형식**: JSON` : ''}

## 스타일링
CSS 클래스: \`.widget-${widgetInfo.kebabCase}\`

## 테스트
\`\`\`bash
npm test -- ${widgetInfo.componentName}.test.js
\`\`\`

## 스토리북
\`\`\`bash
npm run storybook
\`\`\`

## 생성 정보
- **생성일**: ${new Date().toISOString().split('T')[0]}
- **타입**: ${widgetInfo.type}
- **API 사용**: ${!widgetInfo.noApi ? '예' : '아니오'}
`;

  const docPath = path.join(__dirname, '..', 'docs', 'widgets', `${widgetInfo.componentName}.md`);
  const docDir = path.dirname(docPath);
  
  if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir, { recursive: true });
  }
  
  fs.writeFileSync(docPath, docContent);
  console.log(`✅ 문서 생성: ${docPath}`);
}

// 메인 실행
function main() {
  try {
    // 1. 위젯 파일 생성
    if (!createWidgetFile()) {
      console.log('❌ 위젯 생성을 중단합니다.');
      return;
    }
    
    // 2. CSS 스타일 추가
    createCssFile();
    
    // 3. 테스트 파일 생성
    createTestFile();
    
    // 4. 스토리북 파일 생성
    createStoryFile();
    
    // 5. WidgetRegistry 업데이트
    updateWidgetRegistry();
    
    // 6. 문서 생성
    generateDocumentation();
    
    console.log('\n🎉 위젯 생성 완료!');
    console.log('\n📋 다음 단계:');
    console.log('1. 위젯 내용 구현');
    console.log('2. CSS 스타일링');
    console.log('3. 테스트 작성');
    console.log('4. DynamicDashboard 설정에 추가');
    console.log('\n📁 생성된 파일들:');
    console.log(`- frontend/src/components/dashboard/widgets/${widgetInfo.type === 'common' ? '' : widgetInfo.type + '/'}${widgetInfo.fileName}`);
    console.log(`- frontend/src/components/dashboard/widgets/__tests__/${widgetInfo.componentName}.test.js`);
    console.log(`- frontend/src/components/dashboard/widgets/__stories__/${widgetInfo.componentName}.stories.js`);
    console.log(`- docs/widgets/${widgetInfo.componentName}.md`);
    
  } catch (error) {
    console.error('❌ 위젯 생성 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 실행
main();
