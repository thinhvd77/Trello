module.exports = {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.js'],
    moduleFileExtensions: ['js'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    collectCoverageFrom: [
        'public/js/**/*.js',
        '!public/js/**/*.min.js'
    ],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            branches: 65,
            functions: 80,
            lines: 80,
            statements: 80
        }
    }
};
