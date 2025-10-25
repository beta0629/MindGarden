const fs = require('fs');
const path = require('path');

/**
 * Admin 컴포넌트들의 CSS 클래스 접두사를 mg-에서 mg-v2-로 일괄 변경
 */

const adminDir = path.join(__dirname, '../src/components/admin');

// 변경할 파일 목록
const filesToUpdate = [
  'AdminMessages.js',
  'SectionHeader.js',
  'MappingFilters.js',
  'PartialRefundModal.js',
  'ConsultantTransferModal.js',
  'ClientComprehensiveManagement.js',
  'AdminDashboard.js',
  'CommonCodeManagement.js',
  'MappingManagement.js',
  'ConsultantRatingStatistics.js',
  'ConsultantComprehensiveManagement.js',
  'system/SystemTools.js',
  'mapping/SessionExtensionModal.js',
  'mapping/MappingStats.js',
  'mapping/MappingDetailModal.js',
  'mapping/MappingDepositModal.js',
  'mapping/MappingCard.js',
  'VacationManagementModal.js',
  'UserManagement.js',
  'SystemNotificationManagement.js',
  'SystemConfigManagement.js',
  'SessionManagement.js',
  'PermissionManagement.js',
  'PaymentConfirmationModal.js',
  'DiscountPaymentConfirmationModal.js',
  'ConsultationCompletionStats.js',
  'ClientCard.js'
];

function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  파일이 존재하지 않습니다: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // mg- 접두사를 mg-v2-로 변경 (단, mg-v2-는 제외)
    const mgPrefixRegex = /className=["']mg-(?!v2-)([^"']*)["']/g;
    const mgPrefixSingleRegex = /className=['']mg-(?!v2-)([^'']*)['']/g;
    
    // mg-btn을 mg-v2-btn으로 변경
    const mgBtnRegex = /className=["']mg-btn([^"']*)["']/g;
    const mgBtnSingleRegex = /className=['']mg-btn([^'']*)['']/g;

    // 변경 전 내용 저장
    const originalContent = content;

    // className="mg-xxx" 패턴 변경
    content = content.replace(mgPrefixRegex, (match, className) => {
      hasChanges = true;
      return `className="mg-v2-${className}"`;
    });

    // className='mg-xxx' 패턴 변경
    content = content.replace(mgPrefixSingleRegex, (match, className) => {
      hasChanges = true;
      return `className='mg-v2-${className}'`;
    });

    // mg-btn 패턴 변경
    content = content.replace(mgBtnRegex, (match, suffix) => {
      hasChanges = true;
      return `className="mg-v2-btn${suffix}"`;
    });

    content = content.replace(mgBtnSingleRegex, (match, suffix) => {
      hasChanges = true;
      return `className='mg-v2-btn${suffix}'`;
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 업데이트 완료: ${path.relative(adminDir, filePath)}`);
      return true;
    } else {
      console.log(`⏭️  변경사항 없음: ${path.relative(adminDir, filePath)}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ 오류 발생: ${filePath}`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Admin 컴포넌트 CSS 클래스 접두사 일괄 변경 시작...\n');

  let updatedCount = 0;
  let totalCount = 0;

  filesToUpdate.forEach(fileName => {
    const filePath = path.join(adminDir, fileName);
    totalCount++;
    
    if (updateFile(filePath)) {
      updatedCount++;
    }
  });

  console.log(`\n📊 작업 완료: ${updatedCount}/${totalCount} 파일 업데이트됨`);
  
  if (updatedCount > 0) {
    console.log('\n🎉 CSS 클래스 접두사 변경이 완료되었습니다!');
    console.log('다음 단계: 인라인 스타일 제거 작업을 진행하세요.');
  } else {
    console.log('\n✨ 모든 파일이 이미 업데이트되어 있습니다!');
  }
}

main();
