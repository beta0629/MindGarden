#!/usr/bin/env node

/**
 * 잘못된 'ui' import 경로 수정 스크립트
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
  error: (msg) => console.log(`❌ ${msg}`)
};

/**
 * 잘못된 ui import 수정
 */
async function fixUIImports() {
  console.log('🔧 잘못된 ui import 경로 수정 시작...');
  
  // 모든 JS/JSX 파일 검색
  const files = glob.sync('**/*.{js,jsx}', { 
    cwd: FRONTEND_PATH,
    ignore: ['**/*.backup.*', '**/node_modules/**', '**/build/**']
  });
  
  let fixedFiles = 0;
  
  for (const file of files) {
    const filePath = path.join(FRONTEND_PATH, file);
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // 잘못된 'ui' import들 제거
      const badImports = [
        /import\s+[^}]+\s+from\s+['"]ui['"];?\s*\n?/g,
        /import\s*\{[^}]*\}\s*from\s+['"]ui['"];?\s*\n?/g,
        /import\s+\w+\s+from\s+['"]ui['"];?\s*\n?/g
      ];
      
      for (const pattern of badImports) {
        if (pattern.test(content)) {
          content = content.replace(pattern, '');
          modified = true;
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
        
        log.success(`✓ ${file} - 잘못된 ui import 제거`);
      }
      
    } catch (error) {
      log.error(`${file} 처리 실패: ${error.message}`);
    }
  }
  
  console.log('');
  log.success(`✅ 잘못된 ui import 수정 완료: ${fixedFiles}개 파일`);
}

// 스크립트 실행
if (require.main === module) {
  fixUIImports().catch(error => {
    log.error(`실행 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { fixUIImports };
