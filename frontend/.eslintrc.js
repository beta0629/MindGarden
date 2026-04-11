module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended'
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-react']
    }
  },
  plugins: [
    'react',
    'react-hooks',
    'jsx-a11y',
    'import'
  ],
  rules: {
    // ============================================
    // MindGarden 디자인 시스템 v2.0 규칙
    // ============================================
    
    // 아이콘 직접 import 금지
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['lucide-react/*'],
            message: '아이콘은 constants/icons.js에서 가져오세요. 직접 import 금지.'
          }
        ]
      }
    ],
    
    // 인라인 style: 차트·동적 위치 등에서 필요 → 토큰/컴포넌트 이관은 별도 배치
    'react/forbid-dom-props': 'off',
    
    // 레거시 mg- 클래스: 경고 대량 발생 → G-01/mg-v2 이관 트랙에서 처리. 필요 시 스캔 스크립트로 보완.
    'no-restricted-syntax': 'off',
    
    // document 경고: 포털·레거시 다수 → 점진 제거
    'no-restricted-globals': 'off',
    
    // ============================================
    // 일반적인 React 규칙
    // ============================================
    
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-no-duplicate-props': 'off',
    'react/jsx-key': 'error',
    'react/no-array-index-key': 'off',
    'react/no-unused-state': 'warn',
    'react/no-unused-prop-types': 'warn',
    'react/self-closing-comp': 'warn',
    'react/jsx-pascal-case': 'error',
    // 인라인 화살표 핸들러는 프로젝트 전반에서 표준적으로 사용 → 규칙 비활성화
    'react/jsx-no-bind': 'off',
    'react/jsx-no-target-blank': 'error',
    
    // React Hooks 규칙
    'react-hooks/rules-of-hooks': 'error',
    // 의존성 배열: 팀 리뷰·수동 점검. 자동 strict는 노이즈 과다
    'react-hooks/exhaustive-deps': 'off',
    
    // ============================================
    // Import 규칙
    // ============================================
    
    'import/order': 'off', // 임시로 비활성화
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    'import/no-duplicates': 'error',
    'import/no-named-as-default': 'off',
    
    // ============================================
    // 접근성 규칙
    // ============================================
    
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'jsx-a11y/no-autofocus': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
    'react/no-unescaped-entities': 'off',
    'react/no-unknown-property': 'off',
    'jsx-a11y/mouse-events-have-key-events': 'off',
    'no-dupe-keys': 'off',
    'no-case-declarations': 'off',
    'react/jsx-no-comment-textnodes': 'off',
    'no-useless-escape': 'off',
    'no-prototype-builtins': 'off',
    'no-useless-catch': 'off',
    'react/display-name': 'off',
    'no-alert': 'off',
    
    // ============================================
    // 일반적인 JavaScript 규칙
    // ============================================
    
    // 미사용 변수: IDE·리뷰로 보완. 별도 정리 배치에서 재검토
    'no-unused-vars': 'off',
    'no-console': 'off', // 개발 중에는 console.log 허용
    'no-debugger': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'warn',
    'template-curly-spacing': 'warn',
    'arrow-spacing': 'warn',
    'comma-dangle': ['warn', 'never'],
    'comma-spacing': 'warn',
    'comma-style': 'warn',
    'computed-property-spacing': 'warn',
    'func-call-spacing': 'warn',
    'key-spacing': 'warn',
    'keyword-spacing': 'warn',
    'object-curly-spacing': ['warn', 'always'],
    'semi': ['warn', 'always'],
    'semi-spacing': 'warn',
    'space-before-blocks': 'warn',
    'space-before-function-paren': ['warn', 'never'],
    'space-in-parens': 'warn',
    'space-infix-ops': 'warn',
    'space-unary-ops': 'warn',
    'spaced-comment': 'warn',
    
    // ============================================
    // 코드 품질 규칙
    // ============================================
    
    // 복잡도·길이: 리팩터는 파일 단위 배치로. strict 게이트 부담 완화.
    'complexity': 'off',
    'max-depth': 'off',
    'max-lines': 'off',
    'max-lines-per-function': 'off',
    'max-params': ['warn', 8],
    // 숫자 리터럴: constants/magicNumbers.js·도메인 상수로 점진 이관
    'no-magic-numbers': 'off',
    'no-nested-ternary': 'off',
    'no-unneeded-ternary': 'error',
    'prefer-destructuring': 'off',
    'prefer-spread': 'error',
    'prefer-rest-params': 'error'
  },
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx']
      }
    }
  },
  overrides: [
    {
      files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
      env: {
        jest: true
      },
      rules: {
        'no-magic-numbers': 'off'
      }
    },
    {
      files: ['**/*.stories.{js,jsx}'],
      rules: {
        'no-magic-numbers': 'off',
        'react/prop-types': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'build/',
    'dist/',
    '*.config.js',
    '*.config.ts',
    'public/',
    'coverage/',
    '.eslintrc.js'
  ]
};
