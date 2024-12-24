const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Point to your Next.js app
  dir: './'
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (if you're using them in your Next.js project)
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1'
  }
}

module.exports = createJestConfig(customJestConfig)
