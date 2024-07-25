module.exports = {
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.ts'],
  testPathIgnorePatterns: ['node_modules'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '^.+\\.svg(\\?react)?$': '<rootDir>/__mocks__/svg.tsx',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/../../__mocks__/fileMock.js',
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.svg',
  ],
};
