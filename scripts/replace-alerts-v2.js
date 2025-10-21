#!/usr/bin/env node
/**
 * alert()와 confirm()을 notificationManager로 변경하는 스크립트 v2
 * 템플릿 리터럴과 변수를 사용하는 복잡한 패턴 지원
 */
const fs = require('fs');
const path = require('path');

function replaceComplexConfirms(content) {
  let modified = content;

  // 1. if (window.confirm(변수)) { ... } 패턴
  modified = modified.replace(
    /if\s*\(\s*window\.confirm\(([^)]+)\)\s*\)\s*\{/g,
    (match, message) => {
      return `const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(${message}, resolve);
    });
    if (confirmed) {`;
    }
  );

  // 2. if (!window.confirm(변수)) return; 패턴
  modified = modified.replace(
    /if\s*\(\s*!window\.confirm\(([^)]+)\)\s*\)\s*return;/g,
    (match, message) => {
      return `const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(${message}, resolve);
    });
    if (!confirmed) return;`;
    }
  );

  // 3. if (!window.confirm(변수)) { return; } 패턴
  modified = modified.replace(
    /if\s*\(\s*!window\.confirm\(([^)]+)\)\s*\)\s*\{\s*return;\s*\}/g,
    (match, message) => {
      return `const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(${message}, resolve);
    });
    if (!confirmed) {
        return;
    }`;
    }
  );

  // 4. const/let/var result = window.confirm(변수) 패턴
  modified = modified.replace(
    /(const|let|var)\s+(\w+)\s*=\s*window\.confirm\(([^)]+)\);/g,
    (match, varType, varName, message) => {
      return `${varType} ${varName} = await new Promise((resolve) => {
      notificationManager.confirm(${message}, resolve);
    });`;
    }
  );

  return modified;
}

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    return false;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // window.confirm이 있는지 확인
    const hasWindowConfirm = /window\.confirm\(/.test(content);

    if (!hasWindowConfirm) {
      return false;
    }

    // 복잡한 confirm 패턴 변경
    content = replaceComplexConfirms(content);

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ ${filePath}: Updated`);
      return true;
    }

    return false;

  } catch (error) {
    console.log(`❌ ${filePath}: Error - ${error.message}`);
    return false;
  }
}

// 처리할 파일 목록
const files = [
  'frontend/src/components/admin/AdminDashboard.js',
  'frontend/src/components/admin/CommonCodeManagement.js',
  'frontend/src/components/admin/UserManagement.js',
  'frontend/src/components/admin/MappingManagement.js',
  'frontend/src/components/admin/VacationManagementModal.js',
  'frontend/src/components/admin/BranchManagement.js',
  'frontend/src/components/admin/ConsultantManagement.js',
  'frontend/src/components/admin/AccountManagement.js',
  'frontend/src/components/admin/mapping/PartialRefundModal.js',
  'frontend/src/components/mypage/MyPage.js',
  'frontend/src/components/finance/RecurringExpenseModal.js',
];

console.log('🔄 Starting complex pattern replacement...\n');

let updatedCount = 0;
for (const file of files) {
  if (processFile(file)) {
    updatedCount++;
  }
}

console.log(`\n✅ Completed: ${updatedCount}/${files.length} files updated`);

