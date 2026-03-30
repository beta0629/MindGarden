#!/usr/bin/env node

/**
 * 모든 컴포넌트의 아이콘을 중앙화된 시스템으로 완전히 변경하는 스크립트
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 모든 lucide-react를 사용하는 파일 찾기
const filesToProcess = execSync(
  "find frontend/src/components -name '*.js' -type f | xargs grep -l \"from 'lucide-react'\"",
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

console.log(`🔍 발견된 파일: ${filesToProcess.length}개\n`);

function calculateRelativePath(filePath) {
  const depth = filePath.split('/').length - 3; // frontend/src/ 제외
  return '../'.repeat(depth) + 'constants/icons';
}

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  파일 없음: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // 1. ICONS import가 없으면 추가
  if (!content.includes("from '../../constants/icons'") && 
      !content.includes("from '../../../constants/icons'") &&
      !content.includes("from '../../../../constants/icons'") &&
      !content.includes("from '../../../../../constants/icons'") &&
      !content.includes("from '../../../../../../constants/icons'")) {
    
    const relativePath = calculateRelativePath(filePath);
    const importStatement = `import { ICONS, ICON_SIZES, ICON_COLORS, IconHelpers } from '${relativePath}';\n`;
    
    // React import 다음에 추가
    const reactImportMatch = content.match(/import React[^;]*;/);
    if (reactImportMatch) {
      const insertPosition = reactImportMatch.index + reactImportMatch[0].length + 1;
      content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
      modified = true;
    }
  }

  // 2. lucide-react import 제거 (주석 처리)
  if (content.includes("from 'lucide-react'")) {
    content = content.replace(/import\s+{[^}]+}\s+from\s+'lucide-react';?\n?/g, '// $&');
    modified = true;
  }

  // 3. 일반적인 아이콘 사용 패턴 변경
  const iconReplacements = [
    // <IconName ... /> -> <ICONS.ICON_NAME ... />
    { pattern: /<Users([^>]*)>/g, replacement: '<ICONS.USERS$1>' },
    { pattern: /<User([^>]*)>/g, replacement: '<ICONS.USER$1>' },
    { pattern: /<Calendar([^>]*)>/g, replacement: '<ICONS.CALENDAR$1>' },
    { pattern: /<CheckCircle([^>]*)>/g, replacement: '<ICONS.CHECK_CIRCLE$1>' },
    { pattern: /<XCircle([^>]*)>/g, replacement: '<ICONS.X_CIRCLE$1>' },
    { pattern: /<AlertCircle([^>]*)>/g, replacement: '<ICONS.ALERT_CIRCLE$1>' },
    { pattern: /<Info([^>]*)>/g, replacement: '<ICONS.INFO$1>' },
    { pattern: /<Settings([^>]*)>/g, replacement: '<ICONS.SETTINGS$1>' },
    { pattern: /<Edit([^>]*)>/g, replacement: '<ICONS.EDIT$1>' },
    { pattern: /<Trash2([^>]*)>/g, replacement: '<ICONS.TRASH$1>' },
    { pattern: /<Plus([^>]*)>/g, replacement: '<ICONS.PLUS$1>' },
    { pattern: /<X([^>]*)>/g, replacement: '<ICONS.X$1>' },
    { pattern: /<Check([^>]*)>/g, replacement: '<ICONS.CHECK$1>' },
    { pattern: /<Search([^>]*)>/g, replacement: '<ICONS.SEARCH$1>' },
    { pattern: /<Filter([^>]*)>/g, replacement: '<ICONS.FILTER$1>' },
    { pattern: /<Download([^>]*)>/g, replacement: '<ICONS.DOWNLOAD$1>' },
    { pattern: /<Upload([^>]*)>/g, replacement: '<ICONS.UPLOAD$1>' },
    { pattern: /<Save([^>]*)>/g, replacement: '<ICONS.SAVE$1>' },
    { pattern: /<Mail([^>]*)>/g, replacement: '<ICONS.MAIL$1>' },
    { pattern: /<Phone([^>]*)>/g, replacement: '<ICONS.PHONE$1>' },
    { pattern: /<MapPin([^>]*)>/g, replacement: '<ICONS.MAP_PIN$1>' },
    { pattern: /<Clock([^>]*)>/g, replacement: '<ICONS.CLOCK$1>' },
    { pattern: /<TrendingUp([^>]*)>/g, replacement: '<ICONS.TRENDING_UP$1>' },
    { pattern: /<TrendingDown([^>]*)>/g, replacement: '<ICONS.TRENDING_DOWN$1>' },
    { pattern: /<BarChart([^>]*)>/g, replacement: '<ICONS.BAR_CHART$1>' },
    { pattern: /<PieChart([^>]*)>/g, replacement: '<ICONS.PIE_CHART$1>' },
    { pattern: /<Activity([^>]*)>/g, replacement: '<ICONS.ACTIVITY$1>' },
    { pattern: /<Heart([^>]*)>/g, replacement: '<ICONS.HEART$1>' },
    { pattern: /<Star([^>]*)>/g, replacement: '<ICONS.STAR$1>' },
    { pattern: /<Award([^>]*)>/g, replacement: '<ICONS.AWARD$1>' },
    { pattern: /<Target([^>]*)>/g, replacement: '<ICONS.TARGET$1>' },
    { pattern: /<Shield([^>]*)>/g, replacement: '<ICONS.SHIELD$1>' },
    { pattern: /<Lock([^>]*)>/g, replacement: '<ICONS.LOCK$1>' },
    { pattern: /<Unlock([^>]*)>/g, replacement: '<ICONS.UNLOCK$1>' },
    { pattern: /<Eye([^>]*)>/g, replacement: '<ICONS.EYE$1>' },
    { pattern: /<EyeOff([^>]*)>/g, replacement: '<ICONS.EYE_OFF$1>' },
    { pattern: /<Bell([^>]*)>/g, replacement: '<ICONS.BELL$1>' },
    { pattern: /<BellOff([^>]*)>/g, replacement: '<ICONS.BELL_OFF$1>' },
    { pattern: /<MessageSquare([^>]*)>/g, replacement: '<ICONS.MESSAGE_SQUARE$1>' },
    { pattern: /<Send([^>]*)>/g, replacement: '<ICONS.SEND$1>' },
    { pattern: /<Paperclip([^>]*)>/g, replacement: '<ICONS.PAPERCLIP$1>' },
    { pattern: /<Image([^>]*)>/g, replacement: '<ICONS.IMAGE$1>' },
    { pattern: /<File([^>]*)>/g, replacement: '<ICONS.FILE$1>' },
    { pattern: /<FileText([^>]*)>/g, replacement: '<ICONS.FILE_TEXT$1>' },
    { pattern: /<Folder([^>]*)>/g, replacement: '<ICONS.FOLDER$1>' },
    { pattern: /<Home([^>]*)>/g, replacement: '<ICONS.HOME$1>' },
    { pattern: /<Building([^>]*)>/g, replacement: '<ICONS.BUILDING$1>' },
    { pattern: /<Briefcase([^>]*)>/g, replacement: '<ICONS.BRIEFCASE$1>' },
    { pattern: /<Package([^>]*)>/g, replacement: '<ICONS.PACKAGE$1>' },
    { pattern: /<ShoppingCart([^>]*)>/g, replacement: '<ICONS.SHOPPING_CART$1>' },
    { pattern: /<CreditCard([^>]*)>/g, replacement: '<ICONS.CREDIT_CARD$1>' },
    { pattern: /<DollarSign([^>]*)>/g, replacement: '<ICONS.DOLLAR$1>' },
    { pattern: /<Receipt([^>]*)>/g, replacement: '<ICONS.RECEIPT$1>' },
    { pattern: /<Wallet([^>]*)>/g, replacement: '<ICONS.WALLET$1>' },
    { pattern: /<Truck([^>]*)>/g, replacement: '<ICONS.TRUCK$1>' },
    { pattern: /<RotateCcw([^>]*)>/g, replacement: '<ICONS.ROTATE_CCW$1>' },
    { pattern: /<RefreshCw([^>]*)>/g, replacement: '<ICONS.REFRESH$1>' },
    { pattern: /<ChevronLeft([^>]*)>/g, replacement: '<ICONS.CHEVRON_LEFT$1>' },
    { pattern: /<ChevronRight([^>]*)>/g, replacement: '<ICONS.CHEVRON_RIGHT$1>' },
    { pattern: /<ChevronUp([^>]*)>/g, replacement: '<ICONS.CHEVRON_UP$1>' },
    { pattern: /<ChevronDown([^>]*)>/g, replacement: '<ICONS.CHEVRON_DOWN$1>' },
    { pattern: /<ArrowLeft([^>]*)>/g, replacement: '<ICONS.ARROW_LEFT$1>' },
    { pattern: /<ArrowRight([^>]*)>/g, replacement: '<ICONS.ARROW_RIGHT$1>' },
    { pattern: /<ArrowUp([^>]*)>/g, replacement: '<ICONS.ARROW_UP$1>' },
    { pattern: /<ArrowDown([^>]*)>/g, replacement: '<ICONS.ARROW_DOWN$1>' },
    { pattern: /<MoreVertical([^>]*)>/g, replacement: '<ICONS.MORE_VERTICAL$1>' },
    { pattern: /<MoreHorizontal([^>]*)>/g, replacement: '<ICONS.MORE_HORIZONTAL$1>' },
    { pattern: /<Menu([^>]*)>/g, replacement: '<ICONS.MENU$1>' },
    { pattern: /<Grid([^>]*)>/g, replacement: '<ICONS.GRID$1>' },
    { pattern: /<List([^>]*)>/g, replacement: '<ICONS.LIST$1>' },
    { pattern: /<Layout([^>]*)>/g, replacement: '<ICONS.LAYOUT$1>' },
    { pattern: /<LayoutDashboard([^>]*)>/g, replacement: '<ICONS.LAYOUT_DASHBOARD$1>' },
    { pattern: /<Maximize([^>]*)>/g, replacement: '<ICONS.MAXIMIZE$1>' },
    { pattern: /<Minimize([^>]*)>/g, replacement: '<ICONS.MINIMIZE$1>' },
    { pattern: /<Copy([^>]*)>/g, replacement: '<ICONS.COPY$1>' },
    { pattern: /<Clipboard([^>]*)>/g, replacement: '<ICONS.CLIPBOARD$1>' },
    { pattern: /<ExternalLink([^>]*)>/g, replacement: '<ICONS.EXTERNAL_LINK$1>' },
    { pattern: /<Link([^>]*)>/g, replacement: '<ICONS.LINK$1>' },
    { pattern: /<Link2([^>]*)>/g, replacement: '<ICONS.LINK_2$1>' },
    { pattern: /<Zap([^>]*)>/g, replacement: '<ICONS.ZAP$1>' },
    { pattern: /<Sparkles([^>]*)>/g, replacement: '<ICONS.SPARKLES$1>' },
    { pattern: /<CalendarDays([^>]*)>/g, replacement: '<ICONS.CALENDAR_DAYS$1>' },
    { pattern: /<Trophy([^>]*)>/g, replacement: '<ICONS.TROPHY$1>' },
  ];

  iconReplacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ 수정 완료: ${filePath}`);
  } else {
    console.log(`ℹ️  변경 없음: ${filePath}`);
  }
}

console.log('🚀 전체 아이콘 통합 작업 시작...\n');

filesToProcess.forEach((file, index) => {
  console.log(`[${index + 1}/${filesToProcess.length}] 처리 중: ${file}`);
  processFile(file);
});

console.log('\n✅ 전체 아이콘 통합 작업 완료!');
console.log(`\n📊 처리된 파일: ${filesToProcess.length}개`);



