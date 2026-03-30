#!/usr/bin/env node

/**
 * CSS Import 경로 수정 스크립트
 * 
 * mindgarden-design-system.css → unified-design-tokens.css로 변경
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

/**
 * CSS Import 경로 수정
 */
async function fixCSSImports() {
  console.log('🔧 CSS Import 경로 수정 시작...');
  
  // 모든 JS/JSX 파일 검색
  const files = glob.sync('**/*.{js,jsx}', { 
    cwd: FRONTEND_PATH,
    ignore: ['**/*.backup.*']
  });
  
  let fixedFiles = 0;
  
  for (const file of files) {
    const filePath = path.join(FRONTEND_PATH, file);
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // mindgarden-design-system.css → unified-design-tokens.css 변경
      const oldImport = /import\s+['"](.*?)mindgarden-design-system\.css['"];?/g;
      
      if (oldImport.test(content)) {
        content = content.replace(
          /import\s+['"](.*?)mindgarden-design-system\.css['"];?/g,
          "import '$1unified-design-tokens.css';"
        );
        
        // 백업 생성
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        
        // 수정된 내용 저장
        fs.writeFileSync(filePath, content);
        fixedFiles++;
        
        log.success(`✓ ${file} - CSS import 경로 수정`);
      }
      
    } catch (error) {
      log.error(`${file} 처리 실패: ${error.message}`);
    }
  }
  
  console.log('');
  log.success(`✅ CSS Import 경로 수정 완료: ${fixedFiles}개 파일`);
}

// 스크립트 실행
if (require.main === module) {
  fixCSSImports().catch(error => {
    log.error(`실행 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { fixCSSImports };
