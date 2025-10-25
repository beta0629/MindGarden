module.exports = {
  semi: true,
  trailingComma: 'none',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  quoteProps: 'as-needed',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  
  // ============================================
  // MindGarden 디자인 시스템 v2.0 설정
  // ============================================
  
  // JSX 설정
  jsxSingleQuote: true,
  jsxBracketSameLine: false,
  
  // HTML 설정
  htmlWhitespaceSensitivity: 'css',
  
  // Vue 설정
  vueIndentScriptAndStyle: false,
  
  // 프로젝트별 설정
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always'
      }
    },
    {
      files: '*.css',
      options: {
        printWidth: 100,
        singleQuote: false
      }
    },
    {
      files: '*.scss',
      options: {
        printWidth: 100,
        singleQuote: false
      }
    },
    {
      files: '*.html',
      options: {
        printWidth: 100,
        htmlWhitespaceSensitivity: 'ignore'
      }
    }
  ]
};
