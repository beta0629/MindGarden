const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');

// ESLint 스타일 경고 수정 스크립트
const fixESLintStyleWarnings = () => {
  const processFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // 1. space-before-function-paren 수정
    content = content.replace(/function\s+\(/g, 'function(');
    content = content.replace(/async\s+\(/g, 'async(');
    content = content.replace(/=>\s+\(/g, '=>(');

    // 2. arrow-spacing 수정
    content = content.replace(/=>\(/g, '=> (');

    // 3. comma-dangle 수정 (마지막 쉼표 제거)
    content = content.replace(/,(\s*[}\]])/g, '$1');

    // 4. prefer-template 수정 (문자열 연결을 템플릿 리터럴로)
    content = content.replace(/'([^']*)'\s*\+\s*'([^']*)'/g, '`$1$2`');
    content = content.replace(/"([^"]*)"\s*\+\s*"([^"]*)"/g, '`$1$2`');

    // 5. object-curly-spacing 수정
    content = content.replace(/\{\s*([^}]+)\s*\}/g, '{ $1 }');

    // 6. prefer-const 수정 (let을 const로)
    content = content.replace(/let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);/g, (match, varName, value) => {
      // 단순한 할당인 경우에만 const로 변경
      if (!value.includes('++') && !value.includes('--') && !value.includes('+=') && !value.includes('-=')) {
        return `const ${varName} = ${value};`;
      }
      return match;
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ESLint 스타일 수정 완료: ${filePath}`);
      return true;
    }
    return false;
  };

  const scanDirectory = (directory) => {
    fs.readdirSync(directory, { withFileTypes: true }).forEach(dirent => {
      const fullPath = path.join(directory, dirent.name);
      if (dirent.isDirectory()) {
        // node_modules, .git, build, public 제외
        if (!['node_modules', '.git', 'build', 'public'].includes(dirent.name)) {
          scanDirectory(fullPath);
        }
      } else if (dirent.isFile() && (dirent.name.endsWith('.js') || dirent.name.endsWith('.jsx'))) {
        processFile(fullPath);
      }
    });
  };

  console.log('🚀 ESLint 스타일 경고 자동 수정 시작...');
  scanDirectory(SRC_DIR);
  console.log('🎉 ESLint 스타일 경고 자동 수정 완료!');
};

fixESLintStyleWarnings();
