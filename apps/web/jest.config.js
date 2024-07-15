const nextJest = require('next/jest');
const baseConfig = require('../../jest.config');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  ...baseConfig,
  testPathIgnorePatterns: [
    ...baseConfig.testPathIgnorePatterns,
    '<rootDir>.*/public',
    '<rootDir>/.next/',
  ],
};

module.exports = async () => ({
  ...await createJestConfig(customJestConfig)(),
  transformIgnorePatterns: [],
});
