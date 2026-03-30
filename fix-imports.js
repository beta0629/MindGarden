#!/usr/bin/env node

/**
 * ESLint import 오류 일괄 수정 스크립트
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 수정할 import 패턴들
const importFixes = [
  {
    pattern: /\/\/ import SimpleLayout from/g,
    replacement: 'import SimpleLayout from',
    description: 'SimpleLayout import 주석 해제'
  },
  {
    pattern: /\/\/ import ReactDOM from/g,
    replacement: 'import ReactDOM from',
    description: 'ReactDOM import 주석 해제'
  },
  {
    pattern: /\/\/ import notificationManager from/g,
    replacement: 'import notificationManager from',
    description: 'notificationManager import 주석 해제'
  },
  {
    pattern: /\/\/ \/\/ import notificationManager from/g,
    replacement: 'import notificationManager from',
    description: 'notificationManager 이중 주석 해제'
  },
  {
    pattern: /\/\/ import CommonPageTemplate from/g,
    replacement: 'import CommonPageTemplate from',
    description: 'CommonPageTemplate import 주석 해제'
  },
  {
    pattern: /\/\/ import BaseWidget from/g,
    replacement: 'import BaseWidget from',
    description: 'BaseWidget import 주석 해제'
  }
];

// 추가할 import들
const missingImports = {
  'mypageApi': "import { mypageApi } from '../../utils/ajax';",
  'csrfTokenManager': "import csrfTokenManager from '../../utils/csrfTokenManager';",
  'ConsultantRatingModal': "import ConsultantRatingModal from '../consultant/ConsultantRatingModal';",
  'ScheduleModal': "import ScheduleModal from './ScheduleModal';",
  'StepIndicator': "import StepIndicator from '../ui/StepIndicator';",
  'ClientSelector': "import ClientSelector from '../ui/ClientSelector';",
  'ConsultantCard': "import ConsultantCard from '../ui/Card/ConsultantCard';",
  'SubscriptionManagement': "import SubscriptionManagement from './SubscriptionManagement';",
  'UnifiedHeader': "import UnifiedHeader from '../common/UnifiedHeader';"
};

function findJSFiles(dir) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files = files.concat(findJSFiles(fullPath));
      } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(item)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.log(`⚠️  디렉토리 읽기 실패: ${dir}`);
  }
  
  return files;
}

function fixImportsInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 주석처리된 import 해제
  for (const fix of importFixes) {
    if (fix.pattern.test(content)) {
      content = content.replace(fix.pattern, fix.replacement);
      modified = true;
      console.log(`  ✅ ${fix.description}`);
    }
  }

  // 누락된 import 추가 (간단한 패턴만)
  for (const [identifier, importStatement] of Object.entries(missingImports)) {
    // 이미 import가 있는지 확인
    const importRegex = new RegExp(`import.*${identifier}`, 'i');
    const usageRegex = new RegExp(`[^a-zA-Z_]${identifier}[^a-zA-Z_]`);
    
    if (!importRegex.test(content) && usageRegex.test(content)) {
      // import 섹션 끝에 추가
      const importSectionEnd = content.lastIndexOf("import ");
      if (importSectionEnd !== -1) {
        const nextLineIndex = content.indexOf('\n', importSectionEnd);
        if (nextLineIndex !== -1) {
          content = content.slice(0, nextLineIndex + 1) + importStatement + '\n' + content.slice(nextLineIndex + 1);
          modified = true;
          console.log(`  ✅ ${identifier} import 추가`);
        }
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    return true;
  }

  return false;
}

console.log('🔧 ESLint import 오류 일괄 수정 시작...\n');

const frontendDir = 'frontend/src/components';
const files = findJSFiles(frontendDir);

let fixedCount = 0;
let totalCount = files.length;

for (const filePath of files) {
  console.log(`📁 검사 중: ${filePath}`);
  if (fixImportsInFile(filePath)) {
    fixedCount++;
    console.log(`✅ 수정 완료: ${filePath}\n`);
  }
}

console.log(`📊 수정 완료: ${fixedCount}/${totalCount} 파일`);

// 임시 파일 정리
try {
  fs.unlinkSync('fix-react-hooks.js');
  fs.unlinkSync('fix-imports.js');
  console.log('🧹 임시 파일 정리 완료');
} catch (error) {
  // 파일이 없으면 무시
}

console.log('\n✅ import 오류 수정 완료!');
