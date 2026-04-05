exports.parserOptions = {
    ecmaVersion: 2021,
    sourceType: 'module',
};

exports.plugins = ['react', 'react-hooks'];

exports.extends = ['eslint:recommended', 'plugin:react/recommended'];

exports.rules = {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-uses-react': 'off',
};

exports.settings = {
    react: {
        version: 'detect',
    },
};
