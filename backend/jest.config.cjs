module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
        '^.+\\.js$': [
            'babel-jest',
            {
                presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
            },
        ],
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
};
