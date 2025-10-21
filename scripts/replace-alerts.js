#!/usr/bin/env node
/**
 * alert()와 confirm()을 notificationManager로 변경하는 스크립트
 */
const fs = require('fs');
const path = require('path');

// 처리할 파일 목록
const files = [
  // Admin
  'frontend/src/components/admin/ClientComprehensiveManagement.js',
  'frontend/src/components/admin/AdminDashboard.js',
  'frontend/src/components/admin/CommonCodeManagement.js',
  'frontend/src/components/admin/UserManagement.js',
  'frontend/src/components/admin/MappingManagement.js',
  'frontend/src/components/admin/VacationManagementModal.js',
  'frontend/src/components/admin/BranchManagement.js',
  'frontend/src/components/admin/ConsultantManagement.js',
  'frontend/src/components/admin/AccountManagement.js',
  // ERP
  'frontend/src/components/erp/BudgetManagement.js',
  'frontend/src/components/erp/ItemManagement.js',
  'frontend/src/components/erp/ImprovedTaxManagement.js',
  'frontend/src/components/erp/RefundManagement.js',
  'frontend/src/components/erp/ConsultantProfileModal.js',
  'frontend/src/components/erp/FinancialTransactionForm.js',
  'frontend/src/components/erp/QuickExpenseForm.js',
  // MyPage
  'frontend/src/components/mypage/ProfileEdit.js',
  'frontend/src/components/mypage/MyPage.js',
  'frontend/src/components/mypage/components/ProfileImageUpload.js',
  'frontend/src/components/mypage/components/PrivacyConsentSection.js',
  'frontend/src/components/mypage/components/PasswordChangeModal.js',
  'frontend/src/components/mypage/components/AddressInput.js',
  // Client/Consultant
  'frontend/src/components/consultant/ConsultantClientList.js',
  'frontend/src/components/client/ConsultantRatingModal.js',
  'frontend/src/components/client/ClientSessionManagement.js',
  'frontend/src/components/client/ClientPaymentHistory.js',
  // Schedule
  'frontend/src/components/schedule/TimeSlotGrid.js',
  // Auth/Common
  'frontend/src/components/auth/TabletLogin.js',
  'frontend/src/components/auth/TabletRegister.js',
  'frontend/src/components/common/SalaryExportModal.js',
  'frontend/src/components/common/PrivacyConsentModal.js',
  'frontend/src/utils/socialLogin.js',
  // Finance/Dashboard
  'frontend/src/components/finance/RecurringExpenseModal.js',
  'frontend/src/components/dashboard/ClientPersonalizedMessages.js',
  'frontend/src/components/admin/mapping/ConsultantTransferModal.js',
  'frontend/src/components/admin/mapping/PartialRefundModal.js',
  'frontend/src/components/super-admin/PaymentManagement.js',
];

function hasNotificationImport(content) {
  return content.includes('notificationManager');
}

function addNotificationImport(content, filePath) {
  if (hasNotificationImport(content)) {
    return content;
  }

  // import 경로 계산
  const depth = filePath.split('/').length - 3; // frontend/src/ 제외
  const importPath = '../'.repeat(depth) + 'utils/notification';

  // React import 다음에 추가
  const lines = content.split('\n');
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import')) {
      insertIndex = i + 1;
    } else if (lines[i].trim() && !lines[i].trim().startsWith('//') && insertIndex !== -1) {
      break;
    }
  }

  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, `import notificationManager from '${importPath}';`);
    return lines.join('\n');
  }

  return content;
}

function replaceAlerts(content) {
  let modified = content;

  // 1. 단순 alert('메시지') -> notificationManager.show('메시지', 'info')
  modified = modified.replace(
    /\balert\((['"`])([^'"`]+)\1\)/g,
    "notificationManager.show($1$2$1, 'info')"
  );

  // 2. window.alert('메시지') -> notificationManager.show('메시지', 'info')
  modified = modified.replace(
    /\bwindow\.alert\((['"`])([^'"`]+)\1\)/g,
    "notificationManager.show($1$2$1, 'info')"
  );

  return modified;
}

function replaceConfirms(content) {
  let modified = content;

  // 1. if (!confirm('메시지')) return; 패턴
  modified = modified.replace(
    /if\s*\(\s*!(?:window\.)?confirm\((['"`])([^'"`]+)\1\)\s*\)\s*return;/g,
    (match, quote, message) => {
      return `const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(${quote}${message}${quote}, resolve);
    });
    if (!confirmed) return;`;
    }
  );

  // 2. if (confirm('메시지')) { ... } 패턴
  modified = modified.replace(
    /if\s*\(\s*(?:window\.)?confirm\((['"`])([^'"`]+)\1\)\s*\)\s*\{/g,
    (match, quote, message) => {
      return `const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(${quote}${message}${quote}, resolve);
    });
    if (confirmed) {`;
    }
  );

  // 3. const result = confirm('메시지') 패턴
  modified = modified.replace(
    /(const|let|var)\s+(\w+)\s*=\s*(?:window\.)?confirm\((['"`])([^'"`]+)\3\)/g,
    (match, varType, varName, quote, message) => {
      return `${varType} ${varName} = await new Promise((resolve) => {
      notificationManager.confirm(${quote}${message}${quote}, resolve);
    })`;
    }
  );

  return modified;
}

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  ${filePath}: File not found`);
    return false;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // alert나 confirm이 있는지 확인
    const hasAlert = /\balert\(/.test(content) || /\bwindow\.alert\(/.test(content);
    const hasConfirm = /\bconfirm\(/.test(content) || /\bwindow\.confirm\(/.test(content);

    if (!hasAlert && !hasConfirm) {
      console.log(`⏭️  ${filePath}: No alert or confirm found`);
      return false;
    }

    // notificationManager import 추가
    content = addNotificationImport(content, filePath);

    // alert 변경
    if (hasAlert) {
      content = replaceAlerts(content);
    }

    // confirm 변경
    if (hasConfirm) {
      content = replaceConfirms(content);
    }

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ ${filePath}: Updated`);
      return true;
    }

    console.log(`⏭️  ${filePath}: No changes needed`);
    return false;

  } catch (error) {
    console.log(`❌ ${filePath}: Error - ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🔄 Starting alert/confirm replacement...\n');

  let updatedCount = 0;
  let totalCount = files.length;

  for (const file of files) {
    if (processFile(file)) {
      updatedCount++;
    }
  }

  console.log(`\n✅ Completed: ${updatedCount}/${totalCount} files updated`);
}

main();

