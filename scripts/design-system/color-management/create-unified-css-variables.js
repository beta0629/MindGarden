#!/usr/bin/env node

/**
 * 통합 CSS 변수 시스템 생성 도구
 * 
 * 분산된 5개 CSS 변수 파일을 1개의 마스터 파일로 통합
 * CI/BI 변경에 대비한 중앙화된 색상 관리 시스템 구축
 * 
 * @author MindGarden Team
 * @version 1.0.0
 * @since 2025-11-28
 */

const fs = require('fs');
const path = require('path');

// 통합할 CSS 변수 파일들
const CSS_VARIABLE_FILES = [
  'frontend/src/styles/variables.css',
  'frontend/src/styles/css-variables.css',
  'frontend/src/styles/design-system.css',
  'frontend/src/styles/mindgarden-design-system.css',
  'frontend/src/styles/00-core/_variables.css'
];

// JavaScript 상수 파일들
const JS_CONSTANT_FILES = [
  'frontend/src/constants/css-variables.js',
  'frontend/src/constants/cssConstants.js',
  'frontend/src/constants/css/commonStyles.js'
];

class UnifiedCSSVariableCreator {
  constructor() {
    this.unifiedVariables = new Map();
    this.conflicts = [];
    this.statistics = {
      totalFiles: 0,
      totalVariables: 0,
      duplicates: 0,
      conflicts: 0
    };
  }

  /**
   * 메인 실행 함수
   */
  async run() {
    console.log('🔧 통합 CSS 변수 시스템 생성 시작...\n');

    // 1. 기존 CSS 변수 파일들 분석
    await this.analyzeCSSFiles();
    
    // 2. JavaScript 상수 파일들 분석
    await this.analyzeJSFiles();
    
    // 3. 충돌 해결
    await this.resolveConflicts();
    
    // 4. 통합 CSS 변수 파일 생성
    await this.createUnifiedCSSFile();
    
    // 5. 통합 JavaScript 상수 파일 생성
    await this.createUnifiedJSFile();
    
    // 6. 마이그레이션 가이드 생성
    await this.createMigrationGuide();
    
    // 7. 결과 리포트
    this.generateReport();

    console.log('\n✅ 통합 CSS 변수 시스템 생성 완료!');
  }

  /**
   * CSS 파일들 분석
   */
  async analyzeCSSFiles() {
    console.log('📁 CSS 변수 파일 분석 중...');

    for (const filePath of CSS_VARIABLE_FILES) {
      if (fs.existsSync(filePath)) {
        console.log(`  🔍 ${filePath}`);
        await this.parseCSSFile(filePath);
        this.statistics.totalFiles++;
      } else {
        console.log(`  ⚠️  파일 없음: ${filePath}`);
      }
    }
  }

  /**
   * CSS 파일 파싱
   */
  async parseCSSFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const variables = this.extractCSSVariables(content);
      
