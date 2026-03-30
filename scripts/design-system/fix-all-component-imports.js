#!/usr/bin/env node

/**
 * 모든 컴포넌트 Import 경로 수정 스크립트
 * 
 * 통합된 컴포넌트들의 경로를 새로운 표준 경로로 일괄 변경
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

// 로그 함수들
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`)
};

// 컴포넌트 경로 매핑
const COMPONENT_PATH_MAPPING = {
  // 통합된 컴포넌트들
  'MGButton': { from: '../components/common/MGButton', to: '../components/ui', named: 'Button' },
  'MGCard': { from: '../components/common/MGCard', to: '../components/ui', named: 'Card' },
  'UnifiedModal': { from: '../components/common/modals/UnifiedModal', to: '../components/ui', named: 'Modal' },
  'UnifiedLoading': { from: '../components/common/UnifiedLoading', to: '../components/ui', named: 'Loading' },
  'UnifiedHeader': { from: '../components/common/UnifiedHeader', to: '../components/layout', named: 'Header' },
  
  // 상대 경로 변형들
  'common/MGButton': { from: 'common/MGButton', to: 'ui', named: 'Button' },
  'common/MGCard': { from: 'common/MGCard', to: 'ui', named: 'Card' },
  'common/modals/UnifiedModal': { from: 'common/modals/UnifiedModal', to: 'ui', named: 'Modal' },
  'common/UnifiedLoading': { from: 'common/UnifiedLoading', to: 'ui', named: 'Loading' },
  'common/UnifiedHeader': { from: 'common/UnifiedHeader', to: 'layout', named: 'Header' },
  
  // 절대 경로 변형들
  './MGButton': { from: './MGButton', to: '../ui', named: 'Button' },
  './MGCard': { from: './MGCard', to: '../ui', named: 'Card' },
  './UnifiedModal': { from: './UnifiedModal', to: '../ui', named: 'Modal' },
  './UnifiedLoading': { from: './UnifiedLoading', to: '../ui', named: 'Loading' },
  './UnifiedHeader': { from: './UnifiedHeader', to: '../layout', named: 'Header' }
};

/**
 * 모든 컴포넌트 Import 경로 수정
 */
async function fixAllComponentImports() {
  console.log('🔧 모든 컴포넌트 Import 경로 수정 시작...');
  
  // 모든 JS/JSX 파일 검색
  const files = glob.sync('**/*.{js,jsx}', { 
    cwd: FRONTEND_PATH,
    ignore: ['**/*.backup.*', '**/node_modules/**', '**/build/**']
  });
  
  let fixedFiles = 0;
  let totalFixes = 0;
  
  for (const file of files) {
    const filePath = path.join(FRONTEND_PATH, file);
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      let fileFixCount = 0;
      
      // 각 컴포넌트 매핑에 대해 검사 및 수정
      for (const [componentName, mapping] of Object.entries(COMPONENT_PATH_MAPPING)) {
        // 기본 import 패턴
        const defaultImportPattern = new RegExp(
          `import\\s+${componentName}\\s+from\\s+['"]([^'"]*${escapeRegExp(mapping.from)})['"]\s*;?`,
          'g'
        );
        
        // Named import 패턴
        const namedImportPattern = new RegExp(
          `import\\s*\\{[^}]*${componentName}[^}]*\\}\\s*from\\s+['"]([^'"]*${escapeRegExp(mapping.from)})['"]\s*;?`,
          'g'
        );
        
        // 기본 import 수정
        if (defaultImportPattern.test(content)) {
          content = content.replace(defaultImportPattern, 
            `import { ${mapping.named} as ${componentName} } from '${mapping.to}';`
          );
          modified = true;
          fileFixCount++;
        }
        
        // Named import 수정
        if (namedImportPattern.test(content)) {
          content = content.replace(namedImportPattern, 
            `import { ${mapping.named} as ${componentName} } from '${mapping.to}';`
          );
          modified = true;
          fileFixCount++;
        }
        
        // 더 일반적인 패턴들
        const generalPatterns = [
          new RegExp(`from\\s+['"]([^'"]*/${escapeRegExp(mapping.from)})['"]\s*;?`, 'g'),
          new RegExp(`from\\s+['"]([^'"]*${escapeRegExp(mapping.from)})['"]\s*;?`, 'g')
        ];
        
        for (const pattern of generalPatterns) {
          if (pattern.test(content)) {
            content = content.replace(pattern, `from '${mapping.to}';`);
            modified = true;
            fileFixCount++;
          }
        }
      }
      
      // 파일이 수정되었으면 저장
      if (modified) {
        // 백업 생성
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        
        // 수정된 내용 저장
        fs.writeFileSync(filePath, content);
        fixedFiles++;
        totalFixes += fileFixCount;
        
        log.success(`✓ ${file} - ${fileFixCount}개 import 수정`);
      }
      
    } catch (error) {
      log.error(`${file} 처리 실패: ${error.message}`);
    }
  }
  
  console.log('');
  log.success(`✅ 컴포넌트 Import 경로 수정 완료:`);
  log.info(`   📁 수정된 파일: ${fixedFiles}개`);
  log.info(`   🔧 총 수정 사항: ${totalFixes}개`);
}

/**
 * 정규식 이스케이프
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 스크립트 실행
if (require.main === module) {
  fixAllComponentImports().catch(error => {
    log.error(`실행 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { fixAllComponentImports };
