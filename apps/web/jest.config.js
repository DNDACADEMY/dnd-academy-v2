const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFiles: [],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts',
  ],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '\\.(css|less|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '^.+\\.(svg)$': '<rootDir>/__mocks__/svg.tsx',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testPathIgnorePatterns: [
    'node_modules',
    '<rootDir>.*/public',
    '<rootDir>/.next/',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
};

module.exports = async () => ({
  ...await createJestConfig(customJestConfig)(),
  transformIgnorePatterns: [],
});