      variables.forEach(({ name, value, line }) => {
        this.addVariable(name, value, filePath, line, 'css');
      });

    } catch (error) {
      console.error(`❌ CSS 파일 파싱 실패: ${filePath} - ${error.message}`);
    }
  }

  /**
   * CSS 변수 추출
   */
  extractCSSVariables(content) {
    const variables = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // CSS 변수 패턴: --variable-name: value;
      const match = line.match(/^\s*(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/);
      if (match) {
        const [, name, value] = match;
        variables.push({
          name: name.trim(),
          value: value.trim(),
          line: index + 1
        });
      }
    });

    return variables;
  }

  /**
   * JavaScript 파일들 분석
   */
  async analyzeJSFiles() {
    console.log('\n📁 JavaScript 상수 파일 분석 중...');

    for (const filePath of JS_CONSTANT_FILES) {
      if (fs.existsSync(filePath)) {
        console.log(`  🔍 ${filePath}`);
        await this.parseJSFile(filePath);
        this.statistics.totalFiles++;
      } else {
        console.log(`  ⚠️  파일 없음: ${filePath}`);
      }
    }
  }

  /**
   * JavaScript 파일 파싱 (간단한 색상값만 추출)
   */
  async parseJSFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const colorValues = this.extractJSColorValues(content);
      
      colorValues.forEach(({ name, value, line }) => {
        this.addVariable(`--mg-${name.toLowerCase()}`, value, filePath, line, 'js');
      });

    } catch (error) {
      console.error(`❌ JS 파일 파싱 실패: ${filePath} - ${error.message}`);
    }
  }

  /**
   * JavaScript 색상값 추출
   */
  extractJSColorValues(content) {
    const colorValues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // 색상값 패턴: PRIMARY: '#ffffff',
      const match = line.match(/^\s*([A-Z_]+)\s*:\s*['"`]([#a-fA-F0-9]+)['"`]/);
      if (match) {
        const [, name, value] = match;
        colorValues.push({
          name: name.trim(),
          value: value.trim(),
          line: index + 1
        });
      }
    });

    return colorValues;
  }

  /**
   * 변수 추가 (중복 및 충돌 체크)
   */
  addVariable(name, value, source, line, type) {
    this.statistics.totalVariables++;

    if (this.unifiedVariables.has(name)) {
      const existing = this.unifiedVariables.get(name);
      
      if (existing.value !== value) {
        // 충돌 발생
        this.conflicts.push({
          name,
          existing: existing,
          new: { value, source, line, type }
        });
        this.statistics.conflicts++;
      } else {
        // 중복 (같은 값)
        existing.sources.push({ source, line, type });
        this.statistics.duplicates++;
      }
    } else {
      // 새로운 변수
      this.unifiedVariables.set(name, {
        value,
        sources: [{ source, line, type }],
        category: this.categorizeVariable(name)
      });
    }
  }

  /**
   * 변수 카테고리 분류
   */
  categorizeVariable(name) {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('primary')) return 'primary';
    if (lowerName.includes('secondary')) return 'secondary';
    if (lowerName.includes('success') || lowerName.includes('green')) return 'success';
    if (lowerName.includes('error') || lowerName.includes('danger') || lowerName.includes('red')) return 'error';
    if (lowerName.includes('warning') || lowerName.includes('orange') || lowerName.includes('yellow')) return 'warning';
    if (lowerName.includes('info') || lowerName.includes('blue')) return 'info';
    if (lowerName.includes('gray') || lowerName.includes('grey')) return 'gray';
    if (lowerName.includes('text')) return 'text';
    if (lowerName.includes('bg') || lowerName.includes('background')) return 'background';
    if (lowerName.includes('border')) return 'border';
    if (lowerName.includes('shadow')) return 'shadow';
    if (lowerName.includes('spacing') || lowerName.includes('margin') || lowerName.includes('padding')) return 'spacing';
    if (lowerName.includes('font') || lowerName.includes('size')) return 'typography';
    if (lowerName.includes('radius')) return 'border-radius';
    if (lowerName.includes('z-') || lowerName.includes('index')) return 'z-index';
    
    return 'other';
  }

  /**
   * 충돌 해결
   */
  async resolveConflicts() {
    if (this.conflicts.length === 0) {
      console.log('\n✅ 충돌 없음 - 모든 변수가 일관됨');
      return;
    }

    console.log(`\n⚠️  ${this.conflicts.length}개 충돌 발견 - 자동 해결 중...`);

    this.conflicts.forEach(conflict => {
      // 우선순위 기반 자동 해결
      const resolvedValue = this.resolveConflictAutomatically(conflict);
      
      if (resolvedValue) {
        this.unifiedVariables.get(conflict.name).value = resolvedValue.value;
        this.unifiedVariables.get(conflict.name).resolvedFrom = resolvedValue.source;
        
        console.log(`  🔧 ${conflict.name}: ${resolvedValue.value} (from ${resolvedValue.source})`);
      }
    });
  }

  /**
   * 충돌 자동 해결 (우선순위 기반)
   */
  resolveConflictAutomatically(conflict) {
    const { existing, new: newVar } = conflict;
    
    // 우선순위: mindgarden-design-system > design-system > css-variables > variables > others
    const priorityOrder = [
      'mindgarden-design-system.css',
      'design-system.css', 
      'css-variables.css',
      'variables.css'
    ];

    const existingPriority = this.getFilePriority(existing.sources[0].source, priorityOrder);
    const newPriority = this.getFilePriority(newVar.source, priorityOrder);

    if (existingPriority <= newPriority) {
      return existing;
    } else {
      return newVar;
    }
  }

  /**
   * 파일 우선순위 계산
   */
  getFilePriority(filePath, priorityOrder) {
    const fileName = path.basename(filePath);
    const index = priorityOrder.findIndex(priority => fileName.includes(priority));
    return index === -1 ? 999 : index;
  }

  /**
   * 통합 CSS 파일 생성
   */
  async createUnifiedCSSFile() {
    console.log('\n🎨 통합 CSS 변수 파일 생성 중...');

    const outputPath = 'frontend/src/styles/unified-design-tokens.css';
    
    let cssContent = `/**
 * MindGarden 통합 디자인 토큰
 * 
 * CI/BI 변경 대비 중앙화된 색상 관리 시스템
 * 모든 하드코딩된 색상값을 이 파일에서 관리
 * 
 * 생성일: ${new Date().toISOString()}
 * 자동 생성: scripts/create-unified-css-variables.js
 * 
 * ⚠️ 이 파일을 직접 수정하지 마세요.
 * ⚠️ CI/BI 변경 시 이 파일의 색상값만 수정하면 전체 시스템에 적용됩니다.
 */

:root {
`;

    // 카테고리별로 정렬하여 출력
    const categories = this.groupVariablesByCategory();
    
    Object.entries(categories).forEach(([category, variables]) => {
      cssContent += `\n  /* ===== ${category.toUpperCase()} ===== */\n`;
      
      variables.forEach(([name, data]) => {
        cssContent += `  ${name}: ${data.value};\n`;
      });
    });

    cssContent += `\n}

/* ===== 호환성 별칭 (Deprecated) ===== */
/* 기존 코드와의 호환성을 위한 별칭들 - 점진적으로 제거 예정 */

:root {
  /* iOS 색상 별칭 */
  --ios-blue: var(--mg-primary-500);
  --ios-green: var(--mg-success-500);
  --ios-red: var(--mg-error-500);
  --ios-orange: var(--mg-warning-500);
  
  /* 기존 색상 별칭 */
  --color-primary: var(--mg-primary-500);
  --color-secondary: var(--mg-secondary-500);
  --color-success: var(--mg-success-500);
  --color-danger: var(--mg-error-500);
  --color-warning: var(--mg-warning-500);
  --color-info: var(--mg-info-500);
  
  /* 텍스트 색상 별칭 */
  --text-primary: var(--mg-text-primary);
  --text-secondary: var(--mg-text-secondary);
  
  /* 배경 색상 별칭 */
  --bg-primary: var(--mg-bg-primary);
  --bg-secondary: var(--mg-bg-secondary);
}
`;

    fs.writeFileSync(outputPath, cssContent);
    console.log(`✅ 통합 CSS 파일 생성: ${outputPath}`);
  }

  /**
   * 카테고리별 변수 그룹화
   */
  groupVariablesByCategory() {
    const categories = {};
    
    this.unifiedVariables.forEach((data, name) => {
      const category = data.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push([name, data]);
    });

    // 카테고리 정렬
    const sortedCategories = {};
    const categoryOrder = [
      'primary', 'secondary', 'success', 'error', 'warning', 'info',
      'gray', 'text', 'background', 'border', 'shadow',
      'spacing', 'typography', 'border-radius', 'z-index', 'other'
    ];

    categoryOrder.forEach(category => {
      if (categories[category]) {
        sortedCategories[category] = categories[category].sort();
      }
    });

    return sortedCategories;
  }

  /**
   * 통합 JavaScript 상수 파일 생성
   */
  async createUnifiedJSFile() {
    console.log('🔧 통합 JavaScript 상수 파일 생성 중...');

    const outputPath = 'frontend/src/constants/unifiedDesignTokens.js';
    
    let jsContent = `/**
 * MindGarden 통합 디자인 토큰 (JavaScript)
 * 
 * CSS 변수와 연동되는 JavaScript 상수들
 * 
 * 생성일: ${new Date().toISOString()}
 * 자동 생성: scripts/create-unified-css-variables.js
 * 
 * ⚠️ 이 파일을 직접 수정하지 마세요.
 */

// CSS 변수 참조 객체
export const MG_DESIGN_TOKENS = {
  // 색상 시스템
  COLORS: {
`;

    const categories = this.groupVariablesByCategory();
    
    // 색상 관련 카테고리만 JavaScript 상수로 변환
    const colorCategories = ['primary', 'secondary', 'success', 'error', 'warning', 'info', 'gray'];
    
    colorCategories.forEach(category => {
      if (categories[category]) {
        jsContent += `    // ${category.toUpperCase()}\n`;
        categories[category].forEach(([name, data]) => {
          const jsName = name.replace('--mg-', '').replace(/-/g, '_').toUpperCase();
          jsContent += `    ${jsName}: 'var(${name})',\n`;
        });
        jsContent += '\n';
      }
    });

    jsContent += `  },
  
  // CSS 클래스 생성 헬퍼
  CSS_CLASSES: {
    // 색상 클래스 생성
    getBgClass: (color) => \`mg-bg-\${color}\`,
    getTextClass: (color) => \`mg-text-\${color}\`,
    getBorderClass: (color) => \`mg-border-\${color}\`,
  },
  
  // 유틸리티 함수
  UTILS: {
    // CSS 변수 값 가져오기
    getCSSVariable: (name) => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(name).trim();
    },
    
    // CSS 변수 설정
    setCSSVariable: (name, value) => {
      document.documentElement.style.setProperty(name, value);
    }
  }
};

// 호환성을 위한 기존 상수들 (Deprecated)
export const COLORS = {
  PRIMARY: 'var(--mg-primary-500)',
  SECONDARY: 'var(--mg-secondary-500)',
  SUCCESS: 'var(--mg-success-500)',
  ERROR: 'var(--mg-error-500)',
  WARNING: 'var(--mg-warning-500)',
  INFO: 'var(--mg-info-500)'
};

export default MG_DESIGN_TOKENS;
`;

    fs.writeFileSync(outputPath, jsContent);
    console.log(`✅ 통합 JavaScript 파일 생성: ${outputPath}`);
  }

  /**
   * 마이그레이션 가이드 생성
   */
  async createMigrationGuide() {
    console.log('📋 마이그레이션 가이드 생성 중...');

    const guidePath = 'docs/CSS_VARIABLES_MIGRATION_GUIDE.md';
    
    let guide = `# 🔄 CSS 변수 마이그레이션 가이드

> **생성일**: ${new Date().toISOString()}  
> **목적**: 분산된 CSS 변수를 통합 시스템으로 마이그레이션

---

## 📊 마이그레이션 현황

| 구분 | 수량 |
|------|------|
| 분석된 파일 | ${this.statistics.totalFiles}개 |
| 총 변수 | ${this.statistics.totalVariables}개 |
| 중복 변수 | ${this.statistics.duplicates}개 |
| 충돌 변수 | ${this.statistics.conflicts}개 |

---

## 🎯 새로운 통합 시스템

### 1. 통합 CSS 파일
\`\`\`css
/* frontend/src/styles/unified-design-tokens.css */
:root {
  --mg-primary-500: #3b82f6;
  --mg-success-500: #10b981;
  /* ... 모든 색상 변수 */
}
\`\`\`

### 2. 통합 JavaScript 상수
\`\`\`javascript
// frontend/src/constants/unifiedDesignTokens.js
export const MG_DESIGN_TOKENS = {
  COLORS: {
    PRIMARY_500: 'var(--mg-primary-500)',
    SUCCESS_500: 'var(--mg-success-500)',
    // ...
  }
};
\`\`\`

---

## 🔄 마이그레이션 단계

### Phase 1: 새로운 시스템 적용
\`\`\`bash
# 1. 통합 CSS 파일 import 추가
# frontend/src/index.css 또는 App.css에 추가:
@import './styles/unified-design-tokens.css';

# 2. 기존 CSS 변수 파일들 deprecated 처리
# (아직 삭제하지 말고 주석 처리)
\`\`\`

### Phase 2: 기존 파일 교체
\`\`\`bash
# 기존 CSS 변수 파일들을 점진적으로 교체
node scripts/replace-css-imports.js
\`\`\`

### Phase 3: 검증 및 정리
\`\`\`bash
# 1. 전체 시스템 빌드 테스트
npm run build

# 2. 시각적 회귀 테스트
npm run test:visual

# 3. 사용되지 않는 파일 제거
node scripts/cleanup-old-css-files.js
\`\`\`

---

## 📋 변경 사항 요약

### 기존 → 새로운 변수명 매핑

| 기존 변수명 | 새로운 변수명 | 비고 |
|-------------|---------------|------|`;

    // 변수 매핑 테이블 생성
    this.unifiedVariables.forEach((data, name) => {
      if (data.sources.length > 1) {
        const oldNames = data.sources.map(s => `\`${name}\``).join(', ');
        guide += `\n| ${oldNames} | \`${name}\` | 통합됨 |`;
      }
    });

    guide += `

---

## 🚨 충돌 해결 내역

${this.conflicts.length > 0 ? 
  this.conflicts.map(conflict => 
    `- **${conflict.name}**: \`${conflict.existing.value}\` vs \`${conflict.new.value}\` → 해결됨`
  ).join('\n') :
  '충돌 없음 ✅'
}

