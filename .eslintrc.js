module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks', 'jsx-a11y', '@typescript-eslint'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Allgemeine Regeln
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-unused-vars': 'off', // Deaktiviert, da TypeScript dies bereits prüft
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // React-spezifische Regeln
    'react/prop-types': 'off', // Da wir TypeScript verwenden
    'react/react-in-jsx-scope': 'off', // Nicht nötig mit React 17+
    'react/display-name': 'off',
    'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
    'react/jsx-boolean-value': ['warn', 'never'],
    'react/no-unescaped-entities': 'off',
    'react/no-children-prop': 'warn',
    'react/self-closing-comp': ['warn', { component: true, html: true }],

    // React Hooks Regeln
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Zugänglichkeitsregeln (A11y)
    'jsx-a11y/anchor-is-valid': ['warn', {
      components: ['Link'],
      specialLink: ['to', 'href'],
    }],
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/media-has-caption': 'off', // Für unsere Medienelemente

    // Spezifische Regeln zur Verhinderung verschachtelter <a>-Tags
    'jsx-a11y/anchor-has-content': 'warn',
    'jsx-a11y/anchor-ambiguous-text': 'off', // Diese Regel ist zu restriktiv
    'jsx-a11y/heading-has-content': 'warn',
  },
  overrides: [
    // Test-Dateien speziell behandeln
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
    // Style-Dateien speziell behandeln
    {
      files: ['**/*.styles.[jt]s?(x)', '**/*.styled.[jt]s?(x)', '**/*.theme.[jt]s?(x)'],
      rules: {
        'max-lines': 'off',
        'max-len': 'off',
      },
    },
    // Konfigurationsdateien speziell behandeln
    {
      files: [
        '.eslintrc.js',
        'jest.config.js',
        'vite.config.ts',
        'postcss.config.js',
        'tailwind.config.ts',
      ],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};