const fs = require('fs');
const path = require('path');

// 수정할 파일 목록
const filesToFix = [
  'src/components/admin/AccountManagement.js',
  'src/components/admin/ClientComprehensiveManagement.js',
  'src/components/admin/CommonCodeManagement.js',
  'src/components/admin/ConsultantComprehensiveManagement.js',
  'src/components/admin/ConsultantRatingStatistics.js',
  'src/components/admin/MappingCard.js',
  'src/components/admin/MappingCreationModal.js',
  'src/components/admin/MappingEditModal.js',
  'src/components/admin/MappingManagement.js'
];

function fixFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`파일을 찾을 수 없습니다: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // space-before-function-paren 수정
  const spaceBeforeFunctionRegex = /(\w+)\s+\(/g;
  const newContent1 = content.replace(spaceBeforeFunctionRegex, (match, funcName) => {
    // async, function, const, let, var 등이 아닌 경우만 수정
    if (!['async', 'function', 'const', 'let', 'var', 'if', 'for', 'while', 'switch', 'catch', 'with'].includes(funcName)) {
      modified = true;
      return `${funcName}(`;
    }
    return match;
  });

  // async () => 수정
  const asyncArrowRegex = /async\s+\(\)\s*=>/g;
  const newContent2 = newContent1.replace(asyncArrowRegex, () => {
    modified = true;
    return 'async() =>';
  });

  // prefer-const 수정 (let을 const로 변경)
  const letRegex = /let\s+(\w+)\s*=\s*[^;]+;/g;
  const newContent3 = newContent2.replace(letRegex, (match, varName) => {
    // 재할당이 없는 경우 const로 변경
    const lines = newContent2.split('\n');
    const currentLineIndex = newContent2.substring(0, newContent2.indexOf(match)).split('\n').length - 1;
    
    // 다음 50줄 내에서 재할당이 있는지 확인
    const nextLines = lines.slice(currentLineIndex + 1, currentLineIndex + 51);
    const reassignmentFound = nextLines.some(line => 
      line.includes(`${varName} =`) && !line.includes('const') && !line.includes('let')
    );
    
    if (!reassignmentFound) {
      modified = true;
      return match.replace('let', 'const');
    }
    return match;
  });

  // prefer-template 수정 (문자열 연결을 템플릿 리터럴로)
  const stringConcatRegex = /(['"`])([^'"`]*)\1\s*\+\s*(['"`])([^'"`]*)\3/g;
  const newContent4 = newContent3.replace(stringConcatRegex, (match, quote1, str1, quote2, str2) => {
    modified = true;
    return `\`${str1}${str2}\``;
  });

  // comma-dangle 수정 (마지막 쉼표 제거)
  const commaDangleRegex = /,\s*([}\]])/g;
  const newContent5 = newContent4.replace(commaDangleRegex, (match, bracket) => {
    modified = true;
    return bracket;
  });

  // object-curly-spacing 수정
  const objectSpacingRegex = /\{\s*([^}]+)\s*\}/g;
  const newContent6 = newContent5.replace(objectSpacingRegex, (match, content) => {
    if (content.trim() && !content.includes('\n')) {
      modified = true;
      return `{ ${content.trim()} }`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(fullPath, newContent6, 'utf8');
    console.log(`✅ 수정 완료: ${filePath}`);
  } else {
    console.log(`⏭️  수정할 내용 없음: ${filePath}`);
  }
}

// 모든 파일 수정
console.log('🔧 ESLint 스타일 경고 수정 시작...');
filesToFix.forEach(fixFile);
console.log('✅ 모든 파일 수정 완료!');
