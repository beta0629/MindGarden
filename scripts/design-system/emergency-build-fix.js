#!/usr/bin/env node

/**
 * 긴급 빌드 수정 스크립트
 * 
 * 빌드를 막는 핵심 오류들만 빠르게 수정
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
 * 긴급 빌드 수정
 */
async function emergencyBuildFix() {
  console.log('🚨 긴급 빌드 수정 시작...');
  
  // 1. AcademyRegister.js의 Card 사용 제거
  try {
    const academyRegisterPath = path.join(FRONTEND_PATH, 'components/academy/AcademyRegister.js');
    let content = fs.readFileSync(academyRegisterPath, 'utf8');
    
    // Card 컴포넌트 사용을 div로 변경
    content = content.replace(/<Card([^>]*)>/g, '<div className="mg-card"$1>');
    content = content.replace(/<\/Card>/g, '</div>');
    
    fs.writeFileSync(academyRegisterPath, content);
    log.success('✓ AcademyRegister.js Card 사용 제거');
  } catch (error) {
    log.error(`AcademyRegister.js 수정 실패: ${error.message}`);
  }
  
  // 2. 모든 academy 파일의 잘못된 import 제거
  const academyFiles = [
    'ClassForm.js', 'ClassList.js', 'CourseForm.js', 'CourseList.js', 
    'EnrollmentForm.js', 'EnrollmentList.js'
  ];
  
  for (const file of academyFiles) {
    try {
      const filePath = path.join(FRONTEND_PATH, 'components/academy', file);
      if (!fs.existsSync(filePath)) continue;
      
      let content = fs.readFileSync(filePath, 'utf8');
      
      // 잘못된 import 제거
      content = content.replace(/import\s+Card\s+from\s+['"][^'"]*ui\/Card\/Card['"];?\s*\n?/g, '');
      content = content.replace(/import\s+[^}]+\s+from\s+['"]ui['"];?\s*\n?/g, '');
      
      // Card 사용을 div로 변경
      content = content.replace(/<Card([^>]*)>/g, '<div className="mg-card"$1>');
      content = content.replace(/<\/Card>/g, '</div>');
      
      fs.writeFileSync(filePath, content);
      log.success(`✓ ${file} 수정 완료`);
    } catch (error) {
      log.error(`${file} 수정 실패: ${error.message}`);
    }
  }
  
  // 3. 모든 파일에서 'ui' import 제거
  const allFiles = glob.sync('**/*.{js,jsx}', { 
    cwd: FRONTEND_PATH,
    ignore: ['**/*.backup.*', '**/node_modules/**', '**/build/**']
  });
  
  let fixedCount = 0;
  for (const file of allFiles) {
    try {
      const filePath = path.join(FRONTEND_PATH, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // 'ui' import 제거
      const originalContent = content;
      content = content.replace(/import\s+[^}]+\s+from\s+['"]ui['"];?\s*\n?/g, '');
      content = content.replace(/import\s*\{[^}]*\}\s*from\s+['"]ui['"];?\s*\n?/g, '');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        modified = true;
        fixedCount++;
      }
    } catch (error) {
      // 무시
    }
  }
  
  log.success(`✓ ${fixedCount}개 파일에서 'ui' import 제거`);
  
  console.log('');
  log.success(`🚨 긴급 빌드 수정 완료!`);
}

// 스크립트 실행
if (require.main === module) {
  emergencyBuildFix().catch(error => {
    log.error(`실행 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { emergencyBuildFix };
