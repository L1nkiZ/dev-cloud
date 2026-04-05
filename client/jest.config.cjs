module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testPathIgnorePatterns: ['.tsx$'],
    moduleNameMapper: {
        '\\.(css|scss)$': '<rootDir>/test/styleMock.cjs',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transform: {
        '^.+\\.[jt]sx?$': [
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
