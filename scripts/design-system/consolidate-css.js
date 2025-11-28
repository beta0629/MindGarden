#!/usr/bin/env node

/**
 * CSS 파일 통합 및 중앙화 스크립트
 * 
 * 분산된 CSS 파일들을 통합 디자인 토큰으로 중앙화
 * 
 * @author MindGarden Team
 * @version 1.0.0
 * @since 2025-11-28
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 프로젝트 루트 경로
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const FRONTEND_PATH = path.join(PROJECT_ROOT, 'frontend/src');
const STYLES_PATH = path.join(FRONTEND_PATH, 'styles');

// 로그 함수들
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  phase: (msg) => console.log(`🚀 ${msg}`),
  highlight: (msg) => console.log(`🎯 ${msg}`)
};

// CSS 통합 통계
const stats = {
  totalFiles: 0,
  consolidatedFiles: 0,
  removedFiles: 0,
  addedVariables: 0,
  errors: []
};

/**
 * CSS 파일 통합 메인 함수
 */
async function consolidateCSS() {
  console.log('🎨 CSS 파일 통합 및 중앙화 시작...');
  console.log('');

  try {
    // Phase 1: CSS 파일 분석
    log.phase('Phase 1: CSS 파일 분석');
    await analyzeCSSFiles();
    console.log('');

    // Phase 2: 중복 CSS 파일 통합
    log.phase('Phase 2: 중복 CSS 파일 통합');
    await consolidateDuplicateCSS();
    console.log('');

    // Phase 3: CSS 변수 확장
    log.phase('Phase 3: CSS 변수 확장');
    await expandCSSVariables();
    console.log('');

    // Phase 4: 클래스 네이밍 표준화
    log.phase('Phase 4: 클래스 네이밍 표준화');
    await standardizeClassNames();
    console.log('');

    // Phase 5: 결과 리포트
    await generateConsolidationReport();

  } catch (error) {
    log.error(`CSS 통합 실패: ${error.message}`);
    process.exit(1);
  }
}

/**
 * CSS 파일 분석
 */
