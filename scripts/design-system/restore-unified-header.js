#!/usr/bin/env node

/**
 * UnifiedHeader 원본 복원 스크립트
 * 
 * 임의로 변경한 UnifiedHeader를 원본으로 복원
 * 
 * @author MindGarden Team
 * @version 1.0.0
 * @since 2025-11-28
 */

const fs = require('fs');
const path = require('path');

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
 * UnifiedHeader 원본 복원
 */
async function restoreUnifiedHeader() {
  console.log('🔄 UnifiedHeader 원본 복원 시작...');
  
  // 수정할 파일 목록
  const files = [
    'components/auth/BranchLogin.js',
    'components/auth/BranchSpecificLogin.js', 
    'components/auth/HeadquartersLogin.js',
    'components/auth/ResetPassword.js',
    'pages/IPhone17TemplateExample.js',
    'pages/iPhone17DesignSystemSample.js',
    'App.js'
  ];
  
  for (const file of files) {
    try {
      const filePath = path.join(FRONTEND_PATH, file);
      if (!fs.existsSync(filePath)) {
        log.info(`파일 없음: ${file}`);
        continue;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // 주석 처리된 UnifiedHeader import 복원
      if (content.includes('// import UnifiedHeader')) {
        content = content.replace(
          /\/\/ import UnifiedHeader from [^;]+;[^\n]*\n?/g,
          'import UnifiedHeader from "../common/UnifiedHeader";\n'
        );
        modified = true;
      }
      
      // 간단한 헤더를 UnifiedHeader로 복원
      if (content.includes('simple-header')) {
        content = content.replace(
          /<header className="simple-header">[\s\S]*?<\/header>/g,
          '<UnifiedHeader />'
        );
        modified = true;
      }
      
      if (modified) {
        // 백업 생성
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        
        // 수정된 내용 저장
        fs.writeFileSync(filePath, content);
        log.success(`✓ ${file} - UnifiedHeader 복원`);
      } else {
        log.info(`- ${file} - 수정할 내용 없음`);
      }
      
    } catch (error) {
      log.error(`${file} 처리 실패: ${error.message}`);
    }
  }
  
  console.log('');
  log.success(`🔄 UnifiedHeader 원본 복원 완료!`);
}

// 스크립트 실행
if (require.main === module) {
  restoreUnifiedHeader().catch(error => {
    log.error(`실행 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { restoreUnifiedHeader };
