const fs = require('fs');
const path = require('path');

// 수정할 파일 목록
const filesToFix = [
  'src/components/admin/AccountManagement.js',
  'src/components/admin/ClientComprehensiveManagement.js',
  'src/components/admin/CommonCodeManagement.js'
];

function fixFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`파일을 찾을 수 없습니다: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // template-curly-spacing 수정 (${} 안의 공백 제거)
  const templateSpacingRegex = /\$\{\s*([^}]+)\s*\}/g;
  const newContent1 = content.replace(templateSpacingRegex, (match, inner) => {
    modified = true;
    return `\${${inner.trim()}}`;
  });

  // keyword-spacing 수정 (return 뒤 공백 추가)
  const keywordSpacingRegex = /return\s*([^;\n])/g;
  const newContent2 = newContent1.replace(keywordSpacingRegex, (match, after) => {
    if (after.trim()) {
      modified = true;
      return `return ${after}`;
    }
    return match;
  });

  // space-before-function-paren 수정 (함수명 뒤 공백 제거)
  const functionSpacingRegex = /(\w+)\s+\(/g;
  const newContent3 = newContent2.replace(functionSpacingRegex, (match, funcName) => {
    // 특정 키워드들은 제외
    if (!['async', 'function', 'const', 'let', 'var', 'if', 'for', 'while', 'switch', 'catch', 'with', 'return'].includes(funcName)) {
      modified = true;
      return `${funcName}(`;
    }
    return match;
  });

  // object-curly-spacing 수정 (객체 리터럴 내부 공백 정리)
  const objectSpacingRegex = /\{\s*([^}]+)\s*\}/g;
  const newContent4 = newContent3.replace(objectSpacingRegex, (match, content) => {
    if (content.trim() && !content.includes('\n') && content.length < 100) {
      modified = true;
      return `{ ${content.trim()} }`;
    }
    return match;
  });

  // no-const-assign 수정 (const 변수 재할당을 let으로 변경)
  const constAssignRegex = /const\s+(\w+)\s*=/g;
  const newContent5 = newContent4.replace(constAssignRegex, (match, varName) => {
    // 해당 변수가 나중에 재할당되는지 확인
    const lines = newContent4.split('\n');
    const currentLineIndex = newContent4.substring(0, newContent4.indexOf(match)).split('\n').length - 1;
    
    // 다음 100줄 내에서 재할당이 있는지 확인
    const nextLines = lines.slice(currentLineIndex + 1, currentLineIndex + 101);
    const reassignmentFound = nextLines.some(line => 
      line.includes(`${varName} =`) && !line.includes('const') && !line.includes('let')
    );
    
    if (reassignmentFound) {
      modified = true;
      return `let ${varName} =`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(fullPath, newContent5, 'utf8');
    console.log(`✅ 수정 완료: ${filePath}`);
  } else {
    console.log(`⏭️  수정할 내용 없음: ${filePath}`);
  }
}

// 모든 파일 수정
console.log('🔧 ESLint 스타일 경고 수정 시작...');
filesToFix.forEach(fixFile);
console.log('✅ 모든 파일 수정 완료!');
