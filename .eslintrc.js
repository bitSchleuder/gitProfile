module.exports = {
    root: true,
    extends: [
        'standard',
        'plugin:json/recommended',
        'plugin:mocha/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
        //prettier must be the last to override all other eslint formatter
        'prettier',
        'prettier/standard',
        'prettier/@typescript-eslint',
    ],
    plugins: ['@typescript-eslint', 'standard', 'json', 'html', 'mocha', 'prettier'],
    settings: {
        'html/html-extensions': ['.html'] // don't include .vue
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2018,
        ecmaFeatures: {
            jsx: true
        }
    },
    env: {
        es6: true,
        browser: true,
        node: true,
        mocha: true
    },
    rules: {
        'prettier/prettier': [
            'error',
            {
                useTabs: false,
                singleQuote: true,
                semi: true,
                trailingComma: 'none',
                arrowParens: 'always',
                printWidth: 120,
                bracketSpacing: true,
                tabWidth: 2
            }
        ],
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off', // allow debugger during development
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    }
};