import globals from 'globals';
import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node
            }
        },
        rules: {
            indent: ['error', 4],
            semi: ['error', 'always'],
            'no-unused-vars': ['error', { args: 'none' }]
        }
    },
    {
        files: ['__tests__/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.jest
            }
        }
    },
    {
        ignores: ['dist/', 'coverage/', 'node_modules/', '__mocks__/']
    }
];
