const { TextEncoder, TextDecoder } = require('util');

module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    '^lucide-react$': '<rootDir>/__mocks__/lucide-react.js'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testEnvironmentOptions: {
      customExportConditions: ['']
  },
  setupFiles: ['<rootDir>/jest.setup.js']
};