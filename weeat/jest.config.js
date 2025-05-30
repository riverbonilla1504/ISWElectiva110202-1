module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/app/$1',
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
    },
    collectCoverageFrom: [
      'app/**/*.{js,jsx,ts,tsx}',
      '!app/**/*.d.ts',
      '!app/**/*.stories.{js,jsx,ts,tsx}',
      '!app/globals.css',
      '!app/favicon.ico'
    ],
  };