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
    
    // 인라인 스타일 금지 (경고로 완화)
    'react/forbid-dom-props': [
      'warn',
      {
        forbid: ['style']
      }
    ],
    
    // CSS 클래스명 패턴 검증 (경고로 완화)
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'Literal[value=/^mg-(?!v2-)/]',
        message: 'CSS 클래스는 mg-v2- 접두사를 사용하세요.'
      }
    ],
    
    // ui/ 컴포넌트 사용 강제 (경고)
    'no-restricted-globals': [
      'warn',
      {
        name: 'document',
        message: '직접 DOM 조작 대신 ui/ 컴포넌트를 사용하세요.'
      }
    ],
    
    // ============================================
    // 일반적인 React 규칙
    // ============================================
    
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-key': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-unused-state': 'warn',
    'react/no-unused-prop-types': 'warn',
    'react/self-closing-comp': 'warn',
    'react/jsx-pascal-case': 'error',
    'react/jsx-no-bind': 'warn',
    'react/jsx-no-target-blank': 'error',
    
    // React Hooks 규칙
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // ============================================
    // Import 규칙
    // ============================================
    
    'import/order': 'off', // 임시로 비활성화
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    'import/no-duplicates': 'error',
    
    // ============================================
    // 접근성 규칙
    // ============================================
    
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/label-has-associated-control': 'warn', // 접근성 규칙 경고로 완화
    'jsx-a11y/anchor-is-valid': 'warn', // 앵커 유효성 경고로 완화
    'jsx-a11y/no-autofocus': 'warn', // 자동 포커스 경고로 완화
    'jsx-a11y/no-noninteractive-element-interactions': 'warn', // 비상호작용 요소 경고로 완화
    'react/no-unescaped-entities': 'warn', // 이스케이프되지 않은 엔티티 경고로 완화
    'react/no-unknown-property': 'warn', // 알 수 없는 속성 경고로 완화
    'react/jsx-no-duplicate-props': 'warn', // 중복 props 경고로 완화
    'jsx-a11y/mouse-events-have-key-events': 'warn', // 마우스 이벤트 경고로 완화
    'no-dupe-keys': 'warn', // 중복 키 경고로 완화
    'no-case-declarations': 'warn', // case 선언 경고로 완화
    'react/jsx-no-comment-textnodes': 'warn', // 주석 텍스트 노드 경고로 완화
    'no-useless-escape': 'warn', // 불필요한 이스케이프 경고로 완화
    'no-prototype-builtins': 'warn', // 프로토타입 빌트인 경고로 완화
    'no-useless-catch': 'warn', // 불필요한 catch 경고로 완화
    'react/display-name': 'warn', // display name 경고로 완화
    
    // ============================================
    // 일반적인 JavaScript 규칙
    // ============================================
    
    'no-unused-vars': 'warn', // 사용하지 않는 변수 경고로 완화
    'no-console': 'off', // 개발 중에는 console.log 허용
    'no-debugger': 'error',
    'no-alert': 'warn',
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
    
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-lines': ['warn', 500], // 파일 크기 제한 완화
    'max-lines-per-function': ['warn', 100], // 함수 크기 제한 완화
    'max-params': ['warn', 5],
    'no-magic-numbers': ['warn', { ignore: [0, 1, -1] }],
    'no-nested-ternary': 'warn',
    'no-unneeded-ternary': 'error',
    'prefer-destructuring': 'warn',
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
