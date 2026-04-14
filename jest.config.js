module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "!src/**/*.d.ts",
    "!src/types/**",
    "!**/node_modules/**"
  ],
  coverageReporters: ["text", "lcov", "clover"],
  coverageThreshold: {
    global: {
      branches: 63,
      functions: 70,
      lines: 84,
      statements: 84,
    },
  },
};
