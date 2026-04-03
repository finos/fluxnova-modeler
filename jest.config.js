/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {

  // The root directory that Jest should scan for tests and modules within
  rootDir: './',

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    '<rootDir>/client/src/**/*.js',
    '<rootDir>/app/**/*.js',
    '!<rootDir>/client/src/**/__tests__/**',
    '!<rootDir>/app/**/__tests__/**',
    '!<rootDir>/app/public/**',
    '!<rootDir>/app/preload/**',
  ],

  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      lines: 0,
      statements: 0,
    }
  },

  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // The glob patterns Jest uses to detect test files
  testMatch: [ '**/?(*.)+(spec|test).js' ],

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(ts|js|jsx)$': 'babel-jest',
    '.+\\.(svg|css|styl|less|sass|scss|png|jpg|ttf|woff|woff2|jpeg)$':
      'jest-transform-stub',
    '^.+\\.(bpmn)$': '<rootDir>/jest-raw-loader.js',
  },

};

module.exports = config;