---

## 🎯 CI/BI 적용 준비

### 색상 변경 시 수정할 파일
1. **\`frontend/src/styles/unified-design-tokens.css\`** - 메인 색상 정의
2. 끝! (다른 파일은 수정 불필요)

### CI/BI 색상 적용 예시
\`\`\`css
:root {
  /* 새로운 브랜드 색상으로 변경 */
  --mg-primary-500: #NEW_BRAND_COLOR;
  --mg-secondary-500: #NEW_SECONDARY_COLOR;
  /* 전체 시스템에 자동 적용됨 */
}
\`\`\`

---

## 📝 다음 단계

1. **통합 시스템 테스트**: \`npm run build && npm run test\`
2. **시각적 검증**: 모든 페이지가 기존과 동일하게 표시되는지 확인
3. **기존 파일 정리**: 사용되지 않는 CSS 변수 파일들 제거
4. **CI/BI 준비 완료**: 새로운 브랜드 색상 적용 준비

**💡 이제 CI/BI 변경 시 1개 파일만 수정하면 전체 시스템에 적용됩니다!**
`;

    fs.writeFileSync(guidePath, guide);
    console.log(`✅ 마이그레이션 가이드 생성: ${guidePath}`);
  }

  /**
   * 결과 리포트 생성
   */
  generateReport() {
    console.log('\n📊 통합 CSS 변수 시스템 생성 결과');
    console.log('='.repeat(50));
    
    console.log(`📁 분석된 파일: ${this.statistics.totalFiles}개`);
    console.log(`🎨 총 변수: ${this.statistics.totalVariables}개`);
    console.log(`🔄 통합된 변수: ${this.unifiedVariables.size}개`);
    console.log(`📋 중복 제거: ${this.statistics.duplicates}개`);
    console.log(`⚠️  해결된 충돌: ${this.statistics.conflicts}개`);

    console.log('\n📁 생성된 파일:');
    console.log('  - frontend/src/styles/unified-design-tokens.css');
    console.log('  - frontend/src/constants/unifiedDesignTokens.js');
    console.log('  - docs/CSS_VARIABLES_MIGRATION_GUIDE.md');

    console.log('\n🎯 다음 실행할 스크립트:');
    console.log('  1. node scripts/convert-hardcoded-colors.js');
    console.log('  2. npm run build (테스트)');
    console.log('  3. node scripts/cleanup-old-css-files.js');
  }
}

// 스크립트 실행
if (require.main === module) {
  const creator = new UnifiedCSSVariableCreator();
  creator.run().catch(console.error);
}

module.exports = UnifiedCSSVariableCreator;