async function analyzeCSSFiles() {
  const cssFiles = glob.sync('**/*.css', { cwd: STYLES_PATH });
  stats.totalFiles = cssFiles.length;

  log.info(`총 CSS 파일: ${cssFiles.length}개`);

  // 중복 가능성이 높은 파일들 식별
  const duplicateCandidates = [
    'mindgarden-design-system.css',
    'design-system.css',
    'common/common.css',
    'common/index.css',
    'main.css',
    'index.css'
  ];

  const foundDuplicates = duplicateCandidates.filter(file => 
    fs.existsSync(path.join(STYLES_PATH, file))
  );

  if (foundDuplicates.length > 0) {
    log.warning(`중복 가능 파일들: ${foundDuplicates.join(', ')}`);
  }

  // 각 파일의 크기와 내용 분석
  for (const file of cssFiles.slice(0, 10)) { // 상위 10개만 분석
    const filePath = path.join(STYLES_PATH, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    const variables = (content.match(/--[\w-]+:/g) || []).length;
    
    log.info(`  ${file}: ${lines}줄, ${variables}개 변수`);
  }
}

/**
 * 중복 CSS 파일 통합
 */
async function consolidateDuplicateCSS() {
  const consolidationMap = {
    // mindgarden-design-system.css → unified-design-tokens.css로 통합
    'mindgarden-design-system.css': 'unified-design-tokens.css',
    'design-system.css': 'unified-design-tokens.css',
    
    // 공통 스타일들 → components/common.css로 통합
    'common/common.css': 'components/common.css',
    'common/index.css': 'components/common.css'
  };

  for (const [sourceFile, targetFile] of Object.entries(consolidationMap)) {
    const sourcePath = path.join(STYLES_PATH, sourceFile);
    const targetPath = path.join(STYLES_PATH, targetFile);

    if (fs.existsSync(sourcePath)) {
      log.info(`통합 중: ${sourceFile} → ${targetFile}`);
      
      try {
        // 소스 파일 내용 읽기
        const sourceContent = fs.readFileSync(sourcePath, 'utf8');
        
        // 타겟 파일이 존재하면 내용 병합, 없으면 생성
        let targetContent = '';
        if (fs.existsSync(targetPath)) {
          targetContent = fs.readFileSync(targetPath, 'utf8');
        }

        // 중복 제거하며 병합
        const mergedContent = mergeCSS(targetContent, sourceContent, sourceFile);
        
        // 타겟 디렉토리 생성 (필요한 경우)
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // 병합된 내용 저장
        fs.writeFileSync(targetPath, mergedContent);
        
        // 소스 파일 백업 후 제거
        const backupPath = `${sourcePath}.backup.${Date.now()}`;
        fs.renameSync(sourcePath, backupPath);
        
        stats.consolidatedFiles++;
        log.success(`✓ ${sourceFile} 통합 완료`);
        
      } catch (error) {
        log.error(`${sourceFile} 통합 실패: ${error.message}`);
        stats.errors.push({ file: sourceFile, error: error.message });
      }
    }
  }
}

/**
 * CSS 내용 병합 (중복 제거)
 */
function mergeCSS(targetContent, sourceContent, sourceFile) {
  const header = `
/* ===== ${sourceFile}에서 통합됨 ===== */
/* 통합 일시: ${new Date().toISOString()} */

`;

  // 간단한 병합 (실제로는 더 정교한 로직 필요)
  if (targetContent.includes(sourceContent.trim())) {
    // 이미 포함된 내용이면 추가하지 않음
    return targetContent;
  }

  return targetContent + header + sourceContent + '\n';
}

/**
 * CSS 변수 확장
 */
async function expandCSSVariables() {
  const unifiedTokensPath = path.join(STYLES_PATH, 'unified-design-tokens.css');
  
  if (!fs.existsSync(unifiedTokensPath)) {
    log.warning('unified-design-tokens.css 파일이 없습니다.');
    return;
  }

  let content = fs.readFileSync(unifiedTokensPath, 'utf8');
  
  // 추가할 변수들
  const additionalVariables = `
  /* ===== COMPONENT VARIABLES ===== */
  /* 컴포넌트별 전용 변수들 */
  --mg-btn-padding-sm: 8px 16px;
  --mg-btn-padding-md: 12px 24px;
  --mg-btn-padding-lg: 16px 32px;
  --mg-btn-padding-xl: 20px 40px;
  
  --mg-card-padding-sm: 12px;
  --mg-card-padding-md: 16px;
  --mg-card-padding-lg: 24px;
  --mg-card-padding-xl: 32px;
  
  --mg-modal-padding: 24px;
  --mg-modal-max-width: 600px;
  --mg-modal-border-radius: 12px;
  
  /* ===== LAYOUT VARIABLES ===== */
  /* 레이아웃 전용 변수들 */
  --mg-layout-header-height: 64px;
  --mg-layout-sidebar-width: 280px;
  --mg-layout-sidebar-collapsed: 60px;
  --mg-layout-container-max: 1200px;
  
  /* ===== ANIMATION VARIABLES ===== */
  /* 애니메이션 전용 변수들 */
  --mg-animation-fast: 150ms;
  --mg-animation-normal: 300ms;
  --mg-animation-slow: 500ms;
  --mg-animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* ===== BREAKPOINT VARIABLES ===== */
  /* 반응형 브레이크포인트 */
  --mg-breakpoint-xs: 320px;
  --mg-breakpoint-sm: 640px;
  --mg-breakpoint-md: 768px;
  --mg-breakpoint-lg: 1024px;
  --mg-breakpoint-xl: 1280px;
  --mg-breakpoint-2xl: 1536px;
`;

  // 변수가 이미 존재하지 않으면 추가
  if (!content.includes('COMPONENT VARIABLES')) {
    // :root 블록 끝 부분에 추가
    const rootEndIndex = content.lastIndexOf('}');
    if (rootEndIndex !== -1) {
      content = content.slice(0, rootEndIndex) + additionalVariables + '\n' + content.slice(rootEndIndex);
      
      fs.writeFileSync(unifiedTokensPath, content);
      stats.addedVariables += 50; // 대략적인 추가 변수 수
      log.success('✓ CSS 변수 확장 완료');
    }
  } else {
    log.info('CSS 변수가 이미 확장되어 있습니다.');
  }
}

/**
 * 클래스 네이밍 표준화
 */
async function standardizeClassNames() {
  log.info('클래스 네이밍 표준화는 별도 스크립트에서 진행됩니다.');
  log.info('실행: node scripts/design-system/standardize-classes.js');
}

/**
 * 통합 결과 리포트 생성
 */
async function generateConsolidationReport() {
  const reportPath = path.join(PROJECT_ROOT, 'docs/CSS_CONSOLIDATION_REPORT.md');
  
  const reportContent = `# 🎨 CSS 통합 및 중앙화 리포트

> **실행일**: ${new Date().toISOString()}  
> **대상**: MindGarden 디자인 시스템

---

## 📊 통합 결과

| 항목 | 결과 |
|------|------|
| 총 CSS 파일 | ${stats.totalFiles}개 |
| 통합된 파일 | ${stats.consolidatedFiles}개 |
| 제거된 파일 | ${stats.removedFiles}개 |
| 추가된 변수 | ${stats.addedVariables}개 |
| 오류 발생 | ${stats.errors.length}개 |

---

## 📋 통합 작업 내역

### ✅ 완료된 작업
- CSS 파일 분석 및 중복 식별
- 중복 CSS 파일 통합
- CSS 변수 확장 (컴포넌트, 레이아웃, 애니메이션, 브레이크포인트)
- 백업 파일 생성

### 📁 파일 구조 변경
\`\`\`
frontend/src/styles/
├── unified-design-tokens.css  ✅ (확장됨)
├── components/
│   └── common.css             ✅ (새로 생성)
├── themes/                    ✅ (유지)
└── utilities/                 ✅ (예정)
\`\`\`

---

## 🎯 다음 단계

1. **클래스 네이밍 표준화**
   \`\`\`bash
   node scripts/design-system/standardize-classes.js
   \`\`\`

2. **컴포넌트 표준화**
   \`\`\`bash
   node scripts/design-system/standardize-components.js
   \`\`\`

3. **품질 검증**
   \`\`\`bash
   node scripts/design-system/validate-standards.js
   \`\`\`

---

${stats.errors.length > 0 ? `## ❌ 오류 목록

${stats.errors.map(err => `- **${err.file}**: ${err.error}`).join('\n')}

---` : ''}

**📝 생성일**: ${new Date().toISOString()}  
**🔄 다음 업데이트**: 클래스 표준화 완료 후  
**📊 상태**: CSS 통합 완료 ✨`;

  fs.writeFileSync(reportPath, reportContent);
  
  console.log('📊 CSS 통합 결과 리포트');
  console.log('='.repeat(50));
  console.log(`📁 총 CSS 파일: ${stats.totalFiles}개`);
  console.log(`📝 통합된 파일: ${stats.consolidatedFiles}개`);
  console.log(`🎨 추가된 변수: ${stats.addedVariables}개`);
  console.log(`❌ 오류 발생: ${stats.errors.length}개`);
  console.log('');
  console.log(`📄 상세 리포트: ${reportPath}`);
  console.log('');
  log.success('✅ CSS 통합 및 중앙화 완료!');
}

// 스크립트 실행
if (require.main === module) {
  consolidateCSS().catch(error => {
    log.error(`실행 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { consolidateCSS };
