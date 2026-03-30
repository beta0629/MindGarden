#!/usr/bin/env node

/**
 * JSX 문법 오류 수정 스크립트
 * 
 * 잘못된 JSX 문법을 올바르게 수정
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
 * JSX 문법 오류 수정
 */
async function fixSyntaxErrors() {
  console.log('🔧 JSX 문법 오류 수정 시작...');
  
  // 수정할 파일 목록
  const files = [
    'components/academy/AcademyRegister.js',
    'components/academy/ClassForm.js',
    'components/academy/ClassList.js',
    'components/academy/CourseForm.js',
    'components/academy/CourseList.js',
    'components/academy/EnrollmentForm.js',
    'components/academy/EnrollmentList.js'
  ];
  
  for (const file of files) {
    try {
      const filePath = path.join(FRONTEND_PATH, file);
      if (!fs.existsSync(filePath)) {
        log.error(`파일 없음: ${file}`);
        continue;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // 잘못된 JSX 문법 수정
      const fixes = [
        // <div className="mg-card".Header> → <div className="mg-card__header">
        {
          from: /<div className="mg-card"\.Header>/g,
          to: '<div className="mg-card__header">'
        },
        // <div className="mg-card".Body> → <div className="mg-card__body">
        {
          from: /<div className="mg-card"\.Body>/g,
          to: '<div className="mg-card__body">'
        },
        // </Card.Header> → </div>
        {
          from: /<\/Card\.Header>/g,
          to: '</div>'
        },
        // </Card.Body> → </div>
        {
          from: /<\/Card\.Body>/g,
          to: '</div>'
        },
        // </Card> → </div>
        {
          from: /<\/Card>/g,
          to: '</div>'
        }
      ];
      
      for (const fix of fixes) {
        if (fix.from.test(content)) {
          content = content.replace(fix.from, fix.to);
          modified = true;
        }
      }
      
      if (modified) {
        // 백업 생성
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        
        // 수정된 내용 저장
        fs.writeFileSync(filePath, content);
        log.success(`✓ ${file} - JSX 문법 수정`);
      } else {
        log.info(`- ${file} - 수정할 내용 없음`);
      }
      
    } catch (error) {
      log.error(`${file} 처리 실패: ${error.message}`);
    }
  }
  
  console.log('');
  log.success(`🔧 JSX 문법 오류 수정 완료!`);
}

// 스크립트 실행
if (require.main === module) {
  fixSyntaxErrors().catch(error => {
    log.error(`실행 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { fixSyntaxErrors };
