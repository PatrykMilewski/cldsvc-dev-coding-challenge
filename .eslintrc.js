// This config makes ESLint the main type checker during the development

module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['import', 'jest', 'prettier'],
    extends: [
        'airbnb-typescript/base',
        'eslint:recommended',
        'plugin:jest/recommended',
        'prettier',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
    ],
    rules: {
        // exported functions from modules can be put on the top of file
        '@typescript-eslint/no-use-before-define': 'off',
        // we are using prettier for that, https://github.com/typescript-eslint/typescript-eslint/issues/1824
        '@typescript-eslint/indent': 'off',
        // default export is generally not recommended, due to annoying imports
        'import/prefer-default-export': 'off',
        'prettier/prettier': 'error',
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                js: 'never',
                ts: 'never',
            },
        ],
    },
    overrides: [
        {
            files: '*.[t|j]s',
            parserOptions: { project: './tsconfig.json' },
        },
    ],
    env: {
        jest: true,
        node: true,
        es6: true,
    },
};
