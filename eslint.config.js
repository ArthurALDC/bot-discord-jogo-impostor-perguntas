const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',

        },
        env: {
            node: true,
        },
        rules: {

        },
    },
];