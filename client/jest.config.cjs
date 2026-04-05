module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '\\.(css|scss)$': '<rootDir>/test/styleMock.cjs',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: {
                    jsx: 'react-jsx',
                },
            },
        ],
        '^.+\\.jsx?$': [
            'babel-jest',
            {
                presets: [
                    ['@babel/preset-env', { targets: { node: 'current' } }],
                    ['@babel/preset-react', { runtime: 'automatic' }],
                ],
            },
        ],
    },
};
